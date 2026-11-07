/* Saheli tips engine - Today's plan, remedies, prevention.
   Every item: evidence tag (STRONG=guideline/systematic review, SOME=small studies, WEAK=traditional/early) + source.
   Rules: screening not diagnosis; manage/ease/prevent, never "cure"; no dosages; gentle general advice. */
var SaheliTips=(function(){
  var EV={STRONG:'STRONG',SOME:'SOME',WEAK:'WEAK'};

  // Daily plan by phase. cat: water/food/move/sleep/skin/hair/rest
  var PHASE_PLAN={
    period:[
      {cat:'rest',t:'Period day - be kind to yourself. Warm bath or a heat pad (wrapped in a cloth) on your tummy can ease cramps.',ev:'STRONG',src:'NHS period pain'},
      {cat:'move',t:'Gentle movement helps cramps: a slow walk, easy yoga or stretching. Stop if pain gets worse.',ev:'STRONG',src:'NHS period pain'},
      {cat:'food',t:'Iron-rich food today (palak, dal, jaggery, dates, eggs/meat if you eat it) - periods take iron out.',ev:'SOME',src:'ACOG heavy bleeding + anemia risk'},
      {cat:'water',t:'Keep a water bottle near. Needs differ person to person - drink to thirst, a little more if it is hot.',ev:'SOME',src:'general health guidance'}
    ],
    follicular:[
      {cat:'move',t:'Energy usually rises now - good days for strength training or a brisk walk/run.',ev:'STRONG',src:'2023 PCOS guideline: regular activity advised'},
      {cat:'food',t:'Build the week: protein + fibre each meal (dal, paneer, sprouts, veggies) steadies energy and cravings.',ev:'STRONG',src:'2023 PCOS guideline lifestyle'},
      {cat:'skin',t:'Skin often calmer this week - keep the gentle routine: mild cleanser, moisturiser, sunscreen SPF 30+.',ev:'SOME',src:'dermatology guidance (AAD)'}
    ],
    fertile:[
      {cat:'rest',t:'Fertile window (estimate). This is information, not contraception - apps cannot prevent pregnancy.',ev:'STRONG',src:'ACOG fertile-window guidance'},
      {cat:'move',t:'Good days for your hardest workout if you feel up for it.',ev:'SOME',src:'2023 PCOS guideline: 150-300 min/week activity'},
      {cat:'water',t:'Keep water handy - gentle reminder only, your need depends on heat and activity.',ev:'SOME',src:'general health guidance'}
    ],
    luteal:[
      {cat:'food',t:'Cravings rise for many now. Keep regular meals with protein; dark chocolate/fruit can answer a sweet tooth without a crash.',ev:'SOME',src:'PMS nutrition literature'},
      {cat:'move',t:'Bloated or crampy? A light walk or yoga often eases it. High-energy day? Strength works too.',ev:'STRONG',src:'NHS period pain (gentle exercise)'},
      {cat:'sleep',t:'Wind down 30 min earlier - mood and cramps feel worse on short sleep.',ev:'SOME',src:'sleep and PMS research'},
      {cat:'skin',t:'Pre-period breakouts are common. Hands off pimples; gentle cleanse; benzoyl peroxide/salicylic acid only after asking a pharmacist or dermatologist.',ev:'SOME',src:'AAD acne care'}
    ]
  };

  // Relief per symptom (Remedies and relief)
  var RELIEF={
    cramps:[
      {t:'Heat pad or hot water bottle wrapped in a cloth on your tummy, 15-20 min.',ev:'STRONG',src:'NHS period pain'},
      {t:'Warm bath or shower; gentle tummy and back massage.',ev:'STRONG',src:'NHS period pain'},
      {t:'Gentle exercise - yoga, swimming, walking, cycling.',ev:'STRONG',src:'NHS period pain'},
      {t:'Ginger (adrak) tea - traditional remedy with clinical-trial support for period pain.',ev:'SOME',src:'systematic reviews on ginger for dysmenorrhea',caution:'Avoid excess if pregnant or on blood thinners.'},
      {t:'Painkillers like paracetamol or ibuprofen can help - follow the pack or ask a pharmacist; see a doctor if they stop helping.',ev:'STRONG',src:'NHS period pain'}
    ],
    bloating:[
      {t:'Go light on very salty snacks today - salt holds water.',ev:'SOME',src:'nutrition guidance'},
      {t:'Slow walk after meals; small frequent meals instead of one heavy one.',ev:'SOME',src:'gastroenterology guidance'},
      {t:'Saunf (fennel) or ajwain water - traditional and gentle.',ev:'WEAK',src:'traditional use, limited studies'}
    ],
    mood:[
      {t:'Name it: pre-period mood dips are real and common (PMS). You are not overreacting.',ev:'STRONG',src:'ACOG PMS patient guidance'},
      {t:'10 min outside daylight + short walk - reliably lifts mood a notch.',ev:'SOME',src:'exercise and mood research'},
      {t:'If low mood is heavy, lasts beyond your period, or you feel unsafe - please talk to a doctor or someone you trust today.',ev:'STRONG',src:'PMDD red-flag guidance (NHS/ACOG)'}
    ],
    acne:[
      {t:'Gentle cleanser twice a day, do not scrub. Sunscreen in the day.',ev:'SOME',src:'AAD acne care'},
      {t:'Hands off - picking scars. Hydrocolloid pimple patches help the urge.',ev:'SOME',src:'AAD acne care'},
      {t:'PCOS-linked acne often needs medical treatment - a dermatologist can help; track breakouts against your cycle here to show them.',ev:'SOME',src:'2023 PCOS guideline'}
    ],
    hairfall:[
      {t:'Gentle handling: loose hairstyles, no tight ponytails, wide comb on wet hair.',ev:'SOME',src:'AAD hair care'},
      {t:'Protein at each meal + iron check if periods are heavy - low iron thins hair.',ev:'SOME',src:'dermatology guidance'},
      {t:'Pattern hair thinning (widening part, temple recession) with PCOS signs deserves a doctor visit - treatments work best early.',ev:'STRONG',src:'2023 PCOS guideline'}
    ],
    cravings:[
      {t:'Regular meals with protein + fibre beat willpower. Skipping meals feeds the 5pm craving.',ev:'SOME',src:'nutrition literature'},
      {t:'Sweet tooth plan: fruit, dates, a piece of dark chocolate - portioned, not forbidden.',ev:'SOME',src:'nutrition literature'},
      {t:'Poor sleep amplifies cravings - check last night first.',ev:'SOME',src:'sleep and appetite research'}
    ],
    headache:[
      {t:'Water, food, screen break - the usual three before anything else.',ev:'SOME',src:'general guidance'},
      {t:'Hormone-linked headaches often cluster pre-period; logging them here shows your doctor the pattern.',ev:'SOME',src:'menstrual migraine literature'}
    ],
    fatigue:[
      {t:'Heavy periods + tiredness can mean low iron - ask a doctor about a CBC/ferritin test if this repeats.',ev:'STRONG',src:'ACOG heavy bleeding'},
      {t:'Short walk beats a nap over 30 min for daytime slump.',ev:'SOME',src:'activity research'},
      {t:'Constant fatigue with weight change, feeling cold, hair fall - ask about a thyroid (TSH) test.',ev:'STRONG',src:'NHS hypothyroidism'}
    ],
    sleep:[
      {t:'Same sleep/wake time daily; screens off 30 min before bed.',ev:'SOME',src:'sleep hygiene guidance'},
      {t:'Cramps at night: heat pad before bed, side-sleep with a pillow between knees.',ev:'SOME',src:'NHS period pain adapted'}
    ]
  };

  // Fair look at popular/traditional PCOS remedies
  var REMEDIES=[
    {name:'Spearmint tea',for:'unwanted hair / androgen signs',ev:'SOME',note:'Small trials found lower androgen levels with regular spearmint tea over weeks. Pleasant and low-risk; effect is modest.',src:'small RCTs (Grant 2010; Akdogan 2007)',caution:'Safe as a beverage for most.'},
    {name:'Cinnamon (dalchini)',for:'cycle regularity, insulin resistance',ev:'SOME',note:'Small trials in PCOS showed improved cycle regularity and insulin measures. Food-level amounts are fine.',src:'small RCTs in PCOS (Kort 2014; Wang 2007)',caution:'Cassia cinnamon in large daily doses can stress the liver - food amounts OK.'},
    {name:'Ginger (adrak)',for:'period pain, nausea',ev:'SOME',note:'Systematic reviews support ginger for period pain and nausea.',src:'systematic reviews on ginger for dysmenorrhea',caution:'Avoid excess in pregnancy or with blood thinners.'},
    {name:'Fenugreek (methi)',for:'blood sugar support',ev:'WEAK',note:'Traditional; early small studies for glucose. Not a PCOS treatment.',src:'early small studies',caution:'Avoid medicinal doses in pregnancy; interacts with diabetes medicines.'},
    {name:'Ashwagandha',for:'stress',ev:'WEAK',note:'Some trials for stress/cortisol, none solid for PCOS itself.',src:'small stress RCTs; no solid PCOS evidence',caution:'Avoid in pregnancy, thyroid disease without a doctor, with sedatives.'},
    {name:'Seed cycling',for:'cycle regularity',ev:'WEAK',note:'Popular on social media; no clinical trials. Seeds are healthy food - just not medicine.',src:'no clinical evidence found',caution:'None as food.'}
  ];

  // Prevention / management (complications)
  var PREVENTION=[
    {t:'Insulin resistance and diabetes risk: regular activity (about 150-300 min/week moderate), strength work twice a week, and fibre+protein meals are the guideline-backed core. Ask a doctor about a glucose/HbA1c test every 1-3 years with PCOS.',ev:'STRONG',src:'2023 PCOS guideline'},
    {t:'Heart health: the same lifestyle core; keep an eye on blood pressure and lipids at checkups.',ev:'STRONG',src:'2023 PCOS guideline'},
    {t:'Very long gaps (no period for 90+ days) need a doctor visit - the womb lining needs regular shedding.',ev:'STRONG',src:'2023 PCOS guideline'},
    {t:'Anemia from heavy periods: iron-rich food daily; if bleeding is heavy (soaking a pad/tampon hourly for hours, clots bigger than a coin, >7 days), see a doctor and ask about CBC + ferritin.',ev:'STRONG',src:'ACOG heavy menstrual bleeding'},
    {t:'Fertility: PCOS is a common, treatable cause of irregular ovulation. If planning pregnancy, earlier doctor visits help - many options exist.',ev:'STRONG',src:'WHO PCOS fact sheet'},
    {t:'Weight-neutral note: health habits help at every size; crash dieting backfires. Care should never be "just lose weight".',ev:'STRONG',src:'2023 PCOS guideline'}
  ];

  var EXERCISE={
    period:{t:'Easy yoga or a slow walk',note:'gentle movement eases cramps',ev:'STRONG',src:'NHS period pain'},
    follicular:{t:'Strength training or a run',note:'energy usually peaks now',ev:'SOME',src:'2023 PCOS guideline activity'},
    fertile:{t:'Your favourite workout',note:'good energy window',ev:'SOME',src:'2023 PCOS guideline activity'},
    luteal:{t:'Brisk walk or swim',note:'helps bloating and pre-period mood',ev:'SOME',src:'NHS period pain adapted'}
  };

  function planFor(phase,symptoms){
    symptoms=symptoms||{};
    var items=(PHASE_PLAN[phase]||PHASE_PLAN.follicular).slice();
    var ex=EXERCISE[phase]||EXERCISE.follicular;
    items.unshift({cat:'move',t:"Today's movement: "+ex.t+' - '+ex.note+'. Stop if pain.',ev:ex.ev,src:ex.src});
    Object.keys(symptoms).forEach(function(s){
      if(RELIEF[s]&&symptoms[s]) items.push({cat:'relief',t:RELIEF[s][0].t,ev:RELIEF[s][0].ev,src:RELIEF[s][0].src});
    });
    return items.slice(0,6);
  }

  // Sexual and reproductive health info (WHO/NHS/ACOG). Respectful, non-judgmental, private.
  var SEXED=[
    {t:'Contraception basics',b:'Condoms are the only method that also protects against STIs. Pills are taken daily and work best on schedule - a doctor helps you choose. Emergency contraception is for emergencies and works best the sooner it is taken - it is not a regular method. An IUD is long-acting and placed by a doctor.',ev:'STRONG',src:'WHO/NHS contraception guidance'},
    {t:'Cycle apps are not contraception',b:'Fertile-window estimates like Saheli\'s are rough - especially with irregular cycles. Sperm can survive up to about 5 days and the egg about a day, but timing varies. Never rely on an app to avoid pregnancy.',ev:'STRONG',src:'ACOG fertility-awareness guidance'},
    {t:'STIs and testing',b:'Many STIs have no symptoms. Condoms lower the risk a lot. Test when you have a new partner, symptoms (unusual discharge, burning while peeing, sores, pelvic pain), or just for peace of mind. Testing is normal healthcare, not shame.',ev:'STRONG',src:'WHO STI fact sheets'},
    {t:'Pain during sex is worth a doctor visit',b:'Pain during or after sex is common and treatable - it can come from dryness, infection, endometriosis or other causes. You do not have to endure it.',ev:'STRONG',src:'NHS painful sex guidance'},
    {t:'Consent, always',b:'Consent means a clear, freely given yes - every time, and it can be withdrawn at any point. Pressure is not consent. Your body, your choice.',ev:'STRONG',src:'WHO consent guidance'},
    {t:'See a doctor soon if',b:'burning while peeing, unusual discharge or smell, pelvic pain outside your period, bleeding after sex, fever with pelvic pain, or a missed period with pregnancy risk.',ev:'STRONG',src:'NHS sexual health guidance'}
  ];
  return {planFor:planFor,RELIEF:RELIEF,REMEDIES:REMEDIES,PREVENTION:PREVENTION,PHASE_PLAN:PHASE_PLAN,EXERCISE:EXERCISE,SEXED:SEXED};
})();
