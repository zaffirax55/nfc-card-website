#!/usr/bin/env bash
set -euo pipefail
: "${GITHUB_WORKSPACE:?GitHub workspace required}"
STAGING="$GITHUB_WORKSPACE"
TARGET="$RUNNER_TEMP/optidigital-3d-copy"
git clone --depth 1 https://github.com/optidigitalagent/nfc-card-website.git "$TARGET"
mkdir -p "$TARGET/src/v36_2/assets/models"
cp "$STAGING"/src/models/*.glb "$TARGET/src/v36_2/assets/models/"
cp "$STAGING/migration/nfc-3d-integration.mjs" "$STAGING/migration/nfc-3d-integration.css" "$TARGET/src/v36_2/"
cd "$TARGET"
npm install --no-save --package-lock=false @google/model-viewer@4.1.0
cp node_modules/@google/model-viewer/dist/model-viewer.min.js src/v36_2/assets/model-viewer.min.js
python3 - <<'PY'
from pathlib import Path
p=Path('src/v36_2/static-render.mjs')
s=p.read_text()
a='<script type="module" src="${BASE}/app.mjs"></script>'
b='<link rel="stylesheet" href="${BASE}/nfc-3d-integration.css"><script type="module" src="${BASE}/app.mjs"></script><script type="module" src="${BASE}/nfc-3d-integration.mjs"></script>'
assert s.count(a)==1, "Static renderer version has changed"
p.write_text(s.replace(a,b))
PY
npm run designer:build
test "$(find src/v36_2/assets/models -name '*.glb' | wc -l)" -eq 12
git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add src/v36_2/assets/models src/v36_2/assets/model-viewer.min.js src/v36_2/nfc-3d-integration.mjs src/v36_2/nfc-3d-integration.css src/v36_2/static-render.mjs
git commit -m "Integrate twelve original Zaffirax GLB models into OptiDigital copy"
git remote set-url origin "https://x-access-token:${GH_TOKEN}@github.com/zaffirax55/nfc-card-website.git"
git push origin HEAD:refs/heads/optidigital-3d-preview --force
echo "Published source branch: optidigital-3d-preview"
