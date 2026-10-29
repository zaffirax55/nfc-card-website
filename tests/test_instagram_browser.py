"""Local Chromium QA. Remote traffic is denied; Pages delivery is a mocked seam."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
import threading
import uuid

import pytest
from playwright.sync_api import sync_playwright, expect
from test_pages_v17 import source, build, ENDPOINT, BASE
from test_v12_browser import web, browser, repo, service, ready, block_external

ROOT=Path(__file__).resolve().parents[1]
WIDTHS=[320,360,390,393,430,768,1024,1280,1440]
EVIDENCE=Path(os.environ.get('NFC_INSTAGRAM_EVIDENCE',str(ROOT/'work/qa/instagram-v22')))


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self,*args):pass


@pytest.fixture
def pages_web(source):
    site=build(source,NFC_PUBLICATION_MODE='PUBLIC',NFC_LEAD_ENDPOINT=ENDPOINT,NFC_TELEGRAM_ENABLED='false')
    www=source/'www';www.mkdir();(www/'nfc-card-website').symlink_to(site,target_is_directory=True)
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(QuietHandler,directory=www))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    yield f'http://127.0.0.1:{server.server_port}',site
    server.shutdown();server.server_close();thread.join(3)


def local_only(context,origin):
    blocked=[]
    def guard(route):
        if route.request.url.startswith(origin+'/') and route.request.method in ['GET','HEAD']:
            route.continue_()
        else:
            blocked.append({'url':route.request.url,'method':route.request.method});route.abort()
    context.route('**/*',guard)
    return blocked


@pytest.mark.parametrize('width',WIDTHS)
def test_instagram_nine_width_pages_matrix(pages_web,browser,width):
    origin,_=pages_web; context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
    blocked=local_only(context,origin);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)));page.on('console',lambda m:errors.append(m.text) if m.type=='error' else None)
    EVIDENCE.mkdir(parents=True,exist_ok=True);rows=[]
    for locale in ['uk','en']:
        prefix='/en' if locale=='en' else ''
        for route in ['/','/solutions','/solutions/instagram-card','/instagram-card','/order','/solutions/review-card','/solutions/branded-review-card']:
            path=BASE+prefix+('' if route=='/' else route)
            response=page.goto(origin+path+'/');assert response.status==200
            ready(page)
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),(path,width)
            assert page.locator('h1').count()==1 and page.locator('html').get_attribute('lang')==locale
            assert page.locator('img:not([alt])').count()==0
            assert page.evaluate("[...document.images].every(i=>!i.getClientRects().length||!i.complete||i.naturalWidth>0)")
            for a in page.locator('a[href^="/"]').all():assert a.get_attribute('href').startswith(BASE+'/')
            if route=='/solutions':
                cards=page.locator('.commerce-card')
                assert cards.evaluate_all('(rows)=>rows.map(c=>c.dataset.variant||null)')==['standard','branded',None,None,None,None,None,'instagram','menu']
                assert cards.nth(6).get_attribute('data-product-id')=='nfc-review-card-3d'
                poster=page.locator('.commerce-card[data-variant=instagram] img.catalog-artwork-poster')
                expect(poster).to_be_visible()
                assert '/assets/model-posters/instagram.webp' in poster.get_attribute('src')
                page.locator('.commerce-card[data-variant=instagram]').screenshot(path=EVIDENCE/f'{locale}-instagram-catalog-tile-{width}.png')
            if route=='/solutions/instagram-card':
                assert page.locator('[data-thumb-to]').count()==5
                assert page.locator('[data-slide] [data-media-claim-role=real_product_photo]').count()==4
                assert page.locator('[data-slide] [data-media-claim-role=promotional_product_render]').count()==1
                page.locator('[data-thumb-to="4"]').click();expect(page.locator('[data-slide="4"]')).to_be_visible()
                assert page.locator('.gallery-open').count()==1
                page.locator('[data-gallery-frame]').focus();page.keyboard.press('ArrowLeft')
                expect(page.locator('[data-slide="3"]')).to_be_visible()
                page.locator('[data-thumb-to="0"]').click()
                if width in [320,1440]:
                    opener=page.locator('[data-zoom]');opener.focus();opener.press('Enter')
                    expect(page.locator('.image-lightbox')).to_be_visible();page.keyboard.press('Escape')
                    expect(page.locator('.image-lightbox')).not_to_be_visible();expect(opener).to_be_focused()
                page.select_option('#purchase-quantity','2')
                assert '2600' in ''.join(filter(str.isdigit,page.locator('[data-current-price]').inner_text()))
                assert page.locator('#f-quantity').input_value()=='2'
                assert page.locator('#f-quantity option').evaluate_all('(o)=>o.map(x=>x.value)')==['1','2']
                expect(page.locator('#f-instagramUrl')).to_have_attribute('required','')
                expect(page.locator('.instagram-product-content')).to_be_visible()
                assert page.locator('[data-details-control]').count()==0
                assert page.locator('.product-detail .faq-list>details').count()==9
                assert page.locator('.instagram-product-content').evaluate("e=>getComputedStyle(e.querySelector('.meaning-rows p')).color===getComputedStyle(e.querySelector('.product-detail h2')).color")
                banner=page.locator('.instagram-product-content>.detail-signature')
                assert banner.evaluate("e=>{const s=getComputedStyle(e),r=e.getBoundingClientRect();return s.display==='grid'&&s.placeItems==='center'&&s.textAlign==='center'&&s.transform==='none'&&s.paddingTop===s.paddingBottom&&r.height>=96}")
            if route=='/instagram-card':
                assert page.locator('.instagram-info-content').evaluate("e=>[...e.querySelectorAll('.section p:not(.eyebrow):not(.field-hint),.section li')].every(x=>getComputedStyle(x).color===getComputedStyle(e).color)")
                assert page.locator('.instagram-info-content img[data-media-claim-role=real_product_photo]').count()==2
                assert page.locator('.instagram-info-content [data-placeholder=IG09]').count()==1
            if route=='/solutions/review-card':assert page.locator('[data-slide]').count()==13
            if route=='/solutions/branded-review-card':assert page.locator('[data-slide]').count()==3
            page.evaluate('scrollTo(0,0)')
            slug=route.strip("/").replace("/","-") or 'home'
            filename=f'{locale}-{slug}-{width}.png'
            page.screenshot(path=EVIDENCE/filename,animations='disabled')
            if width in [390,1440] and route in ['/solutions/instagram-card','/instagram-card']:
                page.screenshot(path=EVIDENCE/filename.replace('.png','-full.png'),full_page=True,animations='disabled')
            page.reload();ready(page);assert page.locator('h1').count()==1
            rows.append({'path':path,'width':width,'status':200,'overflow':False,'reload':True,'screenshot':filename})
    assert not errors and not blocked,(errors,blocked)
    (EVIDENCE/f'matrix-{width}.json').write_text(json.dumps(rows,indent=2))
    context.close()


@pytest.mark.parametrize('locale',['uk','en'])
@pytest.mark.parametrize('width',[320,1440])
def test_legacy_monthly_faq_anchor_scrolls_to_canonical_entry(pages_web,browser,locale,width):
    origin,_=pages_web;context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
    blocked=local_only(context,origin);page=context.new_page();prefix='/en' if locale=='en' else ''
    page.goto(origin+BASE+prefix+'/#faq-instagram-subscription');ready(page)
    page.wait_for_function('scrollY>1000')
    anchor=page.locator('#faq-instagram-subscription');faq=page.locator('#faq')
    assert anchor.bounding_box()['y']>=0 and anchor.bounding_box()['y']<160
    assert faq.bounding_box()['y']<200
    question='Чи є щомісячна плата?' if locale=='uk' else 'Is there a monthly fee?'
    assert page.locator('#faq details',has=page.get_by_text(question,exact=True)).count()==1
    assert not blocked
    context.close()


@pytest.mark.parametrize('locale',['uk','en'])
def test_instagram_gallery_touch_swipe(pages_web,browser,locale):
    origin,_=pages_web;context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,reduced_motion='reduce')
    blocked=local_only(context,origin);page=context.new_page();prefix='/en' if locale=='en' else ''
    page.goto(origin+BASE+prefix+'/solutions/instagram-card/');ready(page)
    frame=page.locator('[data-gallery-frame]');box=frame.bounding_box();session=context.new_cdp_session(page)
    y=box['y']+box['height']/2;x=box['x']+box['width']*.8
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
    for offset in [30,65,100,140]:session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-offset,'y':y}]})
    session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
    expect(page.locator('[data-gallery-count]')).to_have_text('2 / 5')
    expect(page.locator('.image-lightbox')).not_to_be_visible()
    assert not blocked
    context.close()


@pytest.mark.parametrize('locale',['uk','en'])
def test_pages_instagram_form_switch_retry_no_pii_and_durable_receipt(pages_web,browser,locale):
    origin,_=pages_web;context=browser.new_context(viewport={'width':393,'height':900});blocked=local_only(context,origin)
    page=context.new_page();prefix='/en' if locale=='en' else ''
    posts=[];lead_id=str(uuid.uuid4());challenge_calls=[]
    def challenge(route):
        challenge_calls.append(1)
        route.fulfill(status=200,json={'challenge':'synthetic.'+'a'*43,'minimumDelayMs':2000})
    def submit(route):
        posts.append({'payload':route.request.post_data_json,'key':route.request.headers['idempotency-key']})
        if len(posts)==1:route.abort('failed')
        else:route.fulfill(status=202,json={'ok':True,'source':'NFC_CARD','durableSaved':True,'leadId':lead_id})
    context.route(ENDPOINT+'/challenge?*',challenge);context.route(ENDPOINT,submit)
    page.goto(origin+BASE+prefix+'/order/');ready(page)
    page.fill('#f-name','Synthetic Instagram QA');page.fill('#f-phone','+380001234567')
    page.locator('.lead-form:not([data-menu-form]) [name=messenger][value=telegram]').check(force=True);page.check('#f-consent')
    page.select_option('#f-variant','instagram');expect(page.locator('#f-instagramUrl')).to_be_visible()
    page.fill('#f-instagramUrl','https://www.instagram.com/isolated_nfc_fixture/');page.fill('#f-comment','Synthetic comment')
    page.select_option('#f-quantity','2')
    page.select_option('#f-variant','branded');expect(page.locator('#f-instagramUrl')).to_be_hidden()
    assert page.locator('#f-instagramUrl').input_value()==''
    assert page.locator('#f-quantity option').evaluate_all('(o)=>o.map(x=>x.value)')==['1','2','more']
    expect(page.locator('#f-name')).to_have_value('Synthetic Instagram QA')
    page.select_option('#f-variant','instagram');page.fill('#f-instagramUrl','https://instagram.com/reel/invalid')
    page.locator('.lead-form:not([data-menu-form]) [type=submit]').click();expect(page.locator('.lead-form:not([data-menu-form]) .form-result[data-status=error]')).to_be_visible()
    assert not posts and not challenge_calls
    expect(page.locator('#f-instagramUrl')).to_have_attribute('aria-invalid','true')
    expect(page.locator('#e-instagramUrl')).to_be_visible()
    expect(page.locator('#f-instagramUrl')).to_be_focused()
    page.screenshot(path=EVIDENCE/f'{locale}-instagram-url-error-393.png')
    page.fill('#f-instagramUrl','https://instagram.com/isolated_nfc_fixture/');page.locator('.lead-form:not([data-menu-form]) [type=submit]').click()
    expect(page.locator('.lead-form:not([data-menu-form]) .form-result[data-status=error]')).to_be_visible(timeout=15000)
    assert len(posts)==1
    expect(page.locator('#f-instagramUrl')).to_have_value('https://instagram.com/isolated_nfc_fixture/')
    expect(page.locator('#f-name')).to_have_value('Synthetic Instagram QA')
    page.locator('.lead-form:not([data-menu-form]) [type=submit]').click();expect(page.locator('.lead-form:not([data-menu-form]) .form-result[data-status=success]')).to_be_visible(timeout=15000)
    assert len(posts)==2 and posts[0]==posts[1]
    assert posts[0]['payload']['product_id']=='nfc-instagram-card' and posts[0]['payload']['quantity']==2
    assert posts[0]['payload']['comment']=='Synthetic comment'
    assert 'Instagram' in page.locator('.lead-form:not([data-menu-form]) .form-result').inner_text()
    page.screenshot(path=EVIDENCE/f'{locale}-instagram-success-mocked-393.png')
    page.locator('.lead-form:not([data-menu-form])').evaluate('(f)=>f.requestSubmit()');page.wait_for_timeout(100);assert len(posts)==2
    stores=page.evaluate('JSON.stringify({local:{...localStorage},session:{...sessionStorage},events:window.nfcAnalyticsEvents})')
    for pii in ['Synthetic Instagram QA','isolated_nfc_fixture','380001234567','Synthetic comment']:assert pii not in stores
    events=page.evaluate('window.nfcAnalyticsEvents')
    assert any(e.get('product_id')=='nfc-instagram-card' and e['event']=='order_submit_success' for e in events)
    assert not blocked
    context.close()


@pytest.mark.parametrize('locale',['uk','en'])
@pytest.mark.parametrize('width',[393,1440])
def test_instagram_header_order_and_preselection(pages_web,browser,locale,width):
    origin,_=pages_web;context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce')
    blocked=local_only(context,origin);page=context.new_page();prefix='/en' if locale=='en' else ''
    page.goto(origin+BASE+prefix+'/solutions/instagram-card/');ready(page)
    page.select_option('#purchase-quantity','2');page.evaluate('scrollTo(0,0)')
    if width<769:
        page.locator('.menu-toggle').click();page.locator('.mobile-menu nav>.button').click()
    else:page.locator('.header-actions>.button').click()
    assert page.url.endswith('#request')
    assert page.locator('#f-quantity').input_value()=='2'
    assert ''.join(filter(str.isdigit,page.locator('[data-form-price]').inner_text()))=='2600'
    page.locator('[data-form-price]').scroll_into_view_if_needed()
    page.screenshot(path=EVIDENCE/f'{locale}-instagram-form-total-{width}.png')
    page.goto(origin+BASE+prefix+'/order/?variant=instagram&quantity=2');ready(page)
    expect(page.locator('[data-selected-product]')).to_have_text('NFC Instagram Card')
    assert page.locator('[name=variant]').input_value()=='instagram'
    assert page.locator('#f-quantity').input_value()=='2'
    assert 'Review Card' not in page.locator('h1').inner_text()
    target_locale = 'en' if locale == 'uk' else 'uk'
    if width<601:page.locator('.menu-toggle').click();page.locator(f'#mobile-menu .locale-switch[lang="{target_locale}"]').click()
    else:page.locator(f'.header-actions .locale-switch[lang="{target_locale}"]').click()
    ready(page)
    assert page.locator('[name=variant]').input_value()=='instagram' and page.locator('#f-quantity').input_value()=='2'
    assert not blocked
    context.close()


@pytest.mark.parametrize('locale',['uk','en'])
def test_fullstack_instagram_real_local_persistence(web,browser,locale):
    origin,server=web;context=browser.new_context();block_external(context,origin);page=context.new_page()
    page.goto(origin+('/en' if locale=='en' else '')+'/solutions/instagram-card');ready(page)
    page.fill('#f-name','Synthetic local IG');page.fill('#f-phone','+380001234567')
    page.locator('.lead-form:not([data-menu-form]) [name=messenger][value=telegram]').check(force=True)
    page.fill('#f-instagramUrl','https://instagram.com/isolated_nfc_fixture/');page.check('#f-consent')
    page.select_option('#f-quantity','2');page.locator('.lead-form:not([data-menu-form]) [type=submit]').click()
    expect(page.locator('.lead-form:not([data-menu-form]) .form-result[data-status=success]')).to_be_visible()
    with server.leads.repo.transaction() as db:
        leads=db.execute('SELECT payload FROM commerce_leads').fetchall()
        outbox=db.execute('SELECT state FROM commerce_notification_outbox').fetchall()
    assert len(leads)==len(outbox)==1 and outbox[0]['state']=='sent' # MockNotifier, never Telegram.
    assert leads[0]['payload']['quote']['amount']==2600
    assert leads[0]['payload']['product_id']=='nfc-instagram-card'
    context.close()


@pytest.mark.parametrize('locale',['uk','en','pl'])
@pytest.mark.parametrize('quantity',['1','2'])
def test_native_instagram_form_without_javascript(web,browser,locale,quantity):
    origin,server=web;context=browser.new_context(java_script_enabled=False,reduced_motion="reduce")
    block_external(context,origin);page=context.new_page()
    page.goto(origin+('/'+locale if locale!='uk' else '')+'/order?variant=instagram&quantity='+quantity)
    expect(page.locator('#f-instagramUrl')).to_be_visible()
    expect(page.locator('[name=variant]')).to_have_value('instagram')
    assert page.locator('#f-quantity option').count()==2
    assert page.locator('#f-quantity').input_value()==quantity
    assert page.locator('[name=productSchemaVersion]').input_value()=='1'
    expected=(129 if quantity=='1' else 219) if locale=='pl' else (1500 if quantity=='1' else 2600)
    assert ''.join(filter(str.isdigit,page.locator('[data-form-price]').inner_text()))==str(expected)
    page.fill('#f-name','Synthetic native IG');page.fill('#f-phone','+380001234567')
    page.locator('.lead-form:not([data-menu-form]) [name=messenger][value=telegram]').check(force=True)
    page.fill('#f-instagramUrl','https://instagram.com/isolated_nfc_fixture/')
    page.locator('#f-consent').focus();page.keyboard.press('Space');expect(page.locator('#f-consent')).to_be_checked()
    page.locator('.lead-form:not([data-menu-form]) [type=submit]').click();expect(page.locator('h1')).to_contain_text({'uk':'локально','en':'locally','pl':'lokalnie'}[locale])
    assert 'NFC Instagram Card' in page.locator('main').inner_text()
    with server.leads.repo.transaction() as db:
        rows=db.execute('SELECT payload FROM commerce_leads').fetchall()
    assert len(rows)==1 and rows[0]['payload']['quote']['amount']==expected
    assert rows[0]['payload']['quote']['currency']==('PLN' if locale=='pl' else 'UAH')
    assert rows[0]['payload']['locale']==locale
    context.close()
