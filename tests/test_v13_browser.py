"""Focused v13 browser behaviors; only isolated ephemeral test servers/DB schemas.

Old integration checks remain in test_v12_browser.py. Native captures here are
separate from both its regression evidence and root's before/after route matrix.
"""
import hashlib
import json
import os
from pathlib import Path
from urllib.parse import urlsplit

import pytest
from playwright.sync_api import expect
from test_v12_browser import ROOT, browser, web, repo, service, block_external, ready, geometry, visible_images

EVIDENCE=Path(os.environ.get('NFC_V13_BROWSER_EVIDENCE',str(ROOT/'refinements/visual-about-v13/targeted-regression'))).resolve()
SHOTS=EVIDENCE/'screenshots';SHOTS.mkdir(parents=True,exist_ok=True)


def revision():
    return hashlib.sha256('\n'.join(f'{p.relative_to(ROOT/"site").as_posix()}:{hashlib.sha256(p.read_bytes()).hexdigest()}'
                                  for p in sorted((ROOT/'site').rglob('*')) if p.is_file()).encode()).hexdigest()


def shot(page,name):
    visible_images(page)
    path=SHOTS/(name+'.png');page.screenshot(path=path,animations='disabled')
    return {'path':'screenshots/'+path.name,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),
            'scrollY':page.evaluate('scrollY'),'width':page.viewport_size['width'],'height':page.viewport_size['height']}


def save(name,rows,start):
    assert revision()==start,'Candidate changed during browser checks.'
    (EVIDENCE/(name+'.json')).write_text(json.dumps({'siteRevision':start,'siteRevisionAfter':revision(),'rows':rows},indent=2),'utf-8')


@pytest.mark.parametrize('width',[320,390,1440])
@pytest.mark.parametrize('variant,count',[('standard',13),('branded',3)])
def test_marketplace_rail_lightbox_keyboard_scroll_and_source(web,browser,width,variant,count):
    origin,_=web;start=revision();rows=[]
    for locale in ['uk','en']:
        context=browser.new_context(viewport={'width':width,'height':900},reduced_motion='reduce',has_touch=True)
        block_external(context,origin);page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
        route=('/en' if locale=='en' else '')+'/solutions/'+('review-card' if variant=='standard' else 'branded-review-card')
        page.goto(origin+route,wait_until='networkidle');ready(page)
        if variant=='standard':
            initial_requests=page.evaluate("performance.getEntriesByType('resource').map(r=>r.name)")
            # Only adjacent originals may preload; the two non-adjacent photos stay deferred.
            for i in [2,3]:
                assert page.locator(f'[data-slide="{i}"] img').evaluate('(img)=>img.src') not in initial_requests
        thumbs=page.locator('[data-thumb-to]');expect(thumbs).to_have_count(count)
        for i in range(count):
            thumb=thumbs.nth(i);expect(thumb).to_be_visible();thumb.click()
            expect(page.locator('[data-gallery-count]')).to_have_text(f'{i+1} / {count}')
            expect(thumb).to_have_attribute('aria-pressed','true')
            assert page.locator('[data-thumb-to][aria-pressed=true]').count()==1
            if not thumb.locator('img').get_attribute('src').endswith('.svg'):
                assert thumb.locator('img').evaluate('(img)=>img.naturalWidth')<=160
        # Arrow keys work from a thumbnail, and maintain the active marker and caption.
        thumbs.last.focus();page.keyboard.press('Home');expect(thumbs.first).to_have_attribute('aria-pressed','true')
        page.keyboard.press('End');expect(thumbs.last).to_have_attribute('aria-pressed','true')
        page.keyboard.press('ArrowRight');expect(thumbs.first).to_have_attribute('aria-pressed','true')
        thumbs.nth(1).click();caption=page.locator('[data-slide="1"]').get_attribute('data-caption')
        expect(page.locator('.gallery-caption')).to_have_text(caption)
        shots=[shot(page,f'{locale}-{variant}-thumb-selected-{width}')]
        opener=page.locator('[data-zoom]');opener.scroll_into_view_if_needed();opener.focus();before_y=page.evaluate('scrollY')
        opener.press('Enter');dialog=page.locator('.image-lightbox');expect(dialog).to_be_visible()
        assert page.evaluate("getComputedStyle(document.body).position")=='fixed'
        assert dialog.locator('.lightbox-scroll img').get_attribute('src')==page.locator('[data-slide="1"] img').evaluate('(img)=>img.src')
        dialog.locator('[data-lightbox-next]').click();expect(page.locator('[data-gallery-count]')).to_have_text(f'3 / {count}')
        dialog.locator('[data-lightbox-prev]').click();expect(dialog.locator('[data-lightbox-count]')).to_have_text(f'2 / {count}')
        assert dialog.locator('[data-lightbox-to],[data-lightbox-zoom]').count()==0
        dialog.locator('[data-lightbox-next]').focus();page.keyboard.press('End')
        expect(thumbs.last).to_have_attribute('aria-pressed','true')
        if width==320:
            surface=dialog.locator('.lightbox-scroll').bounding_box();session=context.new_cdp_session(page)
            x=surface['x']+surface['width']*.8;y=surface['y']+min(surface['height']/2,200)
            session.send('Input.dispatchTouchEvent',{'type':'touchStart','touchPoints':[{'x':x,'y':y}]})
            for offset in [30,65,100]:session.send('Input.dispatchTouchEvent',{'type':'touchMove','touchPoints':[{'x':x-offset,'y':y}]})
            session.send('Input.dispatchTouchEvent',{'type':'touchEnd','touchPoints':[]})
            expect(dialog.locator('[data-lightbox-count]')).to_have_text(f'1 / {count}')
        for key in ['Tab']*12+['Shift+Tab']*12:
            page.keyboard.press(key)
            assert page.evaluate("document.querySelector('.image-lightbox').contains(document.activeElement)")
        close=dialog.locator('[data-lightbox-close]').bounding_box()
        assert close and close['x']>=0 and close['y']>=0 and close['x']+close['width']<=width
        assert close['width']>=44 and close['height']>=44
        zoom_pan=None
        if width==320:
            scroll=dialog.locator('.lightbox-scroll');surface=scroll.bounding_box()
            assert scroll.evaluate('(e)=>getComputedStyle(e).touchAction')=='none'
            selected=dialog.locator('[data-lightbox-count]').inner_text()
            x=surface['x']+surface['width']/2;y=surface['y']+surface['height']/2
            def touch(kind,points):
                session.send('Input.dispatchTouchEvent',{'type':kind,'touchPoints':[
                    {'x':px,'y':py,'id':n,'radiusX':4,'radiusY':4,'force':1}
                    for n,(px,py) in enumerate(points)]})
            touch('touchStart',[(x-40,y),(x+40,y)])
            for step in range(1,6):touch('touchMove',[(x-40-step*14,y),(x+40+step*14,y)])
            expect(dialog).to_have_attribute('data-zoomed','true')
            assert float(scroll.locator('img').evaluate("e=>e.style.getPropertyValue('--zoom-scale')"))>1.5
            touch('touchEnd',[])
            touch('touchStart',[(x,y)])
            for step in range(1,5):touch('touchMove',[(x-step*18,y+step*9)])
            zoom_pan=scroll.locator('img').evaluate("e=>e.style.getPropertyValue('--pan-x')")
            assert zoom_pan!='0px'
            touch('touchEnd',[])
            expect(dialog.locator('[data-lightbox-count]')).to_have_text(selected)
            shots.append(shot(page,f'{locale}-{variant}-lightbox-zoom-touch-pan-{width}'))
            touch('touchStart',[(x-105,y),(x+105,y)])
            for step in range(1,6):touch('touchMove',[(x-105+step*16,y),(x+105-step*16,y)])
            touch('touchEnd',[])
            expect(dialog).to_have_attribute('data-zoomed','false')
        else:
            dialog.locator('.lightbox-scroll').dblclick();expect(dialog).to_have_attribute('data-zoomed','true')
            dialog.locator('.lightbox-scroll').dblclick();expect(dialog).to_have_attribute('data-zoomed','false')
        shots.append(shot(page,f'{locale}-{variant}-lightbox-{width}'))
        page.keyboard.press('Escape');expect(dialog).not_to_be_visible();expect(opener).to_be_focused()
        assert abs(page.evaluate('scrollY')-before_y)<=1
        # A second open/close proves no stale body lock or opener survives the modal.
        opener.press('Enter');dialog.locator('[data-lightbox-close]').click();expect(opener).to_be_focused()
        assert page.evaluate("getComputedStyle(document.body).position")!='fixed'
        assert abs(page.evaluate('scrollY')-before_y)<=1
        assert geometry(page)['scrollWidth']<=width and not errors
        rows.append({'route':route,'width':width,'allThumbnails':count,'keyboardRail':'Home/End/ArrowRight',
                     'modal':'original image, arrows, pinch/pan, bidirectional Tab containment, Escape, repeat close',
                     'scrollRestored':True,'zoomedTouchPanX':zoom_pan,'pageErrors':errors,'screenshots':shots})
        context.close()
    save(f'gallery-{variant}-{width}',rows,start)


@pytest.mark.parametrize('width',[320,390,1024])
def test_compact_messenger_keyboard_error_and_footer_boundaries(web,browser,width):
    origin,_=web;start=revision();rows=[]
    for locale in ['uk','en']:
        context=browser.new_context(viewport={'width':width,'height':844},reduced_motion='reduce');block_external(context,origin);page=context.new_page()
        prefix='/en' if locale=='en' else '';page.goto(origin+prefix+'/order',wait_until='networkidle');ready(page)
        form=page.locator('[data-commerce-form]');group=form.locator('.messenger-options');group.scroll_into_view_if_needed();labels=group.locator('label');boxes=[x.bounding_box() for x in labels.all()]
        assert len(boxes)==3 and all(b and 44<=b['height']<=56 for b in boxes)
        assert max(b['y'] for b in boxes)-min(b['y'] for b in boxes)<=1
        screenshots=[shot(page,f'{locale}-messenger-default-{width}')]
        form.locator('.submit-button').click();expect(page.locator('#e-messenger')).to_be_visible()
        group.scroll_into_view_if_needed();screenshots.append(shot(page,f'{locale}-messenger-error-{width}'))
        first=page.locator('#f-messenger-telegram');first.focus();first.press('Space');expect(first).to_be_checked()
        expect(page.locator('#e-messenger')).not_to_be_visible()
        assert first.get_attribute('aria-invalid') is None
        expect(page.locator('#e-name')).to_be_visible();expect(page.locator('#e-phone')).to_be_visible()
        page.keyboard.press('ArrowRight');expect(page.locator('#f-messenger-whatsapp')).to_be_checked()
        page.keyboard.press('ArrowRight');expect(page.locator('#f-messenger-viber')).to_be_checked()
        assert form.locator('[name=messenger]:checked').count()==1
        assert form.locator('.messenger-option').last.locator('.selection-check').evaluate('(e)=>getComputedStyle(e).visibility')=='visible'
        screenshots.append(shot(page,f'{locale}-messenger-keyboard-selected-{width}'))
        page.goto(origin+prefix,wait_until='networkidle');ready(page);page.evaluate('scrollTo(0,document.documentElement.scrollHeight)')
        footer=page.locator('footer').bounding_box();cta=page.locator('main>.final-conversion').bounding_box()
        assert footer and cta and abs(footer['y']-(cta['y']+cta['height']))<=1
        # Two additional niche destinations retain 44px touch targets at 320px.
        assert page.locator('footer a[href$="/solutions/beauty-review-card"]').count()==1
        assert page.locator('footer a[href$="/solutions/restaurant-review-card"]').count()==1
        assert footer['height']<550 and geometry(page)['scrollWidth']<=width
        screenshots.append(shot(page,f'{locale}-final-cta-footer-{width}'))
        # The custom quote row remains sized by its content at all three widths.
        assist=page.locator('.catalog-assist');assist.scroll_into_view_if_needed();box=assist.bounding_box()
        assert box and box['height']<300
        for child in assist.locator('a,p').all():
            bounds=child.bounding_box();assert bounds and bounds['x']>=box['x']-1 and bounds['x']+bounds['width']<=box['x']+box['width']+1
        page.evaluate("sessionStorage.removeItem('qa-click-events');window.addEventListener('nfc:analytics',e=>{const a=JSON.parse(sessionStorage.getItem('qa-click-events')||'[]');a.push(e.detail);sessionStorage.setItem('qa-click-events',JSON.stringify(a));})")
        page.locator('main>.final-conversion .button').click();page.wait_for_url(lambda u:urlsplit(u).path==prefix+'/solutions');ready(page)
        events=page.evaluate("JSON.parse(sessionStorage.getItem('qa-click-events')||'[]')")
        assert len([e for e in events if e['event']=='catalog_view'])>=1
        rows.append({'locale':locale,'width':width,'messengerHeights':[b['height'] for b in boxes],
                     'radioKeyboard':'Space + ArrowRight; exactly one selected; visible check','footerHeight':footer['height'],
                     'customQuoteHeight':box['height'],'homeFinalCtaCatalogViewCount':len([e for e in events if e['event']=='catalog_view']),'screenshots':screenshots});context.close()
    save(f'controls-footer-{width}',rows,start)


@pytest.mark.parametrize('locale',['uk','en'])
def test_about_responsive_media_route_top_and_safe_hash_navigation(web,browser,locale):
    origin,_=web;start=revision();rows=[];prefix='/en' if locale=='en' else ''
    context=browser.new_context(viewport={'width':390,'height':844},reduced_motion='reduce');block_external(context,origin);page=context.new_page()
    page_errors=[];console_errors=[];page.on('pageerror',lambda error:page_errors.append(str(error)))
    page.on('console',lambda msg:console_errors.append(msg.text) if msg.type=='error' else None)
    for width in [390,1440]:
        page.set_viewport_size({'width':width,'height':844});page.goto(origin+prefix,wait_until='networkidle');ready(page)
        page.locator('#about a[href="'+prefix+'/about"]').click();page.wait_for_url('**'+prefix+'/about');ready(page)
        assert page.evaluate('scrollY')<=1
        assert not page_errors and not console_errors
        assert page.evaluate('Array.isArray(window.nfcAnalyticsEvents)')
        page.locator('.about-story-link[href="#about-founder-story"]').click();expect(page.locator('#about-founder-story')).to_be_in_viewport()
        header=page.locator('header').bounding_box();story=page.locator('#about-founder-story').bounding_box()
        assert story['y']>=header['y']+header['height']-1
        sources=[]
        for figure in page.locator('[data-founder-photo]').all():
            figure.scroll_into_view_if_needed();img=figure.locator('img');expect(img).to_be_visible()
            page.wait_for_function('(img)=>img.complete&&img.naturalWidth>0',arg=img.element_handle())
            current=img.evaluate('(e)=>({src:e.currentSrc,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height,objectFit:getComputedStyle(e).objectFit})')
            assert ('-mobile.' if width<768 else '-desktop.') in current['src']
            assert current['src'].startswith(origin+'/assets/media/founder/')
            if figure.get_attribute('data-founder-photo')=='urban':assert current['width']<=300 and current['objectFit']=='contain'
            sources.append({'role':figure.get_attribute('data-founder-photo'),**current})
        assert len(sources)==7 and geometry(page)['scrollWidth']<=width
        page.evaluate("sessionStorage.removeItem('qa-click-events');window.addEventListener('nfc:analytics',e=>{const a=JSON.parse(sessionStorage.getItem('qa-click-events')||'[]');a.push(e.detail);sessionStorage.setItem('qa-click-events',JSON.stringify(a));})")
        page.locator('.about-page>.final-conversion .button').click();page.wait_for_url(lambda u:urlsplit(u).path==prefix+'/solutions');ready(page)
        events=page.evaluate("JSON.parse(sessionStorage.getItem('qa-click-events')||'[]')")
        assert not any(e['event']=='order_start' for e in events)
        assert not page_errors and not console_errors
        rows.append({'route':prefix+'/about','width':width,'routeTop':True,'hashClearsHeader':True,'pageErrors':list(page_errors),'consoleErrors':list(console_errors),'aboutCatalogClickOrderStartCount':0,'media':sources})
    context.close();save(f'about-navigation-media-{locale}',rows,start)


@pytest.mark.parametrize('route',['/','/solutions'],ids=['home','catalog'])
@pytest.mark.parametrize('locale',['uk','en'])
def test_catalog_reserves_delayed_media_before_first_paint(web,browser,locale,route):
    origin,_=web;start=revision();prefix='/en' if locale=='en' else ''
    path=prefix+('' if route=='/' and prefix else route)
    context=browser.new_context(viewport={'width':390,'height':900},reduced_motion='reduce')
    delayed=[];blocked=[];released=False;errors=[]
    def network_boundary(request):
        if not request.request.url.startswith(origin+'/'):
            blocked.append(request.request.url);return request.abort()
        if 'review-card-front' in request.request.url and not released:
            delayed.append(request);return
        request.continue_()
    context.route('**/*',network_boundary)
    context.add_init_script('''window.nfcDelayedMedia={entries:[],sessionCLS:0};let session=0,start=0,last=0;
      new PerformanceObserver(list=>{for(const e of list.getEntries()){
        nfcDelayedMedia.entries.push({value:e.value,startTime:e.startTime,hadRecentInput:e.hadRecentInput,
          sources:e.sources.map(s=>({tag:s.node?.tagName,className:s.node?.className,
            previousRect:s.previousRect.toJSON(),currentRect:s.currentRect.toJSON()}))});
        if(e.hadRecentInput)continue;
        if(last&&e.startTime-last<1000&&e.startTime-start<5000)session+=e.value;else{session=e.value;start=e.startTime}
        last=e.startTime;nfcDelayedMedia.sessionCLS=Math.max(nfcDelayedMedia.sessionCLS,session);
      }}).observe({type:'layout-shift',buffered:true});''')
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    try:
        response=page.goto(origin+path,wait_until='domcontentloaded');assert response.status==200
        page.evaluate('document.fonts.ready')
        # Poll through direct evaluation: wait_for_function's expression eval can
        # conflict with the application's intentionally strict script CSP.
        first_paint=None
        for _ in range(100):
            first_paint=page.evaluate("()=>performance.getEntriesByName('first-contentful-paint')[0]?.startTime")
            if first_paint is not None:break
            page.wait_for_timeout(50)
        assert first_paint is not None,'The delayed image must remain blocked through a real first contentful paint.'
        image=page.locator('.commerce-card[data-variant=standard] .catalog-product-image')
        copy=page.locator('.commerce-card[data-variant=standard] .commerce-card-copy')
        page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
        frame=page.locator('.commerce-card[data-variant=standard] .catalog-card-media')
        before={'image':image.bounding_box(),'frame':frame.bounding_box(),'copy':copy.bounding_box()}
        assert delayed,'The image must actually be held by the local network boundary.'
        assert image.evaluate('(e)=>!e.complete&&e.naturalWidth===0')
        assert before['image'] and before['copy']
        # The photo strip occupies its own row, while the unloaded image and
        # the complete media frame reserve their final positions.
        assert before['image']['height']>200 and before['frame']['height']>300
        assert abs(before['copy']['y']-(before['frame']['y']+before['frame']['height']))<=1
        name=f'{locale}-{("home" if route=="/" else "catalog")}-delayed-media-390'
        # Do not use shot(): its image.decode() wait must not release this deliberate delay.
        before_path=SHOTS/(name+'-reserved-before-load.png')
        page.screenshot(path=before_path,animations='disabled')
        screenshots=[{'path':'screenshots/'+before_path.name,'sha256':hashlib.sha256(before_path.read_bytes()).hexdigest(),
                      'scrollY':page.evaluate('scrollY'),'width':390,'height':900}]
        release_time=page.evaluate('performance.now()');assert release_time>first_paint
        released=True
        for request in delayed:request.continue_()
        image.evaluate('(e)=>e.decode()')
        assert image.evaluate('(e)=>e.complete&&e.naturalWidth>0')
        page.evaluate('()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))')
        page.wait_for_timeout(100)
        after={'image':image.bounding_box(),'frame':frame.bounding_box(),'copy':copy.bounding_box()}
        for target in ['image','frame','copy']:
            for coordinate in ['x','y','width','height']:
                assert abs(after[target][coordinate]-before[target][coordinate])<=1,(target,coordinate,before,after)
        performance=page.evaluate('window.nfcDelayedMedia')
        assert performance['sessionCLS']<=.1,performance
        assert not errors and not blocked
        screenshots.append(shot(page,name+'-loaded'))
        save(f'delayed-media-{locale}-{("home" if route=="/" else "catalog")}',
             [{'route':path,'width':390,'firstContentfulPaint':first_paint,'mediaReleaseTime':release_time,
               'heldLocalRequests':len(delayed),'externalRequestsBlocked':blocked,'before':before,'after':after,
               'performance':performance,'pageErrors':errors,'screenshots':screenshots}],start)
    finally:
        context.close()
