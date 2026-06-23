const WORD_GROUPS = {
  "แม่กง": [
    { word: "ช้าง", icon: "🐘" }, { word: "กุ้ง", icon: "🦐" }, { word: "ธง", icon: "🚩" },
    { word: "แตงโม", icon: "🍉" }, { word: "ลูกโป่ง", icon: "🎈" }
  ],
  "แม่กน": [
    { word: "จาน", icon: "🍽️" }, { word: "บ้าน", icon: "🏠" }, { word: "ดิน", icon: "🪴" },
    { word: "ถนน", icon: "🛣️" }, { word: "ช้อน", icon: "🥄" }
  ],
  "แม่กม": [
    { word: "ลม", icon: "💨" }, { word: "ขนม", icon: "🧁" }, { word: "ส้ม", icon: "🍊" },
    { word: "ไอติม", icon: "🍦" }, { word: "ชมพู่", icon: "🍐" }
  ],
  "แม่เกย": [
    { word: "กล้วย", icon: "🍌" }, { word: "ถ้วย", icon: "🏆" }, { word: "ควาย", icon: "🐃" },
    { word: "พลอย", icon: "💎" }, { word: "อ้อย", icon: "🎋" }
  ],
  "แม่เกอว": [
    { word: "แมว", icon: "🐱" }, { word: "ดาว", icon: "⭐" }, { word: "ข้าว", icon: "🍚" },
    { word: "มะพร้าว", icon: "🥥" }, { word: "แก้ว", icon: "🥛" }
  ],
  "แม่กก": [
    { word: "นก", icon: "🐦" }, { word: "ตุ๊กตา", icon: "🧸" }, { word: "เมฆ", icon: "☁️" },
    { word: "ดอกไม้", icon: "🌼" }, { word: "ลูกบอล", icon: "⚽" }
  ],
  "แม่กด": [
    { word: "มด", icon: "🐜" }, { word: "รถ", icon: "🚗" }, { word: "จรวด", icon: "🚀" },
    { word: "มีด", icon: "🔪" }, { word: "เป็ด", icon: "🦆" }
  ],
  "แม่กบ": [
    { word: "กบ", icon: "🐸" }, { word: "รูป", icon: "🖼️" }, { word: "ธูป", icon: "🕯️" },
    { word: "ภาพ", icon: "🌄" }, { word: "ลิปสติก", icon: "💄" }
  ]
};

const GROUPS = Object.keys(WORD_GROUPS);
const ALL_WORDS = GROUPS.flatMap(group => WORD_GROUPS[group].map(item => ({ ...item, group })));
const MISSING_LETTERS = [
  { shown: "กล้ว_", word: "กล้วย", icon: "🍌", clue: "ผลไม้สีเหลืองที่ลิงชอบ", answer: "ย", choices: ["ย", "ว", "น"] },
  { shown: "ช้า_", word: "ช้าง", icon: "🐘", clue: "สัตว์ตัวใหญ่ มีงวง", answer: "ง", choices: ["ง", "น", "ม"] },
  { shown: "จา_", word: "จาน", icon: "🍽️", clue: "ภาชนะสำหรับใส่อาหาร", answer: "น", choices: ["น", "ม", "บ"] },
  { shown: "ส้_", word: "ส้ม", icon: "🍊", clue: "ผลไม้รสเปรี้ยว สีส้ม", answer: "ม", choices: ["ม", "น", "ง"] },
  { shown: "ดา_", word: "ดาว", icon: "⭐", clue: "ส่องแสงอยู่บนท้องฟ้า", answer: "ว", choices: ["ว", "ย", "ก"] },
  { shown: "เป็_", word: "เป็ด", icon: "🦆", clue: "สัตว์ปีกที่ว่ายน้ำได้", answer: "ด", choices: ["ด", "ก", "บ"] },
  { shown: "น_", word: "นก", icon: "🐦", clue: "สัตว์มีปีก บินบนท้องฟ้า", answer: "ก", choices: ["ก", "ด", "บ"] }
];

const defaultState = {
  stars: 0,
  keys: 0,
  cards: [],
  completed: {},
  heardBooks: {}
};

let state = loadState();
let soundOn = true;
let audioContext;
let activeTimer = null;

const $ = selector => document.querySelector(selector);
const welcomeScreen = $("#welcomeScreen");
const classroomScreen = $("#classroomScreen");
const secretScreen = $("#secretScreen");
const topbar = $("#topbar");
const modalBackdrop = $("#modalBackdrop");
const modalContent = $("#modalContent");

function loadState() {
  try {
    return { ...defaultState, ...JSON.parse(localStorage.getItem("magicClassroomState") || "{}") };
  } catch {
    return { ...defaultState };
  }
}

function saveState() {
  localStorage.setItem("magicClassroomState", JSON.stringify(state));
  updateScoreboard();
}

function updateScoreboard() {
  $("#starCount").textContent = state.stars;
  $("#keyCount").textContent = state.keys;
  $("#cardCount").textContent = state.cards.length;
  const unlocked = state.stars >= 5 && state.keys >= 3;
  $("#secretDoor").classList.toggle("locked", !unlocked);
  $("#doorLock").textContent = unlocked ? "✨" : "🔒";
  $("#unlockHint").textContent = unlocked
    ? "✨ ห้องลับเปิดแล้ว! ลองแตะประตูได้เลย"
    : `อีก ${Math.max(0, 5 - state.stars)} ⭐ และ ${Math.max(0, 3 - state.keys)} 🔑 จะเปิดห้องลับได้`;
}

function switchScreen(screen) {
  [welcomeScreen, classroomScreen, secretScreen].forEach(s => s.classList.remove("active"));
  screen.classList.add("active");
  topbar.hidden = screen === welcomeScreen;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function openModal(title, icon, eyebrow = "ภารกิจ") {
  $("#modalTitle").textContent = title;
  $("#modalIcon").textContent = icon;
  $("#modalEyebrow").textContent = eyebrow;
  modalContent.innerHTML = "";
  modalBackdrop.hidden = false;
  document.body.classList.add("modal-open");
  playSound("click");
}

function closeModal() {
  modalBackdrop.hidden = true;
  document.body.classList.remove("modal-open");
  clearActiveTimer();
}

function clearActiveTimer() {
  if (activeTimer) {
    clearInterval(activeTimer);
    activeTimer = null;
  }
}

function shuffled(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function choiceSet(correct, pool, count = 3) {
  const others = shuffled(pool.filter(item => item !== correct)).slice(0, count - 1);
  return shuffled([correct, ...others]);
}

function showToast(message, type = "") {
  const toast = $("#toast");
  toast.textContent = message;
  toast.className = `toast show ${type}`;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => toast.className = "toast", 1900);
}

function playSound(type = "click") {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const notes = {
      click: [440, .05], correct: [660, .1, 880], wrong: [220, .18, 180],
      star: [523, .1, 659, 784], key: [587, .12, 784, 988], win: [523, .12, 659, 784, 1046]
    }[type] || [440, .05];
    const frequencies = notes.filter((_, index) => index % 2 === 0);
    const duration = notes[1] || .1;
    frequencies.forEach((frequency, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      osc.type = type === "wrong" ? "sawtooth" : "sine";
      osc.frequency.value = frequency;
      gain.gain.setValueAtTime(.0001, audioContext.currentTime + index * .1);
      gain.gain.exponentialRampToValueAtTime(.13, audioContext.currentTime + index * .1 + .01);
      gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + index * .1 + duration);
      osc.connect(gain).connect(audioContext.destination);
      osc.start(audioContext.currentTime + index * .1);
      osc.stop(audioContext.currentTime + index * .1 + duration + .02);
    });
  } catch { /* Audio is an enhancement. */ }
}

function speakThai(word) {
  if (!soundOn || !("speechSynthesis" in window)) {
    showToast(soundOn ? `🔊 ${word}` : "เปิดเสียงก่อนนะ");
    return;
  }
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(word);
  utterance.lang = "th-TH";
  utterance.rate = .72;
  utterance.pitch = 1.08;
  speechSynthesis.speak(utterance);
}

function confetti() {
  const colors = ["#ff7faa", "#ffd55e", "#68c9ed", "#77d2ad", "#a990e9"];
  for (let i = 0; i < 28; i++) {
    const bit = document.createElement("i");
    bit.className = "confetti";
    bit.style.left = `${Math.random() * 100}vw`;
    bit.style.background = pick(colors);
    bit.style.animationDelay = `${Math.random() * .5}s`;
    bit.style.transform = `rotate(${Math.random() * 180}deg)`;
    $("#confettiLayer").appendChild(bit);
    setTimeout(() => bit.remove(), 2400);
  }
}

function reward(type, missionId) {
  if (state.completed[missionId]) {
    playSound("correct");
    showToast("เก่งมาก! ภารกิจนี้ผ่านแล้ว 🎉", "success");
    return;
  }
  state.completed[missionId] = true;
  if (type === "star") state.stars++;
  if (type === "key") state.keys++;
  saveState();
  playSound(type);
  confetti();
  showToast(type === "star" ? "เก่งมาก! ได้ดาว 1 ดวง ⭐" : "ยอดเยี่ยม! ได้กุญแจ 1 ดอก 🔑", "success");
}

function wrong() {
  playSound("wrong");
  showToast(pick(["ลองอีกครั้งนะ 💪", "เกือบถูกแล้ว ลองใหม่นะ", "ไม่เป็นไร ลองอีกทีได้เลย"]), "error");
}

function renderGroupChoices(correct, onCorrect, count = 3) {
  const choices = choiceSet(correct, GROUPS, count);
  return `<div class="choice-grid">${choices.map(group =>
    `<button class="choice-button" data-answer="${group}">${group}</button>`).join("")}</div>`;
}

function bindAnswerButtons(correct, onCorrect) {
  modalContent.querySelectorAll("[data-answer]").forEach(button => {
    button.addEventListener("click", () => {
      playSound("click");
      if (button.dataset.answer === correct) {
        playSound("correct");
        showToast("เก่งมาก! ถูกต้องแล้ว 🌟", "success");
        onCorrect(button);
      } else {
        button.animate([{ transform: "translateX(-5px)" }, { transform: "translateX(5px)" }, { transform: "translateX(0)" }], { duration: 250 });
        wrong();
      }
    });
  });
}

function missionBlackboard() {
  openModal("กระดานดำปริศนา", "📝");
  let round = 0;
  const target = pick(GROUPS);
  const words = shuffled(WORD_GROUPS[target]).slice(0, 3);

  function render() {
    modalContent.innerHTML = `
      <p class="instruction">ดูคำทั้ง 3 คำ แล้วเลือกว่าคำเหล่านี้อยู่ในมาตราใด</p>
      <div class="word-display">${words.map(item => item.word).join(" / ")}<small>สังเกตเสียงและตัวสะกดของคำทั้งสาม</small></div>
      ${renderGroupChoices(target, null, 4)}
    `;
    bindAnswerButtons(target, () => {
      round++;
      modalContent.querySelectorAll("button").forEach(b => b.disabled = true);
      reward("star", "blackboard");
      setTimeout(closeModal, 1200);
    });
  }
  render();
}

function missionBookshelf() {
  openModal("ชั้นหนังสือลับ", "📚", "คลังความรู้");
  renderBookShelf();
}

function renderBookShelf() {
  modalContent.innerHTML = `
    <p class="instruction">เปิดหนังสือ เลือกฟังคำศัพท์ให้ครบทั้ง 5 คำ แล้วรับกุญแจ หนังสือแต่ละเล่มแทนหนึ่งมาตรา</p>
    <div class="book-grid">
      ${GROUPS.map(group => `<button class="book-button ${state.heardBooks[group]?.length >= 5 ? "completed" : ""}" data-book="${group}">📖<br>${group}</button>`).join("")}
    </div>
  `;
  modalContent.querySelectorAll("[data-book]").forEach(button => {
    button.addEventListener("click", () => renderBook(button.dataset.book));
  });
}

function renderBook(group) {
  const heard = new Set(state.heardBooks[group] || []);
  modalContent.innerHTML = `
    <button class="back-link" id="backToShelf">← หนังสือทั้งหมด</button>
    <div class="status-row"><b>📖 ${group}</b><span id="heardStatus">ฟังแล้ว ${heard.size}/5</span></div>
    <div class="word-cards">
      ${WORD_GROUPS[group].map(item => `
        <button class="word-card ${heard.has(item.word) ? "heard" : ""}" data-word="${item.word}">
          <span class="emoji">${item.icon}</span><b>${item.word}</b><small>🔊 แตะเพื่อฟัง</small>
        </button>`).join("")}
    </div>
    <p class="reward-note">ฟังครบ 5 คำ จะได้รับ 🔑 1 ดอก</p>
  `;
  $("#backToShelf").addEventListener("click", renderBookShelf);
  modalContent.querySelectorAll("[data-word]").forEach(card => {
    card.addEventListener("click", () => {
      const word = card.dataset.word;
      speakThai(word);
      heard.add(word);
      card.classList.add("heard");
      state.heardBooks[group] = [...heard];
      saveState();
      $("#heardStatus").textContent = `ฟังแล้ว ${heard.size}/5`;
      if (heard.size === 5) reward("key", `book-${group}`);
    });
  });
}

function missionDesk() {
  openModal("คำถามจากคุณครู", "👩🏻‍🏫");
  const target = pick(GROUPS);
  const correctItem = pick(WORD_GROUPS[target]);
  const wrongItems = shuffled(ALL_WORDS.filter(item => item.group !== target)).slice(0, 2);
  const choices = shuffled([correctItem, ...wrongItems]);
  modalContent.innerHTML = `
    <p class="instruction">คุณครูมิ้นท์ถามว่า “คำใดอยู่ใน <b>${target}</b>”</p>
    <div class="word-display">👩🏻‍🏫 <small>คิดช้า ๆ แล้วเลือกคำตอบได้เลยจ้ะ</small></div>
    <div class="choice-grid">${choices.map(item =>
      `<button class="choice-button" data-word-answer="${item.word}">${item.icon} ${item.word}</button>`).join("")}</div>
  `;
  modalContent.querySelectorAll("[data-word-answer]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.wordAnswer === correctItem.word) {
        playSound("correct");
        showToast("คุณครูปรบมือให้เลย! 👏", "success");
        reward("star", "desk");
        setTimeout(closeModal, 1200);
      } else wrong();
    });
  });
}

function missionWindow() {
  openModal("หน้าต่างนักสังเกต", "🪟");
  const target = pick(GROUPS);
  const correctWords = shuffled(WORD_GROUPS[target]).slice(0, 3).map(item => ({ ...item, group: target }));
  const decoys = shuffled(ALL_WORDS.filter(item => item.group !== target)).slice(0, 4);
  const words = shuffled([...correctWords, ...decoys]);
  let found = 0;
  modalContent.innerHTML = `
    <p class="instruction">แตะเฉพาะคำใน <b>${target}</b> ให้ครบ 3 คำ ระวังคำหลอกที่ลอยมาด้วยนะ!</p>
    <div class="status-row"><span>พบแล้ว <b id="windowFound">0</b>/3</span><span>☁️ นักสังเกตตาไว</span></div>
    <div class="floating-words">${words.map(item =>
      `<button class="float-word" data-float-word="${item.word}" data-correct="${item.group === target}">${item.icon} ${item.word}</button>`).join("")}</div>
  `;
  modalContent.querySelectorAll("[data-float-word]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.correct === "true" && !button.classList.contains("correct-picked")) {
        button.classList.add("correct-picked");
        found++;
        $("#windowFound").textContent = found;
        playSound("correct");
        if (found === 3) {
          reward("star", "window");
          setTimeout(closeModal, 1300);
        }
      } else if (button.dataset.correct !== "true") wrong();
    });
  });
}

function missionTree() {
  openModal("ต้นไม้คำศัพท์", "🌳");
  const target = pick(GROUPS);
  const targets = WORD_GROUPS[target].map(item => ({ ...item, group: target }));
  const decoys = shuffled(ALL_WORDS.filter(item => item.group !== target)).slice(0, 4);
  const leaves = shuffled([...targets, ...decoys]);
  let found = 0;
  modalContent.innerHTML = `
    <p class="instruction">เก็บผลคำศัพท์ของ <b>${target}</b> ให้ครบ 5 คำ</p>
    <div class="status-row"><span>เก็บแล้ว <b id="treeFound">0</b>/5</span><span>🍃 เลือกให้ดีนะ</span></div>
    <div class="leaf-grid">${leaves.map(item =>
      `<button class="leaf-button" data-tree-word="${item.word}" data-correct="${item.group === target}">${item.icon}<br>${item.word}</button>`).join("")}</div>
  `;
  modalContent.querySelectorAll("[data-tree-word]").forEach(button => {
    button.addEventListener("click", () => {
      if (button.dataset.correct === "true") {
        button.disabled = true;
        found++;
        $("#treeFound").textContent = found;
        playSound("correct");
        if (found === 5) {
          reward("key", "tree");
          setTimeout(closeModal, 1300);
        }
      } else wrong();
    });
  });
}

function missionTreasure() {
  openModal("กล่องสมบัติลึกลับ", "🧰");
  let score = 0;
  function next() {
    const item = pick(ALL_WORDS);
    modalContent.innerHTML = `
      <p class="instruction">กล่องสุ่มคำออกมาแล้ว! เลือกบ้านมาตราที่ถูกต้องให้ครบ 3 ครั้ง</p>
      <div class="status-row"><span>ตอบถูก <b>${score}</b>/3</span><span>✨ สมบัติกำลังรออยู่</span></div>
      <div class="word-display">${item.icon} ${item.word}<small>คำนี้ควรกลับบ้านมาตราไหน?</small></div>
      ${renderGroupChoices(item.group, null, 4)}
    `;
    bindAnswerButtons(item.group, () => {
      score++;
      if (score >= 3) {
        reward("star", "treasure");
        setTimeout(closeModal, 1200);
      } else setTimeout(next, 600);
    });
  }
  next();
}

function missionLocker() {
  openModal("ตู้เก็บของจิ๊กซอว์", "🧩");
  let score = 0;
  let questions = shuffled(MISSING_LETTERS).slice(0, 5);
  function next() {
    const item = questions[score];
    modalContent.innerHTML = `
      <p class="instruction">เติมตัวสะกดที่หายไปให้คำสมบูรณ์ ตอบให้ครบ 5 ข้อ</p>
      <div class="status-row"><span>ชิ้นส่วน <b>${score}</b>/5</span><span>🧩 ต่อคำให้สำเร็จ</span></div>
      <div class="word-display"><span>${item.icon} ${item.shown}</span><small>คำใบ้: ${item.clue}</small></div>
      <div class="choice-grid">${shuffled(item.choices).map(letter =>
        `<button class="choice-button" data-letter="${letter}">${letter}</button>`).join("")}</div>
    `;
    modalContent.querySelectorAll("[data-letter]").forEach(button => {
      button.addEventListener("click", () => {
        if (button.dataset.letter === item.answer) {
          playSound("correct");
          score++;
          if (score === 5) {
            reward("key", "locker");
            setTimeout(closeModal, 1200);
          } else setTimeout(next, 450);
        } else wrong();
      });
    });
  }
  next();
}

function missionClock() {
  openModal("นาฬิกาแห่งเวลา", "⏰");
  let score = 0;
  let seconds = 60;
  let current;

  function finish(won) {
    clearActiveTimer();
    if (won) {
      reward("star", "clock");
      setTimeout(closeModal, 1200);
    } else {
      modalContent.innerHTML = `
        <div class="word-display">⏰ หมดเวลาแล้ว<small>ทำได้ ${score}/5 ข้อ ลองใหม่ได้เสมอนะ</small></div>
        <button class="primary-button" id="retryClock">ลองอีกครั้ง</button>`;
      $("#retryClock").addEventListener("click", missionClock);
    }
  }

  function next() {
    current = pick(ALL_WORDS);
    modalContent.innerHTML = `
      <p class="instruction">เลือกมาตราให้ถูกครบ 5 คำ ภายใน 60 วินาที</p>
      <div class="status-row"><span>ถูก <b>${score}</b>/5</span><span class="timer">⏱️ <b id="timerSeconds">${seconds}</b></span></div>
      <div class="progress-track"><div class="progress-bar" style="width:${score * 20}%"></div></div>
      <div class="word-display">${current.icon} ${current.word}</div>
      ${renderGroupChoices(current.group, null, 4)}
    `;
    bindAnswerButtons(current.group, () => {
      score++;
      if (score === 5) finish(true);
      else setTimeout(next, 350);
    });
  }

  next();
  activeTimer = setInterval(() => {
    seconds--;
    const timerEl = $("#timerSeconds");
    if (timerEl) timerEl.textContent = seconds;
    if (seconds <= 0) finish(false);
  }, 1000);
}

function missionGacha() {
  openModal("ตู้กาชาปองคำศัพท์", "🔮");
  renderGacha();
}

function renderGacha(revealed = null) {
  const ownedGroups = new Set(state.cards.map(word => ALL_WORDS.find(item => item.word === word)?.group));
  modalContent.innerHTML = `
    <p class="instruction">หมุนกาชาเพื่อสะสมการ์ดคำศัพท์ ถ้ามีการ์ดจากครบทั้ง 8 มาตรา จะได้ดาว 1 ดวง</p>
    <div class="gacha-machine">
      ${revealed ? `
        <div class="card-reveal">
          <span class="big-emoji">${revealed.icon}</span>
          <h2>${revealed.word}</h2><b>${revealed.group}</b>
          <button class="back-link" data-speak="${revealed.word}">🔊 ฟังเสียงคำศัพท์</button>
        </div>` : `<div class="gacha-ball">🔴<br>🟡 🟢</div>`}
      <button class="primary-button" id="spinGacha">${revealed ? "หมุนอีกครั้ง" : "หมุนกาชา"} ✨</button>
      <div class="collection-chips">
        ${GROUPS.map(group => `<span class="${ownedGroups.has(group) ? "owned" : ""}">${ownedGroups.has(group) ? "✓" : "○"} ${group}</span>`).join("")}
      </div>
      <p>มีการ์ดไม่ซ้ำ <b>${state.cards.length}</b>/40 ใบ · ครบ <b>${ownedGroups.size}</b>/8 มาตรา</p>
    </div>
  `;
  $("#spinGacha").addEventListener("click", () => {
    playSound("click");
    const unowned = ALL_WORDS.filter(item => !state.cards.includes(item.word));
    const card = unowned.length ? pick(unowned) : pick(ALL_WORDS);
    if (!state.cards.includes(card.word)) state.cards.push(card.word);
    saveState();
    playSound("correct");
    renderGacha(card);
    const nowOwnedGroups = new Set(state.cards.map(word => ALL_WORDS.find(item => item.word === word)?.group));
    if (nowOwnedGroups.size === 8) reward("star", "gacha");
  });
  modalContent.querySelector("[data-speak]")?.addEventListener("click", event => speakThai(event.currentTarget.dataset.speak));
}

function missionSecret() {
  if (state.stars < 5 || state.keys < 3) {
    openModal("ประตูห้องลับยังล็อกอยู่", "🔒", "ภารกิจใหญ่");
    modalContent.innerHTML = `
      <div class="word-display">🔒<small>ต้องมี ⭐ อย่างน้อย 5 ดวง และ 🔑 อย่างน้อย 3 ดอก</small></div>
      <p class="reward-note">ตอนนี้มี ⭐ ${state.stars} ดวง และ 🔑 ${state.keys} ดอก<br>ออกไปสำรวจสิ่งของในห้องอีกนิดนะ!</p>`;
    wrong();
    return;
  }
  playSound("win");
  confetti();
  $("#finalScore").textContent = `⭐ ${state.stars} ดวง · 🔑 ${state.keys} ดอก · 🎴 ${state.cards.length} ใบ`;
  switchScreen(secretScreen);
}

const missions = {
  blackboard: missionBlackboard,
  bookshelf: missionBookshelf,
  desk: missionDesk,
  window: missionWindow,
  tree: missionTree,
  treasure: missionTreasure,
  locker: missionLocker,
  clock: missionClock,
  gacha: missionGacha,
  secret: missionSecret
};

$("#startButton").addEventListener("click", () => {
  playSound("click");
  switchScreen(classroomScreen);
});
$("#homeButton").addEventListener("click", () => {
  closeModal();
  switchScreen(classroomScreen);
});
$("#returnButton").addEventListener("click", () => switchScreen(classroomScreen));
$("#resetGameButton").addEventListener("click", () => {
  const confirmed = window.confirm("ต้องการเริ่มเกมใหม่ใช่ไหม? ดาว กุญแจ การ์ด และความคืบหน้าทั้งหมดจะถูกล้าง");
  if (!confirmed) return;
  clearActiveTimer();
  window.speechSynthesis?.cancel?.();
  state = {
    stars: 0,
    keys: 0,
    cards: [],
    completed: {},
    heardBooks: {}
  };
  saveState();
  playSound("click");
  showToast("เริ่มการผจญภัยครั้งใหม่กันเลย! 🌈", "success");
  switchScreen(welcomeScreen);
});
$("#closeModal").addEventListener("click", closeModal);
modalBackdrop.addEventListener("click", event => {
  if (event.target === modalBackdrop) closeModal();
});
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modalBackdrop.hidden) closeModal();
});
$("#soundButton").addEventListener("click", () => {
  soundOn = !soundOn;
  $("#soundButton").textContent = soundOn ? "🔊" : "🔇";
  if (soundOn) playSound("click");
  showToast(soundOn ? "เปิดเสียงแล้ว" : "ปิดเสียงแล้ว");
});
document.querySelectorAll("[data-mission]").forEach(button => {
  button.addEventListener("click", () => missions[button.dataset.mission]());
});

updateScoreboard();
