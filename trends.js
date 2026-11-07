/* Saheli trends: tiny dependency-free SVG charts from local logs. */
var SaheliTrends=(function(){
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');}
  function render(C,logs){
    var days=[],t=new Date();
    for(var i=41;i>=0;i--){var d=new Date(t);d.setDate(d.getDate()-i);
      var k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
      days.push({k:k,l:logs[k]});}
    var W=340,H=110,pad=6;
    var x=function(i){return pad+i*(W-2*pad)/(days.length-1);};
    var bg='',i2;
    days.forEach(function(d,i){if(d.l&&C.isFlowDay(d.l)){
      bg+='<rect x="'+(x(i)-3)+'" y="0" width="7" height="'+H+'" rx="3" fill="#e2546e" opacity="0.18"/>';}});
    var crampsPts=[],moodPts=[];
    days.forEach(function(d,i){
      if(d.l&&d.l.cramps!=null&&d.l.cramps>0)crampsPts.push([x(i),H-pad-(d.l.cramps/10)*(H-2*pad),d.l.cramps]);
      if(d.l&&d.l.mood)moodPts.push([x(i),H-pad-((d.l.mood-1)/4)*(H-2*pad),d.l.mood]);});
    function line(pts,color){
      if(pts.length<2)return pts.map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="3" fill="'+color+'"/>';}).join('');
      var path='M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1);}).join(' L');
      return '<path d="'+path+'" fill="none" stroke="'+color+'" stroke-width="2" stroke-linecap="round"/>'+
        pts.map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="2.5" fill="'+color+'"/>';}).join('');
    }
    var svg='<svg viewBox="0 0 '+W+' '+H+'" style="width:100%">'+bg+
      line(crampsPts,'#c2477e')+line(moodPts,'#7a6fc9')+'</svg>';
    // cycle length bars
    var st=C.cycleStats(logs),bars='';
    if(st.lengths.length){
      var mx=Math.max.apply(null,st.lengths.concat([35]));
      bars='<div style="display:flex;align-items:flex-end;gap:6px;height:56px;margin-top:6px">'+
        st.lengths.slice(-8).map(function(L){
          var hh=Math.round(8+48*L/mx);
          return '<div style="flex:1;text-align:center"><div style="height:'+hh+'px;background:var(--brand,#c2477e);border-radius:6px 6px 0 0;opacity:.85"></div><div style="font-size:10px;color:var(--mut)">'+L+'d</div></div>';
        }).join('')+'</div>';
    }
    var any=crampsPts.length||moodPts.length||st.lengths.length;
    if(!any)return '';
    return '<div class="card"><h3>Your trends (6 weeks)</h3>'+svg+
      '<div style="font-size:11px;color:var(--mut)"><span style="color:#c2477e">&#9679;</span> cramps (0-10) &nbsp; <span style="color:#7a6fc9">&#9679;</span> mood (1-5) &nbsp; pink bands = period days</div>'+
      (bars?'<div style="font-size:11px;color:var(--mut);margin-top:6px">Cycle lengths:</div>'+bars:'')+'</div>';
  }
  return {render:render};
})();
