/* Saheli M2 - PCOS early-warning screener. On-device logistic model trained on a public
   clinical dataset (Kaggle, 539 patients, self-reportable features). Screening only. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) { module.exports = factory(require('./screener-weights.js').SCREENER_MODEL || global.SCREENER_MODEL); }
  else root.SaheliScreener = factory(root.SCREENER_MODEL);
})(typeof self !== 'undefined' ? self : this, function (M) {
  const Q = [
    { id: 'age', label: 'Your age', type: 'num', min: 13, max: 50, feat: 'Age (yrs)' },
    { id: 'height', label: 'Height (cm)', type: 'num', min: 130, max: 200 },
    { id: 'weight', label: 'Weight (kg)', type: 'num', min: 30, max: 200 },
    { id: 'irregular', label: 'Are your cycles irregular? (shorter than 21d, longer than 35d, or very unpredictable)', type: 'yn', feat: 'Cycle(R/I)' },
    { id: 'wgain', label: 'Recent weight gain without trying?', type: 'yn', feat: 'Weight gain(Y/N)' },
    { id: 'hair', label: 'Extra hair growth on face, chest or stomach?', type: 'yn', feat: 'hair growth(Y/N)' },
    { id: 'skin', label: 'Dark, velvety skin patches on neck, underarms or groin?', type: 'yn', feat: 'Skin darkening (Y/N)' },
    { id: 'hairloss', label: 'Thinning hair on your head?', type: 'yn', feat: 'Hair loss(Y/N)' },
    { id: 'pimples', label: 'Persistent pimples/acne beyond the usual?', type: 'yn', feat: 'Pimples(Y/N)' },
    { id: 'fastfood', label: 'Fast food often (most days)?', type: 'yn', feat: 'Fast food (Y/N)' },
    { id: 'exercise', label: 'Regular exercise (3+ days a week)?', type: 'yn', feat: 'Reg.Exercise(Y/N)' }
  ];
  const PLAIN = {
    'hair growth(Y/N)': 'extra hair growth (face/chest/stomach)',
    'Weight gain(Y/N)': 'recent weight gain',
    'Skin darkening (Y/N)': 'dark skin patches (neck/underarms)',
    'Cycle(R/I)': 'irregular cycles',
    'Pimples(Y/N)': 'persistent acne',
    'Fast food (Y/N)': 'frequent fast food',
    'Reg.Exercise(Y/N)': 'exercise pattern',
    'Age (yrs)': 'age', 'BMI': 'BMI', 'Hair loss(Y/N)': 'hair thinning'
  };
  function answersToX(a) {
    const bmi = a.weight && a.height ? a.weight / Math.pow(a.height / 100, 2) : 24;
    return {
      'Age (yrs)': a.age, 'BMI': bmi, 'Cycle(R/I)': a.irregular,
      'Weight gain(Y/N)': a.wgain, 'hair growth(Y/N)': a.hair,
      'Skin darkening (Y/N)': a.skin, 'Hair loss(Y/N)': a.hairloss,
      'Pimples(Y/N)': a.pimples, 'Fast food (Y/N)': a.fastfood, 'Reg.Exercise(Y/N)': a.exercise
    };
  }
  function score(a) {
    const x = answersToX(a);
    let z = M.b; const contrib = [];
    M.features.forEach(function (f, i) {
      const xs = (x[f] - M.mu[i]) / M.sd[i];
      z += M.w[i] * xs;
      contrib.push({ f: f, c: M.w[i] * xs });
    });
    const p = 1 / (1 + Math.exp(-z));
    const band = p < 0.3 ? 'low' : (p < 0.6 ? 'moderate' : 'high');
    const reasons = contrib.filter(function (c) { return c.c > 0.25; })
      .sort(function (a2, b2) { return b2.c - a2.c; }).slice(0, 4)
      .map(function (c) { return PLAIN[c.f] || c.f; });
    return { p: Math.round(p * 100) / 100, band: band, reasons: reasons, bmi: Math.round(x.BMI * 10) / 10 };
  }
  return { Q: Q, score: score };
});
