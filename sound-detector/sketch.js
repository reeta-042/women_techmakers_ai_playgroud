// ============================================================
//  SOUND DETECTOR — sketch.js
//  Powered by Teachable Machine + TensorFlow.js Speech Commands
// ============================================================

// ============================================================
//  ✏️  EASY EDIT ZONE 1: Score threshold (0–1)
//  The confidence bar turns green above this level.
//  Does NOT auto-score — user decides with the buttons.
// ============================================================
const SCORE_THRESHOLD = 0.75;

// ============================================================
//  ✏️  EASY EDIT ZONE 2: Points per correct click
// ============================================================
const POINTS_PER_HIT = 1;

// ============================================================
//  ✏️  EASY EDIT ZONE 3: Score needed to show retrain prompt
// ============================================================
const RETRAIN_SCORE = 5;

// ============================================================
//  ✏️  EASY EDIT ZONE 4: Index of the background/noise class
//  Usually index 1 in Teachable Machine audio models.
//  This class label turns grey even if confidence is high.
// ============================================================
const NOISE_CLASS_INDEX = 1;

// --- Internal state ---
let recognizer;
let score = 0;
let correct = 0;
let wrong = 0;
let running = false;

// ---- Called when user clicks ▶ Start ----
async function startApp() {
  if (running) return;

  let url = document.getElementById("model-url-input").value.trim();
  if (!url) {
    setStatus("⚠️ Please paste your model URL first.", "error");
    return;
  }
  if (!url.endsWith("/")) url += "/";

  setStatus("⏳ Loading model...", "");

  if (recognizer && recognizer.isListening()) {
    recognizer.stopListening();
  }

  try {
    recognizer = speechCommands.create(
      'BROWSER_FFT',
      undefined,
      url + "model.json",
      url + "metadata.json"
    );
    await recognizer.ensureModelLoaded();

    const labels = recognizer.wordLabels();
    setStatus("✅ Listening — " + labels.length + " classes", "ready");
    running = true;

    // Enable judge buttons
    document.getElementById("btn-correct").disabled = false;
    document.getElementById("btn-wrong").disabled = false;

    startListening();
  } catch(e) {
    setStatus("❌ Could not load model. Check the URL and try again.", "error");
    console.error(e);
  }
}

// ---- Microphone listener — updates display only, no auto-scoring ----
function startListening() {
  const canvas = document.getElementById("spectrogram-canvas");

  recognizer.listen(async (result) => {
    await plotSpectrogram(canvas, result.spectrogram, recognizer);

    const scores = result.scores;
    let topIndex = 0;
    for (let i = 1; i < scores.length; i++) {
      if (scores[i] > scores[topIndex]) topIndex = i;
    }

    const labels = recognizer.wordLabels();
    const confidence = scores[topIndex];
    const isNoise = topIndex === NOISE_CLASS_INDEX;

    document.getElementById("res").textContent = labels[topIndex];
    document.getElementById("prob").textContent = (confidence * 100).toFixed(1) + "%";
    document.getElementById("prob-bar").style.width = (confidence * 100) + "%";
    // Noise class always stays grey regardless of confidence
    document.getElementById("res").className =
      (!isNoise && confidence >= SCORE_THRESHOLD) ? "high" : "low";

  }, {
    includeSpectrogram: true,
    probabilityThreshold: SCORE_THRESHOLD,
    overlapFactor: 0.75
  });
}

// ---- User judges the result ----
function correctAnswer() {
  score += POINTS_PER_HIT;
  correct++;
  updateScoreUI();
  if (score >= RETRAIN_SCORE) {
    document.getElementById("retrain-prompt").classList.add("show");
  }
}

function wrongAnswer() {
  if (score > 0) score -= POINTS_PER_HIT;
  wrong++;
  updateScoreUI();
}

function updateScoreUI() {
  const scoreEl = document.getElementById("score");
  scoreEl.textContent = score;
  scoreEl.classList.add("bump");
  setTimeout(() => scoreEl.classList.remove("bump"), 300);
  document.getElementById("tp-count").textContent = correct;
  document.getElementById("fp-count").textContent = wrong;
}

function resetScore() {
  score = 0; correct = 0; wrong = 0;
  document.getElementById("score").textContent = "0";
  document.getElementById("tp-count").textContent = "0";
  document.getElementById("fp-count").textContent = "0";
  document.getElementById("retrain-prompt").classList.remove("show");
}

function setStatus(msg, cls) {
  const el = document.getElementById("status-bar");
  el.textContent = msg;
  el.className = cls;
}