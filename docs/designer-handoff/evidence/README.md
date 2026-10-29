# Local designer evidence

All screenshots use the integrated designer source. `LIVE_*` are actual GET-only loopback views; `INDEPENDENT_*HOME*` use static local fulfillment; native zoom uses an isolated Chrome profile. No real customer forms or records are pictured.

Independent acceptance: [report](../INDEPENDENT_ACCEPTANCE.md). Source/build/tests and limits: [QA report](../QA_REPORT.md). Screenshot SHA/size: [manifest](VISUAL_MANIFEST.json).

## Selected views

- [LIVE_uk_DELIVERY_390.png](visual/LIVE_uk_DELIVERY_390.png) — Actual loopback GET
- [LIVE_uk_DELIVERY_1440.png](visual/LIVE_uk_DELIVERY_1440.png) — Actual loopback GET
- [LIVE_uk_ABOUT_390.png](visual/LIVE_uk_ABOUT_390.png) — Actual loopback GET
- [LIVE_uk_ABOUT_1440.png](visual/LIVE_uk_ABOUT_1440.png) — Actual loopback GET
- [LIVE_uk_CATALOG_390.png](visual/LIVE_uk_CATALOG_390.png) — Actual loopback GET
- [LIVE_uk_CATALOG_1440.png](visual/LIVE_uk_CATALOG_1440.png) — Actual loopback GET
- [LIVE_uk_CATALOG_SERVICE_390.png](visual/LIVE_uk_CATALOG_SERVICE_390.png) — Actual loopback GET
- [LIVE_uk_CATALOG_SERVICE_1440.png](visual/LIVE_uk_CATALOG_SERVICE_1440.png) — Actual loopback GET
- [LIVE_en_DELIVERY_390.png](visual/LIVE_en_DELIVERY_390.png) — Actual loopback GET
- [LIVE_en_DELIVERY_1440.png](visual/LIVE_en_DELIVERY_1440.png) — Actual loopback GET
- [LIVE_en_ABOUT_390.png](visual/LIVE_en_ABOUT_390.png) — Actual loopback GET
- [LIVE_en_ABOUT_1440.png](visual/LIVE_en_ABOUT_1440.png) — Actual loopback GET
- [LIVE_en_CATALOG_390.png](visual/LIVE_en_CATALOG_390.png) — Actual loopback GET
- [LIVE_en_CATALOG_1440.png](visual/LIVE_en_CATALOG_1440.png) — Actual loopback GET
- [LIVE_en_CATALOG_SERVICE_390.png](visual/LIVE_en_CATALOG_SERVICE_390.png) — Actual loopback GET
- [LIVE_en_CATALOG_SERVICE_1440.png](visual/LIVE_en_CATALOG_SERVICE_1440.png) — Actual loopback GET
- [LIVE_pl_DELIVERY_390.png](visual/LIVE_pl_DELIVERY_390.png) — Actual loopback GET
- [LIVE_pl_DELIVERY_1440.png](visual/LIVE_pl_DELIVERY_1440.png) — Actual loopback GET
- [LIVE_pl_ABOUT_390.png](visual/LIVE_pl_ABOUT_390.png) — Actual loopback GET
- [LIVE_pl_ABOUT_1440.png](visual/LIVE_pl_ABOUT_1440.png) — Actual loopback GET
- [LIVE_pl_CATALOG_390.png](visual/LIVE_pl_CATALOG_390.png) — Actual loopback GET
- [LIVE_pl_CATALOG_1440.png](visual/LIVE_pl_CATALOG_1440.png) — Actual loopback GET
- [LIVE_pl_CATALOG_SERVICE_390.png](visual/LIVE_pl_CATALOG_SERVICE_390.png) — Actual loopback GET
- [LIVE_pl_CATALOG_SERVICE_1440.png](visual/LIVE_pl_CATALOG_SERVICE_1440.png) — Actual loopback GET
- [INDEPENDENT_uk_HOME_390.png](visual/INDEPENDENT_uk_HOME_390.png) — Local static fulfillment in isolated Chromium regression
- [INDEPENDENT_uk_HOME_1440.png](visual/INDEPENDENT_uk_HOME_1440.png) — Local static fulfillment in isolated Chromium regression
- [INDEPENDENT_NATIVE_ZOOM_200_PL_DELIVERY.png](visual/INDEPENDENT_NATIVE_ZOOM_200_PL_DELIVERY.png) — Native Chrome 200% paint

## Test evidence

- [Independent matrix A01–A24](INDEPENDENT_HANDOFF_MATRIX.json)
- [Independent summary](INDEPENDENT_HANDOFF_SUMMARY.json)
- [Source provenance](INDEPENDENT_PROVENANCE.json)
- [Static SEO](INDEPENDENT_STATIC_SEO_V362.json)
- [Actual HTTP](INDEPENDENT_LIVE_V362.json)
- [Runtime schema/keyboard](INDEPENDENT_RUNTIME_SEO_V362.json)
- [Mocked regression](INDEPENDENT_BROWSER_V362.json)
- [Native zoom](INDEPENDENT_NATIVE_ZOOM_200.json)
- [Synthetic flow summary](SYNTHETIC_FLOW_SUMMARY.json)
- [103 frontend tests](INTEGRATED_FRONTEND.txt)
- [15 portable tests](INTEGRATED_PORTABLE.txt)
- [Two original V36 tests](MAIN_V36_EMAIL_REGRESSION.txt)

The reviewer cutoff remains explicit. [Pre-publication clean-clone and safety proof](PREPUBLICATION_VERIFICATION.json) closes the local packager gates; final remote SHA/main/Pages proof accompanies the owner delivery. Raw synthetic receipt bodies, local absolute-path tools and private run logs are not part of this public branch.
