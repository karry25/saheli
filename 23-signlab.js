/* Saheli photo sign-lab (beta): honest on-device heuristics over a user-chosen photo.
   No upload, no ML diagnosis - simple pixel statistics, clearly labelled rough. */
var SaheliSignLab=(function(){
  function analyze(img,cb){
    var cv=document.createElement('canvas');
    var max=320,scale=Math.min(1,max/Math.max(img.width,img.height));
    cv.width=Math.round(img.width*scale);cv.height=Math.round(img.height*scale);
    var ctx=cv.getContext('2d');ctx.drawImage(img,0,0,cv.width,cv.height);
    var d;
    try{d=ctx.getImageData(0,0,cv.width,cv.height).data;}catch(e){cb({error:'Could not read this photo.'});return;}
    var n=cv.width*cv.height,i,redSpots=0,skinPx=0;
    // coarse 4x4 grid of "spot" candidates: pixel notably redder/darker than neighbourhood average
    var lum=new Float32Array(n);
    for(i=0;i<n;i++){var r=d[i*4],g=d[i*4+1],b=d[i*4+2];
      lum[i]=0.299*r+0.587*g+0.114*b;
      // skin-like pixel: warm tones
      if(r>60&&r>g&&g>=b&&(r-b)>10)skinPx++;
    }
    var W=cv.width,H=cv.height;
    var sampled=0,skinSampled=0;
    for(var y=4;y<H-4;y+=3){for(var x=4;x<W-4;x+=3){
      sampled++;
      var idx=y*W+x,nb=0,c=0;
      for(var dy=-6;dy<=6;dy+=6){for(var dx=-6;dx<=6;dx+=6){
        if(dx===0&&dy===0)continue;nb+=lum[idx+dy*W+dx];c++;
      }}
      nb/=c;
      var px=idx*4,R=d[px],G=d[px+1],B=d[px+2];
      if(R>60&&R>G&&G>=B&&(R-B)>10)skinSampled++;
      // darker than surroundings AND reddish -> possible spot
      if(lum[idx]<nb*0.82&&R>G&&R>B&&(R-B)>14)redSpots++;
    }}
    var density=redSpots/(skinSampled||1);
    var level,note;
    if(skinPx<n*0.15){cb({error:'This does not look like a close-up of skin - try a well-lit close photo of the area.'});return;}
    if(density<0.004){level='few';note='I see few or no visible spots in this photo.';}
    else if(density<0.02){level='some';note='I see some visible spots in this photo.';}
    else{level='several';note='I see several visible spots in this photo.';}
    cb({level:level,note:note,skinPct:Math.round(100*skinPx/n)});
  }
  return {analyze:analyze};
})();
