"""Bounded Pages builds and public form boundary; no live requests or backend writes."""
import hashlib
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from urllib.parse import urlsplit

from bs4 import BeautifulSoup
import pytest

ROOT = Path(__file__).resolve().parents[1]
BASE = '/nfc-card-website'
ORIGIN = 'https://optidigitalagent.github.io'
# Syntactically public test fixture only: every transport call is stubbed.
ENDPOINT = 'https://bridge.nfc-card-fixture.com/api/nfc-card/leads'
NODE = shutil.which('node')


@pytest.fixture
def source(tmp_path):
    shutil.copytree(ROOT / 'src', tmp_path / 'src')
    dest = tmp_path / 'refinements/instagram-v18'
    dest.mkdir(parents=True)
    shutil.copyfile(ROOT / 'refinements/instagram-v18/routes.json', dest / 'routes.json')
    # Content-bound PUBLIC authorization exists only inside this disposable fixture.
    from server.publication import content_hash
    approval = tmp_path / 'src/publication-approval.json'
    data = json.loads(approval.read_text())
    data['publicLaunch']['reviewedContentSha256'] = content_hash(tmp_path)
    data['publicLaunch']['approvalReference'] = 'isolated mocked PUBLIC test; not release approval'
    approval.write_text(json.dumps(data))
    return tmp_path


def build(source, pages=True, **values):
    env = {k: v for k, v in os.environ.items() if not k.startswith('NFC_')}
    env.update(NFC_ENV='production', NFC_PUBLIC_ORIGIN=ORIGIN)
    if pages:
        env.update(NFC_DEPLOYMENT_TARGET='github-pages', NFC_PUBLIC_BASE_PATH=BASE)
    env.update(values)
    result = subprocess.run([NODE, 'src/build.mjs'], cwd=source, env=env, capture_output=True, text=True)
    assert result.returncode == 0, result.stderr
    return source / 'site'


def node(script):
    module = (ROOT / 'src/pages.mjs').as_uri()
    result = subprocess.run([NODE, '--input-type=module'], input=f"import * as pages from {json.dumps(module)};\n"
                            + "import assert from 'node:assert/strict';\n" + script,
                            text=True, capture_output=True, cwd=ROOT)
    assert result.returncode == 0, result.stderr


def strings(value):
    if isinstance(value, str):
        yield value
    elif isinstance(value, list):
        for item in value:
            yield from strings(item)
    elif isinstance(value, dict):
        for item in value.values():
            yield from strings(item)


def assert_project_url(value, site, base=BASE):
    parsed = urlsplit(value)
    if parsed.scheme or parsed.netloc:
        if f'{parsed.scheme}://{parsed.netloc}' != ORIGIN:
            return
    elif not value.startswith('/'):
        return
    assert parsed.path == base or parsed.path.startswith(base + '/'), value
    relative = parsed.path[len(base):].lstrip('/')
    target = site / relative
    assert target.is_file() or (target / 'index.html').is_file(), value


@pytest.mark.parametrize('base', [BASE, BASE + '/', '', '/'])
def test_all_static_urls_metadata_css_and_content_use_base_path(source, base):
    site = build(source, NFC_PUBLIC_BASE_PATH=base)
    normalized = base.rstrip('/')
    for file in site.rglob('*.html'):
        soup = BeautifulSoup(file.read_text(), 'html.parser')
        assert soup.select_one('meta[name=robots]')['content'] == 'noindex,nofollow'
        for el in soup.select('[href],[src],[poster],[data-source],[srcset]'):
            for attr in ('href', 'src', 'poster', 'data-source'):
                if el.get(attr):
                    assert_project_url(el[attr], site, normalized)
            for item in el.get('srcset', '').split(','):
                if item.strip():
                    assert_project_url(item.strip().split()[0], site, normalized)
        og = soup.select_one('meta[property="og:url"]')
        if og:
            assert_project_url(og['content'], site, normalized)
        for script in soup.select('script[type="application/ld+json"]'):
            for value in strings(json.loads(script.string)):
                assert_project_url(value, site, normalized)
        assert 'localhost' not in str(soup) and '127.0.0.1' not in str(soup)
    for url in re.findall(r'url\([\'"]?([^\)\'"\s]+)', (site / 'assets/style.css').read_text()):
        assert_project_url(url, site, normalized)
    for value in strings(json.loads((site / 'assets/content.json').read_text())):
        assert_project_url(value, site, normalized)
    sitemap = BeautifulSoup((site / 'sitemap.xml').read_text(), 'xml')
    assert len(sitemap.select('loc')) == 48
    for loc in sitemap.select('loc'):
        assert_project_url(loc.text, site, normalized)
    assert (site / '.nojekyll').exists()
    assert not (source / 'server').exists()


def test_pages_cleans_server_artifacts_and_default_build_remains_fullstack(source):
    site = build(source, pages=False)
    baseline = {p.relative_to(site): p.read_bytes() for p in site.rglob('*') if p.is_file()}
    server = {p.relative_to(source): p.read_bytes() for p in (source / 'server').rglob('*') if p.is_file()}
    assert len(list(site.rglob('*.html'))) == 66
    admin = site / 'admin/reviews/index.html'
    admin.parent.mkdir(parents=True)
    admin.write_text('stale admin')
    build(source)
    assert not (site / 'admin').exists()
    assert not any((site / prefix / 'reviews/new').exists() for prefix in ('', 'en', 'pl'))
    assert not (site / '_redirects').exists()
    for filename in ['reviews.js', 'reviews-renderer.js', 'admin-reviews.js', 'reviews.css']:
        assert not (site / 'assets' / filename).exists()
    assert server == {p.relative_to(source): p.read_bytes() for p in (source / 'server').rglob('*') if p.is_file()}
    for file in site.rglob('*.html'):
        soup = BeautifulSoup(file.read_text(), 'html.parser')
        assert not soup.select('a[href*="/reviews/new"],a[href*="/admin"],script[src*="reviews"]')
    for file in ['app.js', 'commerce.js']:
        text = (site / 'assets' / file).read_text()
        assert '/api/leads' not in text and 'NFC_FULLSTACK_START' not in text
        result = subprocess.run([NODE, '--check', str(site / 'assets' / file)], capture_output=True, text=True)
        assert result.returncode == 0, result.stderr
    # Switching back cannot inherit a static 404, redirected pages or Pages client.
    build(source, pages=False)
    restored = {p.relative_to(site): p.read_bytes() for p in site.rglob('*') if p.is_file()}
    assert restored == baseline
    soup = BeautifulSoup((site / 'order/index.html').read_text(), 'html.parser')
    assert soup.form['action'] == '/api/leads' and soup.form['method'] == 'post'
    assert 'disabled' not in soup.select_one('[type=submit]').attrs


@pytest.mark.parametrize('endpoint', ['', ENDPOINT])
def test_forms_are_inert_before_client_and_expose_only_public_config(source, endpoint):
    secret = 'synthetic-must-never-be-in-public-artifact'
    site = build(source, NFC_LEAD_ENDPOINT=endpoint, LEAD_GATEWAY_SECRET=secret,
                 LEAD_SOURCE_NFC_CARD_SECRET=secret, TELEGRAM_BOT_TOKEN=secret)
    forms = 0
    for file in site.rglob('*.html'):
        soup = BeautifulSoup(file.read_text(), 'html.parser')
        for form in soup.select('.lead-form'):
            forms += 1
            assert form['method'] == 'dialog' and form['action'] == ''
            menu = form.has_attr('data-menu-form')
            review3d = form.has_attr('data-review3d-form')
            assert menu or review3d or form.has_attr('data-pages-form')
            assert form.select_one('[type=submit]').has_attr('disabled')
            assert soup.html['data-lead-endpoint'] == ''
            assert soup.html['data-publication-mode'] == 'PUBLIC_PREVIEW'
            assert soup.select_one('.header .preview-badge').text == 'PUBLIC PREVIEW'
            assert soup.html['data-public-base-path'] == BASE
            notice = form.select_one('.review3d-notice' if review3d else '.preview-notice')
            assert notice['role'] == 'status'
            expected_notice = {
                'uk': 'Онлайн-заявки тимчасово недоступні у preview-версії. Функцію буде активовано після підключення захищеного збереження заявок.',
                'en': 'Online enquiries are temporarily unavailable in the preview version. The feature will be enabled after secure lead storage is connected.',
                'pl': 'W wersji podglądowej nie można obecnie wysyłać zgłoszeń. Funkcja zostanie uruchomiona po podłączeniu bezpiecznego zapisu zgłoszeń.',
            }[soup.html['lang']]
            if menu:
                assert notice.text == {
                    'uk': 'Локальний перегляд: повідомлення не надсилаються.',
                    'en': 'Local preview: no messages are sent.',
                    'pl': 'Podgląd lokalny: wiadomości nie są wysyłane.',
                }[soup.html['lang']]
            else:
                assert notice.text == expected_notice
            if endpoint:
                assert endpoint not in str(soup)
            assert form.select_one('[name=name]') and form.select_one('[name=phone]')
            if menu:
                assert form.select_one('[name=menu-quantity]') and form.select_one('[name=menu-variant]')
            elif review3d:
                assert form.select_one('[name=quantity]') and not form.select_one('[name=variant]')
            else:
                assert form.select_one('[name=quantity]') and form.select_one('[name=variant]')
                assert_project_url(form.select_one('[name=source]')['value'], site)
    assert forms == 39
    for file in site.rglob('*'):
        if file.is_file():
            assert secret.encode() not in file.read_bytes()


def test_built_clients_fetch_and_navigate_under_project_path(source):
    site = build(source)
    scripts = {name: (site / 'assets' / name).read_text() for name in ['localization-client.js', 'app.js', 'commerce.js']}
    content = json.loads((site / 'assets/content.json').read_text())
    node('const scripts=' + json.dumps(scripts) + ';\nconst content=' + json.dumps(content) + ';\n' + r"""
      const {default:vm}=await import('node:vm');
      for(const name of ['app.js','commerce.js']){
        const fetched=[],historyChanges=[],links=[
          {href:'https://optidigitalagent.github.io/nfc-card-website/en/solutions/review-card/'},
          {href:'https://optidigitalagent.github.io/nfc-card-website/en/order/'}];
        const localeLink={href:'https://optidigitalagent.github.io/nfc-card-website/en/solutions/review-card',
          addEventListener(kind,fn){this[kind]=fn;}};
        const doc={documentElement:{lang:'uk',dataset:{publicBasePath:'/nfc-card-website',deploymentTarget:'github-pages',publicationMode:'PUBLIC_PREVIEW'}},
          body:{dataset:{route:'/solutions/review-card'}},referrer:'',getElementById:()=>null,
          querySelector:selector=>name==='commerce.js'&&selector==='[data-product]'?{dataset:{product:'standard'}}:null,
          querySelectorAll:selector=>selector==='.locale-switch'?[localeLink]:selector==='a[href]'?links:[],addEventListener(){}};
        const location={origin:'https://optidigitalagent.github.io',pathname:'/nfc-card-website/solutions/review-card/',
          search:'?quantity=2&utm_source=fixture',hash:'#request',href:'https://optidigitalagent.github.io/nfc-card-website/solutions/review-card/?quantity=2&utm_source=fixture#request'};
        const state={document:doc,location,history:{replaceState:(a,b,url)=>historyChanges.push(url)},
          sessionStorage:{getItem:()=>null,setItem(){},removeItem(){}},URL,URLSearchParams,Intl,Set,Map,
          CustomEvent:class{},window:{addEventListener(){},dispatchEvent(){}},fetch:async url=>{fetched.push(url);return {ok:true,json:async()=>content};}};
        state.contract=await import(new URL('../src/commerce-contract.mjs',new URL('./tests/test_pages_v17.py', 'file://'+process.cwd()+'/').href));
        vm.runInNewContext(scripts['localization-client.js'],state);
        vm.runInNewContext(scripts[name].replace("await import(basePath+'/assets/commerce-contract.mjs')",'contract'),state);
        await new Promise(resolve=>setImmediate(resolve));
        assert.deepEqual(fetched,['/nfc-card-website/assets/content.json']);
        assert.equal(state.window.nfcAnalyticsEvents?.length||0,0);
        localeLink.click();assert.ok(new URL(localeLink.href,location.origin).pathname.startsWith('/nfc-card-website/'));
        assert.equal(new URL(localeLink.href,location.origin).searchParams.get('quantity'),'2');
        if(name==='commerce.js'){
          for(const link of links){assert.ok(link.href.startsWith('/nfc-card-website/'));assert.equal(new URL(link.href,location.origin).searchParams.get('utm_source'),'fixture');}
          assert.equal(new URL(links[1].href,location.origin).searchParams.get('source'),location.pathname);
          assert.ok(historyChanges.every(url=>url.startsWith('/nfc-card-website/')));
        }
      }
    """)


def test_base_origin_target_and_endpoint_validation():
    node(r"""
      for (const value of ['nfc-card-website', '//other', '/a//b', '/a/../b', '/a/./b', '/a?x', '/a#b', '/%2e', '/a\\b', '/a b'])
        assert.throws(() => pages.publicBasePath(value));
      assert.equal(pages.publicBasePath('/nfc-card-website/'), '/nfc-card-website');
      assert.equal(pages.publicURL('/en/order?quantity=2#request', {basePath:'/nfc-card-website'}), '/nfc-card-website/en/order?quantity=2#request');
      assert.equal(pages.publicURL('/nfc-card-website/en', {basePath:'/nfc-card-website'}), '/nfc-card-website/en');
      assert.equal(pages.publicURL('https://elsewhere.com/p', {basePath:'/nfc-card-website'}), 'https://elsewhere.com/p');
      for (const value of ['/api/leads','http://bridge.company.com/leads','https://127.0.0.1/leads','https://[::1]/leads',
        'https://localhost/leads','https://service.internal/leads','https://service.railway.internal/leads','https://private.local/leads',
        'https://user:password@bridge.company.com/leads','https://bridge.company.com/leads?secret=x','https://bridge.company.com/leads#x',
        'https://bridge.company.com/leads?','https://bridge.company.com/leads#','https://bridge.company.com/',
        'https://bridge.company.com:444/leads','https://bridge.company.com/a/../leads','https://bridge.company.com/a//leads',
        'https://bridge.company.com/%2e/leads','https://bridge.company.com./leads','https://api.telegram.org/bot123/sendMessage',
        'https://bridge.company.com/leads\n','https://bridge.company.com/\\evil']) assert.throws(() => pages.leadEndpoint(value), value);
      assert.equal(pages.leadEndpoint(''), '');
      assert.equal(pages.leadEndpoint('https://bridge.company.com/api/nfc-card/leads'), 'https://bridge.company.com/api/nfc-card/leads');
    """)
    module = (ROOT / 'src/publication.mjs').as_uri()
    node(f"""
      const {{resolvePublication, robotsFile}} = await import({json.dumps(module)});
      const config={{origin:'http://127.0.0.1:8765'}};
      for(const env of [{{NFC_DEPLOYMENT_TARGET:'unknown'}}, {{NFC_DEPLOYMENT_TARGET:'github-pages'}},
        {{NFC_DEPLOYMENT_TARGET:'github-pages',NFC_PUBLIC_ORIGIN:'https://optidigitalagent.github.io/nfc-card-website'}}])
        assert.throws(()=>resolvePublication({{env,config,flags:{{}},approval:{{}}}}));
      const robots=robotsFile({{mode:'PUBLIC_INDEXABLE',origin:'{ORIGIN}',basePath:'{BASE}'}});
      assert.ok(robots.includes('Disallow: {BASE}/admin\\n'));
      assert.ok(robots.includes('Sitemap: {ORIGIN}{BASE}/sitemap.xml\\n'));
    """)


PAYLOAD_FIXTURE = r"""
const fields={locale:'uk',variant:'branded',quantity:'2',name:'  Test Customer  ',phone:'+380 (98) 000-00-00',messenger:'telegram',consent:true};
const context={basePath:'/nfc-card-website',pathname:'/nfc-card-website/order/?source=spoof#request',utm:{utm_source:'test',utm_campaign:'x'.repeat(400),referrer:'private',arbitrary:'ignored'}};
"""


def test_minimal_payload_allowlists_source_normalization_and_utm_limits():
    node(PAYLOAD_FIXTURE + r"""
      const payload=pages.leadPayload({...fields,source:'IADDS',lead_id:'fake',timestamp:'fake',displayed_price:'1',comment:'private'},context);
      assert.deepEqual(Object.keys(payload), ['language','product','quantity','customerName','contact','sourcePage','formVersion','privacyNoticeVersion','consent','selection','utm']);
      assert.equal(payload.formVersion,'NFC-CARD-FORM-V34');
      assert.equal(payload.privacyNoticeVersion,'NFC-CARD-PRIVACY-V34');
      assert.equal(payload.consent,true);
      assert.equal(payload.customerName,'Test Customer'); assert.equal(payload.quantity,2);
      assert.deepEqual(payload.contact,{phone:'+380980000000',preferredMethod:'telegram'});
      assert.equal(payload.sourcePage,'/nfc-card-website/order');
      assert.deepEqual(Object.keys(payload.utm),['source','campaign']); assert.equal(payload.utm.campaign.length,100);
      for(const changed of [{locale:'ru'},{variant:'invented'},{quantity:'0'},{quantity:'3'},{quantity:'1.5'},{quantity:'-1'},
        {variant:'bulk',quantity:'2'},{name:''},{name:'x'.repeat(121)},{phone:''},{phone:'abc1234567'},{phone:'1'.repeat(16)},
        {messenger:'email'},{consent:false},{website:'bot'}]) assert.throws(()=>pages.leadPayload({...fields,...changed},context));
      for(const pathname of ['/order','//evil.com','/nfc-card-website-evil/order','/nfc-card-website/../order','/nfc-card-website/%2fsecret'])
        assert.throws(()=>pages.leadPayload(fields,{...context,pathname}));
      const custom=pages.leadPayload({...fields,variant:'bulk',quantity:'more'},context); assert.equal(custom.quantity,3);assert.deepEqual(custom.selection,{variant:'bulk',quantity:'more'});
      assert.equal(pages.leadPayload({...fields,locale:'en'},{...context,pathname:'/nfc-card-website/en/contact'}).language,'en');
    """)


def test_transport_requires_durable_ack_and_never_falls_back():
    node(PAYLOAD_FIXTURE + f"const endpoint={json.dumps(ENDPOINT)};\n" + r"""
      const pending={key:crypto.randomUUID(),payload:pages.leadPayload(fields,context)},id=crypto.randomUUID();
      const token='eyJhdCI6MTAwMDB9.'+'x'.repeat(43);let calls=[];
      const send=(value,status=202)=>async(url,options)=>{
        if(!options.method)return Response.json({challenge:token,minimumDelayMs:2000});
        calls.push({url,options});return Response.json(value,{status});
      };
      const wait=async ms=>assert.equal(ms,2100);
      await assert.rejects(pages.submitLead('',pending,send({}),wait));assert.equal(calls.length,0);
      for(const value of [{ok:true},{ok:true,saved:true,leadId:id},{durableSaved:false,leadId:id},
        {durableSaved:'true',leadId:id},{durableSaved:true},{durableSaved:true,leadId:'<script>'},{telegram:'sent'}])
        await assert.rejects(pages.submitLead(endpoint,pending,send(value),wait));
      const accepted={ok:true,source:'NFC_CARD',durableSaved:true,leadId:id,notificationStatus:'queued'};
      for(const status of [200,503])await assert.rejects(pages.submitLead(endpoint,pending,send(accepted,status),wait));
      assert.deepEqual(await pages.submitLead(endpoint,pending,send(accepted),wait),{leadId:id,durableSaved:true});
      for(const {url,options}of calls){
        assert.equal(url,endpoint);assert.equal(options.headers['Idempotency-Key'],pending.key);
        assert.deepEqual(JSON.parse(options.body),{...pending.payload,website:'',challenge:token});
        assert.equal(options.credentials,'omit');assert.equal(options.referrerPolicy,'no-referrer');
        assert.deepEqual(Object.keys(options.headers),['Content-Type','Idempotency-Key']);
      }
      const invalid={key:crypto.randomUUID(),payload:pending.payload};
      await assert.rejects(pages.submitLead(endpoint,invalid,send({code:'invalid_payload'},422),wait),/invalid_fields/);
      assert.equal(invalid.uncertain,false);
      invalid.uncertain=true;
      await assert.rejects(pages.submitLead(endpoint,invalid,send({code:'invalid_payload'},422),wait),/request_unconfirmed/);
      assert.equal(invalid.uncertain,true);
    """)


# Minimal DOM seam exercises the real mounted handler without a browser, network,
# third-party DOM package or production storage. Browser QA belongs to the main task.
FORM_FIXTURE = r"""
const storage=()=>{const data=new Map();return {getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};};
globalThis.localStorage=storage(); globalThis.sessionStorage=storage();
function fixture(endpoint,locale='en'){
 const control=(value,type='text')=>({value,type,checked:false,disabled:false});
 const values={name:control('Test Customer'),phone:control('+380980000000'),messenger:control('telegram'),comment:control('Retained comment'),consent:control('yes','checkbox'),variant:control('branded','hidden'),quantity:control('2','select-one'),website:control('','hidden')};
 values.consent.checked=true;
 const submit={type:'submit',textContent:'Send request',disabled:true,hidden:false};
 const elements=[...Object.values(values),submit];elements.namedItem=n=>values[n];
 const result={dataset:{},focus(){},hidden:true},notice={},pendingNote={hidden:true},newRequest={hidden:true};
 const nodes={'[type=submit]':submit,'.form-result':result,'.pending-notice':pendingNote,'.preview-notice':notice,'[data-new-request]':newRequest};
 let selected={variant:'branded',quantity:'2'},locked=false,events=[];
 const handlers={};
 const form={elements,dataset:{},querySelector:s=>nodes[s],reportValidity:()=>true,addEventListener:(n,fn)=>handlers[n]=fn,setAttribute(){},removeAttribute(){}};
 pages.mountPagesForm(form,{endpoint,basePath:'/nfc-card-website',locale,pathname:'/nfc-card-website/'+(locale==='uk'?'':'en/')+'order',attribution:{utm_source:'test'},selection:()=>selected,select:v=>{selected=v;values.variant.value=v.variant;values.quantity.value=v.quantity;},lockSelection:v=>locked=v,event:(name,data)=>events.push({name,data})});
 return {form,values,submit,result,notice,newRequest,events,handlers,get selected(){return selected},get locked(){return locked},send:()=>form.onsubmit({preventDefault(){}})};
}
"""


def test_mounted_unavailable_form_preserves_fields_and_never_submits():
    node(FORM_FIXTURE + r"""
      let calls=0;globalThis.fetch=async()=>{calls++;throw Error('network forbidden');};
      let storageCalls=0;
      for(const store of [localStorage,sessionStorage])for(const op of ['getItem','setItem','removeItem'])
        store[op]=()=>{storageCalls++;throw Error('preview storage forbidden');};
      for(const locale of ['uk','en']){
        const f=fixture('',locale);await f.send();
        assert.equal(f.submit.disabled,true);assert.equal(f.values.name.disabled,false);
        assert.equal(f.values.name.value,'Test Customer');assert.equal(f.values.comment.value,'Retained comment');
        assert.deepEqual(f.selected,{variant:'branded',quantity:'2'});
        assert.ok(f.notice.textContent.includes(locale==='uk'?'тимчасово недоступні':'temporarily unavailable'));
        f.values.quantity.value='more';f.handlers.change({target:{name:'quantity'}});assert.equal(f.selected.quantity,'more');
        assert.equal(f.handlers.input,undefined);
        assert.equal(f.events.length,0);
        f.submit.disabled=false;await f.send();assert.equal(f.form.dataset.complete,undefined);
      }
      assert.equal(calls,0);assert.equal(storageCalls,0);
    """)


def test_mounted_retry_duplicate_guard_and_durable_success_without_personal_storage():
    node(FORM_FIXTURE + f"const endpoint={json.dumps(ENDPOINT)};\n" + r"""
      const realTimeout=setTimeout;globalThis.setTimeout=(fn,ms,...args)=>realTimeout(fn,ms===2100?0:ms,...args);
      const requests=[];let finish;const id=crypto.randomUUID();
      localStorage.setItem=()=>{throw Error('no personal local storage');};
      const written=[];sessionStorage.setItem=(key,value)=>written.push({key,value});
      globalThis.fetch=(url,options)=>{
        if(!options.method)return Promise.resolve(Response.json({challenge:'payload.'+'x'.repeat(43),minimumDelayMs:2000}));
        requests.push({url,options});return new Promise(resolve=>finish=resolve);
      };
      const until=async count=>{for(let i=0;i<100&&requests.length<count;i++)await new Promise(r=>realTimeout(r,5));assert.equal(requests.length,count);};
      const f=fixture(endpoint);assert.equal(f.submit.disabled,false);
      const first=f.send();await f.send();await until(1);assert.equal(f.submit.disabled,true);
      finish(Response.json({ok:true,telegram:'sent'}));await first;
      assert.equal(f.result.dataset.status,'error');assert.equal(f.form.dataset.complete,undefined);
      assert.equal(f.values.name.value,'Test Customer');assert.equal(f.values.comment.value,'Retained comment');assert.equal(f.locked,true);
      const retry=f.send();await until(2);
      assert.equal(requests[0].options.body,requests[1].options.body);
      assert.equal(requests[0].options.headers['Idempotency-Key'],requests[1].options.headers['Idempotency-Key']);
      finish(Response.json({ok:true,source:'NFC_CARD',durableSaved:true,leadId:id,notificationStatus:'queued'},{status:202}));await retry;
      assert.equal(f.result.dataset.status,'success');assert.equal(f.form.dataset.complete,'true');
      assert.ok(f.result.textContent.includes(id));assert.equal(f.submit.disabled,true);await f.send();assert.equal(requests.length,2);
      assert.deepEqual(f.events.filter(e=>e.name==='order_submit_success'),[{name:'order_submit_success',data:{variant:'branded',quantity:'2'}}]);
      assert.ok(!JSON.stringify(f.events).includes('Test Customer'));
      assert.ok(written.length>0);assert.ok(written.every(item=>{const state=JSON.parse(item.value);return /^[a-f0-9-]{36}$/.test(state.key)&&['uncertain','complete'].includes(state.state)&&Object.keys(state).every(k=>['key','state','leadId'].includes(k));}));
      assert.ok(!JSON.stringify(written).includes('Test Customer'));assert.ok(!JSON.stringify(written).includes('38098'));
    """)


def test_definitive_rejection_unlocks_correction_and_failed_challenge_never_posts(source):
    node(FORM_FIXTURE + f"const endpoint={json.dumps(ENDPOINT)};\n" + r"""
      let calls=0;globalThis.fetch=async()=>{calls++;throw Error();};
      const f=fixture(endpoint);await f.send();assert.equal(calls,1);assert.equal(f.result.dataset.status,'error');
      assert.equal(f.values.name.value,'Test Customer');assert.equal(f.values.name.disabled,false);
      const realTimeout=setTimeout;globalThis.setTimeout=(fn,ms,...args)=>realTimeout(fn,ms===2100?0:ms,...args);
      const keys=[];globalThis.fetch=async(url,options)=>{
        if(!options.method)return Response.json({challenge:'payload.'+'x'.repeat(43),minimumDelayMs:2000});
        keys.push(options.headers['Idempotency-Key']);return Response.json({ok:false,code:'invalid_payload'},{status:422});
      };
      await f.send();assert.equal(f.locked,false);assert.equal(f.values.name.disabled,false);
      f.values.name.value='Corrected Customer';await f.send();assert.equal(keys.length,2);assert.notEqual(keys[0],keys[1]);
    """)
    site = build(source)
    original = hashlib.sha256((site / 'index.html').read_bytes()).hexdigest()
    env = {k: v for k, v in os.environ.items() if not k.startswith('NFC_')}
    env.update(NFC_PUBLIC_ORIGIN=ORIGIN, NFC_PUBLIC_BASE_PATH=BASE, NFC_DEPLOYMENT_TARGET='github-pages',
               NFC_LEAD_ENDPOINT='https://user:secret@bridge.company.com/leads')
    result = subprocess.run([NODE, 'src/build.mjs'], cwd=source, env=env, capture_output=True, text=True)
    assert result.returncode != 0 and 'Invalid NFC_LEAD_ENDPOINT' in result.stderr
    assert 'user:secret' not in result.stderr
    assert hashlib.sha256((site / 'index.html').read_bytes()).hexdigest() == original


def test_reload_retains_uncertainty_and_completed_request_has_explicit_new_transition():
    node(FORM_FIXTURE + f"const endpoint={json.dumps(ENDPOINT)};\n" + r"""
      const realTimeout=setTimeout;globalThis.setTimeout=(fn,ms,...args)=>realTimeout(fn,ms===2100?0:ms,...args);
      const saved=new Map(),requests=[];let lose=true,failChallenge=false;
      globalThis.fetch=async(url,options)=>{
        if(!options.method){if(failChallenge)throw Error('challenge lost');return Response.json({challenge:'payload.'+'x'.repeat(43),minimumDelayMs:2000});}
        const key=options.headers['Idempotency-Key'],body=JSON.parse(options.body);delete body.challenge;
        requests.push({key,body});let row=saved.get(key);
        if(row&&JSON.stringify(row.body)!==JSON.stringify(body))return Response.json({code:'idempotency_conflict',existingLeadId:row.id},{status:409});
        if(!row){row={body,id:crypto.randomUUID()};saved.set(key,row);}
        if(lose){lose=false;throw Error('commit response lost');}
        return Response.json({ok:true,source:'NFC_CARD',durableSaved:true,leadId:row.id},{status:202});
      };
      const first=fixture(endpoint);await first.send();assert.equal(saved.size,1);assert.equal(first.result.dataset.status,'error');
      const reload=fixture(endpoint);failChallenge=true;await reload.send();assert.equal(requests.length,1);assert.equal(reload.locked,true);
      failChallenge=false;await reload.send();assert.equal(saved.size,1);assert.equal(requests[0].key,requests[1].key);assert.equal(reload.result.dataset.status,'success');
      const complete=fixture(endpoint);assert.equal(complete.form.dataset.complete,'true');assert.equal(complete.result.dataset.status,'existing');
      await complete.send();assert.equal(requests.length,2);assert.equal(complete.newRequest.hidden,false);
      complete.newRequest.onclick();complete.values.phone.value='+380980000001';await complete.send();assert.equal(saved.size,2);assert.notEqual(requests[2].key,requests[0].key);
      // Another uncertain reload with changed details receives a safe existing
      // receipt, not fake success for the changed form or an endless 409 retry.
      complete.newRequest.onclick();lose=true;await complete.send();assert.equal(saved.size,3);
      const conflict=fixture(endpoint);conflict.values.quantity.value='1';conflict.handlers.change({target:{name:'quantity'}});
      await conflict.send();assert.equal(saved.size,3);assert.equal(conflict.result.dataset.status,'existing');assert.equal(conflict.newRequest.hidden,false);
    """)
