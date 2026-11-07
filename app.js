/* Saheli M1 - UI. All data stays in localStorage. No network calls. */
(function(){
const C = SaheliCycle;
const KEY='saheli.logs.v1';
const COLORS={period:'#e2546e',follicular:'#b3a5e0',fertile:'#5cc4a0',ovulation:'#2e9d7a',luteal:'#f0b489'};
const NAMES={period:'Period',follicular:'Follicular',fertile:'Fertile window',ovulation:'Ovulation (est.)',luteal:'Luteal',unknown:'-'};
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function load(){try{return JSON.parse(localStorage.getItem(KEY))||{};}catch(e){return{};}}
function save(l){localStorage.setItem(KEY,JSON.stringify(l));}
function niceDate(s){const d=C.parseDate(s);return d.toLocaleDateString('en-IN',{day:'numeric',month:'short',timeZone:'UTC'});}

function ringSegments(svg,avgLen,periodLen,ovDay,doc){
  const cx=125,cy=125,r=96,W=26;
  function arc(dayA,dayB,color){
    const a0=(dayA-1)/avgLen*2*Math.PI-Math.PI/2, a1=dayB/avgLen*2*Math.PI-Math.PI/2;
    const x0=cx+r*Math.cos(a0),y0=cy+r*Math.sin(a0),x1=cx+r*Math.cos(a1),y1=cy+r*Math.sin(a1);
    const large=(dayB-dayA)/avgLen>0.5?1:0;
    const p=document.createElementNS('http://www.w3.org/2000/svg','path');
    p.setAttribute('d','M '+x0+' '+y0+' A '+r+' '+r+' 0 '+large+' 1 '+x1+' '+y1);
    p.setAttribute('stroke',color);p.setAttribute('stroke-width',W);p.setAttribute('fill','none');
    p.setAttribute('stroke-linecap','butt');svg.appendChild(p);
  }
  svg.innerHTML='';
  const base=document.createElementNS('http://www.w3.org/2000/svg','circle');
  base.setAttribute('cx',cx);base.setAttribute('cy',cy);base.setAttribute('r',r);
  base.setAttribute('stroke','#efe6ee');base.setAttribute('stroke-width',W);base.setAttribute('fill','none');svg.appendChild(base);
  const ov=Math.max(periodLen+2,ovDay);
  arc(1,periodLen,COLORS.period);
  if(ov-5>periodLen) arc(periodLen+1,ov-5,COLORS.follicular);
  arc(Math.max(periodLen+1,ov-5),Math.min(avgLen,ov+1),COLORS.fertile);
  if(ov+1<avgLen) arc(ov+1,avgLen,COLORS.luteal);
  // ovulation dot
  const ao=(ov-0.5)/avgLen*2*Math.PI-Math.PI/2;
  const dot=document.createElementNS('http://www.w3.org/2000/svg','circle');
  dot.setAttribute('cx',cx+r*Math.cos(ao));dot.setAttribute('cy',cy+r*Math.sin(ao));dot.setAttribute('r',5);
  dot.setAttribute('fill',COLORS.ovulation);dot.setAttribute('stroke','#fff');dot.setAttribute('stroke-width',2);svg.appendChild(dot);
  // today marker
  if(doc&&doc<=avgLen){
    const at=(doc-0.5)/avgLen*2*Math.PI-Math.PI/2;
    const t=document.createElementNS('http://www.w3.org/2000/svg','circle');
    t.setAttribute('cx',cx+r*Math.cos(at));t.setAttribute('cy',cy+r*Math.sin(at));t.setAttribute('r',9);
    t.setAttribute('fill','#fff');t.setAttribute('stroke','#332b33');t.setAttribute('stroke-width',3);svg.appendChild(t);
  }
}

function render(){
  const logs=load(),today=todayStr();
  const ph=C.phaseForDay(logs,today),p=ph.p;
  const doc=ph.dayOfCycle;
  document.getElementById('cday').textContent=doc?(SaheliI18n.t('day')+' '+doc):'Namaste';
  document.getElementById('cphase').textContent=ph.phase==='unknown'?'':(SaheliI18n.t('phase_'+ph.phase)||NAMES[ph.phase]||'');
  const nx=document.getElementById('cnext');
  if(p.nextStart){
    nx.textContent=SaheliI18n.t('nextPeriod')+' '+niceDate(p.nextStart)+' (+/-'+p.band+'d)'+(p.lateBy>0?' - period may be '+p.lateBy+'d late':'');
  } else nx.textContent='log a period day to begin';
  document.getElementById('cconf').innerHTML=p.lastStart?('<span class="chip '+p.conf.level+'">'+p.conf.level+' confidence</span>'):'';
  ringSegments(document.getElementById('ring'),p.avgLen,p.periodLen,p.avgLen-14,doc);
  document.getElementById('legend').innerHTML=
    '<span><span class="dot" style="background:'+COLORS.period+'"></span>period</span>'+
    '<span><span class="dot" style="background:'+COLORS.follicular+'"></span>follicular</span>'+
    '<span><span class="dot" style="background:'+COLORS.fertile+'"></span>fertile</span>'+
    '<span><span class="dot" style="background:'+COLORS.luteal+'"></span>luteal</span>';
  const cards=document.getElementById('cards');cards.innerHTML='';
  // proactive check-in (in-app, anti-nag, quiet hours)
  (function(){
    var pr=SaheliPrompts.due(C,logs,new Date());
    if(!pr)return;
    var d=document.createElement('div');d.className='card';d.style.border='1.5px solid var(--brand,#c2477e)';
    var h='<h3>'+SaheliI18n.t('asks')+'</h3><p style="margin:2px 0 8px">'+pr.text+'</p><div class="row" style="flex-wrap:wrap;gap:6px">';
    pr.chips.forEach(function(c,i){h+='<button class="grow ghost" data-pi="'+i+'" style="flex:0 0 auto;padding:8px 14px">'+c.label+'</button>';});
    h+='</div><div class="why" style="margin-top:6px">In-app check-in only - appears when you open Saheli, at most once a day, never 9pm-8am.</div>';
    d.innerHTML=h;
    d.querySelectorAll('[data-pi]').forEach(function(b){b.onclick=function(){
      var c=pr.chips[+b.dataset.pi],logs2=load(),t=todayStr(),lt=logs2[t]||{};
      if(pr.kind==='perioddue'){if(c.v==='started'){lt.flow='medium';logs2[t]=lt;save(logs2);}}
      else if(pr.field==='cramps'){lt.cramps=+c.v;logs2[t]=lt;save(logs2);}
      else if(pr.field==='flow'){lt.flow=c.v;logs2[t]=lt;save(logs2);}
      SaheliPrompts.answered();render();
    };});
    cards.appendChild(d);
  })();
  function card(t,h){const d=document.createElement('div');d.className='card';d.innerHTML='<h3>'+t+'</h3>'+h;return d;}
  // Today at a glance: ONE hero heads-up + 3 plan chips; details behind taps
  (function(){
    const t=todayStr(), lt=logs[t]||{};
    const f=SaheliPredict.forecast(C,logs,t);
    const symNow={cramps:lt.cramps>0,bloating:lt.bloat&&lt.bloat!=='none',mood:lt.mood&&lt.mood<=2,acne:lt.skin==='breakout'};
    const EMOJI={eat:'\u{1F372}',skincare:'\u{1F9F4}',hair:'\u{1F487}',exercise:'\u{1F3C3}',relief:'\u{1F525}'};
    let h='';
    if(f.items.length){
      const it=f.items[0];
      h+='<div class="hero">You might have <b>'+it.label+'</b> today <span class="evtag">'+it.conf+'</span></div>';
      if(f.items.length>1)h+='<button class="linklike" id="moreheads">+'+(f.items.length-1)+' more heads-up'+(f.items.length>2?'s':'')+'</button>';
    } else {
      h+='<div class="hero">'+SaheliI18n.t('heroClear')+'</div>';
    }
    const plan=SaheliTips.planFor(ph.phase==='unknown'?'follicular':ph.phase,symNow);
    const seen={},top=[];
    plan.forEach(function(it){if(!seen[it.cat]&&top.length<3){seen[it.cat]=1;top.push(it);}});
    h+='<div class="chips">'+top.map(function(it){
      const short=it.t.split(/[.;]/)[0];
      return '<span class="planchip">'+(EMOJI[it.cat]||'\u2728')+' '+short+'</span>';
    }).join('')+'</div>';
    h+='<button class="linklike" id="fullplan">'+SaheliI18n.t('fullPlan')+'</button>';
    cards.appendChild(card(SaheliI18n.t('glance'),h));
    const mb=document.getElementById('moreheads');
    if(mb)mb.onclick=function(){
      let dh='';
      f.items.forEach(function(it){dh+='<div class="flagitem"><b>'+it.label+'</b> <span class="evtag">'+it.conf+'</span><div class="why">'+it.reason+'</div></div>';});
      const la=SaheliPredict.lookahead(C,logs,3);
      if(la.length)dh+='<div style="margin-top:8px"><b>Coming up:</b> '+la.map(function(x){return (x.inDays===1?'tomorrow':'in '+x.inDays+'d')+': '+x.items.map(function(i){return i.label;}).join(', ');}).join(' | ')+'</div>';
      document.getElementById('detailtitle').textContent='Heads-ups';
      document.getElementById('detailbox').innerHTML=dh;
      document.getElementById('dlg-detail').showModal();
    };
    document.getElementById('fullplan').onclick=function(){
      let dh='<ul class="plan">';
      plan.forEach(function(it){dh+='<li><span class="evtag '+it.ev.toLowerCase()+'">'+it.ev+'</span> '+it.t+'<div class="why">'+it.src+'</div></li>';});
      dh+='</ul><div class="why" style="margin-top:6px">Tips ease and manage - they never cure. STRONG = guideline evidence, SOME = smaller studies, WEAK = traditional/early.</div>';
      document.getElementById('detailtitle').textContent="Today's full plan";
      document.getElementById('detailbox').innerHTML=dh;
      document.getElementById('dlg-detail').showModal();
    };
  })();

  // Pattern flags: one line each, tap for details
  (function(){
    const pc=JSON.parse(localStorage.getItem('saheli.pcos.v1')||'null');
    const fl=SaheliFlags.evaluate(C,logs,pc?pc.answers:null,pc?pc.result:null);
    if(fl.length){
      let h='';
      fl.slice(0,3).forEach(function(f,i){
        h+='<button class="flagline" data-fi="'+i+'">\u26A0\uFE0F '+f.title+' <span style="color:var(--mut)">&#8250;</span></button>';
      });
      h+='<button class="ghost" id="opendoc" style="width:100%;margin-top:8px;padding:10px;border-radius:12px">'+SaheliI18n.t('docPrep')+'</button>';
      cards.appendChild(card(SaheliI18n.t('worthDoc'),h));
      document.getElementById('opendoc').onclick=openDocReport;
      cards.querySelectorAll('[data-fi]').forEach(function(b){b.onclick=function(){
        const f=fl[+b.dataset.fi];
        document.getElementById('detailtitle').textContent=f.title;
        document.getElementById('detailbox').innerHTML='<p>'+f.why+'</p><div class="tests">Ask about: '+f.tests.join(' | ')+'</div><div class="why" style="margin-top:6px">Source: '+f.src+'. Screening only - a doctor decides.</div>';
        document.getElementById('dlg-detail').showModal();
      };});
    }
  })();
  if(p.stats.avg||p.ovulation){
    let sh='';
    if(p.stats.avg)sh+='<div class="statcell"><div class="big">'+p.stats.avg+'d</div><div class="statlbl">avg cycle ('+p.stats.min+'-'+p.stats.max+')</div></div>';
    if(p.ovulation)sh+='<div class="statcell"><div class="big" style="font-size:17px">'+niceDate(p.fertileStart)+' - '+niceDate(p.fertileEnd)+'</div><div class="statlbl">fertile window (estimate - not contraception)</div></div>';
    cards.appendChild(card(SaheliI18n.t('yourNumbers'),'<div class="statrow">'+sh+'</div>'));
  }
  cards.appendChild(card('Prediction honesty',p.conf.reason));
  // trends card
  (function(){var th=SaheliTrends.render(C,logs);if(th){var d=document.createElement('div');d.innerHTML=th;cards.appendChild(d.firstChild);}})();

  // history
  const hist=document.getElementById('hist');hist.innerHTML='';
  const keys=Object.keys(logs).sort().reverse().slice(0,8);
  for(const k of keys){const l=logs[k];const it=document.createElement('div');it.className='hist-item';
    const bits=[];if(l.flow&&l.flow!=='none')bits.push('flow: '+l.flow);if(l.cramps)bits.push('cramps '+l.cramps+'/10');if(l.bloat&&l.bloat!=='none')bits.push('bloating '+l.bloat);if(l.mood)bits.push('mood '+l.mood+'/5');if(l.skin&&l.skin!=='clear')bits.push('skin: '+l.skin);
    it.innerHTML='<b>'+niceDate(k)+'</b><span>'+(bits.join(' | ')||'logged')+'</span>';hist.appendChild(it);}
}

// log sheet
const dlg=document.getElementById('dlg');
let draft={};
function fillSeg(id,key){document.querySelectorAll('#'+id+' button').forEach(function(b){
  b.classList.toggle('on',(draft[key]||'none')===b.dataset.v||(key==='skin'&&!draft.skin&&b.dataset.v==='clear'));
  b.onclick=function(){draft[key]=b.dataset.v;fillSeg(id,key);};});}
function openLog(){
  const logs=load(),t=todayStr();draft=Object.assign({flow:'none',cramps:0,bloat:'none',mood:null,tags:[],skin:'clear',note:'',water:0,sleep:null,exercise:'none',sex:'none',weight:null},logs[t]||{});
  fillSeg('qflow','flow');fillSeg('qbloat','bloat');fillSeg('qskin','skin');
  document.querySelectorAll('#qmood button').forEach(function(b){b.classList.toggle('on',draft.mood===+b.dataset.v);b.onclick=function(){draft.mood=+b.dataset.v;document.querySelectorAll('#qmood button').forEach(function(x){x.classList.toggle('on',draft.mood===+x.dataset.v);});};});
  document.querySelectorAll('#qtags button').forEach(function(b){b.classList.toggle('on',(draft.tags||[]).includes(b.dataset.v));b.onclick=function(){const i=(draft.tags=draft.tags||[]).indexOf(b.dataset.v);if(i<0)draft.tags.push(b.dataset.v);else draft.tags.splice(i,1);b.classList.toggle('on');};});
  document.querySelectorAll('#qmore button').forEach(function(b){b.classList.toggle('on',(draft.tags||[]).includes(b.dataset.v));b.onclick=function(){const i=(draft.tags=draft.tags||[]).indexOf(b.dataset.v);if(i<0)draft.tags.push(b.dataset.v);else draft.tags.splice(i,1);b.classList.toggle('on');};});
  function setSeg(id,key){document.querySelectorAll('#'+id+' button').forEach(function(b){b.classList.toggle('on',(draft[key]||'none')===b.dataset.v);b.onclick=function(){draft[key]=b.dataset.v;document.querySelectorAll('#'+id+' button').forEach(function(x){x.classList.toggle('on',draft[key]===x.dataset.v);});};});}
  setSeg('qex','exercise');setSeg('qsex','sex');
  document.getElementById('waterv').textContent=draft.water||0;
  document.getElementById('waterm').onclick=function(e){e.preventDefault();draft.water=Math.max(0,(draft.water||0)-1);document.getElementById('waterv').textContent=draft.water;};
  document.getElementById('waterp').onclick=function(e){e.preventDefault();draft.water=(draft.water||0)+1;document.getElementById('waterv').textContent=draft.water;};
  document.getElementById('qsleep').value=draft.sleep||'';document.getElementById('qsleep').oninput=function(){draft.sleep=this.value?+this.value:null;};
  document.getElementById('qweight').value=draft.weight||'';document.getElementById('qweight').oninput=function(){draft.weight=this.value?+this.value:null;};
  const r=document.getElementById('qcramps');r.value=draft.cramps||0;document.getElementById('crampsv').textContent=r.value;
  r.oninput=function(){draft.cramps=+r.value;document.getElementById('crampsv').textContent=r.value;};
  document.getElementById('qnote').value=draft.note||'';
  document.getElementById('dlgtitle').textContent='Log '+niceDate(t);
  // predictive suggestions she can confirm with one tap
  const sg=document.getElementById('qsuggest');sg.innerHTML='';
  const fc=SaheliPredict.forecast(C,logs,t);
  if(fc.items.length){
    const lbl=document.createElement('div');lbl.style.cssText='font-size:12px;color:var(--mut);margin-bottom:4px';
    lbl.textContent='Saheli guesses - tap what is true:';sg.appendChild(lbl);
    fc.items.forEach(function(it){
      const b=document.createElement('button');b.className='sugchip';b.textContent=it.label+'?';
      b.onclick=function(){
        b.classList.toggle('on');
        if(it.sym==='cramps'){draft.cramps=b.classList.contains('on')?Math.max(draft.cramps||0,3):0;document.getElementById('qcramps').value=draft.cramps;document.getElementById('crampsv').textContent=draft.cramps;}
        if(it.sym==='bloat'){draft.bloat=b.classList.contains('on')?'mild':'none';fillSeg('qbloat','bloat');}
        if(it.sym==='skin'){draft.skin=b.classList.contains('on')?'some':'clear';fillSeg('qskin','skin');}
        if(it.sym==='mood'){draft.mood=b.classList.contains('on')?2:null;document.querySelectorAll('#qmood button').forEach(function(x){x.classList.toggle('on',draft.mood===+x.dataset.v);});}
        if(['headache','fatigue','cravings'].indexOf(it.sym)>=0){draft.tags=draft.tags||[];const tg=it.sym==='fatigue'?'tired':it.sym;const i=draft.tags.indexOf(tg);if(b.classList.contains('on')&&i<0)draft.tags.push(tg);if(!b.classList.contains('on')&&i>=0)draft.tags.splice(i,1);document.querySelectorAll('#qtags button').forEach(function(x){x.classList.toggle('on',draft.tags.indexOf(x.dataset.v)>=0);});}
      };
      sg.appendChild(b);
    });
  }
  dlg.showModal();
}
document.getElementById('btnlog').onclick=openLog;
document.getElementById('bcancel').onclick=function(){dlg.close();};
document.getElementById('bsave').onclick=function(){
  const logs=load();logs[todayStr()]=draft;save(logs);dlg.close();render();};
// demo data: 3 realistic cycles ending recently + symptoms
document.getElementById('fdemo').onclick=function(){
  const logs={},t=todayStr();
  function put(d,obj){logs[d]=obj;}
  const starts=[C.fmt(C.addDays(C.parseDate(t),-88)),C.fmt(C.addDays(C.parseDate(t),-58)),C.fmt(C.addDays(C.parseDate(t),-28))];
  starts.forEach(function(s,si){for(let i=0;i<5;i++){put(C.fmt(C.addDays(C.parseDate(s),i)),{flow:i===0?'medium':(i<3?'light':'light'),cramps:i===0?6:2,bloat:i===0?'mild':'none',mood:i===0?2:4,tags:i===0?['irritated']:['calm'],skin:i===0?'some':'clear'});}});
  put(C.fmt(C.addDays(C.parseDate(t),-1)),{flow:'none',cramps:3,bloat:'strong',mood:2,tags:['irritated','weepy'],skin:'breakout',note:'pms day'});
  save(logs);render();};
document.getElementById('freset').onclick=function(){localStorage.removeItem(KEY);localStorage.removeItem('saheli.pcos.v1');render();};
// ---- Learn tab: remedies, prevention, sexual health ----
document.getElementById('flearn').onclick=function(){
  const box=document.getElementById('learnbox');box.innerHTML='';
  const logs=load(),t=todayStr(),lt=logs[t]||{};
  function sec(title,inner){const d=document.createElement('div');d.innerHTML='<h3 style="margin:14px 0 6px">'+title+'</h3>'+inner;box.appendChild(d);}
  let rel='';
  const active=[];
  if(lt.cramps>0)active.push('cramps');
  if(lt.bloat&&lt.bloat!=='none')active.push('bloating');
  if(lt.mood&&lt.mood<=2)active.push('mood');
  if(lt.skin==='breakout')active.push('acne');
  (lt.tags||[]).forEach(function(g){if(['headache','fatigue','tired','cravings','hairfall'].indexOf(g)>=0)active.push(g==='tired'?'fatigue':g);});
  if(active.length){active.forEach(function(sy){(SaheliTips.RELIEF[sy]||[]).forEach(function(r){rel+='<li><span class="evtag '+r.ev.toLowerCase()+'">'+r.ev+'</span> '+r.t+(r.caution?' <i class="why">Caution: '+r.caution+'</i>':'')+'<div class="why">'+r.src+'</div></li>';});});rel='<ul class="plan">'+rel+'</ul>';}
  else rel='<p class="why">Log a symptom today and relief ideas appear here.</p>';
  sec('Relief for today',rel);
  let rem='';SaheliTips.REMEDIES.forEach(function(r){rem+='<li><b>'+r.name+'</b> ('+r.for+') <span class="evtag '+r.ev.toLowerCase()+'">'+r.ev+'</span><br>'+r.note+(r.caution?' <i class="why">Caution: '+r.caution+'</i>':'')+'<div class="why">'+r.src+'</div></li>';});
  sec('Popular remedies - the honest picture','<ul class="plan">'+rem+'</ul>');
  let prv='';SaheliTips.PREVENTION.forEach(function(p){prv+='<li><span class="evtag '+p.ev.toLowerCase()+'">'+p.ev+'</span> '+p.t+'<div class="why">'+p.src+'</div></li>';});
  sec('Prevent and manage (never cure)','<ul class="plan">'+prv+'</ul>');
  let sx='';SaheliTips.SEXED.forEach(function(x){sx+='<li><b>'+x.t+'</b><br>'+x.b+'<div class="why">'+x.src+'</div></li>';});
  sec('Sexual and reproductive health','<ul class="plan">'+sx+'</ul>');
  const note=document.createElement('p');note.className='why';note.style.marginTop='10px';
  note.textContent='Everything here is education, not medical advice. Tips ease and manage - PCOS and period problems have no cure, only management. See a doctor for diagnosis and treatment.';
  box.appendChild(note);
  document.getElementById('dlg7').showModal();
};
// ---- doctor visit prep ----
function openDocReport(){
  const logs=load(),st=C.cycleStats(logs),pd=C.predict(logs,todayStr());
  const pc=JSON.parse(localStorage.getItem('saheli.pcos.v1')||'null');
  const fl=SaheliFlags.evaluate(C,logs,pc?pc.answers:null,pc?pc.result:null);
  const hint=pc?SaheliFlags.pcosPatternHint(pc.answers,pc.result):null;
  let h='<h4 style="margin:4px 0">Saheli summary - '+niceDate(todayStr())+'</h4>';
  h+='<p><b>Cycles:</b> '+(st.avg?('average '+Math.round(st.avg)+' days ('+st.min+'-'+st.max+'), '+st.lengths.length+' tracked'):'not enough data yet')+(pd.periodLen?('. Periods usually last ~'+pd.periodLen+' days.'):'. Period length not logged yet.')+'</p>';
  const counts={};Object.keys(logs).forEach(function(k){const l=logs[k];
    if(l.cramps>0)counts.cramps=(counts.cramps||0)+1;
    if(l.bloat&&l.bloat!=='none')counts.bloating=(counts.bloating||0)+1;
    if(l.skin&&l.skin!=='clear')counts.skin=(counts.skin||0)+1;
    if(l.mood&&l.mood<=2)counts.lowmood=(counts.lowmood||0)+1;
    if(l.flow==='heavy')counts.heavy=(counts.heavy||0)+1;});
  h+='<p><b>Symptoms logged:</b> '+(Object.keys(counts).length?Object.keys(counts).map(function(k){return k+' x'+counts[k];}).join(', '):'none yet')+'.</p>';
  if(pc){h+='<p><b>PCOS early-warning ('+niceDate(pc.when)+'):</b> '+({low:'lower',moderate:'medium',high:'higher'})[pc.result.band]+' pattern match. Screening only - not a diagnosis, not a personal risk percentage.</p>';
    if(hint)h+='<p><b>Observed pattern:</b> '+hint.pattern+'. '+hint.note+'</p>';}
  if(fl.length){h+='<p><b>Flags and tests to ask about:</b></p><ul style="margin:4px 0 8px 18px">';
    fl.forEach(function(f){h+='<li><b>'+f.title+':</b> '+f.tests.join(', ')+'</li>';});h+='</ul>';}
  h+='<p style="font-size:11px;color:#888">Generated on-device by Saheli. All data stays on this phone. This summary supports a conversation with a doctor; it is not medical advice or a diagnosis.</p>';
  document.getElementById('dreport').innerHTML=h;
  document.getElementById('dlg5').showModal();
}
document.getElementById('dclose').onclick=function(){document.getElementById('dlg5').close();};
document.getElementById('dprint').onclick=function(){window.print();};
// ---- M2: PCOS check ----
const dlg2=document.getElementById('dlg2'),dlg3=document.getElementById('dlg3');
function openCheck(){
  const box=document.getElementById('qs');box.innerHTML='';
  const logs=load();const st=C.cycleStats(logs);
  SaheliScreener.Q.forEach(function(q){
    const d=document.createElement('div');d.className='qnum';
    if(q.type==='num'){d.innerHTML='<label>'+q.label+'</label><input type="number" id="q_'+q.id+'" min="'+q.min+'" max="'+q.max+'">';}
    else{d.innerHTML='<label>'+q.label+'</label><div class="seg" id="q_'+q.id+'"><button data-v="0">No</button><button data-v="1">Yes</button></div>';}
    box.appendChild(d);
  });
  // prefill from onboarding profile when available
  const prof=SaheliOnboard.get();
  if(prof&&!prof.skipped){
    if(prof.age)document.getElementById('q_age').value=prof.age;
    if(prof.height)document.getElementById('q_height').value=prof.height;
    if(prof.weight)document.getElementById('q_weight').value=prof.weight;
    if(prof.regular){const irr=prof.regular==='no'?1:(prof.regular==='yes'?0:null);if(irr!==null)document.querySelectorAll('#q_irregular button').forEach(function(b){b.classList.toggle('on',+b.dataset.v===irr);});}
  }
  // prefill irregularity from tracked cycles when known
  if(st.avg&&st.lengths.length>=2){const irr=(st.max-st.min)>8||st.avg>35||st.avg<21?1:0;
    document.querySelectorAll('#q_irregular button').forEach(function(b){b.classList.toggle('on',+b.dataset.v===irr);});}
  box.querySelectorAll('.seg').forEach(function(seg){seg.querySelectorAll('button').forEach(function(b){b.onclick=function(){seg.querySelectorAll('button').forEach(function(x){x.classList.remove('on');});b.classList.add('on');};});});
  dlg2.showModal();
}
function val(id){const el=document.getElementById('q_'+id);if(!el)return null;
  if(el.tagName==='INPUT')return el.value?+el.value:null;
  const on=el.querySelector('button.on');return on?+on.dataset.v:null;}

// ---- Chat assistant (on-device retrieval) ----
function chatAdd(text,me,r){
  var t=document.getElementById('chat-thread');
  var d=document.createElement('div');
  d.className='chatmsg '+(me?'me':(r&&r.refusal?'bot refuse':'bot'));
  var b=document.createElement('span');b.className='chatbub';b.textContent=text;d.appendChild(b);
  if(!me&&r&&r.src){var m=document.createElement('div');m.className='chatmeta';
    m.innerHTML='<span class="evtag '+r.tag.toLowerCase()+'">'+r.tag+'</span> <span class="why">'+r.src+'</span>';
    d.appendChild(m);}
  t.appendChild(d);t.scrollTop=t.scrollHeight;
}
function chatAsk(q){
  if(!q||!q.trim())return;
  chatAdd(q,true);
  var r=SaheliChat.answer(q,SaheliCycle,load());
  setTimeout(function(){chatAdd(r.text,false,r);},180);
}
document.getElementById('fchat').onclick=function(){document.getElementById('dlg-chat').showModal();};
document.getElementById('chat-send').onclick=function(){var i=document.getElementById('chat-in');chatAsk(i.value);i.value='';};
document.getElementById('chat-in').addEventListener('keydown',function(e){if(e.key==='Enter'){chatAsk(e.target.value);e.target.value='';}});
document.querySelectorAll('#chat-starters .chip').forEach(function(c){c.onclick=function(){chatAsk(c.dataset.q);};});


// ---- M4 photo sign-lab ----
document.getElementById('signfile').addEventListener('change',function(e){
  var f=e.target.files[0];if(!f)return;
  var rd=new FileReader();
  rd.onload=function(){
    var img=new Image();
    img.onload=function(){
      var prev=document.getElementById('signprev');prev.src=rd.result;prev.style.display='block';
      document.getElementById('signres').textContent='Looking...';
      SaheliSignLab.analyze(img,function(r){
        var out=document.getElementById('signres');
        if(r.error){out.textContent=r.error;document.getElementById('signsave').style.display='none';return;}
        out.innerHTML='<b>'+r.note+'</b><div class="why" style="margin-top:4px">Rough pixel heuristic (beta) - one photo, no diagnosis. Track over weeks, and a dermatologist sees far more than any app.</div>';
        var sv=document.getElementById('signsave');sv.style.display='block';
        sv.onclick=function(){
          var logs=load(),t=todayStr(),lt=logs[t]||{};
          lt.skin=r.level==='few'?'clear':(r.level==='some'?'some':'breakout');
          lt.skinNote='photo check: '+r.level+' spots (beta heuristic)';
          logs[t]=lt;save(logs);
          document.getElementById('dlg-sign').close();render();
        };
      });
    };
    img.src=rd.result;
  };
  rd.readAsDataURL(f);
});

document.getElementById('fpcos').onclick=openCheck;
// ---- M3: voice log ----
const dlg4=document.getElementById('dlg4');
document.getElementById('btnvoice').onclick=function(){
  document.getElementById('vheard').textContent='';
  document.getElementById('vchips').innerHTML='';
  document.getElementById('vapply').hidden=true;
  document.getElementById('vstatus').textContent='Tap the mic and speak, e.g. "aaj pet dard hai, sujan bhi, mood kharab". Tap again to stop.';
  dlg4.showModal();
};
document.getElementById('vclose').onclick=function(){if(SaheliVoice.isRecording())return;dlg4.close();};
document.querySelectorAll('#vlang .langpill').forEach(function(b){
  b.onclick=function(){
    document.querySelectorAll('#vlang .langpill').forEach(function(x){x.classList.remove('on');});
    b.classList.add('on');SaheliVoice.lang=b.dataset.l;
  };
});
let vfields=null;
document.getElementById('vmic').onclick=async function(){
  const mic=this,st=document.getElementById('vstatus'),heard=document.getElementById('vheard'),chipbox=document.getElementById('vchips'),apply=document.getElementById('vapply');
  if(!SaheliVoice.isRecording()){
    heard.textContent='';chipbox.innerHTML='';apply.hidden=true;vfields=null;
    try{await SaheliVoice.start();}catch(e){st.textContent='Mic blocked or unavailable. Allow mic permission and try again.';return;}
    mic.classList.add('listening');
    st.textContent='Listening... speak now. Tap the mic again to stop.';
    return;
  }
  mic.classList.remove('listening');
  st.textContent='Working...';
  try{
    const text=await SaheliVoice.stopAndTranscribe(function(m){st.textContent=m;});
    heard.innerHTML='<b>Heard:</b> '+(text||'(nothing clear)');
    if(!text){st.textContent='Could not hear clearly - try again, a little closer to the phone.';return;}
    const ex=SaheliExtract.extract(text);
    vfields=ex.fields;
    if(Object.keys(vfields).length===0){st.textContent='No symptoms recognized. Try naming them, e.g. "pet dard", "sujan", "mood kharab", "period".';return;}
    chipbox.innerHTML='';
    const chips=[];
    if(vfields.flow)chips.push(['flow','Period: '+vfields.flow]);
    if(vfields.cramps!=null)chips.push(['cramps','Cramps '+vfields.cramps+'/10']);
    if(vfields.bloat)chips.push(['bloat','Bloating: '+vfields.bloat]);
    if(vfields.mood)chips.push(['mood','Mood: '+vfields.mood]);
    if(vfields.skin)chips.push(['skin','Skin: '+vfields.skin]);
    (vfields.tags||[]).forEach(function(t){chips.push(['tag:'+t,t]);});
    if(chips.length===0){st.textContent='No symptoms recognized. Try naming them, e.g. "pet dard", "sujan", "mood kharab", "period".';return;}
    st.textContent='Tap a chip to remove it - then Add to my log:';
    chips.forEach(function(pair){
      const b=document.createElement('button');b.className='sugchip on';b.textContent=pair[1];
      b.onclick=function(){b.classList.toggle('on');};
      b.dataset.k=pair[0];chipbox.appendChild(b);
    });
    apply.hidden=false;
  }catch(e){st.textContent='Voice engine error: '+(e&&e.message?e.message:e);}
};
document.getElementById('vapply').onclick=function(){
  if(!vfields){dlg4.close();return;}
  const kept={};
  document.querySelectorAll('#vchips .sugchip.on').forEach(function(b){kept[b.dataset.k]=true;});
  const logs=load(),t=todayStr();const cur=logs[t]||{};
  const f=vfields;
  if(kept['flow']&&f.flow&&(!cur.flow||cur.flow==="none"))cur.flow=f.flow;
  if(kept['cramps']&&f.cramps!=null&&!(cur.cramps>0))cur.cramps=f.cramps;
  if(kept['bloat']&&f.bloat&&(!cur.bloat||cur.bloat==='none'))cur.bloat=f.bloat;
  if(kept['mood']&&f.mood&&!cur.mood)cur.mood=f.mood;
  if(kept['skin']&&f.skin&&(!cur.skin||cur.skin==='clear'))cur.skin=f.skin;
  (f.tags||[]).forEach(function(tg){if(kept['tag:'+tg]){cur.tags=cur.tags||[];if(cur.tags.indexOf(tg)<0)cur.tags.push(tg);}});
  cur.note=((cur.note||'')+' voice: '+document.getElementById('vheard').textContent.replace(/^Heard:\s*/,'')).trim();
  logs[t]=cur;save(logs);
  dlg4.close();openLog();render();
};
document.getElementById('bcancel2').onclick=function(){dlg2.close();};
document.getElementById('bscore').onclick=function(){
  const a={age:val('age'),height:val('height'),weight:val('weight'),irregular:val('irregular'),wgain:val('wgain'),hair:val('hair'),skin:val('skin'),hairloss:val('hairloss'),pimples:val('pimples'),fastfood:val('fastfood'),exercise:val('exercise')};
  if(Object.keys(a).some(function(k){return a[k]===null||isNaN(a[k]);})){alert('Please answer all 10 questions.');return;}
  const r=SaheliScreener.score(a);
  localStorage.setItem('saheli.pcos.v1',JSON.stringify({when:todayStr(),answers:a,result:r}));
  dlg2.close();
  const bandMsg={low:'No strong PCOS pattern in these answers. Keep tracking - you know where to come if things change.',
    moderate:'Some signs match a PCOS pattern. Worth mentioning to a gynecologist at your next visit.',
    high:'Several answers match a common PCOS pattern. Please book a gynecologist visit - early checks make a real difference.'};
  document.getElementById('resultbox').innerHTML=
    '<h2>Your screening result</h2>'+
    '<div class="resultband '+r.band+'"><div class="rb">'+({low:'Lower',moderate:'Medium',high:'Higher'})[r.band]+'</div><div>pattern match</div></div>'+
    '<p style="font-size:12px;color:var(--mut);margin:2px 0 6px">Screening only - a lower result does not rule PCOS out, and a higher result is not a diagnosis. No percentage is shown because a questionnaire score is not a personal risk probability.</p>'+
    '<p style="font-size:14px">'+bandMsg[r.band]+'</p>'+
    (function(){const hint=SaheliFlags.pcosPatternHint(a,r);return hint?'<div class="flagitem" style="margin:8px 0"><b>Observed pattern: '+hint.pattern+'.</b><div class="why">'+hint.note+'</div></div>':'';})()+
    (r.reasons.length?'<ul class="reasons"><b style="font-size:13px">Main reasons:</b>'+r.reasons.map(function(x){return '<li>'+x+'</li>';}).join('')+'</ul>':'')+
    '<div class="doctor">A doctor confirms PCOS with blood tests (hormones, sugar) and an ultrasound - this app cannot diagnose. PCOS has no cure, but it is very manageable, and catching it early helps.</div>'+
    '<p class="safety">Model: on-device logistic screener trained on a public clinical dataset (539 patients; ~86% held-out accuracy, AUC 0.90, clinic population - real-world accuracy will differ). Answers and result stay on this phone.</p>'+
    '<div class="row"><button class="grow save" onclick="document.getElementById(\'dlg3\').close()">Done</button></div>';
  dlg3.showModal();
};
if('serviceWorker' in navigator && location.protocol!=='file:'){/* M1: installable via manifest; offline cache in a later milestone */}

// ---- i18n: static strings + toggle ----
function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(function(el){el.textContent=SaheliI18n.t(el.dataset.i18n);});
  document.querySelectorAll('[data-i18n-ph]').forEach(function(el){el.placeholder=SaheliI18n.t(el.dataset.i18nPh);});
  document.getElementById('langbtn').textContent=SaheliI18n.lang()==='en'?'हिंदी':'EN';
  var cn=document.querySelector('#dlg-chat p');if(cn)cn.textContent=SaheliI18n.t('chatNote');
}
document.getElementById('langbtn').onclick=function(){
  SaheliI18n.set(SaheliI18n.lang()==='en'?'hi':'en');applyI18n();render();
};
applyI18n();

render();if(location.search.indexOf("openlog")>=0)openLog();
if(location.search.indexOf("opencheck")>=0)openCheck();
if(location.search.indexOf("demodata")>=0){document.getElementById("fdemo").click();}
(function(){
  const noLogs=Object.keys(load()).length===0;
  if(location.search.indexOf("onboard")>=0||(SaheliOnboard.needed()&&noLogs)){
    SaheliOnboard.build({seedLog:function(d){
      const logs=load();if(!logs[d])logs[d]={flow:'medium',cramps:0,tags:['period (from setup)']};save(logs);
    },done:function(){render();}});
  }
})();
if(location.search.indexOf("autovoice")>=0){(async function(){
  document.getElementById("btnvoice").click();
  document.getElementById("vmic").click();
  await new Promise(function(r){setTimeout(r,3000);});
  document.getElementById("vmic").click();
})();}
if(location.search.indexOf("demoresult")>=0){openCheck();
  const setN=function(id,v){document.getElementById("q_"+id).value=v;};
  const setS=function(id,v){document.querySelectorAll("#q_"+id+" button").forEach(function(b){b.classList.toggle("on",+b.dataset.v===v);});};
  setN("age",21);setN("height",158);setN("weight",66);
  setS("irregular",1);setS("wgain",1);setS("hair",1);setS("skin",1);setS("hairloss",0);setS("pimples",1);setS("fastfood",1);setS("exercise",0);
  document.getElementById("bscore").click();}
})();
