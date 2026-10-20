#!/usr/bin/env python3
"""Audit a static mirror without third-party dependencies."""
import argparse
import json
import re
from collections import Counter
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
ORIGIN_HOST = "www.hss.cs.t-kougei.ac.jp"
CSS_URL = re.compile(r"url\(\s*['\"]?([^'\")\s]+)", re.I)
CSS_IMPORT = re.compile(r"@import\s+['\"]([^'\"]+)", re.I)


class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=True)
        self.references = []
        self.ids = set()
        self.feed(text)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for key in ("id", "name" if tag == "a" else "id"):
            if attrs.get(key):
                self.ids.add(attrs[key])
        for key in ("href", "src", "poster", "data" if tag == "object" else "src"):
            if attrs.get(key) and (key != "href" or tag in ("a", "link", "area")):
                item = (f"{tag}[{key}]", attrs[key])
                if item not in self.references:
                    self.references.append(item)
        if attrs.get("srcset"):
            for part in attrs["srcset"].split(","):
                if part.strip():
                    self.references.append(("srcset", part.strip().split()[0]))
        if attrs.get("style"):
            self.references.extend(("style", value) for value in CSS_URL.findall(attrs["style"]))
        if tag == "base":
            self.references.append(("unsupported-base", attrs.get("href", "")))
        if tag == "form":
            self.references.append(("unsupported-form", attrs.get("action", "")))


def audit(site):
    files = sorted(path for path in site.rglob("*") if path.is_file())
    docs = {p: Document(p.read_text(encoding="utf-8-sig")) for p in files if p.suffix.lower() in (".html", ".htm")}
    missing, anchors, remote_origin, external, unsupported, root_relative = [], [], [], [], [], []
    local_count = 0
    for source in files:
        refs = list(docs[source].references) if source in docs else []
        if source.suffix.lower() == ".css":
            css = source.read_text(encoding="utf-8-sig")
            refs += [("css", value) for value in CSS_URL.findall(css) + CSS_IMPORT.findall(css)]
        for kind, value in refs:
            row = {"source": source.relative_to(site).as_posix(), "kind": kind, "target": value}
            if kind.startswith("unsupported-"):
                unsupported.append(row)
                continue
            url = urlsplit(value)
            if url.scheme in ("mailto", "tel", "data", "javascript", "blob"):
                continue
            if url.netloc or url.scheme:
                (remote_origin if url.hostname == ORIGIN_HOST else external).append(row)
                continue
            if url.path.startswith("/"):
                root_relative.append(row)
            target = (site / unquote(url.path).lstrip("/") if url.path.startswith("/") else source.parent / unquote(url.path)) if url.path else source
            target = target.resolve()
            if not target.is_relative_to(site):
                missing.append(row)
                continue
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                missing.append(row)
                continue
            local_count += 1
            if url.fragment and target in docs and unquote(url.fragment) not in docs[target].ids:
                anchors.append(row)
    oversized = [p.relative_to(site).as_posix() for p in files if p.stat().st_size >= 100 * 1024 * 1024]
    return {
        "summary": {"files": len(files), "html_pages": len(docs), "bytes": sum(p.stat().st_size for p in files),
                    "extensions": dict(sorted(Counter(p.suffix.lower() or "(none)" for p in files).items())),
                    "local_references_checked": local_count, "missing_local_files": len(missing),
                    "missing_fragments": len(anchors), "original_host_references": len(remote_origin),
                    "external_references": len(external), "root_relative_references": len(root_relative),
                    "unsupported_features": len(unsupported), "oversized_files": len(oversized)},
        "pages": [p.relative_to(site).as_posix() for p in docs],
        "missing_local_files": missing, "missing_fragments": anchors,
        "original_host_references": remote_origin, "external_references": external,
        "root_relative_references": root_relative, "unsupported_features": unsupported,
        "oversized_files": oversized,
    }


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--site", type=Path, default=ROOT / "site")
    parser.add_argument("--report", type=Path)
    args = parser.parse_args()
    site = args.site.resolve()
    if not (site / "index.html").is_file():
        parser.error(f"index.html not found in {site}")
    report = audit(site)
    if args.report:
        args.report.parent.mkdir(parents=True, exist_ok=True)
        args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(report["summary"], ensure_ascii=False, indent=2))
    keys = ("missing_local_files", "root_relative_references", "unsupported_features", "oversized_files")
    raise SystemExit(1 if any(report[key] for key in keys) else 0)


if __name__ == "__main__":
    main()
