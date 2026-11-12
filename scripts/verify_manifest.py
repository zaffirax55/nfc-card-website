"""Verify release bytes independently of Git and its ignore rules (stdlib only)."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import re
import stat

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = "SOURCE_MANIFEST.json"
HANDOFF_MANIFEST = "docs/release/v1.0.0/source-handoff-manifest.json"
HANDOFF_MANIFEST_SHA256 = "7d6db6f7b5c6d911cbdae2a8eed4a94568fc300ffd1f699bdf49b1b92427bf68"
ARCHIVE_SHA256 = "9cf61bc26214321d296adeae4c63eb21a5b624bfa9f8849797bcb51c66ff5de0"
# Exact paths relative to the release root, never basename/glob/gitignore rules.
# Symlinks at these boundaries are rejected before they can be excluded.
GENERATED_ROOTS = (
    ".git", ".pytest_cache", ".venv", "__pycache__", "node_modules",
    "scripts/__pycache__", "server/__pycache__", "server/templates",
    "site", "tests/__pycache__", "work",
)


class ManifestError(ValueError):
    pass


def safe_path(value: str) -> str:
    if (not isinstance(value, str) or not value or value.startswith("/")
            or "\\" in value or ":" in value
            or any(ord(c) < 32 or ord(c) == 127 for c in value)
            or any(p in ("", ".", "..") or p.endswith((" ", ".")) for p in value.split("/"))):
        raise ManifestError("Unsafe or noncanonical relative path")
    return value


def generated_path(path: str) -> bool:
    return any(path == p or path.startswith(p + "/") for p in GENERATED_ROOTS)


def registered_worktree_marker(path: Path) -> bool:
    """Accept only reciprocal Git worktree metadata, never an arbitrary file."""
    try:
        marker = read_regular(path).decode("utf-8")
        if not re.fullmatch(r"gitdir: /[^\r\n]+\n?", marker):
            return False
        directory = Path(marker.removeprefix("gitdir: ").strip())
        if directory.is_symlink() or not directory.is_dir():
            return False
        backlink = Path(read_regular(directory / "gitdir").decode("utf-8").strip())
        if backlink.resolve(strict=True) != path.resolve(strict=True):
            return False
        common = (directory / read_regular(directory / "commondir").decode("utf-8").strip()).resolve(strict=True)
        return (common / "config").is_file() and (common / "HEAD").is_file()
    except (OSError, UnicodeError, ValueError):
        return False


def source_files(root: Path) -> dict[str, Path]:
    """Walk every authored file, including dotfiles and Git-ignored files."""
    root = Path(root).absolute()
    if root.is_symlink() or not root.is_dir():
        raise ManifestError("Release root must be a real directory")
    found: dict[str, Path] = {}
    folded: set[str] = set()

    def visit(directory: Path) -> None:
        for entry in sorted(directory.iterdir(), key=lambda p: p.name):
            relative = safe_path(entry.relative_to(root).as_posix())
            info = entry.lstat()
            if stat.S_ISLNK(info.st_mode):
                raise ManifestError("Symlink in release tree")
            if not (stat.S_ISREG(info.st_mode) or stat.S_ISDIR(info.st_mode)):
                raise ManifestError("Special file in release tree")
            if relative.casefold() in folded:
                raise ManifestError("Case-colliding release path")
            folded.add(relative.casefold())
            if stat.S_ISDIR(info.st_mode):
                if relative not in GENERATED_ROOTS:
                    visit(entry)
            elif relative in GENERATED_ROOTS:
                if relative != ".git" or not registered_worktree_marker(entry):
                    raise ManifestError("Generated directory replaced with a file")
            else:
                found[relative] = entry

    visit(root)
    return found


def read_regular(path: Path) -> bytes:
    # O_NOFOLLOW prevents a file becoming a symlink between inventory/read.
    fd = os.open(path, os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    with os.fdopen(fd, "rb") as stream:
        if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
            raise ManifestError("Expected a regular file")
        return stream.read()


def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        if key in result:
            raise ManifestError("Duplicate JSON key in manifest")
        result[key] = value
    return result


def parse_manifest(data: bytes) -> dict:
    try:
        manifest = json.loads(data, object_pairs_hook=unique_keys)
    except (UnicodeError, json.JSONDecodeError) as exc:
        raise ManifestError("Invalid UTF-8 JSON manifest") from exc
    if not isinstance(manifest, dict) or manifest.get("algorithm") != "SHA-256":
        raise ManifestError("Unsupported manifest algorithm/schema")
    files = manifest.get("files")
    if not isinstance(files, list) or not files:
        raise ManifestError("Manifest must contain a nonempty file list")
    count = manifest.get("file_count_including_manifest")
    if type(count) is not int or count != len(files) + 1:
        raise ManifestError("Manifest file count is inconsistent")
    seen = set()
    for item in files:
        if not isinstance(item, dict) or set(item) != {"path", "bytes", "sha256"}:
            raise ManifestError("Invalid manifest file entry")
        name = safe_path(item["path"])
        if name == MANIFEST or generated_path(name) or name.casefold() in seen:
            raise ManifestError("Duplicate, self-hashed, or generated manifest path")
        seen.add(name.casefold())
        if (type(item["bytes"]) is not int or item["bytes"] < 0
                or not isinstance(item["sha256"], str)
                or not re.fullmatch(r"[0-9a-f]{64}", item["sha256"])):
            raise ManifestError("Invalid manifest size or digest")
    if "release_source" in manifest and manifest["release_source"] != release_provenance():
        raise ManifestError("Release provenance or generated-root policy changed")
    return manifest


def release_provenance() -> dict:
    return {"handoff_archive_sha256": ARCHIVE_SHA256,
            "handoff_manifest": HANDOFF_MANIFEST,
            "handoff_manifest_sha256": HANDOFF_MANIFEST_SHA256,
            "excluded_generated_roots": list(GENERATED_ROOTS)}


def verify(root: Path = ROOT) -> int:
    actual = source_files(root)
    if MANIFEST not in actual:
        raise ManifestError("SOURCE_MANIFEST.json is missing")
    manifest = parse_manifest(read_regular(actual[MANIFEST]))
    expected = {i["path"] for i in manifest["files"]} | {MANIFEST}
    missing = expected - actual.keys()
    unexpected = actual.keys() - expected
    if missing or unexpected:
        # Counts avoid leaking secrets embedded in unexpected file names.
        raise ManifestError(f"Source inventory differs: {len(missing)} missing; {len(unexpected)} unexpected authored files")
    for item in manifest["files"]:
        data = read_regular(actual[item["path"]])
        if len(data) != item["bytes"] or hashlib.sha256(data).hexdigest() != item["sha256"]:
            raise ManifestError("Source size/hash mismatch: " + item["path"])
    if "release_source" in manifest:
        if HANDOFF_MANIFEST not in actual or hashlib.sha256(read_regular(actual[HANDOFF_MANIFEST])).hexdigest() != HANDOFF_MANIFEST_SHA256:
            raise ManifestError("Original handoff manifest missing or changed")
    return len(manifest["files"])


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    args = parser.parse_args()
    try:
        count = verify(args.root)
    except (ManifestError, OSError) as exc:
        print("Manifest verification failed: " + (str(exc) if isinstance(exc, ManifestError) else "unreadable source file"))
        return 1
    print(f"Manifest verified: {count} hashed files plus manifest")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
