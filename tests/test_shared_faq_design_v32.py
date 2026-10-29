"""The shared QR FAQ must describe every custom-design offer accurately."""

import json
from pathlib import Path
from urllib.parse import urlsplit

from bs4 import BeautifulSoup
import pytest


SITE = Path(__file__).resolve().parents[1] / "site"
PRODUCTS = {
    "review-card",
    "branded-review-card",
    "beauty-review-card",
    "branded-beauty-review-card",
    "restaurant-review-card",
    "branded-restaurant-review-card",
    "review-card-3d",
    "instagram-card",
    "menu-card",
}
EXPECTED_ANSWERS = {
    "uk": "Стандартна Google Review Card, NFC Instagram Card і NFC Menu Card у цих пропозиціях не мають QR-коду. Персональний дизайн доступний для Branded Review Card, Branded Beauty Review Card Mini та Branded Restaurant Review Card Mini. QR-код для Branded Review Card можна погодити окремо. Instagram і Menu доступні у готових дизайнах.",
    "en": "The standard Google Review Card, NFC Instagram Card and NFC Menu Card in these offers do not have QR codes. Custom design is available for Branded Review Card, Branded Beauty Review Card Mini and Branded Restaurant Review Card Mini. A QR code for Branded Review Card can be agreed separately. Instagram and Menu cards use ready-made designs.",
    "pl": "Standardowa Google Review Card, NFC Instagram Card i NFC Menu Card w tych ofertach nie mają kodu QR. Indywidualny projekt jest dostępny dla Branded Review Card, Branded Beauty Review Card Mini i Branded Restaurant Review Card Mini. Dodanie kodu QR do Branded Review Card można uzgodnić osobno. Karty Instagram i Menu mają gotowe projekty.",
}
PRICES = {
    "uk": {
        "review-card": (1500, 2600), "branded-review-card": (2000, 3600),
        "instagram-card": (1500, 2600), "review-card-3d": (4000,),
        "menu-card": (1000,),
        "beauty-review-card": (800, 1400),
        "restaurant-review-card": (),
        "branded-beauty-review-card": (800, 1600),
        "branded-restaurant-review-card": (),
    },
    "pl": {
        "review-card": (129, 219), "branded-review-card": (169, 299),
        "instagram-card": (129, 219), "review-card-3d": (349,),
        "menu-card": (89,), "beauty-review-card": (),
        "restaurant-review-card": (), "branded-beauty-review-card": (),
        "branded-restaurant-review-card": (),
    },
}


def page(locale, route=""):
    prefix = "" if locale == "uk" else locale + "/"
    return BeautifulSoup((SITE / prefix / route / "index.html").read_text("utf-8"), "html.parser")


def schema(soup, kind):
    return next(json.loads(node.string) for node in soup.select('script[type="application/ld+json"]')
                if json.loads(node.string).get("@type") == kind)


@pytest.mark.parametrize("locale", ("uk", "en", "pl"))
def test_shared_qr_faq_lists_all_custom_design_products_without_new_mini_qr(locale):
    soup = page(locale)
    faq = soup.select_one("#faq-qr")
    assert faq is not None
    visible = faq.select_one("p").get_text(" ", strip=True)
    assert visible == EXPECTED_ANSWERS[locale]
    assert all(name in visible for name in (
        "Branded Review Card", "Branded Beauty Review Card Mini", "Branded Restaurant Review Card Mini"))
    assert not any(exclusive in visible for exclusive in (
        "лише для Branded Review Card", "only for Branded Review Card", "tylko dla Branded Review Card"))
    assert not any(qr_mini in visible for qr_mini in (
        "QR-код для Branded Beauty", "QR code for Branded Beauty", "kod QR do Branded Beauty"))
    question = faq.select_one("summary").get_text(" ", strip=True)
    published = next(item["acceptedAnswer"]["text"] for item in schema(soup, "FAQPage")["mainEntity"]
                     if item["name"] == question)
    assert published == visible


@pytest.mark.parametrize("locale", ("uk", "en", "pl"))
def test_shared_faq_change_keeps_nine_products_and_approved_schema_prices(locale):
    catalog = page(locale, "solutions")
    links = {urlsplit(anchor["href"]).path.rstrip("/").split("/solutions/")[-1]
             for anchor in catalog.select(".product-rows a[href]") if "/solutions/" in anchor["href"]}
    assert links == PRODUCTS
    expected = PRICES["pl" if locale == "pl" else "uk"]
    for slug in PRODUCTS:
        product = schema(page(locale, "solutions/" + slug), "Product")
        offers = product.get("offers")
        rows = offers if isinstance(offers, list) else [offers] if offers else []
        rows.sort(key=lambda offer: offer["eligibleQuantity"]["minValue"])
        assert tuple(offer["price"] for offer in rows) == expected[slug], (locale, slug)
        assert all(offer["priceCurrency"] == ("PLN" if locale == "pl" else "UAH") for offer in rows)
