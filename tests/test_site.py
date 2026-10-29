"""Current v9 public output contracts. Browser geometry and visual critique are separate."""
import json
from pathlib import Path
import re
import subprocess
import sys
from urllib.parse import urlsplit, unquote, parse_qs

from bs4 import BeautifulSoup
import pytest

ROOT = Path(__file__).resolve().parents[1]
SITE = ROOT / 'site'
BASE_ROUTES = ['/', '/about', '/solutions', '/solutions/review-card', '/solutions/branded-review-card',
               '/solutions/beauty-review-card', '/solutions/branded-beauty-review-card',
               '/solutions/restaurant-review-card', '/solutions/branded-restaurant-review-card',
               '/solutions/review-card-3d', '/solutions/instagram-card', '/instagram-card', '/solutions/menu-card', '/menu-card', '/reviews/new', '/order',
               '/delivery-and-payment', '/warranty-and-returns', '/contact',
               '/thank-you', '/privacy', '/terms']
ROUTES = BASE_ROUTES + ['/en' + ('' if r == '/' else r) for r in BASE_ROUTES] + ['/pl' + ('/' if r == '/' else r) for r in BASE_ROUTES]
RETIRED = ['counter-stand', 'team-kit', 'multi-location']
EVENTS = ['catalog_view', 'product_variant_select', 'quantity_select',
          'product_details_open', 'order_start', 'order_submit_success',
          'order_submit_error', 'telegram_click', 'whatsapp_click', 'viber_click',
          'phone_click', 'instagram_click', 'language_switch',
          'founder_story_video_play', 'faq_open', 'product_row_click', 'product_gallery_view', 'founder_story_view']
sys.path.insert(0, str(ROOT / 'server'))
from pricing import load_commerce, canonical_quote


def route_path(route):
    return SITE / route.lstrip('/') / 'index.html'


def soup_at(route):
    return BeautifulSoup(route_path(route).read_text('utf-8'), 'html.parser')


def node(script):
    result = subprocess.run(['node', '--input-type=module', '-e', script], cwd=ROOT,
                            capture_output=True, text=True, encoding='utf-8')
    assert result.returncode == 0, result.stderr
    return result.stdout


def test_exact_sixty_six_localized_routes():
    actual = {'/' + p.parent.relative_to(SITE).as_posix() for p in SITE.rglob('index.html')}
    actual.discard('/.')
    actual.add('/')
    if '/pl' in actual:
        actual.remove('/pl')
        actual.add('/pl/')
    assert actual == set(ROUTES)


@pytest.mark.parametrize('route', ROUTES)
def test_rendered_route_integrity(route):
    page = route_path(route)
    source = page.read_text('utf-8')
    soup = BeautifulSoup(source, 'html.parser')
    en = route == '/en' or route.startswith('/en/')
    pl = route == '/pl/' or route.startswith('/pl/')
    assert soup.html['lang'] == ('pl' if pl else 'en' if en else 'uk')
    assert len(soup.select('h1')) == 1
    assert soup.title.string and soup.select_one('meta[name=description]')['content']
    assert soup.select_one('meta[name=robots]')['content'] == 'noindex,nofollow'
    assert len(soup.select('link[hreflang]')) == 4
    assert soup.select_one('header') and soup.select_one('main') and soup.select_one('footer')
    assert soup.select_one('dialog#mobile-menu')
    if en or pl:
        assert not re.search(r'[\u0400-\u04ff]', soup.get_text())
    assert not re.search(r'undefined|lorem ipsum|href=["\']#["\']|[A-Z]:[\\/]Users[\\/]', source, re.I)
    assert '\ufffd' not in source
    for anchor in soup.select('a[href]'):
        parsed = urlsplit(anchor['href'])
        if parsed.scheme:
            continue
        target = (SITE / unquote(parsed.path).lstrip('/')) if parsed.path.startswith('/assets/') else route_path(unquote(parsed.path)) if parsed.path else page
        assert target.exists(), (route, anchor['href'])
        if parsed.fragment:
            target_soup = BeautifulSoup(target.read_text('utf-8'), 'html.parser')
            assert target_soup.find(id=unquote(parsed.fragment)), (route, anchor['href'])
        assert not any(old in parsed.path for old in RETIRED)
    for field in soup.select('input:not([type=hidden]),select,textarea'):
        if field.get('name') in ('website','honeypot'):
            continue
        assert field.get('id') or field.find_parent('label'), field
        assert (field.get('id') and soup.find('label', attrs={'for': field['id']})) or field.find_parent('label'), field
    for asset in soup.select('script[src],link[rel=stylesheet],img[src],source[src]'):
        src = asset.get('src') or asset.get('href')
        parsed = urlsplit(src)
        assert src.startswith('/') and not parsed.scheme and not parsed.netloc, src
        assert (SITE / unquote(parsed.path).lstrip('/')).is_file(), src


@pytest.mark.parametrize('route', ROUTES)
def test_canonical_hreflang_are_bidirectional_and_current(route):
    soup = soup_at(route)
    canonical = urlsplit(soup.select_one('link[rel=canonical]')['href'])
    assert canonical.scheme in {'http', 'https'} and canonical.netloc
    assert canonical.path.rstrip('/') == route.rstrip('/')
    assert not canonical.query and not canonical.fragment
    expected_ua = '/' if route in ('/en', '/pl/') else route[3:] if route.startswith(('/en/', '/pl/')) else route
    links = {a['hreflang']: urlsplit(a['href']).path for a in soup.select('link[hreflang]')}
    assert links['uk'] == expected_ua and links['x-default'] == expected_ua
    assert links['en'] == '/en' + ('' if expected_ua == '/' else expected_ua)
    assert links['pl'] == '/pl' + ('/' if expected_ua == '/' else expected_ua)


@pytest.mark.parametrize('route', ['/', '/en', '/solutions', '/en/solutions'])
def test_catalog_is_first_meaningful_section_with_four_mini_products_and_original_prices(route):
    soup = soup_at(route)
    first = soup.main.find('section')
    if route in ('/', '/en'):
        assert 'nfc-demo' in first.get('class', [])
        assert 'home-top-demo' in first.parent.get('class', [])
        assert soup.main.find('section', id='catalog')
    else:
        assert first.get('id') == 'catalog'
    cards = soup.select('.commerce-card')
    assert len(cards) == 9
    assert [c.get('data-variant') for c in cards[:2]] == ['standard', 'branded']
    assert [c['data-solution'] for c in cards[2:6]] == [
        'beauty-review-card', 'branded-beauty-review-card',
        'restaurant-review-card', 'branded-restaurant-review-card']
    assert cards[6]['data-product-id'] == 'nfc-review-card-3d'
    assert cards[7].get('data-variant') == 'instagram'
    assert cards[8].get('data-variant') == 'menu'
    for index, kind in ((2, 'beauty'), (4, 'restaurant')):
        assert kind in cards[index].select_one('img.catalog-product-image')['src']
        assert cards[index + 1].select_one('[data-design-role="custom_layout_example"]')
        assert not cards[index + 1].select_one('img.catalog-product-image')
    # These original assertions continue to protect the two Review Card offers.
    cards = cards[:2]
    for card, prices in zip(cards, [(1500, 2600), (2000, 3600)]):
        amounts = [int(re.sub(r'[^0-9]', '', value.get_text())) for value in card.select('.commerce-card-prices dd')]
        assert amounts == list(prices)
    for card in cards:
        link = card.select_one('h2 a.commerce-card-link')
        assert link and link['href'].endswith('/solutions/'+('branded-review-card' if card['data-variant']=='branded' else 'review-card'))
        assert not link.select('button,a,input')
        assert card.select_one('.catalog-card-actions .button') and card.select_one('.catalog-card-actions .text-action')
        assert card.select_one('.catalog-card-proof')
    branded_src=cards[1].select_one('img')['src']
    media=json.loads((ROOT/'src/media-manifest.json').read_text('utf-8'))
    branded_asset=next(item for item in media if item['url']==branded_src)
    assert branded_asset.get('derivative_of',branded_src).endswith('branded-review-card-neutral-placeholder.svg')
    assert len(soup.select('.catalog-assist')) == 1
    assert not soup.select('[data-badge="popular"],[data-badge="bestseller"]')


def test_retired_products_absent_from_public_html_runtime_data_and_analytics():
    for path in [*SITE.rglob('index.html'), SITE / 'assets/content.json', SITE / 'assets/app.js']:
        content = path.read_text('utf-8')
        assert not any(retired in content.lower() for retired in RETIRED), path
    content = json.loads((SITE / 'assets/content.json').read_text('utf-8'))
    assert [v['id'] for v in content['variants']] == ['standard', 'branded']
    assert content['commerce']['physicalProduct']['id'] == 'nfc-review-card'
    assert set(EVENTS)<=set(content['events'])
    assert {'catalog_product_open','product_gallery_slide','client_review_submit_success'}<=set(content['events'])
    assert len(content['events'])==len(set(content['events']))
    assert {key: value for key, value in content['commerce'].items() if key != 'poland'} == load_commerce()
    assert content['commerce']['poland'] == json.loads((ROOT / 'src/poland-commerce.json').read_text('utf-8'))


def test_deployment_redirect_rules_match_canonical_source():
    mappings = json.loads((ROOT / 'src/redirects.json').read_text('utf-8'))
    lines = [line.split() for line in (SITE / '_redirects').read_text('utf-8').splitlines()
             if line.strip() and not line.startswith('#')]
    for source, target in mappings.items():
        assert [source, target, '301'] in lines
    assert not any(line[2] != '301' for line in lines)


def test_sitemap_has_only_current_nontransactional_nondraft_routes():
    soup = BeautifulSoup((SITE / 'sitemap.xml').read_text('utf-8'), 'xml')
    routes = {urlsplit(el.get_text()).path for el in soup.find_all('loc')}
    expected = {route for route in ROUTES if not route.endswith(('/privacy', '/terms', '/thank-you', '/order', '/contact', '/reviews/new'))}
    assert routes == expected
    assert not any(old in routes for old in RETIRED)


@pytest.mark.parametrize('route', ['/solutions/review-card', '/en/solutions/review-card'])
def test_dedicated_product_schema_two_canonical_package_offers_no_invented_proof(route):
    nodes = soup_at(route).select('script[type="application/ld+json"]')
    data = [json.loads(n.string) for n in nodes]
    products = [d for d in data if d.get('@type') == 'Product']
    assert len(products) == 1
    product = products[0]
    assert product['name'] == 'Google Review Card'
    offers = product['offers']
    assert len(offers) == 2
    config = load_commerce()
    for offer in offers:
        selected = parse_qs(urlsplit(offer['url']).query)
        variant, quantity = 'standard', selected['quantity'][0]
        assert offer['price'] == canonical_quote(variant, quantity, config)['amount']
        assert offer['priceCurrency'] == 'UAH'
        assert offer['eligibleQuantity']['minValue'] == int(quantity)
        assert offer['eligibleQuantity']['maxValue'] == int(quantity)
    serialized = json.dumps(data).lower()
    for forbidden in ['aggregaterating', '"review"', '"rating"', '"availability"', *RETIRED]:
        assert forbidden not in serialized
    assert not any(offer['price'] in {0, None} for offer in offers)


@pytest.mark.parametrize('route', ['/solutions/review-card', '/en/solutions/review-card'])
def test_business_and_branches_anchor_targets_are_keyboard_focusable(route):
    soup = soup_at(route)
    for name in ['business-orders', 'branches']:
        target = soup.find(id=name)
        assert target and target.get('tabindex') == '-1'
        assert len(soup.find_all(id=name)) == 1


@pytest.mark.parametrize('route', ['/order', '/contact', '/en/order', '/en/contact'])
def test_new_primary_form_fields_and_conditional_contract(route):
    form = soup_at(route).select_one('.lead-form')
    assert form
    assert form.select_one('input[name=contractVersion]')['value'] == '6'
    assert form.select_one('input[name=requestToken]')['value'] == ''
    assert form.select_one('input[name=phone]')['type'] == 'tel'
    assert {o.get('value') for o in form.select('input[type=radio][name=messenger]')} == {'telegram', 'whatsapp', 'viber'}
    assert {o.get('value') for o in form.select('select[name=variant] option') if o.get('value')} == {'standard', 'branded', 'review_3d', 'bulk', 'consultation', 'instagram'}
    assert {o.get('value') for o in form.select('select[name=quantity] option')} == {'1', '2', 'more'}
    for field in ['business', 'maps']:
        assert not form.select_one('[name="' + field + '"]')
    assert not form.select('input[type=file],[name=city],[name=country],[name=locations],[name=perLocation]')
    assert form.select_one('[name=consent]').has_attr('required')
    if not route.startswith('/en'):
        for name in ['variant']:
            field = form.select_one('[name="' + name + '"]')
            label = form.find('label', attrs={'for': field['id']})
            assert label.get_text(strip=True) not in {'business', 'maps', 'variant'}


@pytest.mark.parametrize('route', ['/contact', '/en/contact'])
def test_contact_channels_exact_and_no_unconfirmed_email(route):
    soup = soup_at(route)
    links = {a['href'] for a in soup.select('a[href]')}
    assert 'https://t.me/TijGabumG' in links
    assert 'tel:+380980421619' in links
    assert 'https://www.instagram.com/antonovdigital/' in links
    assert any(urlsplit(h).hostname == 'wa.me' and urlsplit(h).path == '/380980421619' for h in links)
    assert any(h.startswith('viber://chat?') and parse_qs(urlsplit(h).query).get('number') == ['+380980421619'] for h in links)
    assert not any(h.startswith('mailto:') for h in links)


def test_unverified_claims_not_in_public_copy_or_metadata():
    flags = json.loads((ROOT / 'src/verification.json').read_text('utf-8'))
    approved = {'link_rewrite_verified', 'lead_time_5_days_confirmed', 'card_material_dimensions_confirmed'}
    assert all(value is (key in approved) for key,value in flags.items() if key != 'source')
    for path in [*SITE.rglob('index.html'), SITE / 'assets/content.json']:
        source = path.read_text('utf-8')
        assert not re.search(r'NTAG\d|ISO\s?14443', source, re.I), path
        assert not re.search(r'\[PRODUCT PHOTO|\[PHOTO \d|\[X.Y\]|\bTODO\b|undefined', source, re.I), path
        assert not re.search(r'100.{0,20}3 дн|87[–-]89', source), path
        assert not BeautifulSoup(source, 'html.parser').select('.cases,[data-case-id],a[href^="mailto:"]')


@pytest.mark.parametrize('route', ['/thank-you', '/en/thank-you'])
def test_public_thank_you_is_empty_receipt_shell_without_per_order_pii(route):
    soup = soup_at(route)
    assert soup.select_one('#receipt') and not soup.select_one('.lead-form')
    assert not re.search(r'NFC-[A-F0-9]{20}', str(soup))
    for link in soup.select('a[href]'):
        query = parse_qs(urlsplit(link['href']).query)
        assert not set(query).intersection({'name', 'phone', 'comment', 'maps', 'requestToken', 'orderId'})
    assert soup.select_one('meta[name=robots]')['content'] == 'noindex,nofollow'


def test_model_validation_and_verification_flags_are_independent():
    node("""
      import assert from 'node:assert/strict';
      import {resolveContent, validateModel, config, flags} from './src/model.mjs';
      const initial=resolveContent();
      assert.equal(validateModel(initial), true);
      assert.ok(initial.copy.rewrite);
      assert.equal(initial.caseTemplate.enabled, false);
      const rewrite=resolveContent({link_rewrite_verified:false});
      assert.equal(rewrite.copy.rewrite, null);
      assert.equal(rewrite.flags.lead_time_5_days_confirmed, true);
      assert.equal(rewrite.config.publicationReady, false);
      assert.equal(rewrite.caseTemplate.public, false);
      assert.ok(resolveContent().copy.rewrite);
      assert.throws(()=>resolveContent({link_rewrite_verified:'yes'}));
      const timing=resolveContent({lead_time_5_days_confirmed:false});
      assert.notDeepEqual(timing.leadTime, initial.leadTime);
      assert.ok(timing.copy.rewrite);
      assert.equal(config.integrationStatus,'IMPLEMENTED_NOT_CONFIGURED');
      assert.equal(flags.legal_identity_confirmed,false);
    """)


def test_node_display_and_server_quote_have_identical_amounts_currency_deposit():
    values = json.loads(node("""
      import {canonicalQuote} from './src/display.mjs';
      console.log(JSON.stringify(['standard','branded','consultation'].flatMap(v=>
        ['1','2','more'].map(q=>({variant:v,quantity:q,quote:canonicalQuote(v,q)})))));
    """))
    for item in values:
        expected = canonical_quote(item['variant'], item['quantity'], load_commerce())
        for field in ['amount', 'currency', 'deposit', 'depositIncluded']:
            assert item['quote'][field] == expected[field]
