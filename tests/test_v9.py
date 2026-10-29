"""V9 migration contracts: public media, native continuity and untrusted observations."""
from pathlib import Path
import hashlib
import json
import sys
from urllib.parse import parse_qs, urlsplit
from bs4 import BeautifulSoup
import pytest

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'server'))
from preview import hydrate_native_form
from pricing import load_commerce
from leads import displayed_price_observation, telegram_message
from test_leads import service, payload, stored

def native(route, query=''):
    source=(ROOT/'site'/route.lstrip('/')/'index.html').read_text('utf-8')
    content=json.loads((ROOT/'site/assets/content.json').read_text('utf-8'))
    return BeautifulSoup(hydrate_native_form(source,route+query,load_commerce(),content),'html.parser')

@pytest.mark.parametrize('prefix',['','/en'])
@pytest.mark.parametrize('variant,prices',[('standard',{'1':1500,'2':2600}),('branded',{'1':2000,'2':3600})])
@pytest.mark.parametrize('quantity',['1','2','more'])
def test_native_pdp_and_lead_selection_agree(prefix,variant,prices,quantity):
    route=prefix+'/solutions/'+('branded-review-card' if variant=='branded' else 'review-card')
    page=native(route,f'?quantity={quantity}&utm_campaign=synthetic')
    form=page.select_one('.commerce-form')
    assert form.select_one('[name=variant]')['value']==variant
    assert form.select_one('[name=quantity] option[selected]')['value']==quantity
    assert page.select_one('#purchase-quantity option[selected]')['value']==quantity
    assert form.select_one('[name=source]')['value']==route
    assert json.loads(form.select_one('[name=attribution]')['value'])['utm_campaign']=='synthetic'
    for summary in page.select('[data-current-price],[data-sticky-price]'):
        digits=''.join(c for c in summary.get_text() if c.isdigit())
        assert digits==str(prices[quantity]) if quantity in prices else not digits
    assert not form.select('select[name=variant]') and not page.select('.product-order')
    assert page.h1.get_text()==('Google Review Card' if variant=='standard' else 'Branded Review Card')

def test_native_links_carry_only_bounded_utm_and_source():
    page=native('/','?utm_campaign=synthetic&phone=%2B12025550123&source=https%3A%2F%2Fevil.test&variant=%22%3E%3Cscript%3E')
    for link in page.select('.product-row .button'):
        query=parse_qs(urlsplit(link['href']).query)
        assert query['source']==['/'] and query['utm_campaign']==['synthetic']
        assert set(query)=={'variant','quantity','source','utm_campaign'}
    assert '12025550123' not in str(page) and 'evil.test' not in str(page)
    assert not page.select('script:not([src]):not([type="application/ld+json"])')
    # v13 home ends with an order link; native continuity remains on the order form.
    order=native('/order','?utm_campaign=synthetic&phone=%2B12025550123&source=https%3A%2F%2Fevil.test')
    assert order.select_one('.lead-form [name=source]')['value']=='/order'
    assert json.loads(order.select_one('[name=attribution]')['value'])['utm_campaign']=='synthetic'
    assert '12025550123' not in str(order) and 'evil.test' not in str(order)

@pytest.mark.parametrize('query',[ '?variant=bulk&quantity=1', '?variant=bulk&quantity=999' ])
def test_native_bulk_always_custom(query):
    page=native('/order',query)
    assert page.select_one('[name=quantity] option[selected]')['value']=='more'
    assert not any(c.isdigit() for c in page.select_one('[data-form-price]').get_text())

@pytest.mark.parametrize('value,expected',[
    ('UAH 3,600','UAH 3,600'),('3\u00a0600 грн','3 600 грн'),('Individual quote','Individual quote'),
    ('Індивідуальний розрахунок','Індивідуальний розрахунок'),(0,'0'),(1.5,'1.5'),
    (True,None),(-1,None),(float('nan'),None),(float('inf'),None),(1e10,None),
    ('<script>alert(1)</script>',None),('Secret user data',None),({'amount':1},None),('1'*81,None),
])
def test_displayed_observation_is_bounded(value,expected):
    assert displayed_price_observation(value)==expected

def test_snapshot_and_notification_keep_observation_separate(service):
    data=payload(variant='branded',quantity='2',businessUrl='https://example.test/synthetic',displayed_price='UAH 0.01',source='/solutions/review-card',attribution={'utm_campaign':'synthetic'})
    first=service.submit(data)
    retry=service.submit({**data,'displayed_price':'UAH 999,999'})
    lead=stored(service)
    assert first['receipt']['quote']['amount']==3600
    assert retry['receipt']['duplicate'] and retry['receipt']['id']==first['receipt']['id']
    assert lead['displayed_price']=='UAH 0.01' and len(service.telegram.calls)==1
    message=telegram_message(first['receipt']['id'],0,lead)
    assert 'Displayed price (untrusted): UAH 0.01' in message
    assert '3600' in message and '/solutions/review-card' in message and 'synthetic' in message

def test_public_media_exact_allowlist_and_original_hashes():
    media=json.loads((ROOT/'src/media-manifest.json').read_text('utf-8'))
    expected={m['url'].removeprefix('/assets/media/') for m in media}
    actual={p.relative_to(ROOT/'site/assets/media').as_posix() for p in (ROOT/'site/assets/media').rglob('*') if p.is_file()}
    assert actual==expected and len(expected)==len(media)
    # Freeze the accepted baseline and admit only traceable, scoped v13 additions.
    snapshot=json.loads((ROOT/'refinements/visual-about-v13/RECOVERY_SNAPSHOT.json').read_text('utf-8'))
    baseline={path.removeprefix('site/assets/media/'):sha for path,sha in snapshot['files'].items() if path.startswith('site/assets/media/')}
    assert len(baseline)==15 and set(baseline)<=expected
    for name,sha in baseline.items():
        assert hashlib.sha256((ROOT/'site/assets/media'/name).read_bytes()).hexdigest()==sha
    for item in media:
        assert hashlib.sha256((ROOT/'site'/item['url'].lstrip('/')).read_bytes()).hexdigest()==item['sha256']
        assert item['status'] not in {'REFERENCE_ONLY','SOURCE_ONLY'}
        assert (ROOT/item['source']).resolve().is_relative_to((ROOT/'src/media').resolve())
        assert hashlib.sha256((ROOT/item['source']).read_bytes()).hexdigest()==item['sha256']
        if item['url'].removeprefix('/assets/media/') not in baseline:
            assert (item['requirements_source'].startswith('v13') or
                    ('/2026-09/' in item['url'] and item['requirements_source']=='Owner media replacement 2026-09-15') or
                    (item['url'].startswith('/assets/media/instagram/') and
                     item['requirements_source']=='NFC_CARD_FRESH_CHAT_INSTAGRAM_UPDATE_PACK_v22' and
                     item.get('managed_by')=='scripts/update_instagram_media.py:v22') or
                    (item['url'].startswith('/assets/media/menu/') and
                     item['requirements_source']=='NFC_CARD_MENU_FRESH_CHAT_IMPLEMENTATION_PACK_v23' and
                         item.get('managed_by')=='scripts/update_menu_media.py:v23') or
                    (item['url'].startswith('/assets/media/niche-v29/') and
                     item['product_id'] in {'beauty-review-card','restaurant-review-card'} and
                     item['requirements_source']=='NFC_CARD_BEAUTY_RESTAURANT_IMPLEMENTATION_PACK_v29' and
                     item.get('managed_by')=='v29_niche_media_import') or
                    (item['url'].startswith('/assets/media/niche-v33/') and
                     item['product_id'] in {'beauty-review-card','restaurant-review-card'} and
                     item['requirements_source']=='NFC_CARD_BEAUTY_RESTAURANT_IMPLEMENTATION_PACK_v29' and
                     item.get('managed_by')=='v33_niche_crop' and
                     item.get('derivative_of','').startswith('/assets/media/niche-v29/') and
                     item.get('source_asset_id','').startswith(('BEAUTY','RESTAURANT'))) or
                    (item['url'].startswith('/assets/media/review-3d/') and
                     item['product_id']=='nfc-review-card-3d' and
                     item['requirements_source']=='NFC_CARD_Review_3D_Website_Pack_v1 + NFC_CARD_REVIEW_3D_MEDIA_MANIFEST_v26' and
                     item.get('managed_by')=='v26_review_3d_media_import') or
                    (item['url']=='/assets/media/2026-09/review-card-video-3-pl.vtt' and
                     item['requirements_source']=='v27 Polish localization of Owner media replacement 2026-09-15' and
                     item['sha256']=='00b3a3278eb3b05e0e0563fbb719846909e87df199ff0fa70e00b618f31f1bfc'))
            assert item['provenance'] in {'user_provided_business_asset','verified_official_business_asset','ai_generated_original'}

@pytest.mark.parametrize('prefix',['','/en'])
def test_gallery_provenance_and_visible_faq_match_schema(prefix):
    page=native(prefix+'/solutions/review-card')
    figures=page.select('[data-slide]')
    assert len(figures)==13
    assert [f.select_one('img')['src'].split('/')[-1][:2] for f in figures[:2]]==['05','01']
    assert len(page.select('[data-slide] video'))==3
    assert not any(name in str(figures) for name in ['02-review-card-real-front','03-review-card-real-in-hand','04-review-card-real-back'])
    assert page.select_one('.gallery-caption').get_text(strip=True)
    assert figures[1].select_one('img')['data-media-provenance']=='user_provided_business_asset'
    assert figures[1].select_one('img')['data-media-claim-role']=='product_design_render'
    assert page.select_one('#product-details') and not page.select_one('#product-details').has_attr('open')
    assert len(page.select('.faq-list details'))>=4
    schemas=[json.loads(s.string) for s in page.select('script[type="application/ld+json"]')]
    assert {'Organization','Product','BreadcrumbList'}<={s['@type'] for s in schemas}
    assert not any(s['@type'] in {'Review','AggregateRating'} for s in schemas)
