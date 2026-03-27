// ============================================================
//  IMAGE CLASSIFIER — sketch.js
//  Powered by Teachable Machine + TensorFlow.js
// ============================================================

// ============================================================
//  ✏️  EASY EDIT ZONE 1: Score threshold (0–1)
//  The confidence bar turns green above this level.
//  Does NOT auto-score — user decides with the buttons.
// ============================================================
const SCORE_THRESHOLD = 0.85;

// ============================================================
//  ✏️  EASY EDIT ZONE 2: Points per correct click
// ============================================================
const POINTS_PER_HIT = 1;

// ============================================================
//  ✏️  EASY EDIT ZONE 3: Score needed to show retrain prompt
// ============================================================
const RETRAIN_SCORE = 5;

// ============================================================
//  ✏️  EASY EDIT ZONE 4: Webcam size in pixels
// ============================================================
const SIZE = 300;

// --- Internal state ---
let webcam, model, totalClasses;
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

  try {
    model = await tmImage.load(url + "model.json", url + "metadata.json");
    totalClasses = model.getTotalClasses();
    setStatus("✅ Model ready — " + totalClasses + " classes", "ready");
  } catch(e) {
    setStatus("❌ Could not load model. Check the URL and try again.", "error");
    console.error(e);
    return;
  }

  try {
    webcam = new tmImage.Webcam(SIZE, SIZE, true);
    await webcam.setup();
    await webcam.play();
    document.getElementById("vidContainer").appendChild(webcam.canvas);
    running = true;

    // Enable judge buttons
    document.getElementById("btn-correct").disabled = false;
    document.getElementById("btn-wrong").disabled = false;

    window.requestAnimationFrame(loop);
  } catch(e) {
    setStatus("❌ Could not access webcam. Check browser permissions.", "error");
    console.error(e);
  }
}

// ---- Main loop ----
async function loop() {
  if (!running) return;
  webcam.update();
  await predict();
  window.requestAnimationFrame(loop);
}

// ---- Prediction — updates display only, no auto-scoring ----
async function predict() {
  const prediction = await model.predict(webcam.canvas, false, totalClasses);
  const sorted = prediction.sort((a, b) => b.probability - a.probability);
  const top = sorted[0];
  const confidence = top.probability;

  document.getElementById("res").textContent = top.className;
  document.getElementById("prob").textContent = (confidence * 100).toFixed(1) + "%";
  document.getElementById("prob-bar").style.width = (confidence * 100) + "%";
  document.getElementById("res").className = confidence >= SCORE_THRESHOLD ? "high" : "low";
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