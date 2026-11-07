/* Saheli predictive heads-ups: "you might have X today/tomorrow".
   Personal history first (symptom frequency on the same cycle-day +/-1 across her past cycles,
   needs >=2 logged cycles); before that, general phase-level patterns clearly labelled general.
   Wording: always "you might", with confidence, never certainty. */
var SaheliPredict=(function(){
  var SYMPTOMS=[['cramps','cramps'],['bloat','bloating'],['skin','breakouts'],['mood','a mood dip'],['headache','a headache'],['fatigue','low energy'],['cravings','cravings']];
  // general phase priors (population-level, labelled general)
  var GENERAL={period:[['cramps',0.6],['fatigue',0.4],['bloat',0.3]],luteal:[['bloat',0.5],['mood',0.4],['skin',0.35],['cravings',0.4],['headache',0.25]],fertile:[],follicular:[]};

  function has(log,k){var l=log[k];if(!l)return false;return (l.flow&&l.flow!=='none')||l.cramps>0||(l.bloat&&l.bloat!=='none')||(l.skin&&l.skin!=='clear')||(l.mood&&l.mood<=2)||(l.tags&&l.tags.length)||l.headache||l.fatigue||l.cravings;}
  function symOf(l,s){
    switch(s){
      case 'cramps':return l.cramps>0; case 'bloat':return l.bloat&&l.bloat!=='none';
      case 'skin':return l.skin==='breakout'||l.skin==='some'; case 'mood':return l.mood&&l.mood<=2;
      case 'headache':return !!l.headache||(l.tags&&l.tags.indexOf('headache')>=0);
      case 'fatigue':return !!l.fatigue||(l.tags&&l.tags.indexOf('tired')>=0);
      case 'cravings':return !!l.cravings||(l.tags&&l.tags.indexOf('cravings')>=0);
    }return false;
  }
  // count occurrences of symptom s at cycle-day +-1 across cycles, using cycle.js data
  function lastStartBefore(starts,k){
    var prev=null;
    for(var i=0;i<starts.length;i++){if(starts[i]<=k)prev=starts[i];}
    return prev;
  }
  function personalStats(C,logs,avgLen,periodStarts){
    var perSym={};
    if(!periodStarts||periodStarts.length<2)return null;
    var byCD={}; // cycle-day -> aggregated logs
    var keys=Object.keys(logs).filter(function(k){return has(logs,k);});
    if(keys.length<3)return null;
    keys.forEach(function(k){
      var start=lastStartBefore(periodStarts,k);
      if(!start)return;
      var cd=Math.round((new Date(k)-new Date(start))/86400000)+1;
      SYMPTOMS.forEach(function(pair){var s=pair[0];
        perSym[s]=perSym[s]||{};
        perSym[s][cd]=perSym[s][cd]||[0,0];
        perSym[s][cd][1]++;
        if(symOf(logs[k],s))perSym[s][cd][0]++;
      });
    });
    return perSym;
  }
  function forecast(C,logs,targetDateStr){
    var ph=C.phaseForDay(logs,targetDateStr);
    var out=[];
    var starts=(ph&&ph.p&&ph.p.stats&&ph.p.stats.starts)||[];
    if(!ph||starts.length<1)return {phase:ph?ph.phase:'unknown',day:ph?ph.dayOfCycle:null,items:[],basis:'none'};
    var cd=ph.dayOfCycle;
    var stats=personalStats(C,logs,ph.p.avgLen,starts);
    if(stats){
      SYMPTOMS.forEach(function(pair){var s=pair[0],label=pair[1];
        var a=(stats[s]&&stats[s][cd-1])||[0,0],b=(stats[s]&&stats[s][cd])||[0,0],c=(stats[s]&&stats[s][cd+1])||[0,0];
        var hits=a[0]+b[0]+c[0],tot=a[1]+b[1]+c[1];
        if(tot>=3&&hits/tot>=0.5){
          out.push({sym:s,label:label,conf:hits/tot>=0.75?'likely':'possible',basis:'personal',
            reason:'in '+hits+' of your last '+tot+' logged days around this cycle day you logged '+label});
        }
      });
      if(out.length)return {phase:ph.phase,day:cd,items:out.slice(0,3),basis:'personal'};
    }
    var g=GENERAL[ph.phase]||[];
    g.forEach(function(pair){
      out.push({sym:pair[0],label:pair[0]==='skin'?'breakouts':(SYMPTOMS.filter(function(x){return x[0]===pair[0];})[0]||['',''])[1]||pair[0],
        conf:'possible',basis:'general',reason:'many people report this in the '+ph.phase+' phase (general pattern, not from your history yet)'});
    });
    return {phase:ph.phase,day:cd,items:out.slice(0,3),basis:out.length?'general':'none'};
  }
  function lookahead(C,logs,days){
    var res=[];
    for(var i=1;i<=days;i++){
      var d=new Date();d.setDate(d.getDate()+i);
      var ds=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      var f=forecast(C,logs,ds);
      if(f.items.length)res.push({date:ds,inDays:i,items:f.items,basis:f.basis});
    }
    return res;
  }
  return {forecast:forecast,lookahead:lookahead};
})();
