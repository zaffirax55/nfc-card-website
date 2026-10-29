# Media, placeholders and provenance

[MEDIA_REGISTER.json](MEDIA_REGISTER.json) is exported from actual v36.2 source, not inferred from an earlier ZIP. It contains all 104original role rows, owner overlays,7 additional unique editorial capture slots and an asset SHA/size inventory. Regenerate after an approved media change with:

```sh
node docs/designer-handoff/export-media.mjs
```

The original ledger is 44 rendered-role records + 27 named placeholders + 33 omitted rows. The owner overlay splits those 33omissions into 30 approved optional omissions, one restored Restaurant Mini home placement and two HOLD slots. These are role counts, not111images or27 additional new products. Seven editorial capture roles are separate future briefs, translated to UA/EN/PL.

- Keep all27 named placeholders until approved material replaces them.
- 30 optional/duplicate placements may stay hidden; original files/history must not be deleted.
- `HOME.MINI.RESTAURANT` remains visible in the approved four-product home.
- `PROMOTION.BANNER` stays HOLD: no active invented offer, dates or discount.
- `PRODUCT_DETAIL_EXTENSION_SLOT` stays HOLD: no new content/function without an approved brief.

## File and rights handling

Current business/product/logo/founder assets are inherited from existing main, with source SHA and roles recorded. A founder portrait is verified owner material, not a customer testimonial. A product rendering is not manufacturing proof or a real installed-client case. The media source manifest is `src/media-manifest.json`; use its claim-role/provenance fields as well as the local role ledger. Source files for old omitted roles remain in the repository/history; a role with no asset is not proof of a missing file supplied in this transfer.

Onest and IBM Plex Mono are bundled with their existing SIL OFL 1.1 notices in `src/v36_2/assets/` and preserved main notices. Do not replace them with unlicensed reference-site fonts. Fonts are licensed software, not business photographs; the register records a separate font kind/license notice.

For future actual image/video assets, record one provenance: `user_provided_business_asset`, `verified_official_business_asset`, `licensed_stock_asset`, `ai_generated_original` for authorized nonproof illustration, or `reference_only`. Reference-only files must never be rendered publicly. Do not invent provenance for an unfilled slot; the register leaves it empty until material exists.

For every replacement provide the slot ID, file path/SHA/bytes, source/permission, intended claim role, truthful localized alt/caption and desktop/mobile crop. Proposed capture aspects in the register are **designer capture targets**, not approved physical-product specifications. Preserve full objects in product galleries; do not crop away size/shape clues. No fabricated clients, Google review screens, attribution or results.

## Additional capture briefs

| Slot | Section | Required material |
|---|---|---|
| `HOW.NFC.DEMO_VIDEO` | How | Actual phone/card interaction, system prompt and link opening; no simulated customer review. |
| `HOW.NFC.PHONE_SCREEN` | How | Permitted screen capture of voluntary next step. |
| `DESIGN.REVIEW.EXAMPLE` | Design | Approved Google 10×10 photo or explicitly labelled mockup. |
| `DESIGN.BEAUTY.EXAMPLE` | Design | Correct Beauty Mini photo/mockup and permission. |
| `DESIGN.RESTAURANT.EXAMPLE` | Design | Correct Restaurant example without invented size or client identity. |
| `DESIGN.PROCESS` | Design | Permitted materials→approved mockup→real result sequence. |
| `DESIGN.NFC_DEMO` | Design | Real final NFC check, without simulated customer outcomes. |

These seven remain placeholders. No real-client proof is created by this handoff. The local `/review/media/` page keeps the two HOLD places separately visible for future owner decisions; changing a draft there does not approve production.
