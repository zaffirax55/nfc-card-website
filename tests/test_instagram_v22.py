"""Acceptance regressions for the v22 Instagram copy, media and layout release."""
from __future__ import annotations

import json
import hashlib
from pathlib import Path
import re

from bs4 import BeautifulSoup
from PIL import Image
import pytest

from test_pages_v17 import BASE, ORIGIN, build, source


ROOT = Path(__file__).resolve().parents[1]

P1 = {
    "uk": "NFC Instagram Card працює за тим самим принципом, що й Google Review Card: клієнт торкається картки смартфоном і натискає сповіщення. Відрізняються дизайн і призначення: замість форми Google-відгуку відкривається Instagram-профіль вашого бізнесу. Ми налаштовуємо картку на ваш профіль і передаємо готовою до використання.",
    "en": "NFC Instagram Card works the same way as Google Review Card: the customer taps the card with a smartphone, then taps the notification. The design and purpose are different: it opens your business’s Instagram profile instead of a Google review form. We configure the card for your profile and deliver it ready to use.",
}

BRIDGE = {
    "uk": "Принцип той самий — дотик смартфоном і перехід за налаштованим посиланням. Оберіть, яку дію ви хочете спростити: відкриття Instagram-профілю, написання Google-відгуку або перегляд онлайн-меню.",
    "en": "The principle is the same: tap with a smartphone and open the configured link. Choose the action you want to make easier: opening your Instagram profile, writing a Google review or viewing an online menu.",
}

P2_STAFF = {
    "uk": "Адміністратору не потрібно щоразу диктувати нікнейм або допомагати з пошуком профілю. Достатньо показати картку — менше повторних пояснень і відволікань від записів, розрахунків та обслуговування.",
    "en": "Staff do not need to spell out the username or help customers find the profile each time. They can simply point to the card, with fewer repeated explanations and interruptions to bookings, payments and customer service.",
}

P2_INFO = {
    "uk": "Коли клієнти просять ваш Instagram, персоналу може доводитися щоразу повторювати нікнейм або показувати потрібний профіль. Якщо це повторюється протягом дня, такі пояснення відволікають від інших завдань. Картка прибирає саме цей повторюваний крок: адміністратор показує її, а клієнт відкриває профіль на власному телефоні.",
    "en": "When customers ask for your Instagram, staff may have to repeat the username or show them the right profile each time. If this happens throughout the day, those explanations interrupt other tasks. The card removes that repeated step: staff point to it, and the customer opens the profile on their own phone.",
}

P4 = {
    "uk": ("Навіщо ми створили NFC Instagram Card", "Ми хочемо зробити просту взаємодію з бізнесом зручнішою: клієнту — швидко відкрити потрібний профіль, а персоналу — не пояснювати пошук щоразу. NFC Instagram Card прибирає зайві дії; підписатися, написати чи переглянути контент людина вирішує сама."),
    "en": ("Why we created NFC Instagram Card", "We want to make a simple interaction with a business more convenient: customers can open the right profile quickly, and staff do not have to explain the search each time. NFC Instagram Card removes unnecessary steps; customers decide whether to follow, message or view the content."),
}

P3 = {
    "uk": {
        "destination": ("Куди саме переходить клієнт?", "Залежить від картки. Google Review Card, Branded Review Card і NFC Review Card 3D відкривають форму Google-відгуку конкретної локації. NFC Instagram Card відкриває Instagram-профіль, а NFC Menu Card — онлайн-меню закладу. Це окремі продукти; подальшу дію клієнт обирає сам."),
        "difference": ("Чим NFC Instagram Card відрізняється від Google Review Card?", "Спосіб використання однаковий: дотик смартфоном, сповіщення й перехід. Відрізняються дизайн і призначення: NFC Instagram Card відкриває Instagram-профіль, а Google Review Card — форму Google-відгуку. Це окремі картки для різних дій."),
        "monthly": ("Чи є щомісячна плата?", "Обов’язкової щомісячної плати за використання самих NFC-карток немає. Якщо потрібна розробка онлайн-меню, деталі обговорюємо на консультації."),
    },
    "en": {
        "destination": ("Where does the customer go?", "It depends on the card. Google Review Card, Branded Review Card and NFC Review Card 3D open the Google review form for a specific location. NFC Instagram Card opens the Instagram profile, and NFC Menu Card opens the venue’s online menu. These are separate products; the customer chooses the next action."),
        "difference": ("How is NFC Instagram Card different from Google Review Card?", "They work the same way: a smartphone tap, a notification and a link. The design and purpose differ: NFC Instagram Card opens an Instagram profile, while Google Review Card opens a Google review form. They are separate cards for different actions."),
        "monthly": ("Is there a monthly fee?", "There is no mandatory monthly fee for using the physical NFC cards themselves. If online-menu development is needed, we discuss the details in a consultation."),
    },
}


@pytest.mark.parametrize("locale", ["uk", "en"])
def test_exact_p1_p2_p4_and_bridge_copy(source, locale):
    site = build(source)
    prefix = "en/" if locale == "en" else ""
    product = BeautifulSoup((site / prefix / "solutions/instagram-card/index.html").read_text("utf-8"), "html.parser")
    info = BeautifulSoup((site / prefix / "instagram-card/index.html").read_text("utf-8"), "html.parser")
    product_text = product.select_one("main").get_text(" ", strip=True)
    info_text = info.select_one("main").get_text(" ", strip=True)
    assert P1[locale] in product_text
    assert P2_STAFF[locale] in product_text
    assert P2_INFO[locale] in info_text
    assert BRIDGE[locale] in info_text
    assert P4[locale][0] in info_text and P4[locale][1] in info_text
    assert not info.select(".instagram-founder-text video,.instagram-founder-text blockquote")


@pytest.mark.parametrize("locale", ["uk", "en"])
def test_p3_faqs_process_and_legacy_anchor(source, locale):
    site = build(source)
    prefix = "en/" if locale == "en" else ""
    home = BeautifulSoup((site / prefix / "index.html").read_text("utf-8"), "html.parser")
    product = BeautifulSoup((site / prefix / "solutions/instagram-card/index.html").read_text("utf-8"), "html.parser")
    visible = [(d.summary.get_text(" ", strip=True), d.p.get_text(" ", strip=True)) for d in home.select("#faq .faq-list>details")]
    nodes = [json.loads(script.string) for script in home.select('script[type="application/ld+json"]')]
    schema = next(node for node in nodes if node["@type"] == "FAQPage")["mainEntity"]
    assert visible == [(item["name"], item["acceptedAnswer"]["text"]) for item in schema]
    monthly = [item for item in visible if item[0] in {"Чи є щомісячна плата?", "Is there a monthly fee?"}]
    assert monthly == [P3[locale]["monthly"]]
    assert P3[locale]["destination"] in visible
    assert P3[locale]["difference"] in visible
    assert home.select_one("#faq-instagram-subscription") is not None
    difference = home.find("summary", string=re.compile("Instagram Card.*Google Review Card|відрізняється"))
    assert difference is not None
    process = home.select("#process .steps>li")
    assert len(process) == 5
    expected = "Уточнюємо посилання для обраної картки" if locale == "uk" else "We confirm the link for the chosen card"
    assert expected in process[1].get_text(" ", strip=True)


@pytest.mark.parametrize("locale,phrase", [("uk", "Одне торкання → Instagram-профіль."), ("en", "One tap → Instagram profile.")])
def test_exact_silver_banner_phrase(source, locale, phrase):
    site = build(source)
    prefix = "en/" if locale == "en" else ""
    soup = BeautifulSoup((site / prefix / "solutions/instagram-card/index.html").read_text("utf-8"), "html.parser")
    assert soup.select_one(".instagram-product-content>.detail-signature").get_text(" ", strip=True) == phrase


def test_only_five_approved_sources_are_public_and_optimized():
    manifest = json.loads((ROOT / "src/media-manifest.json").read_text("utf-8"))
    records = [item for item in manifest if item.get("managed_by") == "scripts/update_instagram_media.py:v22"]
    baseline = []
    for item in manifest:
        if item.get("managed_by") in {"scripts/update_instagram_media.py:v22", "scripts/update_menu_media.py:v23", "v26_review_3d_media_import", "v29_niche_media_import", "v33_niche_crop"} or item.get("source", "").endswith("-pl.vtt"):
            continue
        # v27 adds Polish descriptive metadata and one timed subtitle track.
        # Verify that the previously accepted asset/provenance contract is intact.
        original = {key: value for key, value in item.items() if key not in {"alt_pl", "caption_pl"}}
        if original.get("page_or_section") == "/about, /en/about and /pl/about only":
            original["page_or_section"] = "/about and /en/about only"
        if "tracks" in original:
            original["tracks"] = [track for track in original["tracks"] if track.get("language") != "pl"]
        baseline.append(original)
    frozen = hashlib.sha256(json.dumps(baseline, ensure_ascii=False, separators=(",", ":")).encode()).hexdigest()
    assert len(baseline) == 102
    assert frozen == "a3bf87b69bd7b2bea043e35fc1c1fa7013e26f51393aa528aaf1197eb9757cf4"
    assert len(records) == 40
    primaries = [item for item in records if "derivative_of" not in item]
    assert len(primaries) == 5
    assert [item["claim_role"] for item in primaries] == ["real_product_photo"] * 4 + ["promotional_product_render"]
    assert all(item["product_id"] == "nfc-instagram-card" and item["metadata_stripped"] is True for item in records)
    assert all(len(item["responsive"]) == 3 and len(item["avif"]["responsive"]) == 3 for item in primaries)
    forbidden = ("promo-overview", "promo-how-it-works", "promo-use-cases", "promo-business-value")
    assert not any(any(name in item["source"] for name in forbidden) for item in manifest)
    assert not any(any(name in path.name for name in forbidden) for path in (ROOT / "src/media").rglob("*") if path.is_file())
    for item in records:
        path = ROOT / item["source"]
        assert path.stat().st_size == item["bytes"]
        with Image.open(path) as image:
            assert not image.getexif()
            assert not image.info.get("icc_profile")


@pytest.mark.parametrize("locale", ["uk", "en"])
def test_media_placement_avif_and_product_schema(source, locale):
    site = build(source)
    prefix = "en/" if locale == "en" else ""
    catalog = BeautifulSoup((site / prefix / "solutions/index.html").read_text("utf-8"), "html.parser")
    product = BeautifulSoup((site / prefix / "solutions/instagram-card/index.html").read_text("utf-8"), "html.parser")
    info = BeautifulSoup((site / prefix / "instagram-card/index.html").read_text("utf-8"), "html.parser")
    assert "/assets/model-posters/instagram.webp" in catalog.select_one('.commerce-card[data-variant="instagram"] img')["src"]
    slides = product.select("[data-slide]")
    assert len(slides) == 5 and not product.select("[data-placeholder]")
    assert all(slide.select_one('source[type="image/avif"]') for slide in slides)
    assert all("real-" in slides[index].select_one("img")["src"] for index in range(4))
    assert "clean-front-render" in slides[4].select_one("img")["src"]
    assert len(info.select("img[data-media-claim-role=real_product_photo]")) == 2
    assert len(info.select("[data-placeholder=IG09]")) == 1
    product_schema = next(json.loads(s.string) for s in product.select('script[type="application/ld+json"]') if json.loads(s.string)["@type"] == "Product")
    assert len(product_schema["image"]) == 5
    assert all(url.startswith(ORIGIN + BASE + "/assets/media/instagram/") for url in product_schema["image"])
    assert all("real-" in url for url in product_schema["image"][:4])


def test_banner_uses_layout_centering_without_transform_offsets():
    css = (ROOT / "src/instagram.css").read_text("utf-8")
    rule = re.search(r"\.instagram-product-content>\.detail-signature\{([^}]+)\}", css).group(1)
    assert "display:grid" in rule and "place-items:center" in rule and "text-align:center" in rule
    assert "min-block-size:" in rule
    assert "transform" not in rule
    assert not re.search(r"margin-(?:top|left|right|bottom):\s*-", rule)


def test_legacy_monthly_faq_anchor_remains_in_document_flow():
    css = (ROOT / "src/instagram.css").read_text("utf-8")
    assert "#faq-instagram-subscription{position:relative;top:auto;display:block;scroll-margin-top:0}" in css
