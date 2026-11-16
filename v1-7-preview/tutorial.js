/* Dex Guided Quest v1.6 — practice-only, independent of the real finance ledger. */
(() => {
  'use strict';
  const KEY_SEEN = 'dex_guided_quest_v1_6_seen';
  const KEY_DONE = 'dex_guided_quest_v1_6_completed';
  const modal = document.getElementById('practiceTutorial');
  const stage = document.getElementById('missionStage');
  const feedback = document.getElementById('missionFeedback');
  const advance = document.getElementById('missionContinue');
  const back = document.getElementById('missionBack');
  const exit = document.getElementById('missionExit');
  if (!modal || !stage || !feedback || !advance || !back || !exit) return;
  const $ = id => document.getElementById(id);
  const money = cents => (cents / 100).toLocaleString('en-US', {style:'currency', currency:'USD'});
  const initial = () => ({mode:null,cash:0,rent:0,rentMonthly:false,pay:0,groceries:0,rentProtected:false});
  let session = initial(), passed = new Set(), lesson = 0;
  const cashNow = () => session.cash + session.pay - session.groceries;
  const remaining = () => Math.max(0, cashNow() - (session.rentProtected ? session.rent : 0));
  const guidance = [
    'Try the example. No personal information is needed.',
    'The sample worker has unpredictable pay from gigs. Which income type fits?',
    'This is money you have right now—not the money you hope to make next week.',
    'Rent is an upcoming obligation. Knowing the date and repeat cycle helps Dex plan.',
    'A paycheck counts only after you actually receive it.',
    'Recording spending keeps your budget aligned with what really happened.',
    'Having money in an account does not mean it is free to spend.'
  ];
  function block(label,value,accent=false){return `<div><span>${label}</span><strong${accent?' class="accent"':''}>${money(value)}</strong></div>`;}
  function ledger(kind='basic'){
    const rows=[block('Tracked practice cash',cashNow(),true)];
    if(session.rent){
      rows.push(block('Rent due in 7 days',session.rent));
      if(session.rentProtected){rows.push(block('Reserved for rent',session.rent));rows.push(block('Unassigned before other costs',remaining(),true));}
      else rows.push(block('Rent not yet reserved',session.rent));
    }
    return `<div class="mission-ledger" aria-label="Practice budget example">${rows.join('')}</div>`;
  }
  function explain(html){return `<div class="mission-explain"><strong aria-hidden="true">ⓘ</strong><div>${html}</div></div>`;}
  function inputMission(title,prompt,inputId,button,extra=''){
    return `<span class="mission-eyebrow">Practice · do this yourself</span><h2 id="missionTitle">${title}</h2><p id="missionDescription">${prompt}</p><div class="mission-demo"><span class="mission-demo-label">Dex practice</span>${extra}<label for="${inputId}">Amount in dollars</label><div class="mission-entry"><input id="${inputId}" inputmode="decimal" type="number" min="0" step="0.01" placeholder="0.00" aria-label="Amount in dollars"><button type="button" data-practice="${inputId}">${button}</button></div></div>`;
  }
  function drawScreen(){
    switch(lesson){
      case 0: return `<span class="mission-eyebrow">Welcome to your first apartment budget</span><h2 id="missionTitle">Learn Dex by actually using it.</h2><p id="missionDescription">Six short missions. You'll practice with pretend money: a rent bill, gig income, a grocery trip, and a real-world decision. Nothing you enter here changes your real budget.</p><div class="mission-demo"><span class="mission-demo-label">Your practice scenario</span><h3>One week before rent</h3><div class="mission-ledger">${block('Money you start with',60000,true)}${block('Rent due soon',65000)}${block('Extra gig income later',15000)}${block('A grocery run',3500)}</div></div>${explain('There are no scores, streaks, or penalties. If something doesn’t make sense, Dex explains it and lets you try again.')}`;
      case 1: return `<span class="mission-eyebrow">Mission 1 · Income</span><h2 id="missionTitle">Choose how you get paid.</h2><p id="missionDescription">Imagine you're doing delivery shifts. Some days pay more than others, and you don't get an identical paycheck on schedule. Which mode should you choose?</p><div class="mission-demo"><span class="mission-demo-label">Choose one</span><button class="mission-choice${session.mode==='variable'?' selected':''}" type="button" data-choose="variable"><span><b>Variable income</b><small>Gig work, tips, changing shifts, freelance pay</small></span><span class="mission-check">${session.mode==='variable'?'✓':'○'}</span></button><button class="mission-choice" type="button" data-choose="regular"><span><b>Regular income</b><small>Paycheck arrives on a predictable schedule</small></span><span class="mission-check">○</span></button></div>${explain('Both are valid in real life. For this scenario, Variable is the right fit. Dex records the pay mode you select. Full paycheck forecasting is not included in this beta yet.')}`;
      case 2: return inputMission('Start with the money you already have.','Your practice checking balance is $600. Enter that amount below, as if you were setting up Dex for the first time.','practiceCash','Save cash')+explain('This is your current balance, not this month’s predicted earnings.')+(passed.has(2)?ledger():'');
      case 3: return `<span class="mission-eyebrow">Mission 3 · Bills</span><h2 id="missionTitle">Add an upcoming rent bill.</h2><p id="missionDescription">Your practice apartment rent is $650. It's due in seven days and repeats every month. Tell Dex what the bill looks like.</p><div class="mission-demo"><span class="mission-demo-label">Add a recurring bill</span><label for="practiceRent">Rent amount ($)</label><input id="practiceRent" type="number" inputmode="decimal" min="0" step="0.01" placeholder="650.00"><label for="practiceRepeat">How often do you pay it?</label><select id="practiceRepeat"><option value="">Select frequency</option><option value="once">One time</option><option value="monthly">Every month</option></select><div style="height:12px"></div><button type="button" data-practice="practiceRent">Add practice bill</button></div>${explain('The bill has a due date so you can protect it before spending optional money. Dex won’t pay the bill for you.')}${passed.has(3)?ledger():''}`;
      case 4: return inputMission('Record income when it arrives.','Your practice delivery shift paid $150 today. Enter that as income—money that has actually arrived.','practicePay','Add income')+explain('Expected work tomorrow is only a forecast; do not add it to cash yet.')+(passed.has(4)?ledger():'');
      case 5: return inputMission('Log what you spent.','You bought groceries for $35. Enter that purchase so Dex can subtract it from the tracked cash.','practiceGroceries','Log expense')+explain('Groceries are an essential expense, not a personal failure. The purpose is to keep your numbers honest.')+(passed.has(5)?ledger():'');
      case 6: return `<span class="mission-eyebrow">Mission 6 · Make a decision</span><h2 id="missionTitle">Protect what needs to be paid.</h2><p id="missionDescription">After your gig shift and groceries, the practice account holds ${money(cashNow())}. Rent is ${money(session.rent)} and due in seven days. What is the best next step?</p>${ledger()}<div class="mission-demo"><span class="mission-demo-label">Choose your next action</span><button class="mission-choice${session.rentProtected?' selected':''}" data-choose="protect" type="button"><span><b>Reserve ${money(session.rent)} for rent</b><small>Check other essentials before spending what remains</small></span><span class="mission-check">${session.rentProtected?'✓':'○'}</span></button><button class="mission-choice" data-choose="spend" type="button"><span><b>Spend $100 for fun</b><small>It's in checking, so it should be fine</small></span><span class="mission-check">○</span></button><button class="mission-choice" data-choose="ignore" type="button"><span><b>Ignore rent until the due date</b><small>Deal with it when the payment is due</small></span><span class="mission-check">○</span></button></div>${explain('Protecting a bill in Dex is a planning allocation—not an actual transfer or bill payment. The remaining cash may still need to cover food, transportation, or taxes.')}`;
      default: return `<span class="mission-eyebrow">All six missions complete</span><h2 id="missionTitle">You know the basics.</h2><p id="missionDescription">You practiced tracking sample cash, bills, income, and spending, then made a decision using the numbers rather than guesswork.</p><div class="mission-celebrate">Practice complete ✓</div><div class="mission-demo"><span class="mission-demo-label">Your final practice picture</span>${ledger()}<div class="mission-highlight" style="margin-top:12px">${money(remaining())} is left after reserving rent, <strong>before other necessary costs</strong>. It isn't automatically all spending money.</div></div><p>You can now create your own budget, or reopen this tutorial whenever you need a refresher.</p>${explain('This was all pretend money. Dex did not record any actual payments, bills, or transactions.')}`;
    }
  }
  function message(text,variant='neutral'){
    feedback.textContent=text;feedback.className='mission-feedback'+(variant==='success'?' success':variant==='note'?' note':'');
  }
  function render(){
    stage.innerHTML=drawScreen();
    $('missionIndex').textContent=lesson===0?'Welcome':lesson===7?'Practice complete':`Mission ${lesson} · ${['','Income','Starting cash','Bills','Payday','Expenses','Priorities'][lesson]}`;
    $('missionFraction').textContent=lesson===7?'6 of 6':`${Math.max(0,lesson)} of 6`;
    $('missionProgress').innerHTML=Array.from({length:6},(_,i)=>`<span class="mission-segment${lesson>i+1?' done':lesson===i+1?' current':''}" aria-hidden="true"></span>`).join('');
    back.disabled=lesson===0||lesson===7;back.textContent='Back';
    advance.disabled=lesson>0&&lesson<7&&!passed.has(lesson);
    advance.innerHTML=lesson===0?'Begin practice <span aria-hidden="true">→</span>':lesson===7?'Set up my real budget <span aria-hidden="true">→</span>':`Continue <span aria-hidden="true">→</span>`;
    message(lesson===7?'The practice is finished. Your real budget is unchanged.':lesson===0?'You can exit or restart the tutorial at any time.':passed.has(lesson)?'Practice action completed. You can continue.':guidance[lesson],passed.has(lesson)?'success':'neutral');
    // Keep input elements ready for keyboard and assistive technologies.
    const input=stage.querySelector('input');if(input && lesson>0 && lesson<7 && !passed.has(lesson)) input.focus({preventScroll:true});
    modal.scrollTop=0;
  }
  function accept(text){passed.add(lesson);render();message(text,'success');}
  function checkAmount(id,expected){
    const el=$(id); const input=Number(el?.value);
    if(!el || !el.value.trim() || !Number.isFinite(input) || input<0){message('Enter the amount shown in the example, then try again.','note');return false;}
    if(Math.round(input*100)!==expected){message(`For this practice example, enter ${money(expected)}. When you set up your own budget, use your actual amount.`,'note');el.focus();return false;}
    return true;
  }
  stage.addEventListener('click',event=>{
    const choice=event.target.closest('[data-choose]');
    if(choice){
      const value=choice.dataset.choose;
      if(lesson===1){
        if(value==='variable'){session.mode='variable';accept('Exactly. This sample worker earns a different amount on different days.');}
        else message('A regular paycheck can work for other users. In this example, earnings change day to day, so try Variable income.','note');
      }else if(lesson===6){
        if(value==='protect'){session.rentProtected=true;accept('Good decision. Rent is reserved in the practice plan. The remaining $65 may still be needed for other essentials.');}
        else message(value==='spend'?'$100 would leave less than the $650 rent obligation. Protect the upcoming bill first.':'Waiting until the due date increases the chance that bill money gets spent. Try protecting rent now.','note');
      }
      return;
    }
    const action=event.target.closest('[data-practice]');if(!action) return;
    switch(action.dataset.practice){
      case 'practiceCash': if(checkAmount('practiceCash',60000)){session.cash=60000;accept('You recorded $600 of cash you actually have.');}break;
      case 'practiceRent': {
        if(!checkAmount('practiceRent',65000))return;
        if($('practiceRepeat').value!=='monthly'){message('Rent repeats every month in this example. Select “Every month” before adding it.','note');return;}
        session.rent=65000;session.rentMonthly=true;accept('Rent added for $650 per month. It is not paid or reserved yet.');break;
      }
      case 'practicePay': if(checkAmount('practicePay',15000)){session.pay=15000;accept('Income recorded. Your practice cash rose from $600 to $750.');}break;
      case 'practiceGroceries': if(checkAmount('practiceGroceries',3500)){session.groceries=3500;accept('Groceries recorded. Tracked cash is now $715.');}break;
    }
  });
  stage.addEventListener('keydown',e=>{
    if(e.key==='Enter'&&e.target.matches('input')){
      e.preventDefault();const action=stage.querySelector('button[data-practice]');if(action)action.click();
    }
  });
  function close(){localStorage.setItem(KEY_SEEN,'1');modal.close();}
  function open(){
    session=initial();passed=new Set();lesson=0;render();
    if(!modal.open) modal.showModal();
  }
  function realSetup(){
    localStorage.setItem(KEY_DONE,'1');close();
    if(typeof showTab==='function') showTab('plan');
    if(typeof showPlanSection==='function')showPlanSection('basics');
  }
  back.addEventListener('click',()=>{if(lesson>0&&lesson<7){lesson--;render();}});
  advance.addEventListener('click',()=>{
    if(lesson===7){realSetup();return;}
    if(lesson>0&&!passed.has(lesson))return;
    lesson=Math.min(7,lesson+1);
    if(lesson===7){localStorage.setItem(KEY_DONE,'1');localStorage.setItem(KEY_SEEN,'1');}
    render();
  });
  exit.addEventListener('click',close);
  modal.addEventListener('cancel',e=>{e.preventDefault();close();});
  for(const id of ['openTour','startTour','replayTour']){
    const b=$(id);if(b)b.addEventListener('click',open);
  }
  const fresh = (()=>{
    try{
      if(typeof state!=='object'||!state)return true;
      return !state.setupComplete && state.startingCash===0 && !state.transactions.length && !state.bills.length && !state.approvals.length;
    }catch{return false;}
  })();
  if(fresh&&!localStorage.getItem(KEY_SEEN)){
    window.addEventListener('load',()=>{if(!modal.open) open();},{once:true});
  }
  // Available for browser smoke tests without exposing or modifying financial data.
  window.DexGuidedQuest={open, status:()=>({lesson,completed:passed.size,cash:cashNow(),rent:session.rent,protected:session.rentProtected})};
})();
