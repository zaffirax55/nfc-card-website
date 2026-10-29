"""V6 lead tests use only newly-created synthetic SQLite databases and fake transports."""
import base64
import io
import json
import sqlite3
import subprocess
import sys
import uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

import pytest
from PIL import Image, PngImagePlugin

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / 'server'))
import leads
from leads import LeadService, LeadError, MockNotifier, maps_url, normalized_phone, business_url
from leads import normalize, fingerprint, request_key, telegram_message
from legacy import normalize_legacy, clean_logo
from pricing import load_commerce, canonical_quote
from adapters import TelegramAdapter, EmailAdapter


def payload(**updates):
    data = {
        'contractVersion': 6, 'requestToken': str(uuid.uuid4()), 'locale': 'uk',
        'name': 'Синтетична QA людина', 'phone': '+380 (00) 123-45-67',
        'messenger': 'telegram', 'differentContact': False, 'messengerContact': '',
        'variant': 'standard', 'quantity': '1', 'business': '', 'maps': '',
        'businessUrl': '', 'comment': '', 'consent': True,
        'source': '/solutions/review-card', 'attribution': {},
    }
    data.update(updates)
    return data


@pytest.fixture
def service(tmp_path):
    return LeadService(tmp_path / 'synthetic.sqlite', telegram=MockNotifier())


def stored(service, lead_id=None):
    with service.connect() as db:
        if lead_id:
            row = db.execute('SELECT payload FROM leads WHERE id=?', (lead_id,)).fetchone()
        else:
            row = db.execute('SELECT payload FROM leads').fetchone()
    return json.loads(row[0])


@pytest.mark.parametrize('locale', ['uk', 'en'])
@pytest.mark.parametrize('variant,quantity,expected', [
    ('standard', '1', 1500), ('standard', '2', 2600),
    ('branded', '1', 2000), ('branded', '2', 3600),
    ('standard', 'more', None), ('branded', 'more', None),
    ('bulk', 'more', None),
    ('consultation', '1', None), ('consultation', '2', None), ('consultation', 'more', None),
])
def test_all_canonical_price_combinations(service, locale, variant, quantity, expected):
    result = service.submit(payload(locale=locale, variant=variant, quantity=quantity,
                                    businessUrl='https://example.test/synthetic'))
    item = result['receipt']
    assert item['quote']['amount'] == expected
    assert item['quote']['status'] == ('custom' if expected is None else 'fixed')
    assert item['quote']['currency'] == 'UAH'
    assert item['quote']['deposit'] == 200 and item['quote']['depositIncluded'] is True
    assert item['variant'] == variant and item['quantity'] == quantity
    if expected:
        assert item['quote']['amount'] - item['quote']['deposit'] == expected - 200
    assert stored(service)['quote'] == item['quote']


def test_node_and_python_consume_identical_canonical_json():
    node = subprocess.run(['node', '--input-type=module', '-e',
        "import fs from 'node:fs';console.log(JSON.stringify(JSON.parse(fs.readFileSync('src/commerce.json','utf8'))));"],
        cwd=ROOT, capture_output=True, text=True, encoding='utf-8', check=True)
    assert json.loads(node.stdout) == load_commerce()


@pytest.mark.parametrize('mutate', [
    lambda c: c.update(currency='USD'),
    lambda c: c['variants']['standard']['prices'].update({'1': True}),
    lambda c: c['variants']['standard']['prices'].pop('2'),
    lambda c: c.update(depositIncluded=False),
    lambda c: c.update(schemaVersion=6.0),
])
def test_bad_commerce_fails_before_db_creation(tmp_path, mutate):
    config = load_commerce()
    mutate(config)
    path = tmp_path / 'bad-commerce.json'
    path.write_text(json.dumps(config), encoding='utf-8')
    db = tmp_path / 'must-not-exist.sqlite'
    with pytest.raises(ValueError):
        LeadService(db, commerce_path=path)
    assert not db.exists()


def test_missing_commerce_has_no_price_fallback(tmp_path):
    with pytest.raises(OSError):
        LeadService(tmp_path / 'db.sqlite', commerce_path=tmp_path / 'missing.json')


@pytest.mark.parametrize('price', [0, 1, -2000, '1 UAH', {'amount': 1}, None])
def test_client_displayed_price_never_controls_quote_or_fingerprint(service, price):
    data = payload(displayed_price=price)
    a = service.submit(data)
    b = service.submit({**data, 'displayed_price': 'tampered again'})
    assert a['receipt']['quote']['amount'] == 1500
    assert b['receipt']['id'] == a['receipt']['id'] and b['receipt']['duplicate']
    expected = str(price) if type(price) in (int, float) and price >= 0 else price if price == '1 UAH' else None
    assert stored(service)['displayed_price'] == expected
    assert stored(service)['quote']['amount'] == 1500


@pytest.mark.parametrize('url', [
    'https://maps.app.goo.gl/aBcD', 'https://goo.gl/maps/abc', 'https://g.page/example/review',
    'https://www.google.com/maps/place/Test', 'https://maps.google.com/?cid=1',
    'https://www.google.com.ua/maps?cid=1',
])
def test_official_short_and_long_maps_links(service, url):
    assert maps_url(url)
    assert service.submit(payload(maps=url))['ok']


@pytest.mark.parametrize('url', [
    'javascript:alert(1)', 'http://maps.app.goo.gl/abc', 'https://google.com.evil.test/maps',
    'https://maps.app.goo.gl@evil.test/a', 'https://evil@maps.app.goo.gl/a',
    'https://google.com/search?q=maps', 'https://goo.gl/anything',
    'https://maps.app.goo.gl:444/a', 'https://maps.app.goo.gl/',
])
def test_spoofed_maps_rejected(service, url):
    assert not maps_url(url)
    with pytest.raises(LeadError) as exc:
        service.submit(payload(maps=url))
    assert exc.value.fields == {'maps': 'maps'}


@pytest.mark.parametrize('value', ['+380 (00) 123-45-67', '0001234567', '+1 202 555 0100'])
def test_phone_normalization(value):
    assert normalized_phone(value).startswith('+')


@pytest.mark.parametrize('value', ['@test_only', 'qa@example.test', '', '123', True, [], '++380001234567'])
def test_phone_rejects_non_phone_contacts(value):
    assert normalized_phone(value) is None


@pytest.mark.parametrize('messenger,contact', [
    ('telegram', '@test_only'), ('telegram', 'https://t.me/test_only'),
    ('telegram', '+1 202 555 0100'), ('whatsapp', '+1 202 555 0100'),
    ('viber', '+1 202 555 0100'),
])
def test_conditional_contact(service, messenger, contact):
    result = service.submit(payload(messenger=messenger, differentContact=True, messengerContact=contact))
    assert stored(service, result['receipt']['id'])['messengerContact']


@pytest.mark.parametrize('messenger,contact', [
    ('telegram', ''), ('telegram', 'qa@example.test'), ('whatsapp', '@test_only'),
    ('viber', 'https://t.me/test_only'), ('viber', '123'),
])
def test_conditional_contact_rejects_wrong_format(service, messenger, contact):
    with pytest.raises(LeadError) as exc:
        service.submit(payload(messenger=messenger, differentContact=True, messengerContact=contact))
    assert 'messengerContact' in exc.value.fields


def test_hidden_stale_messenger_contact_cannot_override_phone(service):
    service.submit(payload(differentContact=False, messengerContact='@old_contact'))
    lead = stored(service)
    assert lead['messengerContact'] == lead['phone'] == '+380001234567'


@pytest.mark.parametrize('url', [
    'https://www.instagram.com/example_test/', 'https://example.test/business',
    'http://example.test/business?section=one',
])
def test_branded_business_url(service, url):
    assert business_url(url)
    assert service.submit(payload(variant='branded', businessUrl=url))['ok']


@pytest.mark.parametrize('url', ['', 'javascript:alert(1)', 'https://user:pass@example.test/', 'not-a-url'])
def test_branded_optional_business_url_is_validated_when_supplied(service, url):
    if not url:
        assert service.submit(payload(variant='branded',businessUrl=''))['ok'];return
    with pytest.raises(LeadError) as exc:
        service.submit(payload(variant='branded', businessUrl=url))
    assert 'businessUrl' in exc.value.fields


@pytest.mark.parametrize('field,value', [
    ('name', ''), ('phone', 'bad'), ('variant', 'counter-stand'), ('variant', 'team-kit'),
    ('variant', 'multi-location'), ('variant', 'invented'), ('quantity', '3'),
    ('quantity', 1), ('quantity', True), ('quantity', '0'), ('quantity', '1.5'),
    ('messenger', 'email'), ('consent', False), ('consent', 'true'),
    ('name', 'a' * 121), ('business', 'a' * 201), ('comment', 'a' * 2001),
    ('differentContact', 'false'), ('contractVersion', 6.0), ('contractVersion', True),
    ('requestToken', 'same-token'), ('requestToken', str(uuid.UUID(int=0))),
])
def test_invalid_inputs_never_create_lead(service, field, value):
    with pytest.raises(LeadError):
        service.submit(payload(**{field: value}))
    with service.connect() as db:
        assert db.execute('SELECT count(*) FROM leads').fetchone()[0] == 0


@pytest.mark.parametrize('field', ['locale', 'variant', 'quantity', 'messenger', 'requestToken'])
@pytest.mark.parametrize('value', [[], {}, None, False])
def test_non_scalar_contract_fields_are_client_errors(service, field, value):
    with pytest.raises(LeadError) as exc:
        service.submit(payload(**{field: value}))
    assert exc.value.status in {400, 422}


def test_optional_first_step_fields_are_optional(service):
    item = service.submit(payload())['receipt']
    assert item['id'].startswith('NFC-')
    assert set(item) == {'id', 'variant', 'quantity', 'quote', 'mode', 'duplicate'}


def test_primary_flow_rejects_files_without_decoding(service, monkeypatch):
    monkeypatch.setattr(leads, 'clean_logo', lambda _: pytest.fail('v6 must not decode uploads'))
    with pytest.raises(LeadError) as exc:
        service.submit(payload(logo={'type': 'image/png', 'data': 'invalid'}))
    assert exc.value.code == 'files_not_supported'


@pytest.mark.parametrize('quantity', ['1', '2'])
def test_bulk_quantity_contract_cannot_be_tampered(service, quantity):
    with pytest.raises(LeadError) as exc:
        service.submit(payload(variant='bulk', quantity=quantity))
    assert exc.value.fields == {'quantity': 'quantity'}


def test_unknown_fields_and_client_quote_are_not_accepted(service):
    for field in ['product', 'price', 'quote', 'currency', 'consentAcceptedAt']:
        with pytest.raises(LeadError) as exc:
            service.submit(payload(**{field: 'forged'}))
        assert exc.value.code == 'unsupported_fields'


def test_honeypot_fails_closed(service):
    with pytest.raises(LeadError) as exc:
        service.submit(payload(website='spam'))
    assert exc.value.code == 'spam_rejected'


def test_attribution_is_bounded_private_and_referrer_drops_query(service):
    marker = 'synthetic-private-campaign'
    result = service.submit(payload(attribution={
        'utm_campaign': marker,
        'referrer': 'https://example.test/landing?phone=synthetic#private',
        'landing': '/solutions', 'unrecognized': 'ignored',
    }))
    lead = stored(service)
    assert lead['attribution']['referrer'] == 'https://example.test/landing'
    assert lead['attribution']['utm_campaign'] == marker
    assert 'unrecognized' not in lead['attribution']
    assert marker not in json.dumps(result)


@pytest.mark.parametrize('attr', [
    [], {'utm_campaign': {}}, {'utm_campaign': 'a' * 201},
    {'referrer': 'https://user:password@example.test/a'}, {'landing': '//evil.test'},
])
def test_invalid_attribution(service, attr):
    with pytest.raises(LeadError) as exc:
        service.submit(payload(attribution=attr))
    assert exc.value.status == 422


def test_source_path_drops_query_or_unsafe_target(service):
    data = payload(source='//evil.test/?phone=synthetic')
    service.submit(data)
    assert stored(service)['source'] == '/'


def test_server_consent_version_timestamp_and_private_record(service):
    service.clock = lambda: 1000
    data = payload(comment='synthetic-private-comment', business='Synthetic business')
    result = service.submit(data)
    lead = stored(service)
    assert lead['consentVersion'] == leads.CONSENT_VERSION
    assert lead['consentAcceptedAt'] == '1970-01-01T00:16:40+00:00'
    assert lead['is_test'] is True
    assert not any(field in json.dumps(result) for field in
                   ['name', 'phone', 'messengerContact', 'comment', 'businessUrl', 'attribution'])
    assert 'synthetic-private-comment' not in json.dumps(result)


def test_durable_commit_precedes_notification(tmp_path):
    path = tmp_path / 'synthetic.sqlite'
    class VerifySaved:
        def send(self, lead_id, message):
            db = sqlite3.connect(path)
            try:
                lead = json.loads(db.execute('SELECT payload FROM leads WHERE id=?', (lead_id,)).fetchone()[0])
                assert lead['quote']['amount'] == 1500 and lead['consentAcceptedAt']
            finally:
                db.close()
            return 'mock'
    result = LeadService(path, telegram=VerifySaved()).submit(payload())
    assert result['ok'] and result['receipt']['mode'] == 'local_test'


def test_concurrent_independent_services_deduplicate(tmp_path):
    path = tmp_path / 'synthetic.sqlite'
    notifier = MockNotifier()
    services = [LeadService(path, telegram=notifier) for _ in range(6)]
    data = payload()
    with ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(lambda service: service.submit(data), services))
    assert len({r['receipt']['id'] for r in results}) == 1
    assert sum(not r['receipt']['duplicate'] for r in results) == 1
    assert len(notifier.calls) == 1
    with services[0].connect() as db:
        assert db.execute('SELECT count(*) FROM leads').fetchone()[0] == 1


def test_same_key_changed_payload_returns_409_and_preserves_record(service):
    data = payload()
    first = service.submit(data)
    with pytest.raises(LeadError) as exc:
        service.submit({**data, 'quantity': '2'})
    assert exc.value.status == 409
    assert stored(service, first['receipt']['id'])['quote']['amount'] == 1500


def test_retry_after_restart_price_change_and_new_clock_returns_stored_quote(tmp_path):
    path = tmp_path / 'synthetic.sqlite'
    notifier = MockNotifier()
    data = payload()
    first = LeadService(path, telegram=notifier, clock=lambda: 1000).submit(data)
    config = load_commerce()
    config['variants']['standard']['prices']['1'] = 1600
    config['revision'] = 'synthetic-revision-change'
    config_path = tmp_path / 'commerce.json'
    config_path.write_text(json.dumps(config), encoding='utf-8')
    second = LeadService(path, telegram=notifier, clock=lambda: 1100, commerce_path=config_path)
    replay = second.submit(data)
    assert replay['receipt']['id'] == first['receipt']['id']
    assert replay['receipt']['quote'] == first['receipt']['quote']
    assert replay['receipt']['duplicate']
    assert stored(second, first['receipt']['id'])['consentAcceptedAt'] == '1970-01-01T00:16:40+00:00'
    assert len(notifier.calls) == 1
    assert second.submit(payload())['receipt']['quote']['amount'] == 1600


def test_token_is_namespaced_server_hash(service):
    data = payload()
    service.submit(data)
    with service.connect() as db:
        idem, body = db.execute('SELECT idem,payload FROM leads').fetchone()
    assert idem == request_key(data) and idem.startswith('v6:')
    assert data['requestToken'] not in idem + body


def test_notification_failures_preserve_lead_and_do_not_retry(tmp_path):
    telegram, email = MockNotifier(True), MockNotifier(True)
    service = LeadService(tmp_path / 'synthetic.sqlite', telegram, email)
    data = payload()
    assert service.submit(data)['ok']
    assert service.submit(data)['receipt']['duplicate']
    assert len(telegram.calls) == len(email.calls) == 1
    with service.connect() as db:
        assert db.execute('SELECT notification FROM leads').fetchone()[0] == 'notifications_failed_lead_saved'


def test_email_fallback_only_uses_mock_once(tmp_path):
    telegram, email = MockNotifier(True), MockNotifier()
    service = LeadService(tmp_path / 'synthetic.sqlite', telegram, email)
    data = payload()
    service.submit(data)
    service.submit(data)
    assert len(email.calls) == len(telegram.calls) == 1
    with service.connect() as db:
        assert db.execute('SELECT notification FROM leads').fetchone()[0] == 'mock_email_fallback_accepted'


def test_unknown_notification_after_crash_is_never_resent(tmp_path, monkeypatch):
    service = LeadService(tmp_path / 'synthetic.sqlite', telegram=MockNotifier())
    def interrupted(lead_id, *_):
        with service.connect() as db:
            db.execute("UPDATE leads SET notification='attempting' WHERE id=?", (lead_id,))
        raise OSError('synthetic notification receipt loss')
    monkeypatch.setattr(service, 'dispatch', interrupted)
    data = payload()
    result = service.submit(data)
    assert result['ok']
    second = LeadService(service.db_path, telegram=MockNotifier())
    assert second.submit(data)['receipt']['duplicate']
    assert second.telegram.calls == []
    with second.connect() as db:
        assert db.execute('SELECT notification FROM leads').fetchone()[0] == 'attempting'


def test_invalid_attempts_rate_limited_before_normalization(tmp_path, monkeypatch):
    service = LeadService(tmp_path / 'synthetic.sqlite', rate_limit=2)
    for _ in range(2):
        with pytest.raises(LeadError):
            service.submit(payload(name=''))
    monkeypatch.setattr(leads, 'normalize', lambda _: pytest.fail('rate limit must run first'))
    with pytest.raises(LeadError) as exc:
        service.submit(payload())
    assert exc.value.status == 429


def test_existing_key_retries_have_durable_bounded_bucket(tmp_path, monkeypatch):
    service = LeadService(tmp_path / 'synthetic.sqlite', rate_limit=2, clock=lambda: 1000)
    data = payload()
    service.submit(data)
    for _ in range(20):
        with pytest.raises(LeadError):
            service.submit({**data, 'name': ''})
    second = LeadService(service.db_path, rate_limit=2, clock=lambda: 1000)
    monkeypatch.setattr(leads, 'normalize', lambda _: pytest.fail('retry limit must run first'))
    with pytest.raises(LeadError) as exc:
        second.submit(data)
    assert exc.value.status == 429


def test_new_bucket_durable_and_expired_window_reopens(tmp_path):
    now = [1000]
    service = LeadService(tmp_path / 'synthetic.sqlite', clock=lambda: now[0], rate_limit=1)
    data = payload()
    service.submit(data)
    other = LeadService(service.db_path, clock=lambda: now[0], rate_limit=1)
    assert other.submit(data)['receipt']['duplicate']
    with pytest.raises(LeadError) as exc:
        other.submit(payload())
    assert exc.value.status == 429
    now[0] += 61
    assert other.submit(payload())['ok']


def make_logo():
    image = Image.new('RGB', (12, 12), 'white')
    meta = PngImagePlugin.PngInfo()
    meta.add_text('Private', 'synthetic metadata')
    stream = io.BytesIO()
    image.save(stream, format='PNG', pnginfo=meta)
    return {'name': '../../synthetic.png', 'type': 'image/png',
            'data': base64.b64encode(stream.getvalue()).decode()}


def legacy_payload(**updates):
    data = {'kind': 'order', 'locale': 'uk', 'language': 'uk', 'name': 'Legacy synthetic',
            'business': 'Synthetic old business', 'product': 'team-kit', 'quantity': '3',
            'city': 'Synthetic', 'maps': 'https://maps.app.goo.gl/TESTONLY',
            'contact': 'qa@example.test', 'consent': True, 'source': '/solutions/team-kit',
            'idempotencyKey': uuid.uuid4().hex}
    data.update(updates)
    return data


def seed_legacy(path, data, notification='attempting'):
    key, old, logo = normalize_legacy(data)
    body = json.dumps(old, sort_keys=True, ensure_ascii=False, separators=(',', ':'))
    lead_id = 'NFC-' + 'A' * 20
    db = sqlite3.connect(path)
    try:
        db.executescript("""
        CREATE TABLE leads(id TEXT PRIMARY KEY, idem TEXT UNIQUE NOT NULL, fingerprint TEXT NOT NULL, created REAL NOT NULL, payload TEXT NOT NULL, notification TEXT NOT NULL DEFAULT 'pending');
        CREATE TABLE logos(lead_id TEXT PRIMARY KEY REFERENCES leads(id), mime TEXT NOT NULL, content BLOB NOT NULL);
        CREATE TABLE rate_hits(client TEXT NOT NULL, created REAL NOT NULL);
        CREATE INDEX rate_client ON rate_hits(client,created);
        """)
        db.execute('INSERT INTO leads VALUES(?,?,?,?,?,?)',
                   (lead_id, key, fingerprint(old), 500, body, notification))
        if logo:
            db.execute('INSERT INTO logos VALUES(?,?,?)', (lead_id, logo['mime'], logo['bytes']))
        db.commit()
    finally:
        db.close()
    return lead_id


def database_records(path):
    db = sqlite3.connect(path)
    try:
        return (db.execute('SELECT * FROM leads ORDER BY id').fetchall(),
                db.execute('SELECT * FROM logos ORDER BY lead_id').fetchall())
    finally:
        db.close()


def test_legacy_rows_logos_keys_and_notification_preserved_exactly(tmp_path):
    path = tmp_path / 'legacy-synthetic.sqlite'
    data = legacy_payload(logo=make_logo())
    lead_id = seed_legacy(path, data)
    before = database_records(path)
    service = LeadService(path, telegram=MockNotifier())
    retry = service.submit(data)
    assert retry['leadId'] == lead_id and retry['duplicate']
    assert retry['receipt']['variant'] is None and retry['receipt']['quote'] is None
    assert database_records(path) == before
    assert service.telegram.calls == []
    v6 = service.submit(payload())
    assert v6['receipt']['quote']['amount'] == 1500
    after = database_records(path)
    assert before[0][0] in after[0] and before[1] == after[1]


def test_changed_legacy_retry_conflicts_without_new_row(tmp_path):
    path = tmp_path / 'legacy-synthetic.sqlite'
    data = legacy_payload()
    seed_legacy(path, data)
    before = database_records(path)
    service = LeadService(path)
    with pytest.raises(LeadError) as exc:
        service.submit({**data, 'quantity': '4'})
    assert exc.value.status == 409 and database_records(path) == before


def test_fresh_legacy_requests_rejected_before_logo_decoding(service, monkeypatch):
    monkeypatch.setattr(leads, 'normalize_legacy', lambda _: pytest.fail('No fresh legacy normalization'))
    with pytest.raises(LeadError) as exc:
        service.submit(legacy_payload(logo=make_logo()))
    assert exc.value.code == 'legacy_contract_retired'


def test_legacy_decoder_still_strips_metadata_for_comparison():
    assert b'synthetic metadata' not in clean_logo(make_logo())['bytes']


def test_long_unicode_notification_bounded_and_full_record_retained(service):
    data = payload(comment='😀' * 2000, business='b' * 200)
    result = service.submit(data)
    lead = stored(service)
    message = telegram_message(result['receipt']['id'], 0, lead)
    assert len(message.encode('utf-16-le')) // 2 <= 4096
    assert lead['comment'] == data['comment']
    assert 'full record retained privately' in message


def test_prod_adapters_fail_closed_without_authorization():
    class Forbidden:
        def __getattr__(self, name):
            raise AssertionError('No network in tests')
    for adapter in [TelegramAdapter('fake', 'fake', Forbidden()),
                    EmailAdapter('qa@example.test', Forbidden())]:
        with pytest.raises(RuntimeError, match='NOT_AUTHORIZED'):
            adapter.send('id', 'message')


def test_transports_are_injected_fakes_only():
    class Fake:
        def post_json(self, url, body, timeout):
            assert body['text'] == '<not markup>' and 'parse_mode' not in body
            return {'ok': True}
        def send_text(self, **kwargs):
            assert kwargs['to'] == 'qa@example.test'
            return True
    assert TelegramAdapter('fake', 'fake', Fake(), authorized=True).send('id', '<not markup>') == 'accepted'
    assert EmailAdapter('qa@example.test', Fake(), authorized=True).send('id', 'body') == 'accepted'
