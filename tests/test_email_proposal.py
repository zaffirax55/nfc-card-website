"""Public email route tests; every gateway request is intercepted locally."""
import json
import threading
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import subprocess

from playwright.sync_api import sync_playwright
from test_pages_v17 import source, build

ROOT=Path(__file__).resolve().parents[1]
BASE='/nfc-card-website'
ENDPOINT='https://bridge.nfc-card-fixture.com/v1/public/leads/nfc-card'


def test_email_request_payload_requires_explicit_scope_and_keeps_messenger():
    script=r"""
import assert from 'node:assert/strict';
import {leadPayload} from './src/pages.mjs';
const common={locale:'uk',name:'Synthetic fixture',phone:'',variant:'branded',quantity:'1',messenger:'email',consent:true,website:'',proposalEmail:'Exact.Case+offer@example.com',proposalBusiness:'Synthetic dental',proposalNiche:'dental_orthodontics',proposalRequested:true};
const context={basePath:'/nfc-card-website',pathname:'/nfc-card-website/solutions/branded-review-card'};
const lead=leadPayload(common,context);
assert.equal(lead.contact.email,common.proposalEmail);assert.equal(lead.contact.phone,undefined);
assert.equal(lead.emailProposal.intent,'commercial_offer_by_email');assert.equal(lead.formVersion,'NFC-CARD-FORM-V36');
for(const patch of [{proposalRequested:false},{proposalEmail:'invalid'},{proposalBusiness:''},{proposalNiche:'unknown'},{consent:false},{variant:'standard'}])assert.throws(()=>leadPayload({...common,...patch},context));
const old=leadPayload({...common,messenger:'viber',phone:'+380671234567'},context);
assert.equal(old.contact.preferredMethod,'viber');assert.equal(old.emailProposal,undefined);assert.equal(old.contact.email,undefined);assert.equal(old.formVersion,'NFC-CARD-FORM-V34');
"""
    subprocess.run(['node','--input-type=module','-e',script],cwd=ROOT,check=True,capture_output=True,text=True)


def test_real_pages_form_browser_email_messenger_retry_and_no_personal_storage(source,tmp_path):
    site=build(source,NFC_PUBLICATION_MODE='PUBLIC',NFC_LEAD_ENDPOINT=ENDPOINT)
    root=tmp_path/'http';root.mkdir();(root/'nfc-card-website').symlink_to(site,target_is_directory=True)
    class Quiet(SimpleHTTPRequestHandler):
        def log_message(self,*args):pass
    server=ThreadingHTTPServer(('127.0.0.1',0),partial(Quiet,directory=root))
    thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
    try:
        with sync_playwright() as playwright:
            browser=playwright.chromium.launch(headless=True)
            page=browser.new_page(viewport={'width':390,'height':844})
            requests=[]
            def gateway(route):
                if '/challenge?' in route.request.url:
                    route.fulfill(status=200,content_type='application/json',body=json.dumps({'challenge':'a.'+'b'*43,'minimumDelayMs':2000}))
                else:
                    requests.append({'body':route.request.post_data_json,'key':route.request.headers['idempotency-key']})
                    if len(requests)==1:route.fulfill(status=503,content_type='application/json',body='{}')
                    else:route.fulfill(status=202,content_type='application/json',body=json.dumps({'ok':True,'source':'NFC_CARD','durableSaved':True,'leadId':'11111111-1111-4111-8111-111111111111'}))
            page.route('https://bridge.nfc-card-fixture.com/**',gateway)
            url=f'http://127.0.0.1:{server.server_port}{BASE}/solutions/branded-review-card/'
            page.goto(url);page.wait_for_selector('form[data-enhanced=true]')
            form=page.locator('[data-commerce-form]')
            assert form.locator('[name=messenger][value=telegram]').count()==1
            form.locator('[name=messenger][value=email]').check()
            assert form.locator('[data-email-proposal]').is_visible()
            assert not form.locator('[name=phone]').get_attribute('required')
            form.locator('[name=name]').fill('Synthetic Browser Fixture')
            form.locator('[name=proposalEmail]').fill('request+fixture@example.com')
            form.locator('[name=proposalBusiness]').fill('Synthetic Dental Fixture')
            form.locator('[name=proposalNiche]').select_option('dental_orthodontics')
            form.locator('[name=proposalRequested]').check();form.locator('[name=consent]').check()
            form.locator('[type=submit]').click()
            page.wait_for_function("document.querySelector('.form-result')?.dataset.status==='error'")
            form.locator('[type=submit]').click()
            page.wait_for_function("document.querySelector('.form-result')?.dataset.status==='success'")
            assert len(requests)==2
            assert requests[0]['key']==requests[1]['key']
            # Challenge renews; immutable intent and recipient do not.
            assert requests[0]['body']==requests[1]['body']
            assert requests[1]['body']['contact']['email']=='request+fixture@example.com'
            assert 'ще не підтвердження' in form.locator('.form-result').inner_text()
            assert not page.evaluate("JSON.stringify(sessionStorage)").find('request+fixture')>=0
            assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
            page.reload();page.wait_for_selector('form[data-enhanced=true]')
            assert 'месенджері' not in page.locator('.form-result').inner_text()
            browser.close()
    finally:server.shutdown();server.server_close();thread.join()
