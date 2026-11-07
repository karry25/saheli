/* Saheli proactive check-ins (in-app): phase-relevant prompts when she opens the app.
   Anti-nagging: max one prompt per 20h, stored in localStorage. Quiet hours 21:00-08:00.
   Honest: these appear when the app is opened - real push notifications need the
   wrapped-APK path (see research-reminders-and-apk.md). */
var SaheliPrompts=(function(){
  var PKEY='saheli.prompts.v1';
  function loadP(){try{return JSON.parse(localStorage.getItem(PKEY))||{};}catch(e){return{};}}
  function saveP(p){localStorage.setItem(PKEY,JSON.stringify(p));}
  function quietHours(d){var h=d.getHours();return h>=21||h<8;}
  function due(C,logs,now){
    var p=C.predict(logs,fmtD(now));
    if(!p.lastStart)return null;
    var t=fmtD(now);
    var lastPrompt=loadP().last||0;
    if(now.getTime()-lastPrompt<20*3600*1000)return null;
    var FORCE=typeof location!=='undefined'&&location.search.indexOf('prompt=1')>=0;
    if(quietHours(now)&&!FORCE)return null;
    var lt=logs[t]||{};
    var diff=C.diffDays(p.nextStart||t,t);
    if(!lt.flow&&p.nextStart&&Math.abs(diff)<=Math.max(2,p.band)){
      return {kind:'perioddue',text:p.nextStart===t?'Your period is due around today. Has it started?':(diff>0?'Your period is due in about '+diff+' day'+(diff>1?'s':'')+'. Any early signs?':'Your period seems '+(-diff)+' day'+((-diff)>1?'s':'')+' late. Has it started?'),
        chips:[{v:'started',label:'Yes, started'},{v:'notyet',label:'Not yet'}]};
    }
    var ph=C.phaseForDay(logs,t);
    if(ph.phase==='luteal'&&(lt.cramps==null||lt.cramps===0)&&!lt.flow){
      return {kind:'pms',text:'Check-in: how are the cramps today?',chips:[{v:'0',label:'None'},{v:'3',label:'Mild'},{v:'6',label:'Bad'}],field:'cramps'};
    }
    var pdLen=Math.max(p.periodLen||0,2);
    if(ph.dayOfCycle&&ph.dayOfCycle<=pdLen&&!lt.flow){
      return {kind:'flow',text:'How is the flow today?',chips:[{v:'light',label:'Light'},{v:'medium',label:'Medium'},{v:'heavy',label:'Heavy'}],field:'flow'};
    }
    return null;
  }
  function fmtD(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
  function answered(){var p=loadP();p.last=Date.now();saveP(p);}
  return {due:due,answered:answered,quietHours:quietHours};
})();
