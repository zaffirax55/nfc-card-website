"""Assemble and verify the existing two-source PUBLIC_PREVIEW Pages layout."""
from __future__ import annotations

import argparse
import hashlib
from html.parser import HTMLParser
import json
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import unquote, urlsplit

BASE = "/nfc-card-website"
ORIGIN = "https://zaffirax55.github.io"
IDENTITY = "PUBLICATION_IDENTITY.json"


def require_sha(value: str) -> str:
    if not re.fullmatch(r"[0-9a-f]{40}", value):
        raise ValueError("A full lowercase 40-character commit SHA is required")
    return value


def verify_commit(root: Path, expected: str) -> None:
    require_sha(expected)
    resolved = subprocess.check_output(
        ["git", "rev-parse", "HEAD^{commit}"], cwd=root, text=True).strip()
    if resolved != expected:
        raise ValueError("Checkout does not match the requested exact source SHA")
    if subprocess.check_output(["git", "status", "--porcelain", "--untracked-files=no"], cwd=root):
        raise ValueError("Tracked source changed during the publication build")


def mount(site: Path, storefront: Path) -> None:
    source = storefront / "work/designer-preview-v36_2/nfc-card-website"
    target = site / "optidigital-3d"
    if not source.is_dir() or target.exists():
        raise ValueError("Expected a fresh root artifact and the explicit designer preview build")
    shutil.copytree(source, target)
    for file in target.rglob("*"):
        if file.is_file() and file.suffix in {".html", ".mjs", ".js", ".css", ".xml", ".txt", ".json"}:
            raw = file.read_text(encoding="utf-8")
            edited = (raw.replace("https://optidigitalagent.github.io", ORIGIN)
                      .replace(BASE + "/", BASE + "/optidigital-3d/")
                      .replace("'" + BASE + "'", "'" + BASE + "/optidigital-3d'"))
            if raw != edited:
                file.write_text(edited, encoding="utf-8")
    (site / ".nojekyll").touch()


class Document(HTMLParser):
    def __init__(self):
        super().__init__()
        self.robots = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        data = dict(attrs)
        if tag == "meta" and data.get("name", "").lower() == "robots":
            self.robots.append(data.get("content", "").lower())
        for key in ("href", "src", "poster"):
            if data.get(key):
                self.links.append(data[key])


def inventory(site: Path) -> dict:
    entries = {}
    for file in sorted(site.rglob("*")):
        if file.is_symlink():
            raise ValueError("Pages artifact must not contain symlinks")
        if file.is_file():
            entries[file.relative_to(site).as_posix()] = hashlib.sha256(file.read_bytes()).hexdigest()
    return entries


def fingerprint(entries: dict) -> str:
    return hashlib.sha256("".join(p + "\0" + entries[p] + "\n" for p in sorted(entries)).encode()).hexdigest()


def validate(site: Path) -> dict:
    required = ["index.html", ".nojekyll", "assets/media", "assets/model-viewer.min.js",
                "assets/nfc-review-card-3d.glb", "optidigital-3d/index.html",
                "optidigital-3d/assets/model-viewer.min.js", "optidigital-3d/assets/models/review-standard.glb"]
    for name in required:
        if not (site / name).exists():
            raise ValueError("Missing Pages artifact path: " + name)
    if len(list((site / "optidigital-3d/assets/models").glob("*.glb"))) != 12:
        raise ValueError("Designer preview requires all 12 GLB models")
    pages = list(site.rglob("*.html"))
    for file in pages:
        doc = Document()
        doc.feed(file.read_text(encoding="utf-8"))
        if not doc.robots or not all("noindex" in value for value in doc.robots):
            raise ValueError("PUBLIC_PREVIEW noindex missing: " + file.relative_to(site).as_posix())
        for link in doc.links:
            url = urlsplit(link)
            if url.scheme not in ("", "https", "http") or (url.netloc and url.netloc != urlsplit(ORIGIN).netloc):
                continue
            if not url.path.startswith(BASE + "/"):
                continue
            relative = unquote(url.path[len(BASE) + 1:])
            target = site / relative
            if not target.resolve().is_relative_to(site.resolve()):
                raise ValueError("Artifact URL escapes the Pages base")
            if target.is_dir():
                target /= "index.html"
            if not target.is_file():
                raise ValueError("Broken local artifact URL in " + file.relative_to(site).as_posix() + ": " + url.path)
    return {"html_pages": len(pages), "mode": "PUBLIC_PREVIEW", "layout": "site/ + site/optidigital-3d/"}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--storefront", type=Path, required=True)
    parser.add_argument("--main-sha", required=True)
    parser.add_argument("--storefront-sha", required=True)
    parser.add_argument("--workflow-sha", required=True)
    args = parser.parse_args()
    root = Path(__file__).resolve().parents[1]
    storefront = args.storefront.resolve()
    verify_commit(root, args.main_sha)
    verify_commit(storefront, args.storefront_sha)
    if require_sha(args.workflow_sha) != args.main_sha:
        raise ValueError("The main source and publishing workflow must have the same SHA")
    site = root / "site"
    mount(site, storefront)
    checks = validate(site)
    payload = inventory(site)
    identity = {"main_sha": args.main_sha, "storefront_sha": args.storefront_sha,
                "workflow_sha": args.workflow_sha, "publication_mode": "PUBLIC_PREVIEW",
                "payload_sha256": fingerprint(payload),
                "digest_algorithm": "sorted relative path + NUL + file SHA256 + LF; excludes " + IDENTITY}
    (site / IDENTITY).write_text(json.dumps(identity, indent=2) + "\n")
    final = inventory(site)
    evidence = root / "work/publication-evidence"
    evidence.mkdir(parents=True, exist_ok=True)
    (evidence / "artifact-manifest.json").write_text(json.dumps({"files": final, "tree_sha256": fingerprint(final)}, indent=2) + "\n")
    (evidence / "sources-and-checks.json").write_text(json.dumps({**identity, **checks}, indent=2) + "\n")
    print(json.dumps({**identity, **checks, "final_tree_sha256": fingerprint(final)}))


if __name__ == "__main__":
    main()
