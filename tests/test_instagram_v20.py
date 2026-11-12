"""Corrective-release regressions for the complete Instagram product pages."""
from pathlib import Path
import re

import pytest
from bs4 import BeautifulSoup

from test_pages_v17 import build, source


ROOT = Path(__file__).resolve().parents[1]


@pytest.mark.parametrize(
    "locale,expected",
    [
        ("uk", [
            "NFC Instagram Card працює за тим самим принципом, що й Google Review Card",
            "Що стає простішим",
            "Від посилання до готової картки",
            "Що входить",
            "Характеристики",
            "Де розмістити картку",
            "Чесне уточнення",
            "Оплата й доставка",
            "FAQ — NFC Instagram Card",
            "Google Review Card відкриває форму відгуку конкретної Google-точки",
        ]),
        ("en", [
            "NFC Instagram Card works the same way as Google Review Card",
            "What becomes easier",
            "From your link to a ready-to-use card",
            "What is included",
            "Specifications",
            "Where to place the card",
            "An honest clarification",
            "Payment and delivery",
            "FAQ — NFC Instagram Card",
            "Google Review Card opens the review form for a specific Google location",
        ]),
    ],
)
def test_commercial_copy_is_complete_and_visible_without_master_accordion(source, locale, expected):
    site = build(source)
    prefix = "en/" if locale == "en" else ""
    soup = BeautifulSoup((site / prefix / "solutions/instagram-card/index.html").read_text("utf-8"), "html.parser")
    content = soup.select_one(".instagram-product-content")
    assert content is not None
    assert not soup.select("#product-details.product-disclosure,[data-details-control]")
    text = soup.select_one("main").get_text(" ", strip=True)
    for item in expected:
        assert item in text
    assert len(content.select(".instagram-product-benefits .meaning-rows > div")) == 4
    assert len(content.select(".instagram-product-steps .steps > li")) == 4
    assert len(content.select(".instagram-product-included li")) == 7
    assert len(content.select(".instagram-product-specs li")) == 7
    assert len(content.select(".instagram-product-faq .faq-list > details")) == 9


def test_product_detail_ink_override_keeps_secondary_tokens_scoped():
    commerce = (ROOT / "src/commerce.css").read_text("utf-8")
    instagram = (ROOT / "src/instagram.css").read_text("utf-8")
    assert ".product-detail p,.product-detail li{color:var(--nfc-ink)" in commerce
    assert ".instagram-product-content>.field-hint" in instagram
    assert ".instagram-info-content .section p:not(.eyebrow):not(.field-hint)" in instagram
    assert ".commerce-product[data-product=instagram] .product-promise" in instagram
    assert "color:var(--muted)" in instagram


def test_commercial_mechanism_requires_notification_action(source):
    site = build(source)
    for relative, phrase in [
        ("solutions/instagram-card/index.html", "Клієнт натискає сповіщення"),
        ("en/solutions/instagram-card/index.html", "The customer taps the notification"),
    ]:
        soup = BeautifulSoup((site / relative).read_text("utf-8"), "html.parser")
        step = soup.select(".instagram-product-steps .steps > li")[3].get_text(" ", strip=True)
        assert phrase in step


def test_approved_gallery_has_five_images_and_zoom_control(source):
    site = build(source)
    for relative in ["solutions/instagram-card/index.html", "en/solutions/instagram-card/index.html"]:
        soup = BeautifulSoup((site / relative).read_text("utf-8"), "html.parser")
        assert not soup.select("[data-placeholder]")
        assert len(soup.select("[data-slide]")) == 5
        assert len(soup.select(".gallery-open,[data-zoom]")) == 1


def test_repository_scoped_release_policy_is_persistent():
    policy = " ".join((ROOT / "AGENTS.md").read_text("utf-8").split())
    handoff = " ".join((ROOT / "docs/designer-handoff/GITHUB_WORKFLOW.md").read_text("utf-8").split())
    assert "https://github.com/zaffirax55/nfc-card-website.git" in policy
    assert "Designer PRs target `optidigital-3d-preview`" in policy
    assert "`seo/<task>`" in policy and "`codex/<task>-seo`" in policy
    assert "Local work does not imply permission to commit, push, open/merge PRs or release" in policy
    assert "explicit authorization" in policy and "owner-authorized release" in policy
    assert "review" in handoff and "preview patch first" in handoff

    workflows = ROOT / ".github/workflows"
    ci = (workflows / "ci.yml").read_text()
    assert "scripts/verify_manifest.py" in ci and "scripts/release_guard.py --history" in ci
    assert "run: npm test" in ci
    assert "actions/deploy-pages@" not in ci and "actions/upload-pages-artifact@" not in ci
    publisher = workflows / "fork-pages.yml"
    if publisher.exists():
        text = publisher.read_text()
        events = re.search(r"(?m)^on:\s*\n((?:[ \t]+.*\n|\n)*)", text).group(1)
        assert re.findall(r"(?m)^  ([a-z_]+):", events) == ["workflow_dispatch"]
        assert "storefront_sha:" in events and "required: true" in events

        def job(name):
            return re.search(r"(?ms)^  " + re.escape(name) + r":\n(.*?)(?=^  [a-zA-Z][\w-]*:|\Z)", text).group(1)

        sources = job("sources")
        assert "github.event_name == 'workflow_dispatch'" in sources
        assert "github.ref == 'refs/heads/main'" in sources
        assert "github.repository == 'zaffirax55/nfc-card-website'" in sources
        assert "github.workflow_sha" in sources
        assert "ref: ${{ inputs.storefront_sha }}" in sources
        assert "scripts/verify_storefront_lineage.py" in sources
        assert "ref: optidigital-3d-preview" not in text
        assert "uses: ./.github/workflows/ci.yml" in job("validate-main")
        assert "uses: ./.github/workflows/ci.yml" in job("validate-storefront")
        build = job("build")
        needs = re.search(r"(?m)^    needs:\s*\[([^]]+)\]", build).group(1)
        assert {value.strip() for value in needs.split(',')} == {"sources", "validate-main", "validate-storefront"}
        assert build.index("scripts/pages_artifact.py") < build.index("uses: actions/upload-pages-artifact@")
        assert "ref: ${{ needs.sources.outputs.storefront_sha }}" in build
        deploy = job("deploy")
        assert "needs: build" in deploy and "github.ref == 'refs/heads/main'" in deploy
        assert "pages: write" in deploy and "id-token: write" in deploy
        assert "pages: write" not in text.replace(deploy, "")
        assert "group: nfc-github-pages" in text and "cancel-in-progress: false" in text
        expected_publishers = ["fork-pages.yml"]
    else:
        # Storefront branch validates; publication is a separate main-only route.
        text = (workflows / "publish-optidigital-3d.yml").read_text()
        assert "npm run designer:build" in text and "npm run designer:check" in text
        assert "pages: write" not in text and "id-token: write" not in text
        expected_publishers = []
    publishers = sorted(p.name for p in workflows.glob("*.yml")
                        if re.search(r"uses:\s*actions/deploy-pages@", p.read_text()))
    assert publishers == expected_publishers
