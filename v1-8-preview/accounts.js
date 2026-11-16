/* Dex Budget v1.7 — email sign-in and opt-in private cloud snapshots.
   Client key is public. Never put a Supabase service_role/secret key in this app.
   SQL row-level security must be deployed before account backups are enabled. */
(() => {
  'use strict';
  const cfg=window.DEX_CLOUD_CONFIG||{};
  const ready=/^https:\/\/[^/\s]+\.supabase\.co\/?$/.test(cfg.url||'') &&
    typeof cfg.publishableKey==='string' && cfg.publishableKey.length>12 &&
    !/service.role|sb_secret_/i.test(cfg.publishableKey);
  const $=id=>document.getElementById(id);
  const ACCOUNT_PREFIX='dex_budget_account_v1_';
  const WELCOME_KEY='dex_account_welcome_seen_v17';
  let client=null,user=null,remote=null,revision=0,active=false,blocked=false,dirty=false,loading=false;
  let syncTimer=null,cloudMsg='Local-device mode';
  let currentKey=null;
  function setMessage(msg,level='neutral'){
    cloudMsg=msg;
    const x=$('accountInfo');x.textContent=msg;x.dataset.level=level;
    $('accountCloudStatus').textContent=msg;
  }
  function signedIn(){return !!user && active}
  function refreshUI(){
    $('accountIndicator').textContent=signedIn()?'Signed in · cloud account':user?'Account selection needed':ready?'Cloud sign-in available':'Local device · cloud not configured';
    $('accountSignedOut').classList.toggle('hidden',!!user);
    $('accountSignedIn').classList.toggle('hidden',!signedIn());
    if(user)$('accountEmailLabel').textContent=user.email||'Verified account';
  }
  function isBudget(v){return !!v&&v.version===1&&Array.isArray(v.transactions)&&Array.isArray(v.bills)&&Array.isArray(v.approvals)&&Number.isSafeInteger(v.startingCash)}
  function readLocal(k){try{const x=JSON.parse(localStorage.getItem(k));return isBudget(x)?x:null}catch{return null}}
  function hasBudget(x){return !!x&&(x.setupComplete||x.transactions.length>0||x.bills.length>0||x.startingCash!==0)}
  function showSignIn(){
    if(!ready){setMessage('Secure cloud sign-in is not set up yet. You can keep budgeting on this device; no account data is uploaded.');return;}
    $('signInStatus').textContent='You will receive a one-time email sign-in link.';
    if(!$('signInDialog').open)$('signInDialog').showModal();
  }
  function closeSignIn(){if($('signInDialog').open)$('signInDialog').close()}
  function loadSDK(){
    if(window.supabase&&window.supabase.createClient)return Promise.resolve();
    return new Promise((resolve,reject)=>{
      const el=document.createElement('script');el.src='https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2';
      el.crossOrigin='anonymous';el.async=true;el.onload=()=>window.supabase?.createClient?resolve():reject(Error('The sign-in library was unavailable.'));
      el.onerror=()=>reject(Error('Could not load secure sign-in. Check your connection.'));document.head.appendChild(el);
    });
  }
  async function getClient(){
    if(!ready)throw Error('Cloud sign-in is not configured.');
    if(client)return client;
    await loadSDK();
    client=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{autoRefreshToken:true,persistSession:true,detectSessionInUrl:true},global:{headers:{'X-Client-Info':'dex-budget-v1.7'}}});
    return client;
  }
  async function sendLink(){
    const email=$('signInEmail').value.trim();
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){$('signInStatus').textContent='Enter a valid email address.';return;}
    const btn=$('sendSignIn');btn.disabled=true;$('signInStatus').textContent='Preparing a sign-in link…';
    try{
      const c=await getClient(),redirectTo=new URL('./',location.href).href;
      const {error}=await c.auth.signInWithOtp({email,options:{emailRedirectTo:redirectTo}});
      if(error)throw error;
      $('signInStatus').textContent='Check your email for a sign-in link. The link only works with this project’s allowed website address.';
    }catch(e){$('signInStatus').textContent=e.message||'Email sign-in unavailable.';}finally{btn.disabled=false;}
  }
  async function verifyCode(){
    const email=$('signInEmail').value.trim(),token=$('signInCode').value.trim();
    if(!/^[0-9]{6}$/.test(token)){$('signInStatus').textContent='Enter the six-digit code from your email, if one was provided.';return;}
    const btn=$('verifySignInCode');btn.disabled=true;
    try{const c=await getClient();const {data,error}=await c.auth.verifyOtp({email,token,type:'email'});if(error)throw error;closeSignIn();await activateUser(data.user);}catch(e){$('signInStatus').textContent=e.message||'Could not verify that code.';}finally{btn.disabled=false;}
  }
  async function fetchRemote(){
    const c=await getClient();
    const {data,error}=await c.from('dex_budget_snapshots').select('payload,revision,updated_at').eq('user_id',user.id).maybeSingle();
    if(error)throw error;
    remote=data||null;
    if(data && !isBudget(data.payload))throw Error('The cloud backup has an unsupported format. Export your local data before continuing.');
  }
  function accountKey(){return ACCOUNT_PREFIX+user.id}
  function useAccountData(next,rev){
    if(!isBudget(next))throw Error('This backup is not compatible with Dex.');
    KEY=accountKey();currentKey=KEY;
    state=typeof structuredClone==='function'?structuredClone(next):JSON.parse(JSON.stringify(next));
    state.appearance=normalizeAppearance(state.appearance);
    revision=rev;active=true;blocked=false;dirty=false;
    localStorage.setItem(KEY,JSON.stringify(state));
    applyAppearance();fillSettings();render();renderAppearance();
    setMessage(revision>0?'Account budget opened. Cloud backup connected.':'Account budget opened. Preparing first backup.','success');
    refreshUI();
  }
  function showChoice(){
    const accountLocal=readLocal(accountKey()),guest=readLocal(GUEST_KEY);
    const hasRemote=!!remote;
    $('cloudDecisionTitle').textContent=hasRemote?'Choose your budget copy':'Choose where to begin';
    $('cloudDecisionText').textContent=hasRemote?`Your cloud copy was saved ${new Date(remote.updated_at).toLocaleString()}. Dex will not replace your device’s entries without permission.`:'You can copy a budget from this device into your new account, or start fresh.';
    $('useCloudCopy').disabled=!hasRemote;
    $('useCloudCopy').textContent=hasRemote?'Open cloud backup':'No cloud backup yet';
    $('useDeviceCopy').textContent=hasBudget(accountLocal)?'Use my previous account copy':hasBudget(guest)?'Copy this device’s budget':'Start a new budget';
    $('deviceCopyDescription').textContent=hasBudget(accountLocal)?'Use the last account copy saved on this device.':hasBudget(guest)?'Keep the original device budget in place and create an account copy.':'Begin with a new account budget.';
    $('cloudDecision').showModal();
  }
  async function activateUser(incoming){
    if(!incoming?.id)return;
    user=incoming;active=false;remote=null;revision=0;refreshUI();setMessage('Checking your private cloud backup…');
    try{await fetchRemote();showChoice();}catch(e){setMessage('Account is verified, but secure backup could not be opened. Check the database setup and your internet connection: '+e.message,'error');showChoice();}
  }
  async function backupNow(){
    if(!signedIn()||!client||loading||blocked)return;
    if(!dirty&&revision>0){setMessage('Your account backup is up to date.','success');return;}
    loading=true;setMessage('Saving your budget to your private account…');
    try{
      const payload=readLocal(KEY);
      if(!payload)throw Error('Local account data could not be read.');
      const originalSnapshot=JSON.stringify(payload);
      if(originalSnapshot.length>900000)throw Error('Backup too large for this beta. Export a local backup and contact support.');
      const query=client.from('dex_budget_snapshots');
      let result;
      if(revision===0){result=await query.insert({user_id:user.id,payload,revision:1}).select('revision,updated_at').single();}
      else {result=await query.update({payload,revision:revision+1,updated_at:new Date().toISOString()}).eq('user_id',user.id).eq('revision',revision).select('revision,updated_at');}
      if(result.error)throw result.error;
      const row=Array.isArray(result.data)?result.data[0]:result.data;
      if(!row) {blocked=true;throw Error('A newer backup exists on the server. Auto-sync paused to prevent overwriting it. Use Restore cloud copy after exporting your current budget.');}
      revision=row.revision;
      // If changed again during this request, keep the latest unsaved local version dirty.
      dirty=JSON.stringify(readLocal(KEY))!==originalSnapshot;
      setMessage(dirty?'Saved one revision; newer changes are waiting.':'Cloud backup saved.','success');
    }catch(e){dirty=true;setMessage('Backup not confirmed: '+(e.message||'Connection unavailable')+'. Your local data is still here.','error');}
    finally{loading=false;if(dirty&&!blocked)queueSync(2000);}
  }
  function queueSync(wait=1400){
    if(!signedIn()||blocked)return;
    clearTimeout(syncTimer);
    syncTimer=setTimeout(()=>backupNow(),wait);
  }
  function onBudgetChanged(){if(!signedIn())return;dirty=true;setMessage('Changes saved on this device. Cloud backup pending.');queueSync();}
  async function selectCloud(){
    if(!remote)return;
    try{useAccountData(remote.payload,remote.revision);$('cloudDecision').close();setMessage('Cloud backup restored. Other device copies were not deleted.','success');}catch(e){setMessage(e.message,'error');}
  }
  function selectDevice(){
    const localAccount=readLocal(accountKey()),guest=readLocal(GUEST_KEY);
    const candidate=localAccount||guest||defaultState();
    if(remote&&!confirm('Replace the cloud backup with this device’s copy? If you are unsure, choose cloud copy instead.'))return;
    try{useAccountData(candidate,remote?.revision||0);$('cloudDecision').close();dirty=true;queueSync(100);}
    catch(e){setMessage(e.message,'error');}
  }
  async function signOut(){
    if(!user)return;
    if((dirty||blocked) && !confirm('Your latest account changes may not be backed up. Export a local backup before signing out. Continue?'))return;
    const oldKey=accountKey();clearTimeout(syncTimer);
    try{await client.auth.signOut();}catch(e){setMessage('Could not sign out: '+e.message,'error');return;}
    localStorage.removeItem(oldKey); // protect sensitive account copy on shared devices
    KEY=GUEST_KEY;currentKey=null;user=null;remote=null;active=false;dirty=false;revision=0;blocked=false;
    state=readLocal(KEY)||defaultState();state.appearance=normalizeAppearance(state.appearance);
    applyAppearance();fillSettings();render();renderAppearance();refreshUI();setMessage('Signed out. The account’s local copy was cleared from this device. Your guest budget remains.');
  }
  async function restoreCloud(){
    if(!signedIn())return;
    if(dirty&&!confirm('You have unsaved device changes. Restoring the cloud copy will replace this account’s local copy. Continue?'))return;
    try{await fetchRemote();if(!remote)throw Error('No backup found.');useAccountData(remote.payload,remote.revision);setMessage('Restored your cloud copy.','success');}
    catch(e){setMessage('Unable to restore: '+e.message,'error');}
  }
  async function init(){
    refreshUI();
    if(!ready){setMessage('Cloud accounts are not connected to a Supabase project yet. Your data is currently stored only in this browser.');return;}
    try{
      const c=await getClient();
      const current=await c.auth.getSession();
      if(current.error)throw current.error;
      if(!current.data.session){setMessage('Cloud sign-in is available. Your current budget remains local until you sign in.');return;}
      const {data,error}=await c.auth.getUser();
      if(error)throw error;
      if(data.user){await activateUser(data.user);}
      else setMessage('Cloud sign-in is available. Your current budget remains local until you sign in.');
    }catch(e){setMessage('Could not check your account: '+e.message,'error');}
  }
  $('accountSignIn').onclick=showSignIn;
  $('sendSignIn').onclick=sendLink;
  $('verifySignInCode').onclick=verifyCode;
  $('closeSignIn').onclick=closeSignIn;
  $('useCloudCopy').onclick=selectCloud;
  $('useDeviceCopy').onclick=selectDevice;
  $('cancelCloudDecision').onclick=async ()=>{if($('cloudDecision').open)$('cloudDecision').close();if(client)await client.auth.signOut().catch(()=>{});user=null;active=false;remote=null;refreshUI();setMessage('Continuing with your local budget. No cloud copy was changed.');};
  $('accountBackupNow').onclick=()=>{dirty=true;backupNow()};
  $('accountRestoreCloud').onclick=restoreCloud;
  $('accountSignOut').onclick=signOut;
  const welcome=$('accountWelcome');
  function closeWelcome(openTutorial){localStorage.setItem(WELCOME_KEY,'1');welcome.close();if(openTutorial && !localStorage.getItem('dex_guided_quest_seen_v1') && window.DexGuidedQuest)window.DexGuidedQuest.open();}
  $('welcomeGuest').onclick=()=>closeWelcome(true);
  $('welcomeAccount').onclick=()=>{closeWelcome(false);showTab('more');showMoreSection('account');showSignIn();};
  const emptyGuest=!hasBudget(readLocal(GUEST_KEY));
  window.addEventListener('load',()=>{
    if(emptyGuest&&!localStorage.getItem(WELCOME_KEY)&&!localStorage.getItem('dex_account_welcome_seen_v17')&&!document.querySelector('#practiceTutorial[open]'))welcome.showModal();
  },{once:true});
  // Account backup is independent of the guided tutorial and ambient audio.
  window.DexAccounts={refreshUI,onBudgetChanged,status:()=>({available:ready,signedIn:signedIn(),dirty,revision,blocked})};
  init();
})();
