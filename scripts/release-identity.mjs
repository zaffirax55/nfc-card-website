/** Source identity comes from the resolved storefront checkout, never the caller workflow. */
export function releaseIdentity({head,env=process.env}){
 const full=value=>typeof value==='string'&&/^[a-f0-9]{40}$/.test(value);
 if(!full(head))throw Error('exact_storefront_commit_required');
 if(env.NFC_RELEASE_COMMIT&&env.NFC_RELEASE_COMMIT!==head)throw Error('release_commit_checkout_mismatch');
 const publisherWorkflowCommit=env.NFC_PUBLISHER_WORKFLOW_COMMIT||null;
 if(publisherWorkflowCommit&&(!full(publisherWorkflowCommit)||publisherWorkflowCommit!==env.GITHUB_SHA))throw Error('publisher_workflow_identity_mismatch');
 return {commit:head,publisherWorkflowCommit};
}
