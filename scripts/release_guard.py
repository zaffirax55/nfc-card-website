"""Fail closed on release secrets/private files; never print matching values.

This is a reproducible pattern/path gate, not proof that arbitrary secrets or
personal data cannot exist. Human review and asset provenance remain required.
"""
from __future__ import annotations

import argparse
from dataclasses import dataclass
import hashlib
import os
from pathlib import Path
import re
import subprocess
import sys

sys.path.insert(0, str(Path(__file__).resolve().parent))
from verify_manifest import ROOT, ManifestError, generated_path, read_regular, safe_path, source_files


@dataclass(frozen=True)
class Finding:
    path: str
    rule: str
    line: int = 0
    revision: str = "working-tree"

    def diagnostic(self) -> str:
        # Paths can themselves contain secrets. Emit a stable path identifier
        # and line/rule only; never source snippets, values, Git stderr or diffs.
        identifier = hashlib.sha256(self.path.encode("utf-8", errors="replace")).hexdigest()[:12]
        return f"{self.revision} file-id={identifier} line={self.line} rule={self.rule}"


PATTERNS = {
    "private-key": re.compile(r"-----BEGIN (?:[A-Z0-9]+ )*PRIVATE KEY-----"),
    "aws-access-id": re.compile(r"\b(?:AKIA|ASIA)[A-Z0-9]{16}\b", re.ASCII),
    "provider-token": re.compile(r"\b(?:gh[pousr]_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{30,}|xox[baprs]-[A-Za-z0-9-]{20,}|sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{24,}|sk_live_[A-Za-z0-9]{16,})\b", re.ASCII),
    "telegram-token": re.compile(r"\b[0-9]{8,12}:[A-Za-z0-9_-]{30,}\b", re.ASCII),
    "jwt": re.compile(r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b", re.ASCII),
    "credential-url": re.compile(r"\b(?:https?|postgres(?:ql)?|mysql|mongodb(?:\+srv)?|redis|rediss)://[^\s/:'\"]+:[^\s/@'\"]+@", re.I),
    "private-user-path": re.compile(r"(?:/(?:Users|home)/[^/\s'\"<>]+/|[A-Za-z]:[\\/]+Users[\\/]+[^\\/\s'\"<>]+[\\/])"),
    "credential-literal": re.compile(
        r"(?i)(?<![\w-])['\"]?(?:[a-z0-9_]*(?:password(?:_hash)?|passwd|secret(?:_key)?|api_key|access_key|auth_token|session_token|bot_token|credentials)|token)['\"]?\s*[:=]\s*(['\"])([^'\"\r\n]+)\1"),
    "credential-env": re.compile(
        r"(?im)^\s*(?:export\s+)?[A-Z0-9_]*(?:PASSWORD(?:_HASH)?|PASSWD|SECRET(?:_KEY)?|API_KEY|ACCESS_KEY|AUTH_TOKEN|BOT_TOKEN|CREDENTIALS)\s*[:=]\s*([A-Za-z0-9_./+@!:%$=-]+)\s*(?:#.*)?$"),
    "private-record": re.compile(r"['\"](?:raw_review_text|session_hash|csrf_hash|customer_email|customer_phone)['\"]\s*:\s*['\"][^'\"\r\n]+['\"]", re.I),
}

# Keys are (exact repository path, rule, SHA-256 of the entire stripped line).
# Only individually reviewed synthetic fixtures belong here; changing or
# appending anything to that line invalidates the exemption. No tests/** or
# keyword-based bypass exists. Reasons and fixture scopes are in PACKAGING.md.
SAFE_FIXTURES: dict[tuple[str, str, str], str] = {
    ('src/v36_2/api-client.mjs', 'credential-literal', '75ddb62862e54661e82143d0791cea8ad0466257688e34df04abf0ed86932afb'): 'Fetch credentials mode omit, not a credential value; exact immutable archive source.',
    ('src/v36_2/legacy-v36/pages.mjs', 'credential-literal', 'c69d8f3d1537648b69d5e4792668ce05f6afc6deebe85a20ba150355766a6cb0'): 'Fetch credentials mode omit, not a credential value; exact immutable archive source.',
    ('src/v36_2/legacy-v36/pages.mjs', 'credential-literal', '42fff62a2d917c178ec83a013dcece0a1bc0458648c77cf7167a083d143887bd'): 'Fetch credentials mode omit, not a credential value; exact immutable archive source.',
    ("tests/test_pages_v17.py", "credential-literal", "735b954cc21270d13d65ef6927da6c7abcf443949108201bb52af41f12b5113f"): "unsigned synthetic challenge stub; transport fully mocked",
    ("src/pages.mjs", "credential-literal", "c69d8f3d1537648b69d5e4792668ce05f6afc6deebe85a20ba150355766a6cb0"): "GET challenge fetch credentials mode omit; no credential value",
    ("server/set_admin_password.py", "credential-literal", "ed7489ccf2dbe1f9ac0862947de7e10b7acefc3ff748436455524a936bc85d09"): "getpass confirmation prompt; no credential value",
    ("src/admin-reviews.js", "credential-literal", "83a10662969214b3e8a3531c70eee41191893818142863a9e9ccf9d83a8f2c22"): "fetch credentials mode same-origin; no credential value",
    ("src/pages.mjs", "credential-literal", "42fff62a2d917c178ec83a013dcece0a1bc0458648c77cf7167a083d143887bd"): "fetch credentials mode omit; no credential value",
    ("tests/test_pages_v17.py", "credential-literal", "881622b66d6a34e6af8eab0308ee2b00eaba3303b0ecafc424e2b26d2a1cc968"): "synthetic sentinel proving host secrets never enter the Pages artifact",
    ("tests/test_pages_v17.py", "credential-url", "1099be0ab9e8698186a400ff5ebef55a99293124293b480f50869ed8da906bd5"): "rejected credential-bearing public endpoint fixtures; no network calls",
    ("tests/test_pages_v17.py", "credential-url", "15b1e866d911af28fc99f2270c455deb037f8dbeee9ba599407423d52a1d4cce"): "build rejection fixture for credential-bearing endpoint; no network calls",
    ("tests/test_leads.py", "credential-url", "569acbdaa523c77a390a9d90ea6cf6f30c5af8a127ce44266f7ac4f22cf2ef3b"): "rejected URL validation fixture",
    ("tests/test_leads.py", "credential-url", "38dffcef3477ee8c2b88be9510841b991b83c1faa71c8a21d265b87e0a298e78"): "rejected referrer fixture",
    ("tests/test_v12_reviews.py", "credential-literal", "700ae23d898bb23222221b43a939d1daf5d1a8a30678e94d66f9740e48a02f3e"): "isolated test session signing fixture",
    ("tests/test_v12_reviews.py", "credential-literal", "6ec2926b5d6bd8580e4581e2926bba8a133a754c17ee8327fdf7d9ee445f1383"): "isolated test admin login fixture",
    ("tests/test_v12_reviews.py", "credential-url", "6ad8b375ba05e4feba8c8122449dc2167067216bc200711f3563d711d6cbbf97"): "rejected Instagram URL fixture",
    ("tests/test_v12_reviews.py", "credential-literal", "669b2c1ff6f81309d5f8202b9452297b2a8158bc071be63fb7fb51fb9aeea12e"): "stubbed private S3 client; no network access",
    ("tests/test_v12_reviews.py", "credential-literal", "648bdce8b1a8a7b3394249645007a888846012cb981c77568e2ea2b4f4ab05e2"): "wrong-password rate-limit fixture",
    (".github/workflows/ci.yml", "credential-env", "704609e6685a07a97257e7e79bd7afba142cdb67c0125eab1e364f0623ee0edf"): "disposable PostgreSQL service fixture, created/destroyed by this job",
    (".github/workflows/ci.yml", "credential-url", "5892d60942fe56d2d0fa9a5cfc49fba5278f8b2e732ecfd5dee0880d7231c497"): "exact loopback connection to that nfc_v12_test service",
}

PRIVATE_COMPONENTS = {
    ".aws", ".ssh", ".kube", ".azure", ".codex", ".agents", "governance",
    "private", "private-uploads", "uploads", "sessions", "cookies",
    "browser-profile", "browser-profiles", "playwright-report", "test-results",
    "screenshots", "pgdata", "backups",
}
PRIVATE_NAMES = {
    ".netrc", ".pgpass", ".npmrc", ".pypirc", ".ds_store", "id_rsa", "id_ed25519",
    "credentials", "credentials.json", "service-account.json", "storage-state.json",
    "storage_state.json", "cookies.json", "cookies.txt", "session-secret.txt",
    "admin-password-hash.txt",
}
PRIVATE_SUFFIXES = {
    ".db", ".sqlite", ".sqlite3", ".db-wal", ".db-shm", ".dump", ".backup", ".bak",
    ".log", ".har", ".pem", ".key", ".p12", ".pfx", ".zip", ".tar", ".gz",
    ".tgz", ".7z", ".rar", ".pyc",
}


def path_rules(name: str, *, tracked: bool = False) -> list[str]:
    try:
        safe_path(name)
    except ManifestError:
        return ["unsafe-path"]
    parts = name.lower().split("/")
    base = parts[-1]
    rules = []
    if any(p == ".env" or p.startswith(".env.") for p in parts) and name != ".env.example":
        rules.append("private-environment-file")
    if (any(p in PRIVATE_COMPONENTS for p in parts) or base in PRIVATE_NAMES
            or Path(base).suffix in PRIVATE_SUFFIXES
            or re.fullmatch(r"(?:customers?|orders?|reviews?|submissions?|sessions?|cookies?)(?:[-_].*)?\.(?:jsonl?|csv|tsv|txt)", base)
            or (base.endswith(".sql") and not re.fullmatch(r"server/migrations/[0-9]{3}_[a-z0-9_]+\.sql", name))):
        rules.append("private-or-generated-file")
    if tracked and generated_path(name):
        rules.append("generated-file-in-git")
    return rules


def scan_bytes(name: str, data: bytes, revision: str = "working-tree") -> list[Finding]:
    # latin-1 preserves every byte for ASCII token detection, even in a file
    # labelled binary. Also inspect UTF-16, so encoding isn't a bypass.
    try:
        texts = [data.decode("utf-8")]
    except UnicodeError:
        texts = [data.decode("latin-1")]
    if data.startswith((b"\xff\xfe", b"\xfe\xff")):
        try:
            texts.append(data.decode("utf-16"))
        except UnicodeError:
            pass
    elif b"\x00" in data:
        for encoding in ("utf-16-le", "utf-16-be"):
            try:
                texts.append(data.decode(encoding))
            except UnicodeError:
                pass
    findings = set()
    for text in texts:
        for number, line in enumerate(text.splitlines(), 1):
            for rule, pattern in PATTERNS.items():
                if not pattern.search(line):
                    continue
                key = (name, rule, hashlib.sha256(line.strip().encode("utf-8")).hexdigest())
                if key not in SAFE_FIXTURES:
                    findings.add(Finding(name, rule, number, revision))
    if name == ".env.example":
        try:
            example = data.decode("utf-8")
            keys = set()
            for number, line in enumerate(example.splitlines(), 1):
                value = line.strip()
                if not value or value.startswith("#"):
                    continue
                if not re.fullmatch(r"[A-Z][A-Z0-9_]*=", value) or value[:-1] in keys:
                    findings.add(Finding(name, "env-example-must-be-empty", number, revision))
                keys.add(value[:-1])
            if not keys:
                findings.add(Finding(name, "env-example-has-no-variables", revision=revision))
        except UnicodeError:
            findings.add(Finding(name, "env-example-encoding", revision=revision))
    return sorted(findings, key=lambda f: (f.path, f.line, f.rule, f.revision))


def git(root: Path, *args: str) -> bytes:
    environment = os.environ.copy()
    # Don't let an inherited worktree/index override redirect the audit.
    for key in list(environment):
        if key.startswith("GIT_"):
            environment.pop(key)
    environment.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
                       GIT_NO_REPLACE_OBJECTS="1", GIT_TERMINAL_PROMPT="0")
    result = subprocess.run(["git", "-C", str(root), *args], stdout=subprocess.PIPE,
                            stderr=subprocess.PIPE, env=environment, check=False)
    if result.returncode:
        raise ManifestError("Git audit could not read complete repository evidence")
    return result.stdout


def git_entries(data: bytes, *, index: bool = False):
    for item in data.split(b"\0"):
        if not item:
            continue
        try:
            meta, name = item.split(b"\t", 1)
            fields = meta.decode("ascii").split()
            mode = fields[0]
            oid = fields[1] if index else fields[2]
            if len(fields) != 3 or not re.fullmatch(r"[0-9a-f]{40}|[0-9a-f]{64}", oid):
                raise ValueError()
            name = name.decode("utf-8")
        except (ValueError, UnicodeError, IndexError) as exc:
            raise ManifestError("Unsafe or unreadable Git tree entry") from exc
        yield mode, oid, name


def scan_git(root: Path, *, history: bool) -> list[Finding]:
    if not (root / ".git").exists():
        if history:
            raise ManifestError("History audit requires the first commit in this release repository")
        return []
    if Path(os.fsdecode(git(root, "rev-parse", "--show-toplevel")).strip()).resolve() != root.resolve():
        raise ManifestError("Git audit resolved to a different repository")
    findings = []
    seen = set()

    def inspect(entries, revision):
        for mode, oid, name in entries:
            if (mode, oid, name) in seen:
                continue
            seen.add((mode, oid, name))
            findings.extend(Finding(name, rule, revision=revision) for rule in path_rules(name, tracked=True))
            if mode not in ("100644", "100755"):
                findings.append(Finding(name, "git-symlink-submodule-or-special-file", revision=revision))
                continue
            findings.extend(scan_bytes(name, git(root, "cat-file", "blob", oid), revision))

    inspect(git_entries(git(root, "ls-files", "--stage", "-z"), index=True), "index")
    if history:
        if git(root, "rev-parse", "--is-shallow-repository").strip() != b"false":
            raise ManifestError("History audit requires a complete, non-shallow checkout")
        commits = git(root, "rev-list", "--all", "HEAD").decode("ascii").splitlines()
        if not commits:
            raise ManifestError("History audit requires at least one commit")
        for commit in commits:
            inspect(git_entries(git(root, "ls-tree", "-r", "-z", "--full-tree", commit)), commit[:12])
            findings.extend(scan_bytes("<commit-message>", git(root, "cat-file", "commit", commit), commit[:12]))
        for line in git(root, "for-each-ref", "--format=%(objectname) %(objecttype)", "refs/tags").decode("ascii").splitlines():
            oid, kind = line.split()
            if kind == "tag":
                findings.extend(scan_bytes("<tag-message>", git(root, "cat-file", "tag", oid), oid[:12]))
    return findings


def guard(root: Path = ROOT, *, history: bool = False) -> list[Finding]:
    root = Path(root).absolute()
    files = source_files(root)
    findings = []
    if ".env.example" not in files:
        findings.append(Finding(".env.example", "missing-env-example"))
    for name, path in files.items():
        findings.extend(Finding(name, rule) for rule in path_rules(name))
        findings.extend(scan_bytes(name, read_regular(path)))
    findings.extend(scan_git(root, history=history))
    return sorted(set(findings), key=lambda f: (f.revision, f.path, f.line, f.rule))


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--root", type=Path, default=ROOT)
    parser.add_argument("--history", action="store_true", help="Also audit all reachable Git commit trees and messages; requires full history")
    args = parser.parse_args()
    try:
        findings = guard(args.root, history=args.history)
    except (ManifestError, OSError) as exc:
        print("Release guard failed: " + (str(exc) if isinstance(exc, ManifestError) else "unreadable audit input"))
        return 1
    for finding in findings[:100]:
        print(finding.diagnostic())
    if findings:
        print(f"Release guard failed: {len(findings)} findings (no matching values printed)")
        return 1
    git_status = "; Git index scanned" if (args.root / ".git").exists() else "; no Git repository/index yet"
    print("Release guard passed: authored filesystem" + git_status + ("; complete reachable Git history" if args.history else "; history not requested"))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
