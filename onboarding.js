/* Saheli first-run onboarding: short, friendly, skippable, on-device only.
   Every question earns its place: it prefills predictions, the screener, or the eat/tips cards.
   No account, no ID docs. Saved as saheli.profile.v1 in localStorage. */
var SaheliOnboard=(function(){
  var PKEY='saheli.profile.v1';
  function get(){try{return JSON.parse(localStorage.getItem(PKEY));}catch(e){return null;}}
  function save(p){localStorage.setItem(PKEY,JSON.stringify(p));}
  function needed(){return !get();}

  function build(opts){
    var box=document.getElementById('obbox');
    var dlg=document.getElementById('dlg6');
    var p={};
    function chipRow(label,key,options,multi){
      var d=document.createElement('div');d.className='q';
      d.innerHTML='<label>'+label+'</label>';
      var row=document.createElement('div');row.className='tags';
      options.forEach(function(o){
        var b=document.createElement('button');b.dataset.v=o[0];b.textContent=o[1];
        b.onclick=function(){
          if(multi){var i=(p[key]=p[key]||[]).indexOf(o[0]);if(i<0)p[key].push(o[0]);else p[key].splice(i,1);b.classList.toggle('on');}
          else{p[key]=o[0];row.querySelectorAll('button').forEach(function(x){x.classList.toggle('on',x===b);});}
        };
        row.appendChild(b);
      });
      d.appendChild(row);return d;
    }
    function field(label,key,type,ph){
      var d=document.createElement('div');d.className='q';
      d.innerHTML='<label>'+label+'</label>';
      var i=document.createElement('input');i.type=type||'text';i.placeholder=ph||'';
      i.style.cssText='width:100%;padding:10px;border:1.5px solid #e6dbe4;border-radius:12px;font-size:15px';
      i.oninput=function(){p[key]=i.value;};
      d.appendChild(i);return d;
    }
    var steps=[];
    // step 1: about you
    steps.push(function(){
      box.innerHTML='<h2>Hi, I am Saheli</h2><p style="font-size:13px;color:var(--mut);margin-bottom:12px">Your private period and health companion. 30 seconds of setup - everything stays on this phone, no account. You can skip any question.</p>';
      box.appendChild(field('What should I call you? (nickname)','name','text','e.g. Kari'));
      box.appendChild(field('Age','age','number','years'));
      nav(0);
    });
    // step 2: your cycle
    steps.push(function(){
      box.innerHTML='<h2>Your cycle</h2><p style="font-size:13px;color:var(--mut);margin-bottom:12px">This powers predictions. Best guess is fine.</p>';
      box.appendChild(chipRow('What brings you here?','goal',[['track','Track my cycle'],['pcos','PCOS worry'],['conceive','Planning pregnancy'],['health','General health']]));
      box.appendChild(field('First day of your last period','lastperiod','date'));
      box.appendChild(field('Usual cycle length (days, 0 = not sure)','cyclelen','number','e.g. 28'));
      box.appendChild(chipRow('Are your periods regular?','regular',[['yes','Mostly yes'],['no','No / varies'],['idk','Not sure']]));
      nav(1);
    });
    // step 3: a little more (all optional)
    steps.push(function(){
      box.innerHTML='<h2>A little more (all optional)</h2><p style="font-size:13px;color:var(--mut);margin-bottom:12px">These prefill the PCOS check and food tips.</p>';
      box.appendChild(field('Height (cm)','height','number','optional'));
      box.appendChild(field('Weight (kg)','weight','number','optional'));
      box.appendChild(chipRow('Food type','diet',[['veg','Veg'],['nonveg','Non-veg'],['egg','Eggetarian'],['vegan','Vegan']]));
      box.appendChild(chipRow('Symptoms you usually get around periods','usual',[['cramps','Cramps'],['bloat','Bloating'],['acne','Breakouts'],['mood','Mood dips'],['headache','Headache'],['cravings','Cravings'],['tired','Low energy']],true));
      box.appendChild(chipRow('Birth control (private, on-device only)','bc',[['none','None'],['pill','Pill'],['condoms','Condoms'],['iud','IUD'],['other','Other'],['skip','Prefer not to say']]));
      box.appendChild(field('Conditions or medicines (optional)','meds','text','e.g. thyroid, metformin'));
      nav(2,true);
    });
    function nav(i,last){
      var row=document.createElement('div');row.className='row';row.style.marginTop='14px';
      var skip=document.createElement('button');skip.className='grow ghost';skip.textContent=i===0?'Skip setup':'Back';
      var next=document.createElement('button');next.className='grow save';next.textContent=last?'Start Saheli':'Next';
      skip.onclick=function(){if(i===0){save({skipped:true,when:new Date().toISOString()});dlg.close();opts.done&&opts.done();}else steps[i-1]();};
      next.onclick=function(){
        if(last){finish();}else steps[i+1]();
      };
      row.appendChild(skip);row.appendChild(next);box.appendChild(row);
    }
    function finish(){
      p.when=new Date().toISOString();
      // seed last period as a flow day so the ring works from day one
      if(p.lastperiod&&opts.seedLog)opts.seedLog(p.lastperiod);
      save(p);
      dlg.close();opts.done&&opts.done();
    }
    steps[0]();
    dlg.showModal();
  }
  return {get:get,save:save,needed:needed,build:build};
})();
