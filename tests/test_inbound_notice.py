"""The existing phone and messenger form keeps a request-scoped notice marker."""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]


def test_existing_form_payloads_have_versioned_request_consent_and_no_email():
    source = r"""
      import assert from 'node:assert/strict';
      import {leadPayload} from './src/pages.mjs';
      import {menuLeadPayload} from './src/menu-client.mjs';
      import {review3dLeadPayload} from './src/review3d-client.mjs';
      const common={locale:'uk',name:'Synthetic Staging Buyer',phone:'+380671234567',messenger:'viber',consent:true,website:''};
      const cases=[
        leadPayload({...common,variant:'standard',quantity:'2'},{basePath:'/nfc-card-website',pathname:'/nfc-card-website/order'}),
        menuLeadPayload({...common,intent:'card_order',menu_status:'needs_development',items:[{variant_id:'square_100_black',quantity:1}]},{basePath:'/nfc-card-website',pathname:'/nfc-card-website/solutions/menu-card'}),
        review3dLeadPayload({...common,quantity:'1'},{basePath:'/nfc-card-website',pathname:'/nfc-card-website/solutions/review-card-3d'})
      ];
      for(const lead of cases){
        assert.equal(lead.contact.phone,'+380671234567');
        assert.equal(lead.contact.preferredMethod,'viber');
        assert.equal(lead.contact.email,undefined);
        assert.equal(lead.consent,true);
        assert.equal(lead.formVersion,'NFC-CARD-FORM-V34');
        assert.equal(lead.privacyNoticeVersion,'NFC-CARD-PRIVACY-V34');
      }
    """
    subprocess.run(["node", "--input-type=module", "-e", source], cwd=ROOT,
                   check=True, capture_output=True, text=True)
