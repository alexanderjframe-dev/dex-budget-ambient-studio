/* Dex Budget v1.8 - optional savings goals, allocated cash and scenario projections.
   This script never moves money from a real bank account. All amounts are integer cents. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const MAX=1e10; // $100 million cap per individual entry
  let editingId=null;
  const currency=n=>fmt(n);
  const safeText=s=>esc(String(s));
  function cleanList(){
    if(!Array.isArray(state.goals))state.goals=[];
    return state.goals.filter(g=>g&&typeof g==='object'&&typeof g.id==='string'&&typeof g.name==='string'&&Number.isSafeInteger(g.target)&&g.target>0&&Number.isSafeInteger(g.saved)&&g.saved>=0&&Number.isSafeInteger(g.weekly)&&g.weekly>=0);
  }
  function amountFrom(input){
    const str=String(input||'').trim();
    if(!/^\d{1,8}(?:\.\d{1,2})?$/.test(str))return null;
    const parts=str.split('.');
    const val=Number(parts[0])*100+Number((parts[1]||'').padEnd(2,'0'));
    return Number.isSafeInteger(val)&&val>=0&&val<MAX?val:null;
  }
  function freeCash(){
    const f=funding();
    return Math.max(0,f.unassigned-f.billsGap-f.essentialGap);
  }
  function goalProgress(g){return Math.min(100,Math.max(0,100*g.saved/g.target));}
  function finish(g){
    if(g.saved>=g.target)return {weeks:0,label:'Reached — target funded'};
    if(!g.weekly)return {weeks:null,label:'Set a weekly amount for a timeline'};
    const weeks=Math.ceil((g.target-g.saved)/g.weekly);
    if(weeks>520)return {weeks,label:'At this pace: over 10 years'};
    const date=new Date();date.setHours(12,0,0,0);date.setDate(date.getDate()+7*weeks);
    return {weeks,label:`Around ${date.toLocaleDateString(undefined,{month:'short',year:'numeric'})} · ${weeks} week${weeks===1?'':'s'}`};
  }
  function chart(g){
    const weeksToTarget=g.weekly>0?Math.ceil(Math.max(0,g.target-g.saved)/g.weekly):null;
    const horizon=weeksToTarget==null?26:Math.max(12,Math.min(52,weeksToTarget));
    const width=330,height=178,left=44,right=14,top=15,bottom=30,plotWidth=width-left-right,plotHeight=height-top-bottom;
    const yMax=Math.max(g.target,g.saved,100);
    const ypos=value=>(top+plotHeight-(Math.min(yMax,value)/yMax)*plotHeight).toFixed(1);
    const xpos=week=>(left+week/horizon*plotWidth).toFixed(1);
    const points=[];const increments=26;
    for(let i=0;i<=increments;i++){
      const w=i*horizon/increments;
      points.push(`${xpos(w)},${ypos(Math.min(g.target,g.saved+g.weekly*w))}`);
    }
    const goalY=ypos(g.target);
    const grid=[0,.25,.5,.75,1].map(part=>{
      const yy=ypos(yMax*part);return `<line x1="${left}" x2="${width-right}" y1="${yy}" y2="${yy}" stroke="currentColor" opacity=".12"/><text x="${left-5}" y="${Number(yy)+3}" fill="currentColor" opacity=".66" font-size="9" text-anchor="end">${formatAxis(Math.round(yMax*part))}</text>`;
    }).join('');
    const labels=[0,.25,.5,.75,1].map(part=>`<text x="${xpos(horizon*part)}" y="${height-9}" fill="currentColor" opacity=".7" font-size="9" text-anchor="middle">${Math.round(horizon*part)}w</text>`).join('');
    const targetLine=`<line x1="${left}" x2="${width-right}" y1="${goalY}" y2="${goalY}" stroke="currentColor" stroke-dasharray="4 5" stroke-width="1.6" opacity=".6"/>`;
    const bgPoly=`${left},${top+plotHeight} ${points.join(' ')} ${width-right},${top+plotHeight}`;
    return `<div class="goal-chart" role="img" aria-label="Forecast from ${currency(g.saved)} saved today, adding ${currency(g.weekly)} weekly for ${horizon} weeks toward ${currency(g.target)} target. This is a projection, not money already saved.">
      <div class="goal-chart-label">If you keep saving ${currency(g.weekly)} per week</div>
      <svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs><linearGradient id="goalFill-${safeText(g.id)}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--mint)" stop-opacity=".26"/><stop offset="1" stop-color="var(--mint)" stop-opacity="0"/></linearGradient></defs>
      ${grid}${targetLine}<polygon points="${bgPoly}" fill="url(#goalFill-${safeText(g.id)})"/>
      <polyline points="${points.join(' ')}" fill="none" stroke="var(--mint)" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${left}" cy="${ypos(g.saved)}" r="4" fill="var(--mint-soft)" stroke="var(--surface-2)" stroke-width="2"/>
      ${labels}</svg><div class="goal-legend"><span><b></b> Planned savings</span><span><b class="target-key"></b> Target</span></div>
      <div class="goal-chart-note">Illustrative forecast · assumes consistent weekly contributions, no withdrawals or earnings on savings.</div></div>`;
  }
  function formatAxis(v){const n=v/100;return n>=1000?'$'+(n/1000).toFixed(n%1000?1:0)+'k':'$'+Math.round(n).toLocaleString();}
  function card(g){
    const p=goalProgress(g),f=finish(g),remaining=Math.max(0,g.target-g.saved);
    const options=`<option value="free">Unassigned cash after near-term essentials (${currency(freeCash())})</option><option value="savings">Existing general savings reserve (${currency(state.protectedSavings||0)})</option>`;
    const recent=(g.history||[]).slice(-6).reverse().map(h=>`<div class="row"><div><b>${h.delta>0?'+':'−'}${currency(Math.abs(h.delta))}</b><small>${safeText(new Date(h.date).toLocaleDateString())} · ${safeText(h.note||'Goal adjustment')}</small></div></div>`).join('')||'<p class="tiny">No contributions recorded yet.</p>';
    return `<div class="card goal-card" data-goal-card="${safeText(g.id)}">
      <div class="goal-top"><div><div class="goal-tag">${p>=100?'Goal funded':'Savings goal'}</div><div class="goal-name">${safeText(g.name)}</div></div><span class="badge">${Math.round(p)}%</span></div>
      <div class="goal-metrics"><div class="goal-metric"><small>Assigned so far</small><b>${currency(g.saved)}</b></div><div class="goal-metric"><small>Target amount</small><b>${currency(g.target)}</b></div><div class="goal-metric"><small>Still needed</small><b>${currency(remaining)}</b></div></div>
      <div class="goal-progress" role="progressbar" aria-valuenow="${Math.round(p)}" aria-valuemin="0" aria-valuemax="100" aria-label="${safeText(g.name)} savings progress"><div style="width:${p.toFixed(2)}%"></div></div>
      <p class="tiny" style="margin:6px 0 10px">${safeText(f.label)}</p>
      ${chart(g)}
      <div class="goal-action">
        <div class="grid"><div><label for="goalAmount-${safeText(g.id)}">Change allocated savings ($)</label><input id="goalAmount-${safeText(g.id)}" data-goal-amount="${safeText(g.id)}" type="number" inputmode="decimal" min="0.01" step="0.01" placeholder="25.00"></div>
        <div><label for="goalSource-${safeText(g.id)}">Move funds from</label><select id="goalSource-${safeText(g.id)}" data-goal-source="${safeText(g.id)}">${options}</select></div></div>
        <div class="actions"><button type="button" data-goal-add="${safeText(g.id)}">+ Add to goal</button><button type="button" class="secondary" data-goal-release="${safeText(g.id)}">Release funds</button></div>
        <p class="goal-texthelp">Adding funds reserves cash already tracked in Dex. It does not withdraw from your bank. To buy something with goal money, release it here and record the expense under Add.</p>
      </div>
      <details class="goal-history"><summary>History & goal settings</summary>${recent}
        <div class="actions"><button type="button" class="secondary" data-goal-edit="${safeText(g.id)}">Edit name or plan</button><button type="button" class="danger" data-goal-delete="${safeText(g.id)}">Delete goal</button></div>
      </details>
    </div>`;
  }
  function render(){
    const goals=cleanList();
    $('goalEmpty').classList.toggle('hidden',goals.length>0);
    $('goalCards').innerHTML=goals.map(card).join('');
    const home=$('goalHomePreview');
    home.innerHTML=goals.length?goals.slice(0,3).map(g=>`<div class="goal-mini"><div class="goal-mini-head"><span>${safeText(g.name)}</span><span>${Math.round(goalProgress(g))}% · ${currency(g.saved)}</span></div><div class="goal-progress" role="progressbar" aria-valuenow="${Math.round(goalProgress(g))}" aria-valuemin="0" aria-valuemax="100" aria-label="${safeText(g.name)}"><div style="width:${goalProgress(g).toFixed(2)}%"></div></div></div>`).join('')+(goals.length>3?`<p class="tiny">And ${goals.length-3} more…</p>`:''):'<p class="tiny">Saving for something? Start your first goal in Plan → Goals.</p>';
  }
  function clearForm(){editingId=null;$('goalLabel').value='';$('goalTarget').value='';$('goalWeekly').value='';$('goalFormTitle').textContent='New savings goal';$('saveGoalEntry').textContent='Save goal';$('goalFormCard').classList.add('hidden');}
  function openForm(goal){
    $('goalFormCard').classList.remove('hidden');
    if(goal){editingId=goal.id;$('goalLabel').value=goal.name;$('goalTarget').value=(goal.target/100).toFixed(2);$('goalWeekly').value=(goal.weekly/100).toFixed(2);$('goalFormTitle').textContent='Edit savings goal';$('saveGoalEntry').textContent='Save changes';}
    else{editingId=null;$('goalLabel').value='';$('goalTarget').value='';$('goalWeekly').value='';$('goalFormTitle').textContent='New savings goal';$('saveGoalEntry').textContent='Save goal';}
    $('goalLabel').focus({preventScroll:true});$('goalFormCard').scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function saveGoal(){
    const name=$('goalLabel').value.trim().replace(/\s+/g,' ').slice(0,64);
    const target=amountFrom($('goalTarget').value),weekly=amountFrom($('goalWeekly').value||'0');
    if(!name||target==null||target<=0||weekly==null)return alert('Enter a name, a target above $0, and a valid weekly amount (0 is allowed).');
    if(editingId){const g=cleanList().find(x=>x.id===editingId);if(!g)return alert('Goal was not found.');g.name=name;g.target=target;g.weekly=weekly;}
    else{state.goals.push({id:newId(),name,target,weekly,saved:0,history:[],createdAt:new Date().toISOString()});}
    clearForm();persist();toast('Savings goal saved.');
  }
  function contribution(id,release){
    const g=cleanList().find(x=>x.id===id);if(!g)return;
    const amount=amountFrom(document.querySelector(`[data-goal-amount="${CSS.escape(id)}"]`)?.value);
    if(!Number.isSafeInteger(amount)||amount<=0)return alert('Enter a positive amount with no more than two decimal places.');
    if(release){
      if(amount>g.saved)return alert(`Only ${currency(g.saved)} is assigned to this goal.`);
      g.saved-=amount;g.history=(g.history||[]).concat({date:new Date().toISOString(),delta:-amount,note:'Released to unassigned cash'});persist();toast('Funds released from this goal.');return;
    }
    const source=document.querySelector(`[data-goal-source="${CSS.escape(id)}"]`)?.value;
    if(source==='savings'){
      if(amount>state.protectedSavings)return alert(`Only ${currency(state.protectedSavings)} is in your general savings reserve.`);
      state.protectedSavings-=amount;
    } else {
      if(amount>freeCash())return alert(`Your unassigned money after near-term essentials is only ${currency(freeCash())}. Choose a smaller amount or move an existing general savings allocation.`);
    }
    g.saved+=amount;
    g.history=(g.history||[]).concat({date:new Date().toISOString(),delta:amount,note:source==='savings'?'Moved from general savings reserve':'Reserved from unassigned cash'});
    persist();toast('Saved in your Dex goal. No bank transfer was made.');
  }
  function removeGoal(id){
    const g=cleanList().find(x=>x.id===id);if(!g)return;
    if(!confirm(`Delete “${g.name}”? ${currency(g.saved)} of allocated money will become unassigned cash inside Dex.`))return;
    state.goals=state.goals.filter(x=>x.id!==id);
    persist();toast('Goal deleted. Allocated funds are now unassigned.');
  }
  $('toggleGoalForm').onclick=()=>openForm(null);
  $('cancelGoalEntry').onclick=clearForm;
  $('saveGoalEntry').onclick=saveGoal;
  $('homeGoalsLink').onclick=()=>{showTab('plan');showPlanSection('goals')};
  $('goalCards').addEventListener('click',ev=>{
    const b=ev.target.closest('button');if(!b)return;
    const id=b.dataset.goalAdd||b.dataset.goalRelease||b.dataset.goalEdit||b.dataset.goalDelete;
    if(!id)return;
    if(b.dataset.goalAdd)contribution(id,false);
    else if(b.dataset.goalRelease)contribution(id,true);
    else if(b.dataset.goalEdit)openForm(cleanList().find(x=>x.id===id));
    else if(b.dataset.goalDelete)removeGoal(id);
  });
  window.DexGoals={render};
  render();
})();
