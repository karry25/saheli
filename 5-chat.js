/* Saheli chat assistant: on-device retrieval over the app's vetted knowledge base + her logs.
   No LLM, no network - honest limits shown. Refuses diagnosis/dosage, points to a doctor.
   Optional cloud LLM (Groq/Gemini free tier) is NOT wired in v1: privacy note kept in UI. */
var SaheliChat=(function(){
  function stem(w){return w.length>4&&/s$/.test(w)&&!/ss$/.test(w)?w.slice(0,-1):w;}
  function tok(s){return s.toLowerCase().replace(/[^a-z0-9 \u0900-\u097F]/g,' ').split(/\s+/).filter(function(w){return w.length>2;}).map(stem);}
  var DOCS=[];
  function idx(){
    if(DOCS.length)return DOCS;
    Object.keys(SaheliTips.RELIEF).forEach(function(k){
      SaheliTips.RELIEF[k].forEach(function(r){DOCS.push({text:r.t,tag:r.ev,src:r.src,keys:k+' '+r.t});});
    });
    SaheliTips.REMEDIES.forEach(function(r){DOCS.push({name:r.name,text:r.name+' - '+r.note+(r.caution?' Caution: '+r.caution:''),tag:r.ev,src:r.src,keys:r.name+' '+r.for+' remedy traditional '+r.note});});
    SaheliTips.PREVENTION.forEach(function(p){DOCS.push({text:p.t,tag:p.ev,src:p.src,keys:'prevent manage reduce risk '+p.t});});
    SaheliTips.SEXED.forEach(function(x){DOCS.push({name:x.t,text:x.t+': '+x.b,tag:x.ev,src:x.src,keys:x.t+' sex contraception condom pill sti consent pain '+x.b});});
    Object.keys(SaheliTips.PHASE_PLAN).forEach(function(ph){
      SaheliTips.PHASE_PLAN[ph].forEach(function(p){DOCS.push({text:'('+ph+' phase) '+p.t,tag:p.ev,src:p.src,keys:ph+' phase '+p.cat+' '+p.t});});
    });
    DOCS.push({name:'PCOS cure diagnosis',text:'PCOS is screened, never diagnosed, by apps. A doctor confirms with blood tests (hormones, sugar) and ultrasound. PCOS has no cure but is very manageable.',tag:'STRONG',src:'WHO PCOS fact sheet',keys:'pcos cure cured curable diagnose doctor confirm tests treatment'});
    DOCS.push({text:'Period pain easing: heat pad, warm bath, gentle exercise like yoga or walking, massage. See a doctor if painkillers stop helping or pain stops daily activities.',tag:'STRONG',src:'NHS period pain',keys:'period pain cramps dysmenorrhea help ease'});
    DOCS.push({name:'Prevent anemia',text:'Prevent anemia: eat iron-rich foods (jaggery, spinach, dal, dates), pair them with vitamin C (lemon, amla) to absorb the iron, and if periods are heavy ask a doctor about CBC and ferritin tests.',tag:'STRONG',src:'ACOG heavy menstrual bleeding',keys:'anemia iron deficiency fatigue tired weakness pale'});
    DOCS.push({name:'Heavy bleeding',text:'Heavy bleeding signs: soaking a pad/tampon every hour for hours, clots bigger than a coin, bleeding over 7 days. Ask about CBC and ferritin (iron).',tag:'STRONG',src:'ACOG heavy menstrual bleeding',keys:'heavy bleeding period anemia iron blood clots'});
    DOCS.forEach(function(d){if(d.name&&HI_KEYS[d.name])d.keys+=' '+HI_KEYS[d.name];});
    return DOCS;
  }

  var HI={
    'Prevent anemia':'एनीमिया रोकें: आयरन वाली चीज़ें खाएं (गुड़, पालक, दाल, खजूर), साथ में विटामिन C (नींबू, आंवला) लें ताकि आयरन ज़्यादा सोखा जाए। पीरियड ज़्यादा हो तो डॉक्टर से CBC और फेरिटिन टेस्ट पूछें।',
    'Spearmint tea':'स्पीयरमिंट चाय - छोटे ट्रायल में कुछ हफ़्तों तक पीने से एंड्रोजन लेवल कम मिला। असर मामूली है। ज़्यादातर के लिए सुरक्षित; गर्भावस्था में ज़्यादा मात्रा से बचें।',
    'Contraception basics':'गर्भनिरोधक बेसिक्स: कंडोम ही इकलौता तरीका है जो STI से भी बचाता है। पिल्स रोज़ एक ही समय पर लेनी होती हैं। आपातकालीन पिल्स (i-pill) सिर्फ इमरजेंसी के लिए है, रोज़ के इस्तेमाल के लिए नहीं। सही तरीका डॉक्टर/नर्स से तय करें।',
    'PCOS cure diagnosis':'PCOS को ऐप कभी डायग्नोज़ नहीं करता - सिर्फ स्क्रीनिंग। डॉक्टर ब्लड टेस्ट (हार्मोन, शुगर) और अल्ट्रासाउंड से पक्का करते हैं। PCOS का कोई इलाज नहीं है, लेकिन इसे बहुत अच्छे से मैनेज किया जा सकता है।',
    'Heavy bleeding':'ज़्यादा ब्लीडिंग के संकेत: कई घंटों तक हर घंटे पैड भीगना, सिक्के से बड़े थक्के, 7 दिन से ज़्यादा ब्लीडिंग। डॉक्टर से CBC और फेरिटिन (आयरन) टेस्ट पूछें।'
  };
  var HI_REFUSAL='मैं डायग्नोसिस, प्रेग्नेंसी या दवा की खुराक में मदद नहीं कर सकती - इसके लिए डॉक्टर ज़रूरी है। मुझसे लक्षण, साइकिल, PCOS, घरेलू नुस्खे या रोकथाम के बारे में पूछें; दवा के सवाल डॉक्टर या फार्मासिस्ट से पूछें।';
  var HI_FALLBACK='मेरे पास इसका जांचा हुआ जवाब अभी नहीं है। मैं सिर्फ सहेली के सोर्स्ड नॉलेज बेस (NHS, ACOG, WHO, 2023 PCOS गाइडलाइन) से जवाब देती हूं - क्रैम्प्स, PCOS, नुस्खे, कंडोम या रोकथाम के बारे में पूछें। किसी भी मेडिकल बात के लिए डॉक्टर सही है।';
  var HI_KEYS={'Prevent anemia':'anemia खून की कमी कमजोरी एनीमिया khoon kami kamzori iron','Spearmint tea':'स्पीयरमिंट चाय','Contraception basics':'कंडोम गर्भनिरोधक प्रेगनेंसी रोकना condom garbh','PCOS cure diagnosis':'पीसीओएस इलाज ठीक cure ilaj','Heavy bleeding':'ज्यादा ब्लीडिंग ज़्यादा bleeding'};

  var REFUSE=/\b(dosage|dose|prescribe|medicine name|which tablet|diagnose me|do i have|am i pregnant|pregnant)\b|how (many|much)[^?]*\b(mg|tablet|pill|capsule|paracetamol|ibuprofen|metformin|medicine)/i;
  function answer(q,C,logs){
    q=q||'';
    var hi=typeof SaheliI18n!=='undefined'&&SaheliI18n.lang()==='hi';
    if(REFUSE.test(q)||/\u0900-\u097F/.test(q)&&/(गोली|खुराक|दवा|पैरासिटामोल|pragnent|pregnant|गर्भ)/.test(q))return {text:hi?HI_REFUSAL:'I cannot help with diagnosis, pregnancy questions or medicine doses - those need a doctor, and getting them right matters. Ask me about symptoms, cycle patterns, PCOS, remedies or prevention instead, and take medicine questions to a doctor or pharmacist.',refusal:true};
    var qk=tok(q);
    if(!qk.length)return {text:hi?'मुझसे अपने साइकिल, लक्षण, PCOS, नुस्खों या सेक्सुअल हेल्थ के बारे में कुछ भी पूछें। मैं सिर्फ सहेली के जांचे हुए नॉलेज बेस से जवाब देती हूं।':'Ask me anything about your cycle, symptoms, PCOS, remedies or sexual health. I answer only from the vetted Saheli knowledge base.',refusal:false};
    var best=null,bs=0,bdistinct=0;
    var GENERIC={prevent:1,manage:1,reduce:1,risk:1,help:1,good:1,work:1,what:1,how:1,doe:1,tip:1,safe:1,best:1,treat:1,cure:1,use:1,pcos:1,period:1,cycle:1,can:1,and:1,the:1,for:1,with:1,suit:1,about:1,phase:1,are:1,is:1,it:1,not:1,my:1,your:1,me:1,should:1,ask:1,doctor:1};
    idx().forEach(function(d){
      var dk=tok(d.keys),s=0,distinct=0;
      var nk=d.name?tok(d.name):[];
      qk.forEach(function(w){
        if(dk.indexOf(w)>=0){if(GENERIC[w]){s+=0.5;}else{s+=2;distinct++;}}
        if(nk.indexOf(w)>=0&&!GENERIC[w]){s+=3;distinct++;}
      });
      if(s>bs||(s===bs&&distinct>bdistinct)){bs=s;bdistinct=distinct;best=d;}
    });
    // topic must match: require at least one distinctive (non-generic) content word, else honest fallback
    if(!best||bdistinct<1||bs<2)best=null;
    var ctx='';
    if(logs&&C){
      var st=C.cycleStats(logs);
      if(st.avg)ctx=' From your logs: average cycle '+Math.round(st.avg)+' days.';
    }
    if(!best||bs===0)return {text:(hi?HI_FALLBACK:'I do not have a vetted answer for that yet. I only speak from the sourced Saheli knowledge base (NHS, ACOG, WHO, 2023 PCOS guideline) - try asking about cramps, bloating, PCOS, remedies, contraception or prevention. For anything medical, a doctor is the right call.')+(hi?'':ctx)};
    var out=(hi&&best.name&&HI[best.name])?HI[best.name]:best.text;
    return {text:out+(hi?'':ctx),tag:best.tag,src:best.src};
  }
  return {answer:answer};
})();
