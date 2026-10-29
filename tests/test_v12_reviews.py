"""Real isolated PostgreSQL tests. Synthetic fixtures are never part of the candidate DB or screenshots."""
import io,json,os,sys,uuid,subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime,timezone,timedelta
import pytest,psycopg
from psycopg import sql
from argon2 import PasswordHasher
from PIL import Image
sys.path.insert(0,str(Path(__file__).resolve().parents[1]))
from server.review_repository import ReviewRepository
from server.review_images import ImageProcessor
from server.review_storage import MemoryPrivateStorage,LocalPrivateStorage,PrivateS3Storage
from server.review_security import ReviewError,public_submission,web_url,instagram
from server.review_auth import AdminAuth
from server.review_config import ReviewRuntime,configure
from server.review_http import ReviewHTTP,Request,parse_body
from server.reviews import ReviewService,FakeReviewNotifier
from server.commerce_repository import PostgresLeadService
from server.routing import product_redirect
from server.wsgi import Application
from test_leads import payload as lead_payload

DSN=os.environ.get('NFC_TEST_DATABASE_URL','')
SECRET='synthetic-session-secret-not-a-production-value'
PASSWORD='Synthetic-local-only-password-12'
HASH=PasswordHasher().hash(PASSWORD)
ORIGIN='http://127.0.0.1:8767'
def submission(**values):return {'rating':4,'reviewText':'Synthetic isolated test text, never a customer case.','instagram':'@isolated_test','consent':True,'locale':'uk','clientRequestId':str(uuid.uuid4()),'honeypot':'',**values}
def photo(color='red',fmt='PNG',**save):
    out=io.BytesIO();Image.new('RGB',(640,480),color).save(out,format=fmt,**save);return out.getvalue()
@pytest.fixture
def repo():
    if not DSN:pytest.skip('NFC_TEST_DATABASE_URL must explicitly select isolated PostgreSQL')
    if '/nfc_v12_test' not in DSN:raise RuntimeError('Refusing non-test database')
    schema='qa_'+uuid.uuid4().hex
    with psycopg.connect(DSN,autocommit=True) as db:db.execute(sql.SQL('CREATE SCHEMA {}').format(sql.Identifier(schema)))
    scoped=DSN+('&' if '?' in DSN else '?')+'options=-csearch_path%3D'+schema
    repository=ReviewRepository(scoped);repository.migrate();yield repository
    with psycopg.connect(DSN,autocommit=True) as db:db.execute(sql.SQL('DROP SCHEMA {} CASCADE').format(sql.Identifier(schema)))
@pytest.fixture
def service(repo):return ReviewService(repo,MemoryPrivateStorage(mode='test'),ImageProcessor(),secret=SECRET,origin=ORIGIN,mode='test')
@pytest.fixture
def http(service):return ReviewHTTP(ReviewRuntime(service,AdminAuth(service.repo,secret=SECRET,password_hash=HASH,secure=False),ORIGIN,'test'),lambda lang:'<html lang="'+lang+'">Private admin</html>')
def request(http,path,method='GET',body=None,cookie='',csrf='',headers=None):
    h={'host':'127.0.0.1:8767','origin':ORIGIN,'content-type':'application/json','cookie':cookie,'x-csrf-token':csrf,**(headers or {})}
    return http.dispatch(Request(method,path,h,b'' if body is None else json.dumps(body).encode(),'synthetic-client'))
def auth(http):
    r=request(http,'/api/admin/session');cookie=r.headers['Set-Cookie'].split(';')[0];csrf=json.loads(r.body)['csrf']
    r=request(http,'/api/admin/login','POST',{'password':PASSWORD},cookie,csrf);assert r.status==200,r.body
    return r.headers['Set-Cookie'].split(';')[0],json.loads(r.body)['csrf']
def review_id(service):
    with service.repo.transaction() as db:return str(db.execute('SELECT id FROM client_reviews').fetchone()['id'])
def enrich(service,id):
    r=service.admin_get(id);r=service.update(id,{'version':r['version'],'businessName':'Isolated QA fixture','publicReviewText':'Synthetic approved fixture text, never displayed as a real case.','googleMapsUrl':'https://www.google.com/maps/place/isolated','slug':'isolated-test','verifiedCustomer':True,'publicationConsent':True})
    for role,color in [('primary_card_location','red'),('secondary_business_location','blue')]:r=service.upload(id,role,r['version'],photo(color),alt='Synthetic '+role)
    if r['status']=='draft':r=service.action(id,'submit',r['version'])
    return service.action(id,'verify',r['version'])

def test_migration_idempotent_and_zero_state(repo,service):
    repo.migrate();assert repo.ready();assert service.public_list()=={'items':[],'nextCursor':None}
    with repo.transaction() as db:assert db.execute('SELECT COUNT(*) n FROM nfc_review_migrations').fetchone()['n']==4
def test_durable_pending_notification_failure_and_retry(service):
    service.notifier.fail=True;p=submission();a=service.submit(p,image=photo());b=service.submit(p,image=photo())
    assert a['reference']==b['reference'] and b['duplicate'];assert service.notifier.attempts==1
    r=service.admin_get(review_id(service));assert r['status']=='pending' and r['rating']==4 and r['raw_review_text']==p['reviewText'];assert service.public_list()['items']==[]
    with service.repo.transaction() as db:
        assert db.execute('SELECT state FROM review_notification_outbox').fetchone()['state']=='failed'
        db.execute('UPDATE review_notification_outbox SET next_attempt=NOW()')
    service.notifier.fail=False;assert service.dispatch_outbox()
@pytest.mark.parametrize('field,value',[('status','published'),('businessName','Fake'),('verifiedCustomer',True),('isPublic',True),('publicReviewText','injection'),('rating',True),('rating',6),('consent',False),('locale','ru'),('reviewText','<script>bad()</script>'),('clientRequestId','short'),('honeypot','spam')])
def test_public_mass_assignment_and_validation(service,field,value):
    with pytest.raises(ReviewError):service.submit(submission(**{field:value}))
    assert service.public_list()['items']==[]
def test_same_intent_concurrent_retry_only_one_record(service):
    p=submission()
    with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(lambda _:service.submit(p),range(4)))
    assert len({r['reference'] for r in results})==1;assert sum(not r['duplicate'] for r in results)==1
def test_conflict_and_short_lived_duplicate(service):
    p=submission();service.submit(p)
    with pytest.raises(ReviewError,match='idempotency_conflict'):service.submit({**p,'rating':2})
    with pytest.raises(ReviewError,match='duplicate_submission'):service.submit(submission())
def test_publication_gate_and_image_revocation(service):
    service.submit(submission(),image=photo('green'));id=review_id(service);r=service.admin_get(id)
    with pytest.raises(ReviewError):service.action(id,'publish',r['version'])
    r=enrich(service,id);r=service.action(id,'publish',r['version']);data=service.public_list()['items'][0]
    assert set(data)=={'id','slug','rating','reviewText','businessName','instagramUrl','googleMapsUrl','websiteUrl','primaryImage','secondaryImage','publishedAt'}
    assert data['id']==id and data['rating']==4;assert service.public_list('en')['items'][0]['id']==id
    primary=next(a for a in r['assets'] if a['role']=='primary_card_location');proof=next(a for a in r['assets'] if a['role']=='proof')
    assert service.asset(primary['id'],'large')[1]=='image/webp'
    with pytest.raises(ReviewError):service.asset(proof['id'],'large')
    assert service.asset(proof['id'],'large',True)[0]
    with pytest.raises(ReviewError,match='unpublish_before_edit'):service.update(id,{'version':r['version'],'businessName':'Changed'})
    service.action(id,'unpublish',r['version']);assert not service.public_list()['items']
    with pytest.raises(ReviewError):service.asset(primary['id'],'large')
def test_immutable_origin_and_version_race(service):
    service.submit(submission());id=review_id(service)
    for value in [None,True,'1']:
        with pytest.raises(ReviewError,match='version_required'):service.update(id,{'version':value})
    service.update(id,{'version':1,'businessName':'QA'})
    with pytest.raises(ReviewError,match='stale_version'):service.update(id,{'version':1,'businessName':'Old'})
    with pytest.raises(psycopg.Error):
        with service.repo.transaction() as db:db.execute('UPDATE client_reviews SET rating=5,version=version+1 WHERE id=%s',(id,))
def test_translations_one_identity_and_approved_fallback(service):
    service.submit(submission());id=review_id(service);r=enrich(service,id)
    r=service.update(id,{'version':r['version'],'translations':[{'locale':'en','publicReviewText':'Approved English synthetic fixture text','primaryAlt':'Card fixture','secondaryAlt':'Location fixture','approved':True}]})
    service.action(id,'publish',r['version']);uk=service.public_list()['items'][0];en=service.public_list('en')['items'][0]
    assert uk['id']==en['id'] and uk['rating']==en['rating'];assert en['reviewText']=='Approved English synthetic fixture text' and en['primaryImage']['alt']=='Card fixture'
def test_two_distinct_photos_required(service):
    service.submit(submission());id=review_id(service);r=enrich(service,id)
    r=service.upload(id,'secondary_business_location',r['version'],photo('red'),alt='Distinct role, same content')
    assert 'two_distinct_photos' in r['publicationBlockers']
    with pytest.raises(ReviewError,match='publication_blocked'):service.action(id,'publish',r['version'])
def test_storage_failure_compensation(service):
    service.storage.fail_put=True
    with pytest.raises(ReviewError,match='image_storage_unavailable'):service.submit(submission(),image=photo())
    with service.repo.transaction() as db:
        assert db.execute('SELECT count(*) n FROM client_reviews').fetchone()['n']==0
        assert db.execute('SELECT state FROM review_upload_jobs').fetchone()['state']=='cleaned'
    assert not service.storage.objects and service.notifier.attempts==0
def test_local_images_and_records_survive_new_process(service,tmp_path):
    service.storage=LocalPrivateStorage(tmp_path/'private',mode='test');service.submit(submission(),image=photo());id=review_id(service)
    code='from server.review_repository import ReviewRepository; import sys; r=ReviewRepository(sys.argv[1]); print(r.ready());\nwith r.transaction() as db: print(db.execute("SELECT count(*) n FROM client_reviews").fetchone()["n"])'
    p=subprocess.run([sys.executable,'-B','-c',code,service.repo.dsn],capture_output=True,text=True,cwd=Path(__file__).resolve().parents[1]);assert p.returncode==0,p.stderr;assert p.stdout.strip()=='True\n1'
    second=ReviewService(service.repo,LocalPrivateStorage(tmp_path/'private',mode='test'),ImageProcessor(),secret=SECRET,origin=ORIGIN)
    asset=second.admin_get(id)['assets'][0];assert second.asset(asset['id'],'large',True)[0]
def test_auth_csrf_rotation_expiry_logout_and_private_headers(http):
    assert request(http,'/admin/reviews').status==303;assert request(http,'/api/admin/reviews').status==401
    cookie,csrf=auth(http);assert 'HttpOnly' in http.runtime.auth.cookie('x') and 'SameSite=Strict' in http.runtime.auth.cookie('x')
    assert request(http,'/api/admin/reviews',cookie=cookie).status==200
    assert request(http,'/api/admin/reviews','POST',submission(),cookie,'bad').status==403
    assert request(http,'/api/admin/reviews','POST',submission(),cookie,csrf,{'origin':'https://evil.test'}).status==403
    r=request(http,'/api/admin/reviews','POST',submission(),cookie,csrf);assert r.status==201,r.body
    r=request(http,'/admin/reviews',cookie=cookie);assert r.status==200 and 'noindex' in r.headers['X-Robots-Tag'] and 'no-store' in r.headers['Cache-Control']
    assert request(http,'/api/admin/logout','POST',{},cookie,csrf).status==200
    assert request(http,'/api/admin/reviews',cookie=cookie).status==401
def test_bootstrap_rate_limit(http):
    results=[request(http,'/api/admin/session').status for _ in range(41)];assert results[-1]==429
    with http.runtime.service.repo.transaction() as db:assert db.execute('SELECT count(*) n FROM review_admin_sessions').fetchone()['n']==40
@pytest.mark.parametrize('route',['/api/admin/reviews','/api/reviews','/admin/login'])
def test_host_and_method_rejected(http,route):
    assert request(http,route,headers={'host':'evil.test'}).status==403;assert request(http,route,'DELETE').status==405
def test_public_http_dto_and_filters(http):
    assert json.loads(request(http,'/api/reviews').body)=={'items':[],'nextCursor':None}
    for q in ['locale=ru','limit=0','limit=31','featured=bad','cursor=bad','locale=uk&locale=en','status=pending']:assert request(http,'/api/reviews?'+q).status in (400,422)
    r=request(http,'/api/reviews/submit','POST',submission());assert r.status==201,r.body
    assert set(json.loads(r.body))=={'ok','reference','duplicate'}
@pytest.mark.parametrize('bad',[b'<svg><script/></svg>',b'not image',b'\xff\xd8\xfftruncated',b'RIFFxxxxWEBPgarbage'])
def test_malformed_images(bad):
    with pytest.raises(ReviewError):ImageProcessor().process(bad,'innocent.jpg')
def test_reencode_strips_metadata_and_bounds_pixels():
    exif=Image.Exif();exif[315]='Synthetic private EXIF';exif[274]=6
    processed=ImageProcessor().process(photo(fmt='JPEG',exif=exif));assert (processed.width,processed.height)==(480,640)
    for v in processed.variants.values():
        image=Image.open(io.BytesIO(v['data']));assert not image.getexif() and image.format=='WEBP';assert b'Synthetic private EXIF' not in v['data']
    with pytest.raises(ReviewError):ImageProcessor(max_pixels=100).process(photo())
    with pytest.raises(ReviewError):ImageProcessor(max_bytes=10).process(photo())
    out=io.BytesIO();Image.new('RGB',(10,10),'red').save(out,format='WEBP',save_all=True,append_images=[Image.new('RGB',(10,10),'blue')],duration=100)
    with pytest.raises(ReviewError):ImageProcessor().process(out.getvalue())
@pytest.mark.parametrize('url',['javascript:alert(1)','https://user:pass@instagram.com/name','https://instagram.com.evil.test/name','https://instagram.com/p/abc','https://instagram.com/name?x=1','https://instagram.com/name#fragment'])
def test_instagram_rejects_unsafe_urls(url):
    with pytest.raises(ReviewError):instagram(url)
@pytest.mark.parametrize('url',['http://google.com/maps','https://google.com.evil.test/maps','https://127.0.0.1/maps','data:text/html,test','https://google.com/maps\\evil'])
def test_maps_rejects_unsafe_urls(url):
    with pytest.raises(ReviewError):web_url(url,'maps','maps')
def test_s3_adapter_has_private_headers_random_keys_no_public_acl():
    class Stub:
        def put_object(self,**kwargs):self.args=kwargs
        def get_object(self,**kwargs):return {'Body':io.BytesIO(b'pixels')}
        def delete_object(self,**kwargs):self.deleted=kwargs
    stub=Stub();s3=PrivateS3Storage(endpoint='https://synthetic.invalid',bucket='private-test',region='auto',access_key='test-only',secret_key='test-only',client=stub);key=str(uuid.uuid4())+'/large';s3.put(key,b'pixels','image/webp')
    assert stub.args['CacheControl']=='private, no-store' and 'ACL' not in stub.args and stub.args['Key']==key;assert s3.get(key)==b'pixels';s3.delete(key)
def test_production_configuration_fails_closed():
    for values in [{},{'NFC_ENV':'production','NFC_PUBLIC_ORIGIN':'http://127.0.0.1:8767'},{'NFC_ENV':'production','NFC_PUBLIC_ORIGIN':'https://example.test','NFC_TELEGRAM_ENABLED':'true'}]:
        with pytest.raises(ValueError):configure(values)
@pytest.mark.parametrize('variant,quantity,amount',[('standard','1',1500),('standard','2',2600),('branded','1',2000),('branded','2',3600),('branded','more',None)])
def test_postgres_canonical_commerce_and_idempotency(repo,variant,quantity,amount):
    from server.leads import MockNotifier
    notifier=MockNotifier(fail=True);svc=PostgresLeadService(repo,secret=SECRET,mode='test',notifier=notifier);p=lead_payload(variant=variant,quantity=quantity,displayed_price=1)
    a=svc.submit(p);b=svc.submit(p);assert a['receipt']['quote']['amount']==amount and a['receipt']['id']==b['receipt']['id'];assert b['receipt']['duplicate']
    with repo.transaction() as db:assert db.execute('SELECT state FROM commerce_notification_outbox').fetchone()['state']=='failed'
def test_routing_preserves_safe_context():
    assert product_redirect('/en/solutions/review-card?variant=branded&quantity=2&utm_source=qa&evil=x')=='/en/solutions/branded-review-card?utm_source=qa&quantity=2'
    assert product_redirect('/solutions/branded-review-card?variant=standard&quantity=99')=='/solutions/review-card'
def test_wsgi_same_auth_and_body_boundary(http):
    app=Application(http.runtime);status=[]
    env={'REQUEST_METHOD':'GET','PATH_INFO':'/api/reviews','HTTP_HOST':'127.0.0.1:8767','wsgi.input':io.BytesIO()}
    output=app(env,lambda s,h:status.append((s,dict(h))));assert status[-1][0]=='200 OK';assert json.loads(output[0])['items']==[]
    env.update(REQUEST_METHOD='POST',CONTENT_LENGTH='999999999');app(env,lambda s,h:status.append((s,dict(h))));assert status[-1][0].startswith('413')

def test_readiness_rejects_missing_migration_and_checksum(repo):
    with repo.transaction() as db:
        row=db.execute("DELETE FROM nfc_review_migrations WHERE name='002_commerce.sql' RETURNING name,checksum").fetchone()
    assert not repo.ready()
    with repo.transaction() as db:db.execute('INSERT INTO nfc_review_migrations(name,checksum) VALUES(%s,%s)',(row['name'],row['checksum']))
    assert repo.ready()
    with repo.transaction() as db:db.execute("UPDATE nfc_review_migrations SET checksum='drift' WHERE name='001_reviews.sql'")
    assert not repo.ready()

def test_auth_rotation_and_actual_expiry_and_login_throttle(http):
    auth_service=http.runtime.auth
    r=request(http,'/api/admin/session');old_cookie=r.headers['Set-Cookie'].split(';')[0];old_csrf=json.loads(r.body)['csrf']
    r=request(http,'/api/admin/login','POST',{'password':PASSWORD},old_cookie,old_csrf);cookie=r.headers['Set-Cookie'].split(';')[0]
    assert cookie!=old_cookie and request(http,'/api/admin/reviews',cookie=old_cookie).status==401
    auth_service.clock=lambda:datetime.now(timezone.utc)+timedelta(days=1)
    assert request(http,'/api/admin/reviews',cookie=cookie).status==401
    auth_service.clock=lambda:datetime.now(timezone.utc)
    r=request(http,'/api/admin/session');cookie=r.headers['Set-Cookie'].split(';')[0];csrf=json.loads(r.body)['csrf']
    responses=[request(http,'/api/admin/login','POST',{'password':'Wrong-synthetic-password'},cookie,csrf).status for _ in range(8)]
    assert responses[-1]==429

@pytest.mark.parametrize('field,value',[('publicReviewText',''),('businessName',''),('googleMapsUrl',''),('slug',''),('verifiedCustomer',False),('publicationConsent',False),('primaryAlt',''),('secondaryAlt','')])
def test_each_publication_prerequisite_is_enforced(service,field,value):
    service.submit(submission());id=review_id(service);r=enrich(service,id);r=service.update(id,{'version':r['version'],field:value})
    with pytest.raises(ReviewError,match='publication_blocked'):service.action(id,'publish',r['version'])
    assert not service.public_list()['items']

def test_all_moderation_transitions_and_archive_revocation(service):
    result=service.submit(submission(),manual=True);id=result['id'];r=service.admin_get(id);assert r['status']=='draft'
    for action,expected in [('reject','rejected'),('restore','draft'),('archive','archived'),('restore','draft'),('submit','pending')]:
        r=service.action(id,action,r['version']);assert r['status']==expected
    r=enrich(service,id);r=service.action(id,'publish',r['version']);asset=next(a for a in r['assets'] if a['role']=='primary_card_location');service.action(id,'archive',r['version'])
    with pytest.raises(ReviewError):service.asset(asset['id'],'large')

def test_concurrent_moderation_detects_one_stale_editor(service):
    service.submit(submission());id=review_id(service)
    def change(name):
        try:return service.update(id,{'version':1,'businessName':name})['version']
        except ReviewError as e:return e.code
    with ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(change,['Isolated A','Isolated B']))
    assert results.count(2)==1 and results.count('stale_version')==1

def test_partial_storage_failure_and_cleanup_retry(service,monkeypatch):
    original_put=service.storage.put;calls=[]
    def partial(key,data,mime):
        calls.append(key)
        if len(calls)==2:raise OSError('synthetic partial write')
        original_put(key,data,mime)
    monkeypatch.setattr(service.storage,'put',partial)
    original_delete=service.storage.delete
    monkeypatch.setattr(service.storage,'delete',lambda _:(_ for _ in ()).throw(OSError('synthetic cleanup failure')))
    with pytest.raises(ReviewError):service.submit(submission(),image=photo())
    assert len(service.storage.objects)==1
    monkeypatch.setattr(service.storage,'delete',original_delete);assert service.reconcile()==1 and not service.storage.objects

def test_database_association_failure_cleans_staged_objects(service,monkeypatch):
    monkeypatch.setattr(service,'attach',lambda *_:(_ for _ in ()).throw(RuntimeError('synthetic transaction failure')))
    with pytest.raises(RuntimeError):service.submit(submission(),image=photo())
    assert not service.storage.objects and service.notifier.attempts==0
    with service.repo.transaction() as db:assert db.execute('SELECT count(*) n FROM client_reviews').fetchone()['n']==0

def test_stale_stage_reconciliation(service):
    staged=service.stage(photo())
    with service.repo.transaction() as db:db.execute("UPDATE review_upload_jobs SET created_at=NOW()-INTERVAL '2 hours' WHERE id=%s",(staged['id'],))
    assert service.reconcile()==1 and not service.storage.objects

def test_retention_preview_apply_and_published_asset_protection(service):
    service.submit(submission(),image=photo('green'));published_id=review_id(service);r=enrich(service,published_id);r=service.action(published_id,'publish',r['version']);public_asset=next(a for a in r['assets'] if a['role']=='primary_card_location')
    rejected=service.submit(submission(reviewText='Another synthetic isolated record for retention testing.'),manual=True)['id'];r=service.admin_get(rejected);service.upload(rejected,'primary_card_location',r['version'],photo('yellow'));r=service.admin_get(rejected);service.action(rejected,'reject',r['version'])
    with service.repo.transaction() as db:
        db.execute("UPDATE client_reviews SET updated_at=NOW()-INTERVAL '200 days',version=version+1 WHERE id=%s",(rejected,))
        db.execute("UPDATE client_review_assets SET created_at=NOW()-INTERVAL '200 days'")
    preview=service.retention();assert preview['rejectedRecords']==1 and preview['unusedAssets']==2 and not preview['applied']
    assert service.admin_get(rejected)
    service.retention(apply=True)
    with pytest.raises(ReviewError):service.admin_get(rejected)
    assert service.asset(public_asset['id'],'large')[0] and service.public_list()['items'][0]['id']==published_id
    assert len(service.storage.objects)==6

def test_admin_queue_pagination_reaches_all(service):
    with service.repo.transaction() as db:
        for i in range(101):db.execute("INSERT INTO client_reviews(id,source,status,locale,rating,raw_review_text,instagram_url,submission_reference) VALUES(%s,'public_form','pending','uk',3,'Synthetic pagination fixture only','https://www.instagram.com/isolated_test/',%s)",(str(uuid.uuid4()),'SYNTHETIC-'+str(i)))
    first=service.admin_list('pending');second=service.admin_list('pending',first['nextCursor']);assert len(first['items'])==100 and len(second['items'])==1
    assert len({r['id'] for r in first['items']+second['items']})==101

def test_heif_decode_and_gps_metadata_strip():
    from server.review_images import HEIF
    assert HEIF,'Advertised iPhone support requires the pinned decoder'
    data=photo(fmt='HEIF');processed=ImageProcessor().process(data,'phone.heic');assert processed.variants['large']['mime']=='image/webp'
    exif=Image.Exif();exif[34853]={1:'N',2:(10,20,30),3:'E',4:(20,30,40)};data=photo(fmt='JPEG',exif=exif)
    assert 34853 in Image.open(io.BytesIO(data)).getexif()
    processed=ImageProcessor().process(data)
    assert all(not Image.open(io.BytesIO(v['data'])).getexif() for v in processed.variants.values())

def test_upload_capabilities_and_moderation_feature_flag(http):
    http.runtime.service.images.max_bytes=2*1024*1024
    r=json.loads(request(http,'/api/reviews/options').body);assert r['maxBytes']==2097152 and 'image/heic' in r['mimeTypes']
    http.runtime.enabled=False;assert request(http,'/api/reviews/submit','POST',submission()).status==503

def test_disabled_production_notifications_remain_recoverable_pending(service):
    production=ReviewService(service.repo,service.storage,service.images,secret=SECRET,origin='https://synthetic.invalid',mode='production')
    production.submit(submission());commerce=PostgresLeadService(service.repo,secret=SECRET,mode='production');commerce.submit(lead_payload())
    assert production.notifier is None and commerce.notifier is None
    assert not production.dispatch_outbox() and not commerce.dispatch()
    with service.repo.transaction() as db:
        for table in ('review_notification_outbox','commerce_notification_outbox'):
            row=db.execute(sql.SQL('SELECT state,attempts FROM {}').format(sql.Identifier(table))).fetchone()
            assert row=={'state':'pending','attempts':0}

def test_production_rejects_explicit_success_fakes(service):
    from server.leads import MockNotifier
    with pytest.raises(ValueError,match='test_notifier_forbidden'):
        ReviewService(service.repo,service.storage,service.images,secret=SECRET,origin=ORIGIN,mode='production',notifier=FakeReviewNotifier())
    with pytest.raises(ValueError,match='test_notifier_forbidden'):
        PostgresLeadService(service.repo,secret=SECRET,mode='production',notifier=MockNotifier())

def test_expired_idempotency_can_be_reused_without_reconcile(service):
    payload=submission();first=service.submit(payload)
    with service.repo.transaction() as db:
        db.execute("UPDATE review_idempotency SET expires_at=NOW()-INTERVAL '1 day'")
        db.execute("DELETE FROM review_fingerprints")
    second=service.submit(payload);assert second['reference']!=first['reference'] and not second['duplicate']

def test_retention_large_asset_backlog_converges(service):
    id=service.submit(submission(),manual=True)['id'];r=service.action(id,'reject',1)
    staged=service.stage(photo())
    with service.repo.transaction() as db:
        service.attach(db,id,staged,'proof')
        # Historical replaced assets, synthetic metadata only; never published.
        for i in range(500):
            db.execute('UPDATE client_review_assets SET active=false WHERE review_id=%s',(id,))
            asset={**staged,'id':str(uuid.uuid4()),'original_object_key':'synthetic/'+str(i)}
            service.attach(db,id,asset,'proof')
        db.execute("UPDATE client_review_assets SET active=false,created_at=NOW()-INTERVAL '200 days' WHERE review_id=%s",(id,))
        db.execute("UPDATE client_reviews SET updated_at=NOW()-INTERVAL '200 days',version=version+1 WHERE id=%s",(id,))
    first=service.retention(apply=True);assert first['unusedAssets']==500 and first['rejectedRecords']==0
    second=service.retention(apply=True);assert second['unusedAssets']==1 and second['rejectedRecords']==1
    with pytest.raises(ReviewError):service.admin_get(id)
