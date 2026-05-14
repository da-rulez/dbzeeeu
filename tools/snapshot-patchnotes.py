#!/usr/bin/env python3
"""
Take a downloaded patchnotes.md from the game repo and save it under
_data/patchnotes/v{X.Y.Z}.md if it's a new version (or if the existing
file's content has drifted, overwrite it).

Outputs to $GITHUB_OUTPUT:
  added=true|false
  version=X.Y.Z   (only when added=true)

Usage:
  snapshot-patchnotes.py <source.md> <dest_dir>
"""
import os
import re
import sys
import pathlib

VERSION_RE = re.compile(r"^##\s+v([\d]+(?:\.[\d]+)+)", re.MULTILINE)

# Hard cap. The same text needs to fit in a single Discord message
# (Discord's per-message limit is 2000 chars), so we refuse to archive
# anything longer. Author shortens it in orpg, the next workflow run
# picks it up.
MAX_CHARS = 2000


def gh_output(**kv: str) -> None:
    """Append key=value lines to $GITHUB_OUTPUT if running in Actions."""
    path = os.environ.get("GITHUB_OUTPUT")
    if not path:
        for k, v in kv.items():
            print(f"{k}={v}")
        return
    with open(path, "a", encoding="utf-8") as f:
        for k, v in kv.items():
            f.write(f"{k}={v}\n")


def main() -> int:
    if len(sys.argv) != 3:
        print(f"usage: {sys.argv[0]} <source.md> <dest_dir>", file=sys.stderr)
        return 2

    src = pathlib.Path(sys.argv[1])
    dst_dir = pathlib.Path(sys.argv[2])
    dst_dir.mkdir(parents=True, exist_ok=True)

    if not src.is_file() or src.stat().st_size == 0:
        print("source patchnotes.md missing or empty, skipping")
        gh_output(added="false")
        return 0

    content = src.read_text(encoding="utf-8-sig").strip()

    if len(content) > MAX_CHARS:
        print(
            f"::error::patchnotes.md is {len(content)} chars, hard cap is {MAX_CHARS} "
            f"(Discord per-message limit). Shorten the note in the orpg repo and re-run."
        )
        gh_output(added="false")
        return 1

    m = VERSION_RE.search(content)
    if not m:
        print("::error::no '## vX.Y.Z' heading found in patchnotes.md")
        gh_output(added="false")
        return 1

    version = m.group(1)
    target = dst_dir / f"v{version}.md"

    if target.exists() and target.read_text(encoding="utf-8").strip() == content:
        print(f"v{version} already snapshotted, no change")
        gh_output(added="false")
        return 0

    action = "updated" if target.exists() else "snapshotted"
    target.write_text(content + "\n", encoding="utf-8")
    print(f"{action} v{version}")
    gh_output(added="true", version=version)
    return 0


if __name__ == "__main__":
    sys.exit(main())
