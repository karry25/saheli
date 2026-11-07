/* Saheli M3 - spoken-log extractor: map a transcript (Hindi/Marathi/English, Devanagari or roman) to log fields. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SaheliExtract = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  const RULES = [
    { key: 'flow', v: 'heavy', words: ['भारी', 'ज़्यादा ब्लीडिंग', 'ज्यादा ब्लीडिंग', 'heavy', 'bahut bleeding', 'bhari'] },
    { key: 'flow', v: 'medium', words: ['पीरियड', 'पिरियड', 'मासिक', 'माहवारी', 'mc', 'period', 'piriod', 'masik', 'chums', 'date aayi', 'डेट आई'] },
    { key: 'flow', v: 'light', words: ['हल्का पीरियड', 'light flow', 'spotting', 'स्पॉटिंग'] },
    { key: 'cramps', v: 7, words: ['बहुत दर्द', 'बहुत पेट दर्द', 'severe pain', 'bahut dard'] },
    { key: 'cramps', v: 5, words: ['पेट दर्द', 'पोट दुखत', 'पेट में दर्द', 'क्रैम्प', 'दर्द', 'दुखत', 'dard', 'cramp', 'pet dukh', 'pot dukh', 'pain'] },
    { key: 'cramps', v: 2, words: ['हल्का दर्द', 'थोड़ा दर्द', 'थोडा दुख', 'thoda dard', 'mild pain'] },
    { key: 'bloat', v: 'strong', words: ['बहुत सूजन', 'पेट बहुत फूल', 'bahut sujan'] },
    { key: 'bloat', v: 'mild', words: ['सूजन', 'पेट फूल', 'फूल रहा', 'sujan', 'bloat', 'pet phool', 'pot phut'] },
    { key: 'mood', v: 1, words: ['बहुत खराब', 'बहुत बुरा', 'bahut kharab', 'very low', 'रोना', 'rona'] },
    { key: 'mood', v: 2, words: ['मूड खराब', 'खराब है', 'उदास', 'थकान', 'kharab', 'udaas', 'thakan', 'tired', 'low', 'sad'] },
    { key: 'mood', v: 4, words: ['अच्छा', 'छान', 'achha', 'mast', 'मस्त', 'good', 'theek'] },
    { key: 'mood', v: 5, words: ['बहुत अच्छा', 'खुश', 'khush', 'happy', 'great', 'awesome'] },
    { key: 'skin', v: 'breakout', words: ['पिंपल', 'मुहांसे', 'मुळमुळे', 'pimple', 'acne', 'muhase', 'breakout'] },
    { key: 'tags', v: 'angry', words: ['गुस्सा', 'राग', 'gussa', 'angry', 'rage'] },
    { key: 'tags', v: 'anxious', words: ['चिंता', 'घबराहट', 'चिंता हो', 'chinta', 'anxious', 'anxiety', 'tension', 'टेंशन'] },
    { key: 'tags', v: 'happy', words: ['खुश', 'khush', 'happy'] },
    { key: 'tags', v: 'calm', words: ['शांत', 'शान्त', 'shant', 'calm', 'relaxed'] },
    { key: 'tags', v: 'irritated', words: ['चिढ़', 'चिडचिडा', 'चिडचिड', 'chidchid', 'irritat', 'irritation'] },
    { key: 'tags', v: 'weepy', words: ['रोना', 'रडणं', 'रड', 'weepy', 'cry'] }
  ];
  function extract(text) {
    const t = (text || '').toLowerCase();
    const out = { tags: [] };
    const matched = [];
    for (const r of RULES) {
      for (const w of r.words) {
        if (t.includes(w.toLowerCase())) {
          if (r.key === 'tags') { if (!out.tags.includes(r.v)) out.tags.push(r.v); }
          else if (!(r.key in out)) out[r.key] = r.v;
          matched.push(w); break;
        }
      }
    }
    return { fields: out, matched: matched };
  }
  return { extract: extract };
});
