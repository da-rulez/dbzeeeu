#!/usr/bin/env python3
"""
Render every patch-note markdown file in _data/patchnotes/ into news.html.

One <article class="news-entry"> per file. Sorted by semantic version,
newest first. Drops the result into news.html via the
<!-- NEWS_ENTRIES --> placeholder in tools/news-template.html.

The markdown we accept is intentionally tiny:
  - `## v0.9.2 — Title`     (version heading + optional title)
  - `### Subsection`        (h3)
  - `- item`                (unordered list)
  - paragraphs
  - `**bold**`, `` `code` `` (inline)

That's everything the upstream patchnotes.md uses. No external deps.

No pagination yet: when the page gets too long, split into news.html +
news-2.html etc. by chunking `entries` below.
"""
import re
import pathlib
from typing import List, Dict, Optional

ROOT = pathlib.Path(__file__).resolve().parent.parent
DATA = ROOT / "_data" / "patchnotes"
TEMPLATE = ROOT / "tools" / "news-template.html"
OUT = ROOT / "news.html"

# Strip em dashes from rendered copy to match the site style (per project
# guidance: no em dashes in body copy). Source files keep them; only the
# rendered HTML is normalised.
DASH_REPLACEMENTS = [
    (" — ", ". "),
    ("—", ", "),
]

VERSION_HEADING = re.compile(
    r"^##\s+v(?P<ver>[\d]+(?:\.[\d]+)+)(?:\s*[—\-|:]\s*(?P<title>.+))?\s*$"
)


def version_tuple(s: str):
    return tuple(int(p) for p in s.split("."))


def normalise(text: str) -> str:
    for src, dst in DASH_REPLACEMENTS:
        text = text.replace(src, dst)
    return text


def inline(text: str) -> str:
    text = re.sub(r"\*\*([^*]+)\*\*", r"<strong>\1</strong>", text)
    text = re.sub(r"`([^`]+)`", r"<code>\1</code>", text)
    return normalise(text)


def parse(md: str) -> Optional[Dict]:
    lines = md.splitlines()

    version: Optional[str] = None
    title: str = ""
    body_start = 0
    for i, line in enumerate(lines):
        m = VERSION_HEADING.match(line)
        if m:
            version = m.group("ver")
            title = (m.group("title") or "").strip() or f"v{version}"
            body_start = i + 1
            break
    if not version:
        return None

    body_md = "\n".join(lines[body_start:]).strip()
    body_html = md_to_html(body_md)
    return {"version": version, "title": title, "body_html": body_html}


def md_to_html(md: str) -> str:
    out: List[str] = []
    lines = md.splitlines()
    i = 0
    n = len(lines)

    def is_bullet(s: str) -> bool:
        return bool(re.match(r"^[*-]\s+", s))

    while i < n:
        line = lines[i]
        if not line.strip():
            i += 1
            continue

        if line.startswith("### "):
            out.append(f"<h3>{inline(line[4:].strip())}</h3>")
            i += 1
            continue

        if is_bullet(line):
            items: List[str] = []
            while i < n and is_bullet(lines[i]):
                items.append(inline(re.sub(r"^[*-]\s+", "", lines[i])))
                i += 1
            lis = "\n            ".join(f"<li>{it}</li>" for it in items)
            out.append(f"<ul>\n            {lis}\n          </ul>")
            continue

        # paragraph: collect until blank line or next special construct
        para: List[str] = []
        while (
            i < n
            and lines[i].strip()
            and not lines[i].startswith("### ")
            and not is_bullet(lines[i])
        ):
            para.append(lines[i].strip())
            i += 1
        out.append(f"<p>{inline(' '.join(para))}</p>")

    return "\n          ".join(out)


def render_entry(entry: Dict, *, is_latest: bool) -> str:
    tag_class = "news-tag blue" if is_latest else "news-tag"
    return (
        '        <article class="news-entry">\n'
        '          <div class="news-meta">\n'
        f'            <span class="news-tag">v{entry["version"]}</span>\n'
        f'            <span class="{tag_class}">Patch</span>\n'
        '          </div>\n'
        f'          <h2>{inline(entry["title"])}</h2>\n'
        f"          {entry['body_html']}\n"
        '        </article>'
    )


def main() -> int:
    files = sorted(DATA.glob("v*.md"), key=lambda p: version_tuple(p.stem[1:]), reverse=True)
    entries = [e for e in (parse(p.read_text(encoding="utf-8")) for p in files) if e]
    if not entries:
        print("::warning::no patch-note entries found, news.html will be empty")

    rendered = [render_entry(e, is_latest=(i == 0)) for i, e in enumerate(entries)]
    block = "\n\n".join(rendered)

    template = TEMPLATE.read_text(encoding="utf-8")
    if "<!-- NEWS_ENTRIES -->" not in template:
        print("::error::template is missing the <!-- NEWS_ENTRIES --> marker")
        return 1
    output = template.replace("<!-- NEWS_ENTRIES -->", block)
    OUT.write_text(output, encoding="utf-8")
    print(f"rendered {len(entries)} entries to {OUT.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
