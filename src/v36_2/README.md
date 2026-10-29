# NFC CARD v36.2 editable storefront

Authoritative setup, architecture and constraints: [Designer Handoff](../../docs/designer-handoff/DESIGNER_START_HERE.md).

From repository root on Node24:

```sh
npm run designer:build
npm run designer:preview
```

Open http://127.0.0.1:4196/nfc-card-website/ . Runtime HTML is generated under `work/designer-preview-v36_2`; edit source here, then rebuild. Existing runtime modules/CSS/assets are the exact approved v36.2 archive bytes. This README is a handoff documentation correction, not a runtime change. The old embedded v35.10 guide was historical and must not be used for this version.

Synthetic local data only. No production POST, real sends, main changes or deployment.
