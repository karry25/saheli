/* Saheli i18n: English/Hindi toggle. Hindi strings are machine-assisted translations
   (simple everyday Hindi) - marked honestly in the chat note. Marathi: later. */
var SaheliI18n=(function(){
  var KEY='saheli.lang.v1';
  var S={
    en:{
      logToday:'Log today',speakLog:'Speak your log (Hindi/Marathi/English)',photoCheck:'Photo sign check (beta)',
      navToday:'Today',navCheck:'PCOS check',navDemo:'Demo data',navLearn:'Learn',navChat:'Chat',navReset:'Reset',
      glance:'Today at a glance',asks:'Saheli asks',day:'Day',nextPeriod:'Next period ~',
      phase_period:'Period',phase_follicular:'Follicular',phase_fertile:'Fertile window',phase_ovulation:'Ovulation (est.)',phase_luteal:'Luteal',
      heroClear:'All clear - nothing predicted today.',moreHeads:'more heads-up',fullPlan:'Full plan + evidence',
      worthDoc:'Worth a doctor chat',docPrep:'Doctor visit prep (printable)',yourNumbers:'Your numbers',
      trends:'Your trends (6 weeks)',footer:'Private by design - everything stays on this phone. Estimates and screening, never a diagnosis.',
      chatTitle:'Ask Saheli',chatPlaceholder:'Type a question...',send:'Send',close:'Close',
      chatNote:'Answers come only from the vetted Saheli knowledge base (NHS, ACOG, WHO, 2023 PCOS guideline). Runs fully on this phone - nothing you type leaves the device. No diagnosis, no medicine doses.'
    },
    hi:{
      logToday:'आज लॉग करें',speakLog:'बोलकर लॉग करें (हिंदी/मराठी/English)',photoCheck:'फोटो साइन चेक (बीटा)',
      navToday:'आज',navCheck:'PCOS जांच',navDemo:'डेमो डेटा',navLearn:'जानें',navChat:'चैट',navReset:'रीसेट',
      glance:'आज एक नज़र में',asks:'सहेली पूछती है',day:'दिन',nextPeriod:'अगला पीरियड ~',
      phase_period:'पीरियड',phase_follicular:'फॉलिकुलर',phase_fertile:'फर्टाइल विंडो',phase_ovulation:'ओव्युलेशन (अनुमान)',phase_luteal:'ल्यूटियल',
      heroClear:'सब ठीक - आज कुछ अनुमानित नहीं है।',moreHeads:'और सूचनाएं',fullPlan:'पूरा प्लान + सबूत',
      worthDoc:'डॉक्टर से बात करने लायक',docPrep:'डॉक्टर विज़िट की तैयारी (प्रिंट)',yourNumbers:'आपके आंकड़े',
      trends:'आपके रुझान (6 हफ़्ते)',footer:'पूरी प्राइवेसी - सब कुछ इसी फ़ोन पर रहता है। अनुमान और स्क्रीनिंग, कभी डायग्नोसिस नहीं।',
      chatTitle:'सहेली से पूछें',chatPlaceholder:'सवाल लिखें...',send:'भेजें',close:'बंद करें',
      chatNote:'जवाब सिर्फ सहेली के जांचे हुए नॉलेज बेस (NHS, ACOG, WHO, 2023 PCOS गाइडलाइन) से आते हैं। पूरी तरह इस फ़ोन पर चलता है - कुछ भी बाहर नहीं जाता। कोई डायग्नोसिस या दवा की खुराक नहीं। (हिंदी जवाब मशीन-अनुवादित हैं।)'
    }
  };
  function lang(){try{return localStorage.getItem(KEY)||'en';}catch(e){return 'en';}}
  function set(l){localStorage.setItem(KEY,l);}
  function t(k){var l=lang();return (S[l]&&S[l][k])||S.en[k]||k;}
  return {lang:lang,set:set,t:t};
})();
