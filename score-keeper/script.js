let teamAScore = 0;
let teamBScore = 0;

const calloutEl = document.getElementById("callout");
const timerEl = document.getElementById("timer-value");

const calloutPhrases = [
  "This is brutal!",
  "Looks like a blowout!",
  "Running away with it!",
  "Getting out of hand!",
  "This one's slipping!",
  "It's unraveling!",
  "Turning ugly!",
  "Not even close!",
  "That gap's growing!",
  "Pulling away...",
];

let calloutIsShown = false;
let calloutCycle = [];
let calloutCycleIndex = 0;

const darkOrange = { r: 245, g: 158, b: 11 }; // #f59e0b
const brightRed = { r: 239, g: 68, b: 68 }; // #ef4444

function shuffle(array) {
  // Fisher-Yates shuffle
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function getNextCalloutPhrase() {
  if (calloutCycleIndex >= calloutCycle.length) {
    calloutCycle = shuffle([...calloutPhrases]);
    calloutCycleIndex = 0;
  }
  return calloutCycle[calloutCycleIndex++];
}

function updateScores() {
  document.getElementById("team-a-score").textContent = teamAScore;
  document.getElementById("team-b-score").textContent = teamBScore;
  updateCallout();
}

function saveScores() {
  localStorage.setItem(
    "scores",
    JSON.stringify({ teamA: teamAScore, teamB: teamBScore })
  );
}

function updateCallout() {
  if (!calloutEl) return;

  const gap = Math.abs(teamAScore - teamBScore);

  if (gap > 3) {
    if (!calloutIsShown) {
      calloutEl.textContent = getNextCalloutPhrase();
      calloutIsShown = true;
      calloutEl.classList.add("is-visible");
    }

    // Change callout TEXT color from dark orange (gap=4) to bright red (gap=8+).
    const t = Math.min(1, Math.max(0, (gap - 4) / (8 - 4)));
    const r = Math.round(darkOrange.r + (brightRed.r - darkOrange.r) * t);
    const g = Math.round(darkOrange.g + (brightRed.g - darkOrange.g) * t);
    const b = Math.round(darkOrange.b + (brightRed.b - darkOrange.b) * t);
    calloutEl.style.color = `rgb(${r}, ${g}, ${b})`;

    return;
  }

  if (calloutIsShown) {
    calloutIsShown = false;
    calloutEl.classList.remove("is-visible");
    calloutEl.style.color = ""; // fall back to CSS default
  }
}

function loadScores() {
  const stored = localStorage.getItem("scores");
  if (!stored) return;

  try {
    const { teamA, teamB } = JSON.parse(stored);
    if (typeof teamA === "number") teamAScore = teamA;
    if (typeof teamB === "number") teamBScore = teamB;
    updateScores();
  } catch (e) {
    // ignore invalid stored data
  }
}

function incrementTeamA() {
  teamAScore += 1;
  updateScores();
  saveScores();
}

function decrementTeamA() {
  teamAScore -= 1;
  updateScores();
  saveScores();
}

function incrementTeamB() {
  teamBScore += 1;
  updateScores();
  saveScores();
}

function decrementTeamB() {
  teamBScore -= 1;
  updateScores();
  saveScores();
}

function formatClock(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  const mm = String(minutes).padStart(2, "0");
  const ss = String(seconds).padStart(2, "0");
  return `${mm}:${ss}`;
}

function startCountdown() {
  if (!timerEl) return;

  const durationSeconds = 10 * 60; // 10 minutes
  const endAt = Date.now() + durationSeconds * 1000;

  let intervalId = null;
  const tick = () => {
    const remainingSeconds = Math.max(
      0,
      Math.floor((endAt - Date.now()) / 1000)
    );
    timerEl.textContent = formatClock(remainingSeconds);
    if (remainingSeconds <= 0 && intervalId) clearInterval(intervalId);
  };

  // Update immediately, then roughly once per second.
  tick();
  intervalId = setInterval(tick, 1000);
}

loadScores();

startCountdown();
