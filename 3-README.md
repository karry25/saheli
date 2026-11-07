# Saheli - private period + PCOS companion

Saheli (Hindi/Marathi for "a close female friend") is a privacy-first period and
women's health companion for young Indian women. Its flagship is an **early-warning
PCOS screener** that runs a trained ML model entirely on the phone, alongside
everyday cycle tracking, voice logging in Hindi/Marathi/English, honest
evidence-tagged health guidance, and a doctor-visit report.

**Privacy promise: no account, no cloud, no server. Every byte stays in the
browser's localStorage. Photos are analysed in-page and never stored.**

> Saheli gives estimates and early-warning screening - never a diagnosis.
> PCOS has no cure, only management. See a doctor for confirmation.

## The problem
- 1 in 5 Indian women may have PCOS; most find out years late.
- Popular trackers (Flo etc.) lock insights behind accounts, subscriptions and
  cloud data collection - a poor fit for sensitive health data.
- Health advice online mixes evidence with influencer claims; young women get
  "cures" for a condition that has none.

## What Saheli does
| Feature | How |
|---|---|
| Cycle ring + predictions | On-device stats over logged periods, with confidence bands and honest "vary by X days" language |
| One-tap + broad logging | Flow, cramps, bloating, mood, skin + optional symptoms, water, sleep, exercise, sex (private), weight |
| Voice logging | Speak in Hindi, Marathi or English - on-device whisper ASR (sherpa-onnx WASM), extraction to structured log, confirm chips |
| PCOS early-warning check | Logistic-regression model (86% accuracy, AUC 0.895 on a clinic dataset) over 9 simple questions + Rotterdam phenotype hint labelled as a guess |
| Multi-condition flags | Heavy bleeding/anemia, thyroid, endometriosis, PMDD, long cycles - each with "tests to ask about" + source |
| Photo sign check (beta) | On-device pixel heuristics flag visible skin spots from a selfie; clearly labelled rough, photo never stored |
| Saheli guesses + Today's plan | Predictive symptom cards from personal history (else general priors, labelled), phase-based eat/skincare/hair/exercise plan |
| Proactive check-ins | "Saheli asks" card at phase-relevant moments; max 1/day, quiet 9pm-8am, in-app only |
| Chat assistant | Fully on-device retrieval over a vetted knowledge base (NHS, ACOG, WHO, 2023 international PCOS guideline); refuses diagnosis, pregnancy and dosage questions |
| Learn tab | Relief for today, traditional remedies with honest evidence tags (STRONG/SOME/WEAK) + cautions, prevention, sexual/reproductive health |
| Trends | 6-week cramps/mood chart with period bands + cycle-length bars, dependency-free SVG |
| Doctor visit prep | One-tap printable summary: cycles, symptoms, screening result, suggested tests |

## Tech
- Vanilla JS PWA, no frameworks, no build step, no network calls at runtime
- On-device ML: logistic regression weights trained on the Kaggle PCOS clinic
  dataset (baked to `screener-weights.js`); whisper-small-hi int8 ASR via
  sherpa-onnx WebAssembly (flat files, model streams from HF CDN, loads once)
- Storage: localStorage only (`saheli.logs.v1`, `saheli.pcos.v1`,
  `saheli.profile.v1`, `saheli.prompts.v1`)

## Run it
Any static server that can set COOP/COEP headers (needed for the voice model's
WASM threads):

```
python3 serve.py        # included: sets Cross-Origin-Embedder/Opener-Policy
# open http://localhost:8130
```

Deploy free on Netlify/Vercel with the included headers config. GitHub Pages
cannot set COOP/COEP, so voice will not work there.

Useful demo hooks: `?demodata=1` seeds 3 cycles of realistic logs,
`?prompt=1` forces the check-in card, `?tinyvoice=1` uses the small voice model.

## Evidence and honesty
- Every health statement carries an evidence tag: STRONG (guideline/RCT),
  SOME (small trials), WEAK (traditional/anecdotal), plus a named source.
- The PCOS check reports its real limits (clinic-population accuracy; real-world
  will differ) and always routes to a doctor.
- Sources: 2023 International Evidence-based PCOS Guideline, ACOG heavy
  menstrual bleeding FAQ, NHS (period pain, endometriosis, hypothyroidism),
  WHO PCOS fact sheet, WHO/ACOG sexual health pages, spearmint (Grant 2010),
  cinnamon (Kort 2014), ginger trials. Full list in `research-sources.md`.

## Roadmap (not built yet)
- Capacitor-wrapped APK with on-device scheduled notifications (see
  `research-reminders-and-apk.md`) - sideload, no Play Store fee
- Optional free-tier cloud LLM for chat (off by default, clear warning)
- Marathi voice-model fine-tune; hair-thinning photo heuristics beyond beta
