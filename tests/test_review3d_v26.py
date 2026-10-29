"""Review 3D acceptance at the public Pages boundary; no production submission."""
import json
from pathlib import Path
import subprocess

from bs4 import BeautifulSoup
import pytest

from server.pricing import load_commerce, review3d_quote


ROOT = Path(__file__).resolve().parents[1]


def node(source):
    subprocess.run(['node', '--input-type=module', '-e', source], cwd=ROOT,
                   capture_output=True, text=True, check=True)


def html(route, language='uk'):
    prefix = 'en/' if language == 'en' else ''
    return BeautifulSoup((ROOT / 'site' / prefix / route / 'index.html').read_text(), 'html.parser')


def test_quantity_and_payload_are_distinct_from_legacy_review():
    commerce = load_commerce()
    for quantity, total, balance in ((1, 4000, 3800), (2, 8000, 7800), (3, 12000, 11800)):
        quote = review3d_quote(quantity, commerce)
        assert (quote['amount'], quote['deposit'], quote['balance']) == (total, 200, balance)
    for bad in (0, -1, 1.5, True, '2', 10001):
        with pytest.raises(ValueError):
            review3d_quote(bad, commerce)
    node(r"""
      import assert from 'node:assert/strict';
      import commerce from './src/commerce.json' with {type:'json'};
      import {review3dQuote,selectionQuote,validateCommerce} from './src/commerce-contract.mjs';
      import {googleLocationURL,review3dLeadPayload} from './src/review3d-client.mjs';
      validateCommerce(commerce);
      for(const [quantity,total,balance] of [[1,4000,3800],[2,8000,7800],[3,12000,11800]]){
        const q=review3dQuote(commerce,quantity);
        assert.equal(q.amount,total);assert.equal(q.deposit,200);assert.equal(q.balance,balance);
      }
      for(const bad of [0,-1,1.5,'2',10001,true])assert.equal(review3dQuote(commerce,bad).valid,false);
      assert.equal(selectionQuote(commerce,'standard','2').amount,2600);
      assert.equal(selectionQuote(commerce,'branded','2').amount,3600);
      assert.equal(selectionQuote(commerce,'instagram','2').amount,2600);
      for(const bad of ['http://google.com/maps','https://google.com:443/maps','https://evil.google.com.evil.test/maps',
        'https://'+'user:pass@google.com/maps','https://127.0.0.1/maps','javascript:alert(1)'])assert.equal(googleLocationURL(bad),null);
      assert.equal(googleLocationURL('https://maps.app.goo.gl/Example'),'https://maps.app.goo.gl/Example');
      const common={locale:'uk',name:'Synthetic QA',phone:'+380671234567',messenger:'telegram',quantity:'3',
        google_location_url:'https://maps.app.goo.gl/Example',comment:'Synthetic comment',consent:true,website:''};
      const lead=review3dLeadPayload(common,{basePath:'/nfc-card-website',pathname:'/nfc-card-website/solutions/review-card-3d/'});
      assert.equal(lead.product,'review-card-3d');assert.equal(lead.product_id,'nfc-review-card-3d');
      assert.equal(lead.design,'fixed_shown_design');assert.equal(lead.quantity,3);
      assert.equal(lead.comment,'Synthetic comment');assert.equal(lead.google_location_url,common.google_location_url);
      for(const field of ['selection','amount','price','displayed_price','sku','offer'])assert.equal(field in lead,false);
      for(const bad of ['0','-1','1.5','10001'])assert.throws(()=>review3dLeadPayload({...common,quantity:bad},{pathname:'/solutions/review-card-3d'}));
      assert.throws(()=>review3dLeadPayload({...common,comment:'x'.repeat(1001)},{pathname:'/solutions/review-card-3d'}));
      assert.throws(()=>review3dLeadPayload(common,{pathname:'/solutions/review-card'}));
    """)


def test_bilingual_product_routes_gallery_catalog_and_schema():
    for language in ('uk', 'en'):
        product = html('solutions/review-card-3d', language)
        catalog = html('solutions', language)
        assert product.h1.get_text(' ', strip=True) == 'NFC Review Card 3D'
        assert len(product.select('.commerce-gallery [data-slide]')) == 3
        gallery_sources = [figure.select_one('img')['src'] for figure in product.select('.commerce-gallery [data-slide]')]
        assert [part.split('/')[-1] for part in gallery_sources] == [
            'review-card-3d-front-in-hand.webp', 'review-card-3d-front-on-desk.webp', 'review-card-3d-back.webp']
        assert len(product.select('#faq-review3d details')) == 9
        assert product.select_one('[data-review3d-form] [name=quantity]')['min'] == '1'
        assert product.select_one('[data-review3d-form] [name=comment]')['maxlength'] == '1000'
        assert product.select_one('[data-review3d-form] [type=submit]').has_attr('disabled')
        assert len(catalog.select('.product-rows>article')) == 9
        assert catalog.select_one('.review3d-card') is not None
        assert catalog.select_one('.review3d-card .review3d-media-label') is not None
        assert product.select_one('.commerce-purchase .review3d-status') is not None
        assert product.select_one('[data-review3d-form] .review3d-status') is not None
        assert product.select_one('.desktop-nav a[href$="/solutions/review-card-3d"]')
        assert product.select_one('#mobile-menu a[href$="/solutions/review-card-3d"]')
        schema = [json.loads(script.string) for script in product.select('script[type="application/ld+json"]')]
        offer = next(item for item in schema if item['@type'] == 'Product')['offers']
        assert offer['price'] == 4000 and offer['priceCurrency'] == 'UAH'
        assert 'availability' not in offer
        faq = next(item for item in schema if item['@type'] == 'FAQPage')['mainEntity']
        visible = [(item.summary.get_text(' ', strip=True), item.p.get_text(' ', strip=True))
                   for item in product.select('#faq-review3d details')]
        assert visible == [(item['name'], item['acceptedAnswer']['text']) for item in faq]
    sitemap = (ROOT / 'site/sitemap.xml').read_text()
    assert '/solutions/review-card-3d' in sitemap and '/en/solutions/review-card-3d' in sitemap
    assert not (ROOT / 'site/review-card-3d').exists()


def test_product_copy_avoids_unapproved_claims_and_preserves_prototype():
    for language in ('uk', 'en'):
        page = html('solutions/review-card-3d', language)
        text = page.get_text(' ', strip=True)
        assert ('Прототип' if language == 'uk' else 'Prototype') in text
        assert ('4 000 грн' if language == 'uk' else 'UAH 4,000') in text
        assert '3M' not in text
        assert not any(word in text for word in ('10 × 10', '3 мм', '3 mm', '5 business days'))
        assert ('Branded Review Card' in text and 'NFC Instagram Card' in text and 'NFC Menu Card' in text)
