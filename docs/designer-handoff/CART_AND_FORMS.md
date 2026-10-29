# Cart, forms, V36 and safe preview

## Protected commerce

The browser estimate helps selection; it is not order authority. Production prices are calculated by the gateway contract. Preserve grouping by `market + entryId`, including separate business points, configuration snapshots, variant IDs and one full inquiry from one cart.

| Scenario | Required behavior |
|---|---|
| Fixed | Known complete amount with correct market/currency; one agreed deposit included in total. |
| Quote | Individual estimate required; no invented numeric full total. |
| Mixed | Label known subtotal as partial; unknown lines prevent presenting it as final payable amount. |
| Service-only | `lines=[]`, supported service context, no fictitious product quantity/total/deposit. |

Current ordinary Branded pair is3600 UAH /299 PLN; retained historical2600 UAH receipt profiles remain immutable. Other prices come from unchanged `commerce.mjs` and pure fixture registry; do not manually duplicate or convert them in visual code. UA and EN use UA/UAH, PL uses its separate PLN rules.

After agreement, the200 UAH or20 PLN deposit is once per physical order and included in the total. Ukraine standard Nova Poshta is free; Poland shipping from Ukraine is recipient-paid with carrier/cost agreed before deposit. Balance follows dispatch/tracking. None of this is an online payment. Full approved language is in `delivery-content.mjs`.

## Configurations and intents

Google/Beauty/Restaurant initial enquiries do not require a Google Business URL; existing known URL information must not be discarded. Instagram URL and existing-menu URL remain conditionally required. Menu retains six variants: square 100black/white, square 60black/white, round 70black/white, plus menu-status flow and separate development/consultation intent. Do not infer dimensions for Restaurant Mini from Beauty Mini.

Supported service intents include `free_design_concepts`, `quantity_advice`, `menu_consultation`; context is validated against existing entry IDs. Personal-design base transitions preserve `?entry=...`. A free mockup request is distinct from purchasing the physical Branded card.

## Persistence and recovery

`api-client.mjs` protects normalization, digest, immutable attempt snapshots, exact idempotency keys and receipt validation. Unknown outcome must remain unknown with a safe retry path; never create a new successful-looking order automatically. Browser recovery stores opaque references/state, not client payload/PII. Preserve error, retry, success, validation and quote states in all languages.

Local synthetic SQLite success is emitted only after COMMIT. Exact-key replay returns the same receipt; changed payload with the same key conflicts. The local harness also exercises prewrite failure and saved-but-unknown response. No sender is invoked.

## V36 email proposal

The separately labelled V36 commercial-offer-by-email form remains on the existing Branded URL at `#email-proposal`, also reachable from Contact. Preserve business name, niche, email, optional website/phone, its separate offer request checkbox, exact current-main payload/parser/form/notice versions and durable receipt/recovery.

`legacy-v36/` preserves the main dependencies. Its pages shim only injects a sender/endpoint validator for the loopback preview; this does not authorize rewriting actual v1 transport. Do not replace V36 consent with the generic v2 test checkbox. Success proves local storage, not Gmail delivery.

## Integration boundary

`designer/fixtures/gateway-contract/` contains only 8 pure parser/quote/policy/registry/contact files and synthetic fixtures. There is no production handler, PG store, CRM consumer, queue or notifier. These copies must stay aligned with their provenance and are not a design editing target. No actual customer/CRM data, credentials or production endpoint config is needed.

The public frontend source can demonstrate V36 contract compatibility; it cannot prove installed Owner Desk processing, access controls or live deliverability. Those remain production gates with B05.
