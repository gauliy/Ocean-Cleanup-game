(function () {
  "use strict";

  const CONFIG = Object.freeze({
    duration: 60,
    lives: 3,
    comboTarget: 5,
    comboBonus: 20,
    collisionPenalty: 10,
    invulnerabilityMs: 1000,
    highScoreKey: "oceanCleanup.highScore"
  });

  const DEFINITIONS = Object.freeze({
    waste: [
      { id: "plastic-bottle", icon: "🧴", score: 10, size: 48 },
      { id: "plastic-bag", icon: "🛍️", score: 15, size: 50 },
      { id: "metal-can", icon: "🥫", score: 10, size: 46 },
      { id: "fishing-net", icon: "🕸️", score: 25, size: 54 }
    ],
    animal: [
      { id: "sea-turtle", icon: "🐢", size: 62 },
      { id: "fish", icon: "🐟", size: 54 },
      { id: "dolphin", icon: "🐬", size: 68 }
    ],
    obstacle: [{ id: "rock", icon: "🪨", size: 62 }]
  });

  const canvas = document.getElementById("game-canvas");
  const context = canvas.getContext("2d");
  const background = new Image();
  background.src = "assets/images/ocean-background.png";

  const screens = {
    ready: document.getElementById("start-screen"),
    playing: document.getElementById("game-screen"),
    gameover: document.getElementById("end-screen")
  };
  const elements = {
    pauseOverlay: document.getElementById("pause-overlay"),
    toast: document.getElementById("toast"),
    score: document.getElementById("score"),
    time: document.getElementById("time"),
    lives: document.getElementById("lives"),
    combo: document.getElementById("combo"),
    bestScore: document.getElementById("best-score"),
    pause: document.getElementById("pause-button"),
    start: document.getElementById("start-button"),
    resume: document.getElementById("resume-button"),
    again: document.getElementById("again-button"),
    home: document.getElementById("home-button"),
    homeLink: document.getElementById("home-link")
  };

  const pressedKeys = new Set();
  const player = { x: 442, y: 435, width: 82, height: 82, speed: 310, type: "player" };
  let objects = [];
  let particles = [];
  let nextObjectId = 1;
  let toastTimer = 0;
  let soundEnabled = true;
  let audioContext = null;
  let state;

  const ECO_FACTS = Object.freeze([
    "Plastic waste can remain in the ocean for hundreds of years.",
    "Discarded fishing nets can trap turtles, fish and other marine animals.",
    "Using a reusable bottle helps reduce plastic waste.",
    "Never leave rubbish on beaches or near rivers.",
    "Much of the rubbish found in the ocean comes from land."
  ]);

  function freshState() {
    return {
      status: "ready",
      score: 0,
      timeLeft: CONFIG.duration,
      lives: CONFIG.lives,
      combo: 0,
      highestCombo: 0,
      collectedWaste: 0,
      avoidedAnimals: 0,
      difficultyLevel: 1,
      invulnerableUntil: 0,
      elapsed: 0,
      spawnElapsed: 0,
      lastFrameTime: 0,
      animationFrameId: 0
    };
  }

  function readHighScore() {
    const value = Number(localStorage.getItem(CONFIG.highScoreKey));
    return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
  }

  function showScreen(name) {
    Object.entries(screens).forEach(function ([key, element]) {
      element.classList.toggle("active", key === name);
    });
  }

  function updateHud() {
    elements.score.textContent = String(state.score);
    elements.time.textContent = String(Math.max(0, Math.ceil(state.timeLeft)));
    elements.lives.textContent = Array.from({ length: CONFIG.lives }, function (_, index) {
      return index < state.lives ? "♥" : "♡";
    }).join(" ");
    elements.combo.textContent = "×" + state.combo;
    elements.bestScore.textContent = String(readHighScore());
  }

  function setStatus(status) {
    state.status = status;
    elements.pauseOverlay.classList.toggle("visible", status === "paused");
    elements.pause.textContent = status === "paused" ? "▶ Resume" : "Ⅱ Pause";
  }

  function resetPlayer() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - player.height - 25;
  }

  function startGame() {
    if (state) cancelAnimationFrame(state.animationFrameId);
    state = freshState();
    objects = [];
    particles = [];
    nextObjectId = 1;
    pressedKeys.clear();
    resetPlayer();
    showScreen("playing");
    setStatus("playing");
    updateHud();
    state.lastFrameTime = performance.now();
    state.animationFrameId = requestAnimationFrame(gameLoop);
  }

  function returnHome(event) {
    if (event) event.preventDefault();
    if (state) cancelAnimationFrame(state.animationFrameId);
    pressedKeys.clear();
    state = freshState();
    showScreen("ready");
    setStatus("ready");
    updateHud();
  }

  function togglePause() {
    if (state.status === "playing") {
      setStatus("paused");
    } else if (state.status === "paused") {
      setStatus("playing");
      state.lastFrameTime = performance.now();
    }
  }

  function getDifficulty() {
    if (state.timeLeft <= 20) return { level: 3, interval: 0.48, speed: 1.5 };
    if (state.timeLeft <= 40) return { level: 2, interval: 0.7, speed: 1.25 };
    return { level: 1, interval: 0.95, speed: 1 };
  }

  function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function spawnObject() {
    const roll = Math.random();
    const type = roll < 0.62 ? "waste" : roll < 0.88 ? "animal" : "obstacle";
    const definition = randomItem(DEFINITIONS[type]);
    const difficulty = getDifficulty();
    const size = definition.size;

    objects.push({
      instanceId: nextObjectId++,
      definition: definition,
      type: type,
      x: 20 + Math.random() * (canvas.width - size - 40),
      y: -size,
      width: size,
      height: size,
      speedY: (85 + Math.random() * 75) * difficulty.speed,
      drift: (Math.random() - 0.5) * 34,
      active: true
    });
  }

  function isColliding(a, b) {
    const inset = 10;
    return a.x + inset < b.x + b.width - inset &&
      a.x + a.width - inset > b.x + inset &&
      a.y + inset < b.y + b.height - inset &&
      a.y + a.height - inset > b.y + inset;
  }

  function showToast(message, kind) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.className = "toast show " + kind;
    toastTimer = window.setTimeout(function () {
      elements.toast.className = "toast";
    }, 850);
  }

  function playTone(frequency, duration, type) {
    if (!soundEnabled) return;
    try {
      audioContext = audioContext || new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = type || "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.08, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      soundEnabled = false;
      document.getElementById("sound-button").textContent = "🔇";
    }
  }

  function addParticle(x, y, text, color) {
    particles.push({ x: x, y: y, text: text, color: color, life: 1, speedY: -42 });
  }

  function collectWaste(object) {
    state.score += object.definition.score;
    state.combo += 1;
    state.collectedWaste += 1;
    state.highestCombo = Math.max(state.highestCombo, state.combo);
    let message = "+" + object.definition.score;

    if (state.combo % CONFIG.comboTarget === 0) {
      state.score += CONFIG.comboBonus;
      message = "Combo bonus +" + CONFIG.comboBonus;
      playTone(880, 0.22, "triangle");
    } else {
      playTone(620 + state.combo * 18, 0.12, "sine");
    }

    addParticle(object.x + object.width / 2, object.y, message, "#76ffe5");
    showToast(message, "good");
  }

  function hitHazard(now) {
    if (now < state.invulnerableUntil) return false;
    state.lives -= 1;
    state.score = Math.max(0, state.score - CONFIG.collisionPenalty);
    state.combo = 0;
    state.invulnerableUntil = now + CONFIG.invulnerabilityMs;
    addParticle(player.x + player.width / 2, player.y, "-10", "#ff9d9d");
    playTone(145, 0.28, "sawtooth");
    showToast("Be careful! Protect marine animals.", "bad");
    return true;
  }

  function updatePlayer(delta) {
    let xDirection = 0;
    let yDirection = 0;
    if (pressedKeys.has("arrowleft") || pressedKeys.has("a")) xDirection -= 1;
    if (pressedKeys.has("arrowright") || pressedKeys.has("d")) xDirection += 1;
    if (pressedKeys.has("arrowup") || pressedKeys.has("w")) yDirection -= 1;
    if (pressedKeys.has("arrowdown") || pressedKeys.has("s")) yDirection += 1;
    if (xDirection && yDirection) {
      xDirection *= Math.SQRT1_2;
      yDirection *= Math.SQRT1_2;
    }
    player.x = Math.max(0, Math.min(canvas.width - player.width, player.x + xDirection * player.speed * delta));
    player.y = Math.max(0, Math.min(canvas.height - player.height, player.y + yDirection * player.speed * delta));
  }

  function updateObjects(delta, now) {
    objects.forEach(function (object) {
      if (!object.active) return;
      object.y += object.speedY * delta;
      object.x += object.drift * delta;
      if (object.x < 0 || object.x + object.width > canvas.width) object.drift *= -1;

      if (isColliding(player, object)) {
        if (object.type === "waste") {
          collectWaste(object);
          object.active = false;
        } else if (hitHazard(now)) {
          object.active = false;
        }
      }

      if (object.y > canvas.height + object.height) {
        if (object.type === "animal") state.avoidedAnimals += 1;
        object.active = false;
      }
    });
    objects = objects.filter(function (object) { return object.active; });
  }

  function updateParticles(delta) {
    particles.forEach(function (particle) {
      particle.y += particle.speedY * delta;
      particle.life -= delta * 1.35;
    });
    particles = particles.filter(function (particle) { return particle.life > 0; });
  }

  function updateGame(delta, now) {
    state.elapsed += delta;
    state.timeLeft = Math.max(0, CONFIG.duration - state.elapsed);
    const difficulty = getDifficulty();
    if (difficulty.level !== state.difficultyLevel) {
      state.difficultyLevel = difficulty.level;
      showToast("The current is getting stronger!", "good");
    }

    state.spawnElapsed += delta;
    if (state.spawnElapsed >= difficulty.interval) {
      state.spawnElapsed = 0;
      spawnObject();
    }

    updatePlayer(delta);
    updateObjects(delta, now);
    updateParticles(delta);
    updateHud();

    if (state.timeLeft <= 0 || state.lives <= 0) endGame();
  }

  function drawEmoji(icon, object) {
    context.save();
    const palette = {
      player: { fill: "rgba(4, 42, 62, .94)", stroke: "#ffd85c", glow: "rgba(255, 216, 92, .8)" },
      waste: { fill: "rgba(3, 54, 65, .94)", stroke: "#57f5d3", glow: "rgba(87, 245, 211, .75)" },
      animal: { fill: "rgba(3, 47, 76, .94)", stroke: "#8ee8ff", glow: "rgba(142, 232, 255, .75)" },
      obstacle: { fill: "rgba(69, 37, 43, .94)", stroke: "#ff9b8c", glow: "rgba(255, 115, 103, .75)" }
    };
    const colors = palette[object.type] || palette.obstacle;
    const centerX = object.x + object.width / 2;
    const centerY = object.y + object.height / 2;
    const radius = object.width * 0.5;

    context.shadowColor = colors.glow;
    context.shadowBlur = object.type === "player" ? 20 : 14;
    context.beginPath();
    context.arc(centerX, centerY, radius, 0, Math.PI * 2);
    context.fillStyle = colors.fill;
    context.fill();
    context.strokeStyle = colors.stroke;
    context.lineWidth = object.type === "player" ? 5 : 4;
    context.stroke();

    context.shadowColor = "rgba(0, 0, 0, .9)";
    context.shadowBlur = 10;
    context.font = object.height * 0.72 + "px 'Segoe UI Emoji', 'Apple Color Emoji', sans-serif";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(icon, centerX, centerY + 1);
    context.restore();
  }

  function drawParticles() {
    particles.forEach(function (particle) {
      context.save();
      context.globalAlpha = Math.max(0, particle.life);
      context.fillStyle = particle.color;
      context.font = "800 22px 'Segoe UI', sans-serif";
      context.textAlign = "center";
      context.shadowColor = "rgba(0,25,40,.65)";
      context.shadowBlur = 8;
      context.fillText(particle.text, particle.x, particle.y);
      context.restore();
    });
  }

  function drawScene(now) {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (background.complete && background.naturalWidth) context.drawImage(background, 0, 0, canvas.width, canvas.height);
    else {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#27b9d5");
      gradient.addColorStop(1, "#075679");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
    }
    context.fillStyle = "rgba(1,25,45,.28)";
    context.fillRect(0, 0, canvas.width, canvas.height);
    objects.forEach(function (object) { drawEmoji(object.definition.icon, object); });
    drawParticles();

    context.save();
    if (now < state.invulnerableUntil && Math.floor(now / 100) % 2 === 0) context.globalAlpha = 0.28;
    drawEmoji("🚤", player);
    context.restore();
  }

  function endGame() {
    if (state.status === "gameover") return;
    setStatus("gameover");
    cancelAnimationFrame(state.animationFrameId);
    const previousBest = readHighScore();
    const isNewBest = state.score > previousBest;
    if (isNewBest) localStorage.setItem(CONFIG.highScoreKey, String(state.score));
    playTone(isNewBest ? 880 : 520, 0.35, "triangle");
    populateResults(isNewBest);
    showScreen("gameover");
    updateHud();
  }

  function getRank(score) {
    if (score >= 300) return ["Ocean Guardian", "Amazing! You are a true guardian of the ocean."];
    if (score >= 200) return ["Sea Protector", "Excellent! Marine animals are safer because of you."];
    if (score >= 100) return ["Ocean Helper", "Great work! You made the ocean cleaner."];
    return ["Beginner Cleaner", "Every piece of waste removed helps the ocean."];
  }

  function populateResults(isNewBest) {
    const rank = getRank(state.score);
    document.getElementById("rank-title").textContent = rank[0];
    document.getElementById("rank-message").textContent = rank[1];
    document.getElementById("final-score").textContent = String(state.score);
    document.getElementById("new-best").textContent = isNewBest ? "NEW BEST" : "";
    document.getElementById("waste-count").textContent = String(state.collectedWaste);
    document.getElementById("animal-count").textContent = String(state.avoidedAnimals);
    document.getElementById("best-combo").textContent = "×" + state.highestCombo;
    document.getElementById("eco-fact").textContent = ECO_FACTS[Math.floor(Math.random() * ECO_FACTS.length)];
  }

  function gameLoop(timestamp) {
    const delta = Math.min((timestamp - state.lastFrameTime) / 1000, 0.05);
    state.lastFrameTime = timestamp;
    if (state.status === "playing") updateGame(delta, timestamp);
    drawScene(timestamp);
    if (state.status === "playing" || state.status === "paused") state.animationFrameId = requestAnimationFrame(gameLoop);
  }

  function handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (!["arrowleft", "arrowright", "arrowup", "arrowdown", "a", "d", "w", "s", "p"].includes(key)) return;
    event.preventDefault();
    if (key === "p" && !event.repeat && ["playing", "paused"].includes(state.status)) togglePause();
    else pressedKeys.add(key);
  }

  elements.start.addEventListener("click", startGame);
  elements.again.addEventListener("click", startGame);
  elements.home.addEventListener("click", returnHome);
  elements.homeLink.addEventListener("click", returnHome);
  elements.pause.addEventListener("click", togglePause);
  elements.resume.addEventListener("click", togglePause);
  document.getElementById("sound-button").addEventListener("click", function () {
    soundEnabled = !soundEnabled;
    this.textContent = soundEnabled ? "🔊" : "🔇";
    this.setAttribute("aria-label", soundEnabled ? "Mute sound" : "Enable sound");
    if (soundEnabled) playTone(540, 0.1, "sine");
  });
  window.addEventListener("keydown", handleKeyDown);
  window.addEventListener("keyup", function (event) { pressedKeys.delete(event.key.toLowerCase()); });
  window.addEventListener("blur", function () {
    pressedKeys.clear();
    if (state.status === "playing") togglePause();
  });

  state = freshState();
  updateHud();
  showScreen("ready");
})();
