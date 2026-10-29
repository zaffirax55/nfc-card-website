"""Synthetic adversarial release packaging tests; no Git initialization/network."""
import hashlib
import json
from pathlib import Path
import sys

import pytest

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import release_guard as rg
import update_manifest as um
import verify_manifest as vm
from run_tests import test_database_is_isolated as database_is_isolated


def put(root, name, data=b"authored source\n"):
    path = root / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)
    return path


def seal(root):
    files = []
    for name, path in sorted(vm.source_files(root).items()):
        if name != vm.MANIFEST:
            data = path.read_bytes()
            files.append({"path": name, "bytes": len(data), "sha256": hashlib.sha256(data).hexdigest()})
    data = {"algorithm": "SHA-256", "file_count_including_manifest": len(files) + 1, "files": files}
    put(root, vm.MANIFEST, json.dumps(data).encode())
    return data


@pytest.fixture
def tree(tmp_path):
    put(tmp_path, "src/app.js")
    put(tmp_path, ".env.example", b"NFC_ENV=\n")
    put(tmp_path, ".gitignore", b"hidden.txt\n.env*\n*.log\n")
    seal(tmp_path)
    return tmp_path


def test_manifest_works_after_exact_generated_roots(tree):
    before = vm.verify(tree)
    for root in vm.GENERATED_ROOTS:
        put(tree, root + "/generated.dat")
    assert vm.verify(tree) == before


@pytest.mark.parametrize("name", ["hidden.txt", ".env", "debug.log", "docs/node_modules/notes.md",
                                 "src/site/notes.md", "docs/__pycache__/notes.md",
                                 "refinements/visual-about-v13/new-report.json"])
def test_unexpected_authored_files_cannot_hide_behind_gitignore(tree, name):
    put(tree, name)
    with pytest.raises(vm.ManifestError, match="unexpected authored"):
        vm.verify(tree)


def test_missing_and_same_size_tampered_source_rejected(tree):
    path = tree / "src/app.js"
    original = path.read_bytes()
    path.write_bytes(b"X" * len(original))
    with pytest.raises(vm.ManifestError, match="hash mismatch"):
        vm.verify(tree)
    path.unlink()
    with pytest.raises(vm.ManifestError, match="1 missing"):
        vm.verify(tree)


@pytest.mark.parametrize("name", ["link", "src/link", "site", "server/templates", ".git", vm.MANIFEST])
def test_symlinks_rejected_even_at_generated_boundaries(tree, name):
    path = tree / name
    if path.exists():
        path.unlink()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.symlink_to(tree / "src")
    with pytest.raises(vm.ManifestError, match="Symlink"):
        vm.verify(tree)


def test_broken_link_and_special_file_rejected(tree):
    link = tree / "broken"
    link.symlink_to(tree / "absent")
    with pytest.raises(vm.ManifestError, match="Symlink"):
        vm.source_files(tree)
    link.unlink()
    import os
    os.mkfifo(tree / "pipe")
    with pytest.raises(vm.ManifestError, match="Special file"):
        vm.source_files(tree)


def test_generated_boundary_must_be_a_directory(tree):
    put(tree, "site")
    with pytest.raises(vm.ManifestError, match="replaced with a file"):
        vm.verify(tree)


def test_only_reciprocal_registered_git_worktree_marker_is_excluded(tree, tmp_path):
    metadata = tmp_path.parent / (tmp_path.name + "-gitmeta")
    registration = metadata / "worktrees" / "release"
    registration.mkdir(parents=True)
    put(metadata, "config", b"[core]\nrepositoryformatversion = 0\n")
    put(metadata, "HEAD", b"ref: refs/heads/main\n")
    put(registration, "commondir", b"../..\n")
    put(registration, "gitdir", str(tree / ".git").encode() + b"\n")
    put(tree, ".git", ("gitdir: " + str(registration) + "\n").encode())
    vm.verify(tree)
    put(registration, "gitdir", str(tree / "other").encode() + b"\n")
    with pytest.raises(vm.ManifestError, match="replaced with a file"):
        vm.verify(tree)


@pytest.mark.parametrize("name", ["../escape", "/absolute", "a/../b", "a//b", "./a", "a/",
                                 "C:/drive", "a\\b", "a\nb", "a/.", "a. ", "site/index.html",
                                 vm.MANIFEST])
def test_unsafe_manifest_paths_rejected(tree, name):
    data = seal(tree)
    data["files"][0]["path"] = name
    with pytest.raises(vm.ManifestError):
        vm.parse_manifest(json.dumps(data).encode())


@pytest.mark.parametrize("change", ["duplicate", "case", "size", "digest", "count", "algorithm", "policy"])
def test_malformed_manifest_rejected(tree, change):
    data = seal(tree)
    if change in ("duplicate", "case"):
        entry = dict(data["files"][0])
        if change == "case":
            entry["path"] = entry["path"].upper()
        data["files"].append(entry)
        data["file_count_including_manifest"] += 1
    elif change == "size":
        data["files"][0]["bytes"] = True
    elif change == "digest":
        data["files"][0]["sha256"] = "bad"
    elif change == "count":
        data["file_count_including_manifest"] = 0
    elif change == "algorithm":
        data["algorithm"] = "MD5"
    else:
        data["release_source"] = {"excluded_generated_roots": ["src"]}
    with pytest.raises(vm.ManifestError):
        vm.parse_manifest(json.dumps(data).encode())


def test_duplicate_json_keys_rejected():
    with pytest.raises(vm.ManifestError, match="Duplicate JSON key"):
        vm.parse_manifest(b'{"algorithm":"SHA-256","algorithm":"MD5"}')


def preserve_handoff(tree):
    return put(tree, vm.HANDOFF_MANIFEST, (ROOT / vm.HANDOFF_MANIFEST).read_bytes())


def test_refresh_preserves_handoff_is_deterministic_and_hashes_docs_tests(tree):
    preserved = preserve_handoff(tree)
    original = preserved.read_bytes()
    assert hashlib.sha256(original).hexdigest() == vm.HANDOFF_MANIFEST_SHA256
    assert len(json.loads(original)["files"]) == 199
    put(tree, "docs/release.md")
    put(tree, "tests/new_test.py")
    put(tree, "src/report.json", b'{"authored":true}')
    um.refresh(tree)
    first = (tree / vm.MANIFEST).read_bytes()
    put(tree, "work/qa/summary.json")
    um.refresh(tree)
    assert (tree / vm.MANIFEST).read_bytes() == first
    assert preserved.read_bytes() == original
    names = {i["path"] for i in json.loads(first)["files"]}
    assert {"docs/release.md", "tests/new_test.py", "src/report.json", vm.HANDOFF_MANIFEST} <= names
    assert vm.verify(tree) == len(names)


def test_refresh_refuses_missing_or_altered_handoff(tree):
    with pytest.raises(vm.ManifestError, match="Preserve the original"):
        um.refresh(tree)
    preserve_handoff(tree).write_bytes(b"changed")
    with pytest.raises(vm.ManifestError, match="Preserve the original"):
        um.refresh(tree)


def test_refresh_refuses_source_edit_during_scan(tree, monkeypatch):
    preserve_handoff(tree)
    original = (tree / vm.MANIFEST).read_bytes()
    original_walk = um.source_files
    calls = 0

    def changing(root):
        nonlocal calls
        calls += 1
        if calls == 2:
            put(tree, "src/app.js", b"concurrent edit")
        return original_walk(root)

    monkeypatch.setattr(um, "source_files", changing)
    with pytest.raises(vm.ManifestError, match="changed during refresh"):
        um.refresh(tree)
    assert (tree / vm.MANIFEST).read_bytes() == original


def test_refresh_cannot_normalize_an_ignored_private_file_into_release(tree):
    preserve_handoff(tree)
    old = (tree / vm.MANIFEST).read_bytes()
    put(tree, ".env", b"PRIVATE_VALUE=synthetic\n")
    with pytest.raises(vm.ManifestError, match="guard rejected"):
        um.refresh(tree)
    assert (tree / vm.MANIFEST).read_bytes() == old


@pytest.mark.parametrize("name", [".env", "docs/.env.example", "logs/request.log", "backup.sql",
                                 "private/image.webp", "exports/customers.csv", "cookies.json",
                                 "screenshots/admin.png", "private-key.pem", ".aws/config",
                                 "notes/customer_email.json", "data/db.sqlite3"])
def test_private_paths_fail_guard_even_if_ignored(tree, name):
    put(tree, name, b"synthetic\n")
    assert rg.guard(tree)


@pytest.mark.parametrize("value", ["NFC_ENV=production\n", "NFC_ENV=''\n", "NFC_ENV= # empty\n",
                                  "NFC_ENV=\nNFC_ENV=\n", "# no variables\n"])
def test_env_example_values_cannot_be_committed(tree, value):
    put(tree, ".env.example", value.encode())
    assert any(f.rule.startswith("env-example") for f in rg.guard(tree))


def test_real_example_has_only_empty_values():
    assert not rg.scan_bytes(".env.example", (ROOT / ".env.example").read_bytes())


def payloads():
    return [
        ("provider-token", "ghp_" + "S" * 36),
        ("provider-token", "sk-proj-" + "S" * 48),
        ("aws-access-id", "AKIA" + "S" * 16),
        ("private-key", "-----BEGIN " + "RSA PRIVATE KEY-----"),
        ("telegram-token", "123456789:" + "S" * 35),
        ("jwt", "eyJ" + "S" * 14 + "." + "S" * 20 + "." + "S" * 20),
        ("credential-url", "postgresql://user:" + "synthetic-value@db.invalid/production"),
        ("credential-literal", "password" + " = 'synthetic-unapproved-value'"),
        ("credential-env", "NFC_S3_SECRET_KEY" + "=synthetic-unapproved-value"),
        ("credential-env", "password" + ": synthetic-unapproved-value"),
        ("private-user-path", "/Users/" + "synthetic-owner/private/file"),
        ("private-record", '"customer_email"' + ': "synthetic@example.invalid"'),
    ]


@pytest.mark.parametrize("rule,value", payloads())
def test_secret_patterns_scan_arbitrary_files_without_echoing_values(tree, rule, value):
    findings = rg.scan_bytes("src/unreviewed.txt", value.encode())
    assert any(f.rule == rule for f in findings)
    assert all(value not in f.diagnostic() for f in findings)


def test_utf16_and_binary_extensions_do_not_hide_credentials():
    rule, value = payloads()[0]
    for data in [value.encode("utf-16"), value.encode("utf-16-le"), b"\x00\xff" + value.encode()]:
        assert any(f.rule == rule for f in rg.scan_bytes("src/picture.bin", data))


def test_exact_synthetic_line_exemptions_are_not_path_or_keyword_bypasses():
    path = "tests/test_v12_reviews.py"
    line = (ROOT / path).read_text().splitlines()[24]
    assert not rg.scan_bytes(path, line.encode())
    assert rg.scan_bytes("tests/new_test.py", line.encode())
    assert rg.scan_bytes(path, (line + " # changed").encode())
    assignment = "PASSWORD" + "=" + repr("synthetic-but-unreviewed")
    assert rg.scan_bytes(path, assignment.encode())


def test_reviewed_exemptions_all_still_match_their_exact_source_lines():
    for (name, rule, digest), reason in rg.SAFE_FIXTURES.items():
        lines = (ROOT / name).read_text().splitlines()
        matches = [line for line in lines if hashlib.sha256(line.strip().encode()).hexdigest() == digest]
        assert len(matches) == 1 and reason
        assert rg.PATTERNS[rule].search(matches[0])


def test_guard_does_not_scan_external_dependency_symlinks(tree):
    put(tree, "node_modules/package/index.js")
    (tree / "node_modules/bin").symlink_to(tree / "node_modules/package")
    assert not rg.guard(tree)


def test_guard_scans_authored_static_reports(tree):
    _, value = payloads()[0]
    put(tree, "src/report.json", value.encode())
    assert any(f.rule == "provider-token" for f in rg.guard(tree))


def mock_git(monkeypatch, tree, *, index=(), history=(), blobs=None, shallow=False, message=None, tag=None):
    (tree / ".git").mkdir()
    blobs = blobs or {}
    calls = []

    def fake(root, *args):
        calls.append(args)
        if args == ("rev-parse", "--show-toplevel"):
            return str(tree).encode() + b"\n"
        if args == ("rev-parse", "--is-shallow-repository"):
            return b"true\n" if shallow else b"false\n"
        if args == ("ls-files", "--stage", "-z"):
            return b"".join(f"{mode} {oid} 0\t{name}\0".encode() for mode, oid, name in index)
        if args == ("rev-list", "--all", "HEAD"):
            return b"\n".join(commit.encode() for commit, _ in history)
        if args[:4] == ("ls-tree", "-r", "-z", "--full-tree"):
            entries = dict(history)[args[4]]
            return b"".join(f"{mode} blob {oid}\t{name}\0".encode() for mode, oid, name in entries)
        if args[:2] == ("cat-file", "blob"):
            return blobs[args[2]]
        if args[:2] == ("cat-file", "commit"):
            return message or b"Synthetic commit message\n"
        if args[0] == "for-each-ref":
            return (b"d" * 40 + b" tag\n") if tag else b""
        if args[:2] == ("cat-file", "tag"):
            return tag
        raise AssertionError(args)

    monkeypatch.setattr(rg, "git", fake)
    return calls


def test_staged_secret_is_detected_even_when_working_copy_is_clean(tree, monkeypatch):
    oid = "a" * 40
    _, value = payloads()[0]
    mock_git(monkeypatch, tree, index=[("100644", oid, "src/app.js")], blobs={oid: value.encode()})
    assert any(f.revision == "index" and f.rule == "provider-token" for f in rg.guard(tree))


def test_history_detects_deleted_secret_and_generated_files(tree, monkeypatch):
    old, current, oid = "a" * 40, "b" * 40, "c" * 40
    _, value = payloads()[0]
    calls = mock_git(monkeypatch, tree, history=[(current, []), (old, [("100644", oid, "work/deleted.txt")])], blobs={oid: value.encode()})
    findings = rg.guard(tree, history=True)
    assert {"generated-file-in-git", "provider-token"} <= {f.rule for f in findings}
    assert all(f.revision == old[:12] for f in findings)
    assert ("rev-list", "--all", "HEAD") in calls


def test_history_checks_commit_and_annotated_tag_messages(tree, monkeypatch):
    _, value = payloads()[0]
    mock_git(monkeypatch, tree, history=[("a" * 40, [])], message=value.encode(), tag=value.encode())
    assert {f.path for f in rg.guard(tree, history=True)} == {"<commit-message>", "<tag-message>"}


@pytest.mark.parametrize("mode", ["120000", "160000"])
def test_git_symlinks_and_submodules_rejected(tree, monkeypatch, mode):
    mock_git(monkeypatch, tree, index=[(mode, "a" * 40, "src/link")])
    assert any(f.rule == "git-symlink-submodule-or-special-file" for f in rg.guard(tree))


def test_history_requires_repository_commit_and_full_history(tree, monkeypatch):
    with pytest.raises(vm.ManifestError, match="first commit"):
        rg.guard(tree, history=True)
    mock_git(monkeypatch, tree, shallow=True)
    with pytest.raises(vm.ManifestError, match="non-shallow"):
        rg.guard(tree, history=True)


@pytest.mark.parametrize("suffix", ["", "_clone", "_v16", "_Clone", "__clone", "extra", "/clone", "?dbname=production", "?service=production", "#fragment"])
def test_runner_requires_anchored_test_database(suffix):
    url = "postgresql://nfc_test@127.0.0.1:55542/nfc_v12_test" + suffix
    assert database_is_isolated(url) is (suffix in ("", "_clone", "_v16"))


def test_history_diagnostics_never_include_secret_filename():
    _, value = payloads()[0]
    finding = rg.Finding("src/" + value, "unsafe-path")
    assert value not in finding.diagnostic()
