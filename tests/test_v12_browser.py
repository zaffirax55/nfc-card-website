"""Repeatable browser acceptance for this local application, with an isolated server and DB.

All test submissions are synthetic, pending/private, and confined to the disposable test schema.
No published fixture or customer case screenshot is produced.
"""
import json,os,threading,time,hashlib,subprocess
from pathlib import Path
from http.server import ThreadingHTTPServer
import pytest
from playwright.sync_api import sync_playwright,expect
from test_v12_reviews import repo,service,AdminAuth,ReviewRuntime,ReviewHTTP,PostgresLeadService,HASH,PASSWORD,SECRET,photo
from server.preview import Handler
ROOT=Path(__file__).resolve().parents[1]
EVIDENCE=Path(os.environ.get('NFC_BROWSER_EVIDENCE',str(ROOT/'refinements/visual-about-v13/legacy-regression'))).resolve()
if EVIDENCE.is_relative_to((ROOT/'refinements/commerce-v12').resolve()):
    raise RuntimeError('Current browser QA must not overwrite accepted v12 evidence.')
SHOTS=EVIDENCE/'screenshots'/'verified';SHOTS.mkdir(parents=True,exist_ok=True)
WIDTHS=[320,360,390,430,768,1024,1280,1440]
@pytest.fixture
def web(service):
    server=ThreadingHTTPServer(('127.0.0.1',0),Handler);origin=f'http://127.0.0.1:{server.server_port}'
    service.origin=origin;runtime=ReviewRuntime(service,AdminAuth(service.repo,secret=SECRET,password_hash=HASH,secure=False),origin,'test')
    server.reviews=ReviewHTTP(runtime,lambda lang:(ROOT/'server/templates'/f'admin-{lang}.html').read_text('utf-8'))
    server.leads=PostgresLeadService(service.repo,secret=SECRET,mode='test')
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    yield origin,server
    server.shutdown();server.server_close();thread.join(3)
@pytest.fixture
def browser():
    with sync_playwright() as p:
        b=p.chromium.launch(headless=True,args=['--disable-gpu'])
        yield b
        b.close()
def block_external(context,origin):
    context.route('**/*',lambda route:route.continue_() if route.request.url.startswith(origin+'/') else route.abort())
def visible_images(page):
    page.evaluate('''async()=>{await document.fonts.ready;await new Promise(requestAnimationFrame);await Promise.all([...document.images].filter(img=>{const r=img.getBoundingClientRect();return r.width>0&&r.height>0&&r.bottom>0&&r.top<innerHeight&&r.right>0&&r.left<innerWidth&&(img.currentSrc||img.src);}).map(img=>img.decode().catch(()=>{})));}''')
def ready(page):
    page.evaluate('document.fonts.ready')
    if page.locator('[data-commerce-form]').count():page.wait_for_selector('[data-commerce-form][data-enhanced=true]')
    if page.locator('[data-review-form]').count():
        # Review enhancement waits for upload options; document load alone does
        # not mean the custom submit/validation handler has been installed.
        page.wait_for_function("() => { const form = document.querySelector('[data-review-form]'); return form.noValidate && typeof form.onsubmit === 'function'; }")
    if page.locator('[data-admin-loading]').count():expect(page.locator('[data-admin-loading]')).to_be_hidden()
    visible_images(page)
def geometry(page):return page.evaluate('''()=>({width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,h1:document.querySelectorAll('h1').length,missingAlt:[...document.images].filter(e=>!e.hasAttribute('alt')).length,zeroReviews:!document.querySelector('#client-reviews .review-card,#client-reviews [data-review-id]'),brokenImages:[...document.images].filter(e=>e.getBoundingClientRect().width>0&&e.complete&&e.currentSrc&&e.naturalWidth===0).map(e=>e.currentSrc),galleryDisplay:document.querySelector('.commerce-product-layout')?getComputedStyle(document.querySelector('.commerce-product-layout')).display:null})''')
def capture(page,name,full=False):
    visible_images(page)
    page.screenshot(path=SHOTS/(name+'-top.png'),animations='disabled')
    result={'top':'screenshots/verified/'+name+'-top.png','full':None,'sections':[]}
    if full:
        # Lazy sections can grow as they enter the viewport. Traverse the actual
        # current page extent instead of stopping at its initial estimated height.
        target=0
        for _ in range(300):
            page.evaluate('(y)=>window.scrollTo(0,y)',target);visible_images(page)
            actual=page.evaluate('scrollY');height=page.evaluate('document.documentElement.scrollHeight')
            if actual+page.viewport_size['height']>=height-1:break
            target=actual+700
        else:raise AssertionError('Page did not reach a stable bottom during lazy-image sweep.')
        height=page.evaluate('document.documentElement.scrollHeight')
        page.evaluate('window.scrollTo(0,0)');visible_images(page)
        if height*page.viewport_size['width']<=4_000_000:
            page.screenshot(path=SHOTS/(name+'-full.png'),full_page=True,animations='disabled');result['full']='screenshots/verified/'+name+'-full.png'
        else:
            # A large single bitmap can exceed this workstation's committed memory.
            # Capture real overlapping viewports; never stitch or invent intermediate pixels.
            last=-1;target=0
            for _ in range(300):
                page.evaluate('(y)=>window.scrollTo(0,y)',target);visible_images(page);actual=page.evaluate('scrollY')
                height=page.evaluate('document.documentElement.scrollHeight')
                if actual==last:raise AssertionError('Viewport sequence stalled before the document bottom.')
                last=actual;file=f'{name}-section-{len(result["sections"])+1:02}.png';page.screenshot(path=SHOTS/file,animations='disabled');result['sections'].append({'path':'screenshots/verified/'+file,'scrollY':actual,'viewportHeight':page.viewport_size['height'],'documentHeight':height})
                if actual+page.viewport_size['height']>=height-1:break
                target=actual+max(200,page.viewport_size['height']-180)
            else:raise AssertionError('Viewport sequence did not reach the document bottom.')
            assert result['sections'][-1]['scrollY']+page.viewport_size['height']>=height-1
            page.evaluate('window.scrollTo(0,0)')
    return result

@pytest.mark.parametrize('width',WIDTHS)
def test_eight_width_bilingual_route_and_screenshot_matrix(web,browser,width):
    origin,_=web;rows=[];errors=[]
    revision=lambda:hashlib.sha256('\n'.join(f'{p.relative_to(ROOT/"site").as_posix()}:{hashlib.sha256(p.read_bytes()).hexdigest()}' for p in sorted((ROOT/'site').rglob('*')) if p.is_file()).encode()).hexdigest()
    before=revision()
    routes=['/','/about','/solutions','/solutions/review-card','/solutions/branded-review-card','/order','/contact','/reviews/new','/admin/login']
    for current_width in [width]:
        context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce',device_scale_factor=1);block_external(context,origin);page=context.new_page();page.on('pageerror',lambda error:errors.append(str(error)))
        context.add_init_script("window.nfcQaPerf={cls:0,lcp:0};new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.nfcQaPerf.cls+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())window.nfcQaPerf.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});")
        for lang in ['uk','en']:
            for route in routes:
                path=('/en' if lang=='en' else '')+('' if route=='/' and lang=='en' else route)
                response=page.goto(origin+path,wait_until='networkidle');assert response.status==200,(path,response.status)
                ready(page);data=geometry(page);assert data['width']==width and data['scrollWidth']<=width,(path,width,data)
                assert data['h1']==1 and data['missingAlt']==0 and not data['brokenImages'] and data['zeroReviews'],(path,width,data)
                if data['galleryDisplay']:
                    frame=page.locator('[data-gallery-frame]').bounding_box();purchase=page.locator('.commerce-purchase').bounding_box()
                    assert frame and purchase
                    if width<=768:assert frame['y']+frame['height']<=purchase['y']+1
                    else:assert frame['x']+frame['width']<=purchase['x']+1
                name=f"{lang}-{('home' if route=='/' else route.strip('/').replace('/','-'))}-{width}"
                data['localPerformance']=page.evaluate('''()=>({...nfcQaPerf,domNodes:document.querySelectorAll('*').length,resourceBytes:performance.getEntriesByType('resource').reduce((n,r)=>n+r.decodedBodySize,0)})''')
                shots=capture(page,name,width in (390,1440));rows.append({'route':path,'requestedWidth':width,'status':response.status,**data,**shots})
                (EVIDENCE/'browser-matrix-verified.json').write_text(json.dumps({'engine':'Playwright Chromium, project integration test','deviceScaleFactor':1,'rows':rows,'pageErrors':errors},indent=2),'utf-8')
        context.close()
        print(f'Verified {width}px: {len(rows)} bilingual routes/states.',flush=True)
    assert not errors
    assert before==revision()
    report={'complete':True,'engine':'Playwright Chromium, project integration test','deviceScaleFactor':1,'siteRevision':before,'siteRevisionAfter':revision(),'rows':rows,'pageErrors':errors,'performanceScope':'Local unthrottled shared workstation, reduced motion; observations only, not production/field Core Web Vitals.'}
    (EVIDENCE/f'browser-width-{width}.json').write_text(json.dumps(report,indent=2),'utf-8')
    if all((EVIDENCE/f'browser-width-{w}.json').exists() for w in WIDTHS):
        reports=[json.loads((EVIDENCE/f'browser-width-{w}.json').read_text('utf-8')) for w in WIDTHS]
        if all(r['complete'] and r['siteRevision']==before for r in reports):
            report['rows']=[row for r in reports for row in r['rows']];report['pageErrors']=[e for r in reports for e in r['pageErrors']]
            (EVIDENCE/'browser-matrix-verified.json').write_text(json.dumps(report,indent=2),'utf-8')

def fill_order(page):
    page.locator('#f-name').fill('Synthetic technical QA');page.locator('#f-phone').fill('+380001234567')
    page.locator('.lead-form:not([data-menu-form]) label.messenger-option').filter(has=page.locator('[value=telegram]')).click();page.locator('#f-consent').check()
def login(page,origin,locale='uk'):
    page.goto(origin+('/en' if locale=='en' else '')+'/admin/login');ready(page);page.locator('#admin-password').fill(PASSWORD);page.locator('.admin-login button').click();page.wait_for_url('**/admin/reviews');ready(page)

def test_commerce_gallery_keyboard_sticky_price_and_retry_isolation(web,browser):
    origin,server=web;context=browser.new_context(viewport={'width':390,'height':844},has_touch=True);block_external(context,origin);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(origin+'/solutions/review-card?quantity=2&utm_campaign=synthetic');ready(page)
    expect(page.locator('#f-quantity')).to_have_value('2');expect(page.locator('[data-current-price]')).to_contain_text('600')
    page.locator('[data-gallery-next]').click();expect(page.locator('[data-gallery-count]')).to_have_text('2 / 13')
    page.locator('[data-gallery-frame]').press('ArrowLeft');expect(page.locator('[data-gallery-count]')).to_have_text('1 / 13')
    page.locator('[data-zoom]').click();expect(page.locator('.image-lightbox')).to_be_visible();page.locator('.lightbox-scroll').dblclick();expect(page.locator('.image-lightbox')).to_have_attribute('data-zoomed','true')
    page.keyboard.press('Escape');expect(page.locator('.image-lightbox')).not_to_be_visible();assert page.evaluate("document.activeElement.hasAttribute('data-zoom')")
    page.locator('#product-details summary').first.click();page.locator('.product-detail').last.scroll_into_view_if_needed();expect(page.locator('[data-commerce-sticky]')).to_be_visible();capture(page,'uk-sticky-details-390')
    page.locator('#f-name').focus();expect(page.locator('[data-commerce-sticky]')).not_to_be_visible()
    page.locator('#purchase-quantity').select_option('more');expect(page.locator('#f-quantity')).to_have_value('more');assert not any(c.isdigit() for c in page.locator('[data-current-price]').inner_text())
    page.locator('#purchase-quantity').select_option('2');page.locator('.menu-toggle').click();page.locator('#mobile-menu .locale-switch[lang="en"]').click();page.wait_for_url('**/en/solutions/review-card?**');ready(page);expect(page.locator('#f-quantity')).to_have_value('2');assert 'quantity=2' in page.url and 'utm_campaign' not in page.url
    fill_order(page)
    # Deliver to the local service, then drop the browser response: the durable record exists.
    def lose_response(route):route.fetch();route.abort()
    page.route('**/api/leads',lose_response);page.locator('.submit-button').click();expect(page.locator('.form-result')).to_have_attribute('data-status','error');assert page.locator('#f-name').input_value()=='Synthetic technical QA'
    assert page.locator('[name=messenger]').count()==3
    assert all(radio.is_disabled() for radio in page.locator('[name=messenger]').all())
    page.locator('.messenger-options').scroll_into_view_if_needed();capture(page,'en-messenger-pending-disabled-390')
    with server.reviews.runtime.service.repo.transaction() as db:assert db.execute('SELECT count(*) n FROM commerce_leads').fetchone()['n']==1
    page.goto(origin+'/en/solutions/branded-review-card');ready(page);expect(page.locator('h1')).to_have_text('Branded Review Card');expect(page.locator('input[name=variant]')).to_have_value('branded');expect(page.locator('[data-current-price]')).to_contain_text('2,000');expect(page.locator('.pending-notice')).not_to_be_visible()
    page.goto(origin+'/en/solutions/review-card');ready(page);expect(page.locator('.pending-notice')).to_be_visible();expect(page.locator('input[name=variant]')).to_have_value('standard');page.unroute('**/api/leads',lose_response);page.locator('.submit-button').click();expect(page.locator('.form-result')).to_have_attribute('data-status','success');expect(page.locator('.form-result')).to_contain_text('45 minutes')
    with server.reviews.runtime.service.repo.transaction() as db:assert db.execute('SELECT count(*) n FROM commerce_leads').fetchone()['n']==1
    events=page.evaluate('window.nfcAnalyticsEvents');assert any(e['event']=='order_submit_success' for e in events)
    assert all(set(e)<={'event','locale','route','variant','quantity','asset_index','image_index','messenger','destination','reviewId'} for e in events)
    page.goto(origin+'/en/thank-you');ready(page);expect(page.locator('#receipt')).to_contain_text('NFC-');assert not errors
    (EVIDENCE/'commerce-browser-flow.json').write_text(json.dumps({'pass':True,'gallery':'arrow/lightbox/Escape/focus','sticky':'visible in details; hidden at focused form','quantity':'1/2/custom +locale/UTM','retry':'committed response lost; other SKU unchanged; one record after retry','analytics':events},indent=2),'utf-8');context.close()

@pytest.mark.parametrize('locale',['uk','en'])
def test_review_public_pending_form_and_private_admin(web,browser,locale):
    origin,server=web;prefix='/en' if locale=='en' else '';context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');block_external(context,origin);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(origin+prefix+'/reviews/new');ready(page);page.locator('.review-form [type=submit]').click();expect(page.locator('.error-summary')).to_be_visible();page.locator('#review-rating-1').press('Space');page.keyboard.press('ArrowRight');page.keyboard.press('ArrowRight');expect(page.locator('#review-rating-3')).to_be_checked()
    page.locator('#review-text').fill('Technical automated QA in an isolated database; not a customer review.');page.locator('#review-instagram').fill('@technical_qa');page.locator('#review-consent').check()
    page.locator('#review-image').set_input_files({'name':'synthetic-private-proof.png','mimeType':'image/png','buffer':photo()})
    def lose_response(route):route.fetch();route.abort()
    page.route('**/api/reviews/submit',lose_response);page.locator('.review-form [type=submit]').click();expect(page.locator('.form-result')).to_have_attribute('data-status','error');expect(page.locator('#review-rating-3')).to_be_checked()
    page.unroute('**/api/reviews/submit',lose_response);page.locator('.form-result button').click();expect(page.locator('.form-result')).to_have_attribute('data-status','success')
    page.locator('.form-result').screenshot(path=SHOTS/(locale+'-test-only-pending-receipt.png'))
    with server.reviews.runtime.service.repo.transaction() as db:
        rows=db.execute('SELECT id,status,rating FROM client_reviews').fetchall();assert len(rows)==1 and rows[0]['status']=='pending' and rows[0]['rating']==3;id=str(rows[0]['id'])
    page.goto(origin+prefix+'/admin/reviews');page.wait_for_url('**/admin/login');login(page,origin,locale)
    expect(page.locator('.admin-list>a')).to_have_count(1);page.locator('.admin-list>a').click();ready(page);expect(page.locator('.admin-private')).to_have_count(2);expect(page.locator('.admin-private').first).to_contain_text('3/5')
    expect(page.locator('.admin-publish-panel')).to_contain_text('Google Maps');assert not page.locator('input[name=rating],textarea[name=raw_review_text]').count()
    proof=page.locator('.admin-private img').first;expect(proof).to_be_visible();assert proof.evaluate('(img)=>img.naturalWidth')>0
    page.locator('#admin-businessName').fill('Unsaved technical QA');page.locator('.admin-locale').click();expect(page.locator('[data-admin-error]')).to_be_visible();assert id in page.url
    page.locator('.admin-edit form button[type=submit]').click();ready(page)
    page.locator('.admin-preview>button').click();expect(page.locator('.admin-preview article')).to_be_visible();expect(page.locator('.admin-preview .review-stars')).to_have_text('★★★☆☆')
    page.goto(origin+prefix+'/admin/reviews/new');ready(page);capture(page,locale+'-admin-empty-manual-form-390',True)
    page.locator('#admin-reviewText').fill('Unsaved isolated technical draft.');page.locator('.admin-locale').click();expect(page.locator('[data-admin-error]')).to_be_visible();assert prefix+'/admin/reviews/new' in page.url
    page.locator('[data-logout]').click();page.wait_for_url('**/admin/login');page.goto(origin+prefix+'/admin/reviews/'+id);page.wait_for_url('**/admin/login')
    page.goto(origin+('/en' if locale=='en' else '/'));ready(page);assert page.locator('#client-reviews').count()==1;assert not page.locator('#client-reviews .review-card,#client-reviews [data-review-id]').count();assert not errors
    (EVIDENCE/(locale+'-review-admin-flow.json')).write_text(json.dumps({'pass':True,'rating':3,'submit':'pending only; same reference retry after response lost','admin':'protected login, read-only raw/rating, blockers, unsaved locale protection, save, logout','publishedCases':0,'pageErrors':errors},indent=2),'utf-8');context.close()

def test_reduced_motion_zoom_reflow_and_story_control_contrast(web,browser):
    origin,_=web;context=browser.new_context(viewport={'width':720,'height':900},reduced_motion='reduce');block_external(context,origin);page=context.new_page();page.goto(origin);ready(page)
    assert page.evaluate("matchMedia('(prefers-reduced-motion: reduce)').matches")
    assert page.evaluate("[...document.querySelectorAll('video')].every(v=>v.paused)")
    for route in ['/about','/en/about','/solutions/review-card','/solutions/branded-review-card','/reviews/new','/order','/solutions/instagram-card','/en/solutions/instagram-card','/instagram-card','/en/instagram-card']:
        page.goto(origin+route);ready(page)
        # Browser-level 200% page zoom through Chromium's documented settings accelerator.
        page.keyboard.press('Control+0')
        for _ in range(4):page.keyboard.press('Control++')
        # Headless Chromium may not implement browser chrome accelerators; verify equivalent
        # CSS reflow at half of a 720px desktop viewport as well, without claiming an actual zoom.
        page.set_viewport_size({'width':360,'height':900});assert geometry(page)['scrollWidth']<=360
        capture(page,'zoom-reflow-'+route.strip('/').replace('/','-')+'-360');page.keyboard.press('Control+0');page.set_viewport_size({'width':720,'height':900})
    page.emulate_media(reduced_motion='no-preference');page.goto(origin);ready(page);page.locator('#founder-story').scroll_into_view_if_needed();toggle=page.locator('.story-toggle');expect(toggle).to_be_visible();colors=toggle.evaluate('(e)=>({foreground:getComputedStyle(e).color,background:getComputedStyle(e).backgroundColor})');assert colors=={'foreground':'rgb(24, 27, 31)','background':'rgb(243, 244, 245)'}
    toggle.click();expect(toggle).to_have_attribute('aria-pressed','true');capture(page,'story-paused-control-720');toggle.press('Tab');assert geometry(page)['scrollWidth']<=720
    (EVIDENCE/'motion-reflow.json').write_text(json.dumps({'reducedMotion':'videos stay paused','zoomEvidence':'360px reflow equivalent; actual browser 200% confirmation separate','storyControlColors':colors,'pausedControl':True},indent=2),'utf-8');context.close()

def test_authenticated_empty_admin_responsive_matrix(web,browser):
    origin,_=web;context=browser.new_context(viewport={'width':1440,'height':900},reduced_motion='reduce');block_external(context,origin);page=context.new_page();login(page,origin);rows=[]
    for width in WIDTHS:
        page.set_viewport_size({'width':width,'height':900})
        for locale in ['uk','en']:
            for route in ['/admin/reviews','/admin/reviews/new']:
                path=('/en' if locale=='en' else '')+route;page.goto(origin+path);ready(page);data=geometry(page)
                assert data['h1']==1 and data['scrollWidth']<=width and not data['brokenImages']
                if route.endswith('/new'):assert page.locator('#admin-locale').bounding_box()['height']>=44
                name=locale+'-'+route.strip('/').replace('/','-')+'-empty-'+str(width);capture(page,name);rows.append({'route':path,**data,'screenshot':'screenshots/verified/'+name+'-top.png'})
    (EVIDENCE/'admin-matrix-verified.json').write_text(json.dumps({'rows':rows,'syntheticRecords':0},indent=2),'utf-8');context.close()

def test_real_touch_swipe_and_keyboard_menu(web,browser):
    origin,_=web;context=browser.new_context(viewport={'width':390,'height':844},has_touch=True,is_mobile=True,reduced_motion='reduce');block_external(context,origin);page=context.new_page();page.goto(origin+'/solutions/review-card');ready(page)
    box=page.locator('[data-gallery-frame]').bounding_box();session=context.new_cdp_session(page);y=box['y']+box['height']/2;x=box['x']+box['width']*.8
    session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
    for offset in [30,65,100,140]:session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-offset,'y':y}]})
    session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]});expect(page.locator('[data-gallery-count]')).to_have_text('2 / 13');expect(page.locator('.image-lightbox')).not_to_be_visible()
    page.locator('.menu-toggle').focus();page.keyboard.press('Enter');expect(page.locator('#mobile-menu')).to_be_visible();capture(page,'keyboard-menu-390')
    for _ in range(20):page.keyboard.press('Tab');assert page.evaluate("document.querySelector('#mobile-menu').contains(document.activeElement)")
    page.keyboard.press('Escape');expect(page.locator('#mobile-menu')).not_to_be_visible();expect(page.locator('.menu-toggle')).to_be_focused();context.close()

def test_actual_200_percent_browser_zoom(web,tmp_path):
    # Disposable test-only extension invokes the browser's page-zoom API; no user profile.
    # https://developer.chrome.com/docs/extensions/reference/api/tabs#method-setZoom
    origin,_=web;extension=tmp_path/'zoom-extension';extension.mkdir()
    (extension/'manifest.json').write_text(json.dumps({'manifest_version':3,'name':'Isolated NFC zoom QA','version':'1.0','permissions':['tabs'],'background':{'service_worker':'worker.js'}}),'utf-8')
    (extension/'worker.js').write_text('chrome.runtime.onInstalled.addListener(()=>{});','utf-8')
    rows=[]
    with sync_playwright() as p:
        context=p.chromium.launch_persistent_context(tmp_path/'browser-profile',channel='chromium',headless=True,viewport={'width':1440,'height':1000},args=['--disable-gpu',f'--disable-extensions-except={extension}',f'--load-extension={extension}']);block_external(context,origin)
        worker=context.service_workers[0] if context.service_workers else context.wait_for_event('serviceworker')
        page=context.new_page()
        for route in ['/','/about','/en/about','/solutions/review-card','/solutions/branded-review-card','/reviews/new','/order','/solutions/instagram-card','/en/solutions/instagram-card','/instagram-card','/en/instagram-card']:
            page.goto(origin+route);ready(page)
            zoom=worker.evaluate('''async origin=>{const tabs=await chrome.tabs.query({});const tab=tabs.find(t=>t.url.startsWith(origin));await chrome.tabs.setZoom(tab.id,2);return await chrome.tabs.getZoom(tab.id);}''',origin)
            assert zoom==2;page.wait_for_function('devicePixelRatio===2');data=geometry(page);assert data['width']==720 and data['scrollWidth']<=720
            name='actual-200-percent-'+('home' if route=='/' else route.strip('/').replace('/','-'));capture(page,name);rows.append({'route':route,'chromeTabsGetZoom':zoom,'devicePixelRatio':page.evaluate('devicePixelRatio'),**data,'screenshot':'screenshots/verified/'+name+'-top.png'})
        context.close()
    (EVIDENCE/'actual-browser-zoom.json').write_text(json.dumps({'method':'chrome.tabs.setZoom/getZoom in disposable test extension and profile','rows':rows},indent=2),'utf-8')

def test_explicit_order_routes_keep_pending_variants_separate(web,browser):
    origin,server=web;context=browser.new_context(viewport={'width':390,'height':844});block_external(context,origin);page=context.new_page();page.goto(origin+'/order?variant=standard&quantity=2');ready(page);fill_order(page)
    def lose_response(route):route.fetch();route.abort()
    page.route('**/api/leads',lose_response);page.locator('.lead-form:not([data-menu-form]) .submit-button').click();expect(page.locator('.lead-form:not([data-menu-form]) .form-result')).to_have_attribute('data-status','error')
    page.goto(origin+'/order?variant=branded&quantity=1');ready(page);expect(page.locator('input[name=variant]')).to_have_value('branded');expect(page.locator('#f-quantity')).to_have_value('1');expect(page.locator('.lead-form:not([data-menu-form]) .pending-notice')).not_to_be_visible()
    page.goto(origin+'/order?variant=standard&quantity=2');ready(page);expect(page.locator('.lead-form:not([data-menu-form]) .pending-notice')).to_be_visible();page.unroute('**/api/leads',lose_response);page.locator('.lead-form:not([data-menu-form]) .submit-button').click();expect(page.locator('.lead-form:not([data-menu-form]) .form-result')).to_have_attribute('data-status','success')
    with server.reviews.runtime.service.repo.transaction() as db:assert db.execute('SELECT count(*) n FROM commerce_leads').fetchone()['n']==1
    context.close()

@pytest.mark.parametrize('locale',['uk','en'])
def test_shared_renderer_semantics_and_business_dialog_without_case_screenshots(web,browser,locale):
    origin,_=web;context=browser.new_context(viewport={'width':320,'height':844},reduced_motion='reduce');block_external(context,origin);page=context.new_page()
    # Technical DOM fixture only, not a customer case; never stored or screenshotted.
    page.set_content('<html lang="'+locale+'"><body><main id="fixture"></main></body></html>')
    page.add_script_tag(url=origin+'/assets/reviews-renderer.js');page.add_style_tag(url=origin+'/assets/style.css');page.add_style_tag(url=origin+'/assets/reviews.css')
    page.evaluate('''()=>{const item={id:'11111111-1111-4111-8111-111111111111',rating:3,reviewText:'<img src=x onerror=alert(1)> Technical DOM assertion',businessName:'Technical fixture only',instagramUrl:'https://www.instagram.com/isolated_test/',googleMapsUrl:'https://www.google.com/maps/',websiteUrl:'javascript:alert(1)',primaryImage:null,secondaryImage:null,privateNote:'MUST_NOT_RENDER'};document.querySelector('#fixture').append(NFCReviewUI.render(item));}''')
    expect(page.locator('.review-stars')).to_have_text('★★★☆☆');assert page.locator('.review-rating').inner_text().endswith('3 із 5' if locale=='uk' else '3 out of 5');assert not page.locator('blockquote img').count();assert 'MUST_NOT_RENDER' not in page.locator('body').inner_text()
    trigger=page.locator('.client-review>button');trigger.click();dialog=page.locator('.business-dialog');expect(dialog).to_be_visible();assert dialog.get_attribute('aria-labelledby');expect(dialog.locator('a')).to_have_count(2)
    for anchor in dialog.locator('a').all():assert anchor.get_attribute('rel')=='noopener noreferrer' and anchor.get_attribute('href').startswith('https:')
    for _ in range(12):page.keyboard.press('Tab');assert page.evaluate("document.querySelector('dialog').contains(document.activeElement)")
    page.keyboard.press('Escape');expect(dialog).not_to_be_visible();expect(trigger).to_be_focused();trigger.click();dialog.locator('button').click();expect(trigger).to_be_focused();assert geometry(page)['scrollWidth']<=320;context.close()

def test_browser_console_network_and_accessible_control_names(web,browser):
    origin,_=web;rows=[]
    routes=['/','/about','/solutions','/solutions/review-card','/solutions/branded-review-card','/reviews/new','/order','/contact','/admin/login']
    for width in [390,1440]:
        context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce');block_external(context,origin)
        for locale in ['uk','en']:
            for route in routes:
                page=context.new_page();console=[];failed=[];http=[];errors=[]
                page.on('console',lambda msg:console.append(msg.text) if msg.type=='error' else None)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('requestfailed',lambda req:failed.append({'url':req.url.removeprefix(origin),'failure':req.failure}))
                page.on('response',lambda res:http.append({'url':res.url.removeprefix(origin),'status':res.status}) if res.status>=400 else None)
                path=('/en' if locale=='en' else '')+('' if route=='/' and locale=='en' else route);page.goto(origin+path,wait_until='networkidle');ready(page)
                unnamed=page.evaluate('''()=>[...document.querySelectorAll('input,textarea,select,button,a[href]')].filter(e=>e.getClientRects().length&&e.type!=='hidden'&&!e.closest('[aria-hidden=true]')).filter(e=>!((e.labels&&e.labels.length)||e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||e.textContent.trim()||e.querySelector('img[alt]'))).map(e=>e.id||e.outerHTML.slice(0,150))''')
                assert not console and not failed and not http and not errors and not unnamed,(path,width,console,failed,http,errors,unnamed)
                rows.append({'route':path,'width':width,'consoleErrors':console,'pageErrors':errors,'failedRequests':failed,'httpErrors':http,'unnamedControls':unnamed});page.close()
        context.close()
    (EVIDENCE/'browser-diagnostics.json').write_text(json.dumps({'rows':rows,'scope':'Current affected routes, no fault injection; console/network and accessible-name checks, not a complete WCAG certification.'},indent=2),'utf-8')
