/* Saheli pattern flags: rule-based "see a doctor about X, because Y" across conditions.
   Sources: ACOG heavy menstrual bleeding FAQ, NHS endometriosis, NHS hypothyroidism,
   NHS period pain red flags, WHO PCOS fact sheet, 2023 International PCOS guideline, PMDD criteria (NHS/ACOG).
   Screening only - never diagnosis. Every flag lists the suggested tests to ask about. */
var SaheliFlags=(function(){
  function dayList(logs){return Object.keys(logs).sort();}
  function evaluate(C,logs,pcosAnswers,pcosResult){
    var flags=[];
    var days=dayList(logs);
    var st=C.cycleStats(logs);
    var nFlowHeavy=0,nFlowDays=0,longPeriods=0,painHeavy=0,pmsDays=0,sexPain=0;
    days.forEach(function(k){
      var l=logs[k];
      if(l.flow==='heavy')nFlowHeavy++;
      if(l.flow&&l.flow!=='none')nFlowDays++;
      if(l.cramps>=7)painHeavy++;
      if(l.mood&&l.mood<=1)pmsDays++;
      if(l.tags&&(l.tags.indexOf('pain during sex')>=0))sexPain++;
    });
    // Heavy bleeding / anemia (ACOG): heavy flow on many days, period >7 days, fatigue
    if(nFlowHeavy>=3||(st.periodLen&&st.periodLen>7)){
      flags.push({id:'hmb',title:'Bleeding looks heavier than usual',why:'You logged heavy flow '+nFlowHeavy+' time(s)'+(st.periodLen?' and periods lasting about '+st.periodLen+' days':'')+'. ACOG counts soaking a pad/tampon every hour for hours, clots bigger than a coin, or bleeding over 7 days as heavy.',tests:['CBC (blood count)','ferritin (iron stores)','pelvic ultrasound'],src:'ACOG heavy menstrual bleeding'});
    }
    // Thyroid (NHS): irregular cycles + fatigue + weight/cold signs
    var fatigueTags=days.filter(function(k){var l=logs[k];return l.tags&&(l.tags.indexOf('tired')>=0||l.fatigue);}).length;
    if(st.avg&&(st.avg>35||st.avg<21)&&fatigueTags>=3){
      flags.push({id:'thyroid',title:'Cycle pattern + tiredness can come from thyroid',why:'Your cycles average '+Math.round(st.avg)+' days and you logged low energy '+fatigueTags+' times. An underactive or overactive thyroid can cause both.',tests:['TSH (thyroid)','T4 if TSH is off'],src:'NHS hypothyroidism + irregular periods'});
    }
    // Endometriosis (NHS): severe cramps repeatedly + pain during sex / pain outside period
    if(painHeavy>=3){
      var why='You logged cramps 7/10 or worse '+painHeavy+' times. NHS says period pain that stops daily activities, or pain during sex, deserves a GP visit - endometriosis is one common cause.';
      if(sexPain>0)why+=' You also logged pain during sex.';
      flags.push({id:'endo',title:'Severe period pain is worth checking',why:why,tests:['pelvic ultrasound','gynaecologist consult (laparoscopy only if advised)'],src:'NHS endometriosis + period pain'});
    }
    // PMDD: very low mood clustered in luteal phase
    if(pmsDays>=4){
      flags.push({id:'pmdd',title:'Mood crashes before periods deserve care',why:'You logged very low mood '+pmsDays+' times. If these land mostly in the week before your period and lift after it starts, tell a doctor - PMDD is real and treatable.',tests:['2 months of daily mood tracking (you are already doing it here)','doctor consult'],src:'NHS/ACOG PMDD guidance'});
    }
    // PCOS family: irregular + androgen signs
    if(pcosResult&&pcosResult.band!=='low'){
      flags.push({id:'pcos-follow',title:'Your PCOS early-warning came back '+pcosResult.band,why:'Screening score suggests asking a doctor. PCOS is confirmed only with blood tests and/or ultrasound - this app never diagnoses.',tests:['hormone panel (testosterone, LH/FSH, AMH if advised)','pelvic ultrasound','glucose/HbA1c + lipids (insulin resistance check)'],src:'WHO PCOS + 2023 guideline'});
    }
    // Long cycles alone
    if(st.avg&&st.avg>35&&(!pcosResult||pcosResult.band==='low')&&fatigueTags<3){
      flags.push({id:'longcycles',title:'Cycles longer than 35 days',why:'Your cycles average '+Math.round(st.avg)+' days. Long or missing periods (90+ days without one) should be discussed with a doctor - the womb lining needs regular shedding.',tests:['hormone panel','TSH','pregnancy test if relevant'],src:'2023 PCOS guideline'});
    }
    return flags;
  }
  // Observed-pattern description in plain words (never a phenotype label, never a diagnosis).
  // The 2023 guideline needs 2 of 3 features with other causes excluded - a questionnaire cannot type PCOS.
  function pcosPatternHint(answers,result){
    if(!result||result.band==='low'||!answers)return null;
    var ov=+answers.irregular===1;
    var ha=(+answers.hair===1)||(+answers.skin===1)||(+answers.hairloss===1)||(+answers.pimples===1);
    var base='A clinician confirms PCOS using the 2023 guideline: at least 2 of 3 features (irregular ovulation, androgen excess, polycystic ovaries on ultrasound) after ruling out other causes. Discuss these answers with a clinician.';
    if(ov&&ha)return {pattern:'irregular cycles + skin/hair changes (extra hair growth, acne, or thinning) reported',note:base};
    if(ov&&!ha)return {pattern:'irregular cycles reported, without clear skin/hair changes',note:'A clinician may check hormone levels for androgen excess that is not visible. '+base};
    if(!ov&&ha)return {pattern:'skin/hair changes reported while cycles are regular',note:base};
    return null;
  }
  return {evaluate:evaluate,pcosPatternHint:pcosPatternHint};
})();
