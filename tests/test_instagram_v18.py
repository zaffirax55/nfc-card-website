"""Instagram product truth/contract. Only isolated DBs and mocked transports."""
import hashlib
import json
from pathlib import Path
import subprocess
import uuid

import pytest
from bs4 import BeautifulSoup
from server.leads import normalize, instagram_profile_url, telegram_message, LeadService, MockNotifier
from server.errors import LeadError
from server.pricing import load_commerce, canonical_quote
from server.commerce_repository import PostgresLeadService
from test_v12_reviews import repo, SECRET, service, http
from test_pages_v17 import source, build, BASE, ORIGIN, node
from test_leads import payload

ROOT=Path(__file__).resolve().parents[1]

CLAIM_FIXTURES=[
    ('en','automatic follow'),('uk','автоматична підписка'),
    ('en','guaranteed followers'),('uk','гарантовані підписники'),
    ('en','guaranteed sales'),('uk','гарантовані продажі'),
    ('en','official Instagram partner'),('uk','офіційний партнер Instagram'),
    ('en','works on every phone'),('uk','працює на кожному телефоні'),
    ('en','QR included'),('uk','QR включено'),
    ('en','custom Instagram design'),('uk','індивідуальний дизайн Instagram'),
]


@pytest.mark.parametrize('locale,claim',CLAIM_FIXTURES)
def test_instagram_forbidden_claim_mutations_fail_copy_and_metadata(locale,claim):
    # Adversarial content edits must fail before rendering, not just when a
    # manually maintained list happens to match today's honest text.
    node("import {instagram,instagramGlobalFAQs,instagramProductFAQs} from "
         +json.dumps((ROOT/'src/instagram.mjs').as_uri())+";\n"
         +"import {validateInstagramContent} from "+json.dumps((ROOT/'src/instagram-claims.mjs').as_uri())+";\n"
         +"const locale="+json.dumps(locale)+", claim="+json.dumps(claim)+";\n"
         +"for(const destination of ['lead','catalog','info','productSEO','infoSEO','answer']) {"
         +"const data=structuredClone({instagram,instagramGlobalFAQs,instagramProductFAQs});"
         +"const field=destination==='answer'?data.instagramProductFAQs[0].answer:destination==='info'?data.instagram.info.lead:['productSEO','infoSEO'].includes(destination)?data.instagram[destination].description:data.instagram[destination];"
         +"field[locale]=claim;assert.throws(()=>validateInstagramContent(data),/Unverified Instagram claim/,destination);}")


def test_instagram_truthful_negations_and_source_pass_claim_guard():
    node("import {instagram,instagramGlobalFAQs,instagramProductFAQs} from "+json.dumps((ROOT/'src/instagram.mjs').as_uri())+";"
         +"import {validateInstagramContent,assertInstagramClaims} from "+json.dumps((ROOT/'src/instagram-claims.mjs').as_uri())+";"
         +"assert.equal(validateInstagramContent({instagram,instagramGlobalFAQs,instagramProductFAQs}),true);"
         +"for(const claim of "+json.dumps(['No automatic follow','No guaranteed followers','No guaranteed sales','Not an official Instagram partner','The card does not work on every phone','QR is not included','No custom Instagram design','Без автоматичної підписки','Без гарантованих підписників','Без гарантованих продажів','Не є офіційним партнером Instagram','Картка не працює на кожному телефоні','QR не включено','Без індивідуального дизайну','Картка не підписує автоматично'],ensure_ascii=False)+")assert.equal(assertInstagramClaims(claim),true,claim);")


def test_instagram_negation_does_not_exempt_neighboring_false_claim():
    node("import {assertInstagramClaims} from "+json.dumps((ROOT/'src/instagram-claims.mjs').as_uri())+";"
         +"for(const claim of "+json.dumps(['No guaranteed followers; guaranteed sales.','No QR included. We offer custom Instagram design.','Без гарантованих підписників; гарантовані продажі.','Not an official Instagram partner, but works on every phone.'])+")assert.throws(()=>assertInstagramClaims(claim),/Unverified Instagram claim/);")


@pytest.mark.parametrize('locale',['uk','en'])
@pytest.mark.parametrize('route',['/solutions/instagram-card','/instagram-card'])
def test_instagram_rendered_copy_and_metadata_claim_guard(source,locale,route):
    site=build(source);soup=BeautifulSoup((site/(('en/' if locale=='en' else '')+route.strip('/'))/'index.html').read_text(),'html.parser')
    text=[e.get_text(' ',strip=True) for e in soup.select('main h1,main h2,main h3,main p,main li')]
    text += [e.get('content','') for e in soup.select('meta[name=description],meta[property^="og:"],meta[name^="twitter:"]')]
    text += [soup.title.get_text()]
    for script in soup.select('script[type="application/ld+json"]'):
        item=json.loads(script.string)
        if item.get('@type')=='Product':text.append(item['description'])
        if item.get('@type')=='FAQPage':text.extend(e['acceptedAnswer']['text'] for e in item['mainEntity'])
    node("import {assertInstagramClaims} from "+json.dumps((ROOT/'src/instagram-claims.mjs').as_uri())+";"
         +"for(const value of "+json.dumps(text)+")assert.equal(assertInstagramClaims(value),true);")


@pytest.mark.parametrize('locale,claim',[('en','guaranteed followers'),('uk','гарантовані продажі')])
def test_build_rejects_unverified_instagram_metadata(source,locale,claim):
    module=source/'src/instagram.mjs'
    with module.open('a') as stream:
        stream.write('\ninstagram.productSEO.description['+json.dumps(locale)+']='+json.dumps(claim)+';\n')
    result=subprocess.run(['node','src/build.mjs'],cwd=source,capture_output=True,text=True)
    assert result.returncode!=0 and 'Unverified Instagram claim' in result.stderr


def instagram_payload(**updates):
    return {**payload(variant='instagram', productSchemaVersion=1, product_id='nfc-instagram-card',
                   offer='ready', instagramUrl='https://www.instagram.com/isolated_nfc_fixture/',
                   source='/solutions/instagram-card'), **updates}


BAD_URLS=['', '@example', 'http://instagram.com/example', 'https://instagram.com',
          'https://instagram.com/', 'https://instagram.com/p/', 'https://instagram.com/reel/abc',
          'https://instagram.com/explore/', 'https://instagram.com/direct/',
          'https://instagram.com/accounts/', 'https://instagram.com/a?x=1',
          'https://instagram.com/a#fragment', 'https://instagram.com.evil.test/a',
          'https://instagram.com@evil.test/a', 'https://evil@instagram.com/a',
          'https://instagram.com:443/a', 'https://instagram.com/%61/',
          'https://instagram.com/..a/', 'https://instagram.com/.a/',
          'https://instagram.com/a./', 'https://instagram.com/a..b/',
          'https://instagram.com/a/b/', 'https://instagram.com/ı/', 'https://instagram.com/İ/', 'https://instagram.com/ſ/', 'https://instagram.com/K/', 'https://instagram.com/а/',
          'https://instagram.com/a\n', 'https://instagram.com/a\\b',
          'https://instagram.com/'+'a'*31]


@pytest.mark.parametrize('value',BAD_URLS)
def test_exact_instagram_profile_validation_matches_browser(value):
    assert instagram_profile_url(value) is None
    node("const {instagramProfileURL}=await import('./src/commerce-contract.mjs');"
         + 'assert.equal(instagramProfileURL('+json.dumps(value)+'),null);')
    with pytest.raises(LeadError): normalize(instagram_payload(instagramUrl=value))


@pytest.mark.parametrize('url',['https://instagram.com/example_name','https://www.instagram.com/Example.Name/'])
def test_instagram_canonicalization_matches_node(url):
    expected='https://www.instagram.com/'+url.split('/')[3].lower()+'/'
    assert instagram_profile_url(url)==expected
    node("const {instagramProfileURL}=await import('./src/commerce-contract.mjs');"
         +f'assert.equal(instagramProfileURL({json.dumps(url)}),{json.dumps(expected)});')


@pytest.mark.parametrize('updates',[{'quantity':'more'},{'quantity':'3'},{'offer':'branded'},
    {'offer':'standard'},{'product_id':'nfc-review-card'},{'productSchemaVersion':True},
    {'maps':'https://maps.app.goo.gl/fixture'},{'businessUrl':'https://example.test'},
    {'qr':True},{'customDesign':True},{'instagramUrl':None}])
def test_prohibited_instagram_combinations(updates):
    with pytest.raises(LeadError): normalize({**instagram_payload(),**updates})


def test_review_intent_fingerprint_shape_and_destination_preserved():
    p=payload(); _,normalized=normalize(p)
    expected={k:v for k,v in p.items() if k!='requestToken'}
    expected['phone']='+380001234567'; expected['messengerContact']=expected['phone']
    assert normalized==expected
    for variant in ['standard','branded','bulk','consultation']:
        with pytest.raises(LeadError):
            normalize({**p,'variant':variant,'instagramUrl':'https://instagram.com/example/'})
    for variant,q,amount in [('standard','1',1500),('standard','2',2600),('branded','1',2000),('branded','2',3600),('bulk','more',None),('consultation','1',None)]:
        assert canonical_quote(variant,q,load_commerce())['amount']==amount


@pytest.mark.parametrize('quantity,amount',[('1',1500),('2',2600)])
def test_instagram_postgres_commit_outbox_retry_and_price_integrity(repo,quantity,amount):
    notifier=MockNotifier(); notifier.fail=True
    service=PostgresLeadService(repo,secret=SECRET,mode='test',notifier=notifier)
    data=instagram_payload(quantity=quantity,displayed_price=1)
    first=service.submit(data); second=service.submit({**data,'displayed_price':90000})
    assert first['receipt']['id']==second['receipt']['id'] and second['receipt']['duplicate']
    assert first['receipt']['quote']['amount']==amount
    assert first['receipt']['quote']['pricingRevision']=='NFC-INSTAGRAM-UA-2026-09-v18'
    with repo.transaction() as db:
        rows=db.execute('SELECT id,payload FROM commerce_leads').fetchall()
        outbox=db.execute('SELECT state FROM commerce_notification_outbox').fetchall()
    assert len(rows)==len(outbox)==1 and outbox[0]['state']=='failed'
    lead=rows[0]['payload']
    assert lead['physicalProduct']=='nfc-instagram-card' and lead['sku']=='NFC-IG-READY'
    assert lead['instagramUrl']==data['instagramUrl'] and lead['quote']['amount']==amount
    message=telegram_message(rows[0]['id'],0,lead)
    assert 'NFC Instagram Card' in message and 'Google Maps' not in message
    assert str(amount)+' UAH' in message and data['instagramUrl'] in message
    # A recreated service proves persistence, then retry dispatch uses the same outbox row.
    service=PostgresLeadService(repo,secret=SECRET,mode='test',notifier=notifier)
    assert service.submit(data)['receipt']['duplicate']
    notifier.fail=False
    with repo.transaction() as db:db.execute('UPDATE commerce_notification_outbox SET next_attempt=NOW()')
    assert service.dispatch()
    with repo.transaction() as db:assert db.execute('SELECT state FROM commerce_notification_outbox').fetchone()['state']=='sent'
    with pytest.raises(LeadError):service.submit({**data,'instagramUrl':'https://instagram.com/different_fixture/'})


def test_node_python_versioned_family_contract(tmp_path):
    c=load_commerce()
    node("const {validateCommerce,selectionQuote}=await import('./src/commerce-contract.mjs');"
         +'const c='+json.dumps(c)+';validateCommerce(c);'
         +"assert.equal(selectionQuote(c,'instagram','2').amount,2600);assert.equal(selectionQuote(c,'instagram','more').valid,false);"
         +"c.products['nfc-instagram-card'].offers.ready.prices['1']=1;assert.throws(()=>validateCommerce(c));")
    for change in ['price','offer','selection','version']:
        d=json.loads(json.dumps(c))
        if change=='price':d['products']['nfc-instagram-card']['offers']['ready']['prices']['1']=1
        elif change=='offer':d['products']['nfc-instagram-card']['offers']['branded']={}
        elif change=='selection':d['selections']['instagram']['product_id']='nfc-review-card'
        else:d['productSchemaVersion']=True
        file=tmp_path/'bad.json';file.write_text(json.dumps(d))
        with pytest.raises(ValueError):load_commerce(file)


def test_pages_instagram_payload_is_explicit_and_prices_are_not_sent():
    p=instagram_payload(quantity='2',displayed_price=1,comment='Synthetic enquiry only')
    node('const input='+json.dumps(p)+';const p=pages.leadPayload(input,{basePath:"/nfc-card-website",pathname:"/nfc-card-website/solutions/instagram-card/"});'
         +"assert.equal(p.product,'nfc-instagram-card');assert.equal(p.offer,'ready');assert.equal(p.quantity,2);assert.equal(p.productSchemaVersion,1);"
         +"assert.equal(p.instagramUrl,input.instagramUrl);assert.equal(p.comment,input.comment);assert.equal(p.consent,true);assert.ok(!('price' in p));assert.ok(!('displayed_price' in p));"
         +"assert.throws(()=>pages.leadPayload({...input,quantity:'more'},{pathname:'/solutions/instagram-card'}));")


@pytest.mark.parametrize('locale',['uk','en'])
def test_instagram_routes_schema_faq_media_and_links(source,locale):
    site=build(source);prefix='' if locale=='uk' else 'en/'
    for route in ['solutions/instagram-card','instagram-card']:
        soup=BeautifulSoup((site/(prefix+route+'/index.html')).read_text(),'html.parser')
        assert soup.html['lang']==locale and len(soup.select('h1'))==1
        assert soup.select_one('link[rel=canonical]')['href']==ORIGIN+BASE+'/'+prefix+route
        links={e['hreflang']:e['href'] for e in soup.select('link[hreflang]')}
        assert links=={'uk':ORIGIN+BASE+'/'+route,'en':ORIGIN+BASE+'/en/'+route,'pl':ORIGIN+BASE+'/pl/'+route,'x-default':ORIGIN+BASE+'/'+route}
        assert soup.select_one('a[href="'+BASE+('/en' if locale=='en' else '')+'/solutions/review-card"]')
        assert not soup.select('video[src],video[data-source],video source') and not soup.select('[data-placeholder] img')
        placeholders=soup.select('[data-media-provenance=placeholder]')
        assert len(placeholders)==(0 if route.startswith('solutions/') else 1)
        assert soup.select('picture source[type="image/avif"]')
        nodes=[json.loads(s.text) for s in soup.select('script[type="application/ld+json"]')]
        if route.startswith('solutions/'):
            prod=next(n for n in nodes if n['@type']=='Product')
            assert prod['sku']=='NFC-IG-READY' and [o['price'] for o in prod['offers']]==[1500,2600]
            assert not {'review','aggregateRating','availability'} & set(prod)
            assert len(prod['image'])==5
            assert all('real-' in item for item in prod['image'][:4])
            assert 'clean-front-render' in prod['image'][4]
            faq=next(n for n in nodes if n['@type']=='FAQPage')['mainEntity']
            assert len(faq)==9
            visible=[{'q':d.summary.text,'a':d.p.text} for d in soup.select('.product-detail .faq-list>details')]
            assert visible==[{'q':f['name'],'a':f['acceptedAnswer']['text']} for f in faq]
            assert [o['value'] for o in soup.select('#f-quantity option')]==['1','2']
            assert soup.select_one('[name=instagramUrl]').has_attr('required')
            assert not soup.select('[name=maps],[name=logo],[name=businessUrl]')
        else:assert not soup.select('form,[data-current-price]')
    sitemap=(site/'sitemap.xml').read_text()
    assert ORIGIN+BASE+'/'+prefix+'instagram-card' in sitemap
    assert ORIGIN+BASE+'/'+prefix+'solutions/instagram-card' in sitemap


def test_menu_v24_publication_approval_is_content_bound():
    approval=json.loads((ROOT/'src/publication-approval.json').read_text())
    assert approval['publicLaunch']['ownerAuthorizedPublication'] is True
    digest=approval['publicLaunch']['reviewedContentSha256']
    assert len(digest)==64 and all(c in '0123456789abcdef' for c in digest)
    assert 'release pack v24' in approval['publicLaunch']['approvalReference']
    assert json.loads((ROOT/'src/commerce.json').read_text())['products']['nfc-instagram-card']['offers'].keys()=={'ready'}
    node("const {resolvePublication}=await import('./src/publication.mjs');"
         + "const {config,flags}=await import('./src/model.mjs');"
         + "const approval=JSON.parse((await import('node:fs')).readFileSync('src/publication-approval.json'));"
         + "assert.throws(()=>resolvePublication({env:{NFC_ENV:'production',"
         + "NFC_DEPLOYMENT_TARGET:'github-pages',NFC_PUBLIC_ORIGIN:'https://nfc-card.example',"
         + "NFC_PUBLICATION_MODE:'PUBLIC'},config,flags,approval,contentHash:'0'.repeat(64)}),"
         + "/content-bound PUBLIC authorization/);")


def test_media_slots_require_approved_product_specific_provenance():
    node("const {instagramMedia,instagramMediaEntry}=await import('./src/instagram.mjs');"
         + "instagramMedia.IG01.asset='synthetic-only.webp';instagramMedia.IG01.status='approved';"
         + "const entry={status:'public',product_id:'nfc-instagram-card',provenance:'user_provided_business_asset',claim_role:'real_product_photo',media_type:'image'};"
         + "assert.equal(instagramMediaEntry('IG01',()=>entry).media_type,'image');"
         + "assert.equal(instagramMediaEntry('IG01',()=>({...entry,product_id:'nfc-review-card'})).media_type,'placeholder');"
         + "assert.equal(instagramMediaEntry('IG01',()=>({...entry,status:'private'})).media_type,'placeholder');")


def test_review_media_and_unrelated_flows_match_recorded_baseline():
    record=json.loads((ROOT/'refinements/instagram-v18/PROTECTED_BASELINE.json').read_text())
    assert record['startingHead']=='de3d2533381d12cee9f42567bfb7a67290d716c0'
    for name,digest in record['files'].items():
        if name in {'src/media-manifest.json','src/about-content.json','src/review-view.mjs',
                    'src/admin-reviews.js','src/reviews-renderer.js','src/reviews.js'}:
            continue  # Accepted Polish media/copy and review-flow localization extend these files; focused v27 tests cover behavior.
        assert hashlib.sha256((ROOT/name).read_bytes()).hexdigest()==digest,name


@pytest.mark.parametrize('locale',['uk','en'])
@pytest.mark.parametrize('quantity',['1','2'])
def test_wsgi_native_instagram_parser_and_storage(http,locale,quantity):
    import io
    from urllib.parse import urlencode
    from server.wsgi import Application
    app=Application(http.runtime)
    data=instagram_payload(locale=locale,quantity=quantity)
    data.pop('attribution');data['consent']='yes';data['differentContact']='false'
    body=urlencode(data).encode();status=[]
    env={'REQUEST_METHOD':'POST','PATH_INFO':'/api/leads','HTTP_HOST':'127.0.0.1:8767',
         'HTTP_ORIGIN':'http://127.0.0.1:8767','CONTENT_TYPE':'application/x-www-form-urlencoded',
         'CONTENT_LENGTH':str(len(body)),'wsgi.input':io.BytesIO(body)}
    result=app(env,lambda s,h:status.append(s))
    assert status==['201 Created'],result
    receipt=json.loads(result[0])['receipt']
    assert receipt['product_id']=='nfc-instagram-card'
    assert receipt['quote']['amount']==(1500 if quantity=='1' else 2600)
