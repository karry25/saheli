/* Saheli M3 - on-device voice logging (sherpa-onnx wasm + whisper-small-hi int8).
   Audio never leaves the phone; recognition runs fully in this page. */
var SaheliVoice = (function () {
  let modPromise = null, recognizer = null, recState = null, recLang = null;
  const MODEL_DIR = (typeof location!=='undefined' && location.search.indexOf('tinyvoice')>=0) ? 'asr-tiny/' : 'asr/';
  const STATUS = (m) => { const el = document.getElementById('vstatus'); if (el) el.textContent = m; };

  async function loadModule() {
    if (modPromise) return modPromise;
    modPromise = new Promise(function (res) {
      const M = window.Module;
      if (M && M.calledRun && M._SherpaOnnxCreateOfflineRecognizer) { res(M); return; }
      const prev = M.onRuntimeInitialized;
      M.onRuntimeInitialized = function () { if (prev) prev(); res(M); };
    });
    return modPromise;
  }
  // whisper-tiny int8 (103MB): the only size verified working with this wasm build (small int8 mis-decodes).
  const REMOTE_BASE = 'https://huggingface.co/csukuangfj/sherpa-onnx-whisper-tiny/resolve/main/';
  async function fileToFS(M, url, remoteName, name) {
    // local model dir first (dev/offline bundle); fall back to Hugging Face CDN (CORS-enabled, free)
    let resp = await fetch(url).catch(function(){return null;});
    if (!resp || !resp.ok) resp = await fetch(REMOTE_BASE + remoteName);
    const buf = new Uint8Array(await resp.arrayBuffer());
    M.FS_createDataFile('/', name, buf, true, false, true);
  }
  async function ensureRecognizer(onProgress, lang) {
    lang = lang || 'hi';
    if (recognizer && recLang === lang) return recognizer;
    if (recognizer) { try { recognizer.free(); } catch (e) {} recognizer = null; }
    onProgress('Loading voice engine (first time ~15MB)...');
    const M = await loadModule();
    const P = 'tiny-';
    const files = [[P + 'encoder.int8.onnx', 'encoder.int8.onnx'], [P + 'decoder.int8.onnx', 'decoder.int8.onnx'], [P + 'tokens.txt', 'tokens.txt']];
    let done = 0;
    for (const [remote, local] of files) {
      onProgress('Downloading on-device voice model (' + ++done + '/3, ~103MB first time only - stays on your phone)...');
      await fileToFS(M, MODEL_DIR + local, remote, local);
    }
    onProgress('Preparing recognizer...');
    recognizer = new OfflineRecognizer({
      featConfig: { sampleRate: 16000, featureDim: 80 },
      modelConfig: {
        whisper: { encoder: 'encoder.int8.onnx', decoder: 'decoder.int8.onnx', language: lang, task: 'transcribe', tailPaddings: 1000 },
        tokens: 'tokens.txt', numThreads: 2, provider: "cpu", debug: 0, modelType: 'whisper'
      }
    }, M);
    recLang = lang;
    return recognizer;
  }
  function resample(buf, fromRate, toRate) {
    if (fromRate === toRate) return buf;
    const ratio = fromRate / toRate, out = new Float32Array(Math.floor(buf.length / ratio));
    for (let i = 0; i < out.length; i++) out[i] = buf[Math.floor(i * ratio)];
    return out;
  }
  async function start() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount: 1, echoCancellation: true, noiseSuppression: true } });
    let ctx;
    try { ctx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 }); }
    catch (e) { ctx = new (window.AudioContext || window.webkitAudioContext)(); }
    const src = ctx.createMediaStreamSource(stream);
    const proc = ctx.createScriptProcessor(4096, 1, 1);
    const chunks = [];
    proc.onaudioprocess = (e) => { chunks.push(new Float32Array(e.inputBuffer.getChannelData(0))); };
    src.connect(proc); proc.connect(ctx.destination);
    recState = { stream, ctx, proc, chunks, rate: ctx.sampleRate };
  }
  async function stopAndTranscribe(onProgress) {
    const st = recState; recState = null;
    st.proc.disconnect(); st.ctx.close();
    st.stream.getTracks().forEach(t => t.stop());
    const total = st.chunks.reduce((a, c) => a + c.length, 0);
    const all = new Float32Array(total); let o = 0;
    for (const c of st.chunks) { all.set(c, o); o += c.length; }
    let pcm = resample(all, st.rate, 16000);
    const WINDOW = 480000; // whisper needs exactly 30s of 16kHz audio
    const padded = new Float32Array(WINDOW); padded.set(pcm.subarray(0, WINDOW));
    onProgress('Recognizing on this phone...');
    const rec = await ensureRecognizer(onProgress, SaheliVoice.lang || 'hi');
    const s = rec.createStream();
    s.acceptWaveform(16000, padded);

    rec.decode(s);
    const r = rec.getResult(s);
    s.free();
    return (r.text || '').trim();
  }
  return { start, stopAndTranscribe, isRecording: () => !!recState, lang: 'hi' };
})();
