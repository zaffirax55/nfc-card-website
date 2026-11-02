"""Fail closed unless an exact storefront commit is on the approved preview line."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import re
import subprocess

# Preserved designer base accepted for NFC-COLLAB-01/NFC-BLOCKERS-01.
# Older rollback sources or a rewritten branch require a separate reviewed change.
APPROVED_PREVIEW_BASE = "d7681ebe5b4e98c73192645e20bd90f178e73cd3"
ROOT = Path(__file__).resolve().parents[1]


def git(root: Path, *args: str) -> subprocess.CompletedProcess:
    environment = {key: value for key, value in os.environ.items() if not key.startswith("GIT_")}
    environment.update(GIT_CONFIG_NOSYSTEM="1", GIT_CONFIG_GLOBAL=os.devnull,
                       GIT_NO_REPLACE_OBJECTS="1", GIT_TERMINAL_PROMPT="0")
    return subprocess.run(["git", *args], cwd=root, env=environment, capture_output=True, text=True)


def exact_commit(root: Path, value: str) -> str:
    if not re.fullmatch(r"[0-9a-f]{40}", value):
        raise ValueError("Full lowercase 40-character source SHA required")
    result = git(root, "rev-parse", "--verify", value + "^{commit}")
    if result.returncode or result.stdout.strip() != value:
        raise ValueError("Requested SHA is not an available exact commit")
    return value


def verify(root: Path, storefront_sha: str, preview_tip_sha: str) -> dict:
    checkout = git(root, "rev-parse", "--show-toplevel")
    complete = git(root, "rev-parse", "--is-shallow-repository")
    if (checkout.returncode or Path(checkout.stdout.strip()).resolve() != root.resolve()
            or complete.returncode or complete.stdout.strip() != "false"):
        raise ValueError("Lineage proof requires this exact complete repository checkout")
    anchor = exact_commit(root, APPROVED_PREVIEW_BASE)
    source = exact_commit(root, storefront_sha)
    tip = exact_commit(root, preview_tip_sha)
    for older, newer in [(anchor, tip), (anchor, source), (source, tip)]:
        result = git(root, "merge-base", "--is-ancestor", older, newer)
        if result.returncode:
            raise ValueError("Storefront SHA is outside the authorized optidigital-3d-preview lineage")
    return {"authorized_branch": "refs/heads/optidigital-3d-preview", "approved_base_sha": anchor,
            "storefront_sha": source, "observed_preview_tip_sha": tip, "lineage_check": "PASS"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--storefront-sha", required=True)
    parser.add_argument("--preview-tip-sha", required=True)
    parser.add_argument("--output", type=Path)
    args = parser.parse_args()
    try:
        record = verify(ROOT, args.storefront_sha, args.preview_tip_sha)
    except ValueError as exc:
        print("Storefront lineage check failed: " + str(exc))
        return 1
    encoded = json.dumps(record, indent=2) + "\n"
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(encoded)
    print(encoded, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
