import { supabase } from "../js/supabase.js";
import { requireAuth, signOut } from "../js/auth.js";

const user = await requireAuth();
if (!user) {
  throw new Error("No session");
}

const YEAR = 2026;

const readingPlan = {
  1: ["Gn 1–3", "Gn 4–6", "Gn 7–9", "Gn 10–12", "Gn 13–15", "Gn 16–18", "Gn 19–21", "Gn 22–24", "Gn 25–27", "Gn 28–30", "Gn 31–33", "Gn 34–36", "Gn 37–39", "Gn 40–42", "Gn 43–45", "Gn 46–48", "Gn 49–50", "Êx 1–3", "Êx 4–6", "Êx 7–9", "Êx 10–12", "Êx 13–15", "Êx 16–18", "Êx 19–21", "Êx 22–24", "Êx 25–27", "Êx 28–30", "Êx 31–33", "Êx 34–36", "Êx 37–40", "Lv 1–3"],
  2: ["Lv 4–6", "Lv 7–9", "Lv 10–12", "Lv 13–14", "Lv 15–17", "Lv 18–20", "Lv 21–23", "Lv 24–27", "Nm 1–3", "Nm 4–6", "Nm 7–8", "Nm 9–11", "Nm 12–14", "Nm 15–17", "Nm 18–20", "Nm 21–23", "Nm 24–26", "Nm 27–29", "Nm 30–32", "Nm 33–36", "Dt 1–3", "Dt 4–6", "Dt 7–9", "Dt 10–12", "Dt 13–15", "Dt 16–18", "Dt 19–21", "Dt 22–24"],
  3: ["Dt 25–27", "Dt 28–29", "Dt 30–32", "Dt 33–34", "Js 1–3", "Js 4–6", "Js 7–9", "Js 10–12", "Js 13–15", "Js 16–18", "Js 19–21", "Js 22–24", "Jz 1–3", "Jz 4–6", "Jz 7–9", "Jz 10–12", "Jz 13–15", "Jz 16–18", "Jz 19–21", "Rt 1–4", "1Sm 1–3", "1Sm 4–6", "1Sm 7–9", "1Sm 10–12", "1Sm 13–15", "1Sm 16–18", "1Sm 19–21", "1Sm 22–24", "1Sm 25–27", "1Sm 28–31", "2Sm 1–3"],
  4: ["2Sm 4–6", "2Sm 7–9", "2Sm 10–12", "2Sm 13–15", "2Sm 16–18", "2Sm 19–21", "2Sm 22–24", "1Rs 1–3", "1Rs 4–6", "1Rs 7–8", "1Rs 9–11", "1Rs 12–14", "1Rs 15–17", "1Rs 18–20", "1Rs 21–22", "2Rs 1–3", "2Rs 4–6", "2Rs 7–9", "2Rs 10–12", "2Rs 13–15", "2Rs 16–18", "2Rs 19–21", "2Rs 22–25", "1Cr 1–3", "1Cr 4–6", "1Cr 7–9", "1Cr 10–12", "1Cr 13–15", "1Cr 16–18", "1Cr 19–21"],
  5: ["1Cr 22–24", "1Cr 25–27", "1Cr 28–29", "2Cr 1–3", "2Cr 4–6", "2Cr 7–9", "2Cr 10–12", "2Cr 13–15", "2Cr 16–18", "2Cr 19–21", "2Cr 22–24", "2Cr 25–27", "2Cr 28–30", "2Cr 31–33", "2Cr 34–36", "Ed 1–3", "Ed 4–6", "Ed 7–10", "Ne 1–3", "Ne 4–6", "Ne 7–9", "Ne 10–11", "Ne 12–13", "Et 1–3", "Et 4–6", "Et 7–10", "Jó 1–3", "Jó 4–6", "Jó 7–9", "Jó 10–12", "Jó 13–15"],
  6: ["Jó 16–18", "Jó 19–21", "Jó 22–24", "Jó 25–27", "Jó 28–30", "Jó 31–33", "Jó 34–36", "Jó 37–39", "Jó 40–42", "Sl 1–8", "Sl 9–16", "Sl 17–20", "Sl 21–25", "Sl 26–31", "Sl 32–35", "Sl 36–39", "Sl 40–45", "Sl 46–50", "Sl 51–57", "Sl 58–65", "Sl 66–69", "Sl 70–73", "Sl 74–77", "Sl 78–80", "Sl 81–85", "Sl 86–89", "Sl 90–95", "Sl 96–102", "Sl 103–106", "Sl 107–110"],
  7: ["Sl 111–118", "Sl 119", "Sl 120–134", "Sl 135–142", "Sl 143–150", "Pv 1–3", "Pv 4–6", "Pv 7–9", "Pv 10–12", "Pv 13–15", "Pv 16–18", "Pv 19–21", "Pv 22–24", "Pv 25–27", "Pv 28–31", "Ec 1–4", "Ec 5–8", "Ec 9–12", "Ct 1–4", "Ct 5–8", "Is 1–3", "Is 4–6", "Is 7–9", "Is 10–12", "Is 13–15", "Is 16–18", "Is 19–21", "Is 22–24", "Is 25–27", "Is 28–30", "Is 31–33"],
  8: ["Is 34–36", "Is 37–39", "Is 40–42", "Is 43–45", "Is 46–48", "Is 49–51", "Is 52–54", "Is 55–57", "Is 58–60", "Is 61–63", "Is 64–66", "Jr 1–3", "Jr 4–6", "Jr 7–9", "Jr 10–12", "Jr 13–15", "Jr 16–18", "Jr 19–21", "Jr 22–24", "Jr 25–27", "Jr 28–30", "Jr 31–33", "Jr 34–36", "Jr 37–39", "Jr 40–42", "Jr 43–45", "Jr 46–48", "Jr 49–50", "Jr 51–52", "Lm 1–2", "Lm 3–5"],
  9: ["Ez 1–3", "Ez 4–6", "Ez 7–9", "Ez 10–12", "Ez 13–15", "Ez 16–17", "Ez 18–20", "Ez 21–23", "Ez 24–26", "Ez 27–29", "Ez 30–32", "Ez 33–35", "Ez 36–38", "Ez 39–41", "Ez 42–44", "Ez 45–48", "Dn 1–3", "Dn 4–6", "Dn 7–9", "Dn 10–12", "Os 1–4", "Os 5–8", "Os 9–11", "Os 12–14", "Jl 1–3", "Am 1–3", "Am 4–6", "Am 7–9", "Ob; Jn 1–2", "Jn 3–4; Mq 1"],
  10: ["Mq 2–4", "Mq 5–7", "Na 1–3", "Hc 1–3", "Sf 1–3", "Ag 1–2", "Zc 1–3", "Zc 4–6", "Zc 7–9", "Zc 10–12", "Zc 13–14", "Ml 1–4", "Mt 1–3", "Mt 4–6", "Mt 7–9", "Mt 10–12", "Mt 13–15", "Mt 16–18", "Mt 19–21", "Mt 22–24", "Mt 25–26", "Mt 27–28", "Mc 1–3", "Mc 4–6", "Mc 7–9", "Mc 10–12", "Mc 13–14", "Mc 15–16", "Lc 1–2", "Lc 3–4", "Lc 5–6"],
  11: ["Lc 7–8", "Lc 9–10", "Lc 11–12", "Lc 13–14", "Lc 15–16", "Lc 17–18", "Lc 19–20", "Lc 21–22", "Lc 23–24", "Jo 1–3", "Jo 4–5", "Jo 6–7", "Jo 8–9", "Jo 10–11", "Jo 12–13", "Jo 14–16", "Jo 17–18", "Jo 19–21", "At 1–3", "At 4–6", "At 7–8", "At 9–10", "At 11–13", "At 14–15", "At 16–17", "At 18–19", "At 20–21", "At 22–23", "At 24–26", "At 27–28"],
  12: ["Rm 1–3", "Rm 4–6", "Rm 7–9", "Rm 10–12", "Rm 13–16", "1Co 1–4", "1Co 5–8", "1Co 9–11", "1Co 12–14", "1Co 15–16", "2Co 1–4", "2Co 5–8", "2Co 9–13", "Gl 1–3", "Gl 4–6", "Ef 1–3", "Ef 4–6", "Fp 1–4", "Cl 1–4", "1Ts 1–5", "2Ts 1–3", "1Tm 1–3", "1Tm 4–6", "2Tm 1–4", "Tt 1–3", "Fm; Hb 1–2", "Hb 3–6", "Hb 7–10", "Hb 11–13", "Tg 1–5", "1Pe 1–5"]
};

const monthNames = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro"
];

const calendarGrid = document.getElementById("calendar-grid");
const currentMonthNameEl = document.getElementById("current-month-name");
const monthProgressTextEl = document.getElementById("month-progress-text");
const prevMonthBtn = document.getElementById("prev-month");
const nextMonthBtn = document.getElementById("next-month");
const annualProgressEl = document.getElementById("annual-progress");
const progressBarEl = document.getElementById("progress-bar");
const totalCompletedEl = document.getElementById("total-completed");
const totalRemainingEl = document.getElementById("total-remaining");
const currentStreakEl = document.getElementById("current-streak");

if (!calendarGrid) {
  throw new Error("Missing calendar grid");
}

const pad = (value) => String(value).padStart(2, "0");
const getDefaultDateKey = () => {
  const now = new Date();
  if (now.getFullYear() === YEAR) {
    return `${YEAR}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  }
  return `${YEAR}-01-01`;
};
const dateKeyFor = (month, day) => `${YEAR}-${pad(month + 1)}-${pad(day)}`;
const getDaysInMonth = (month) => new Date(YEAR, month + 1, 0).getDate();
const getFirstDayOfWeek = (month) => new Date(YEAR, month, 1).getDay();

const totalReadings = Object.values(readingPlan).reduce(
  (sum, readings) => sum + readings.length,
  0
);

let currentMonth = new Date().getFullYear() === YEAR ? new Date().getMonth() : 0;
let completedSet = new Set();

// Header nav: make "Diario" land on a valid day (otherwise note.html may not have a day param).
const diaryNavLink = document.querySelector('.nav-actions a[href="note.html"]');
if (diaryNavLink) diaryNavLink.href = `note.html?day=${getDefaultDateKey()}`;

// Header nav: logout (Supabase signOut + redirect to index.html).
document.querySelectorAll(".logout-btn").forEach((btn) => {
  btn.addEventListener("click", async () => {
    try {
      await signOut();
    } catch (error) {
      console.error(error);
      window.location.href = "index.html";
    }
  });
});

async function loadYearProgress() {
  const start = `${YEAR}-01-01`;
  const end = `${YEAR}-12-31`;

  const { data, error } = await supabase
    .from("reading_progress")
    .select("date_key")
    .eq("user_id", user.id)
    .gte("date_key", start)
    .lte("date_key", end);

  if (error) throw error;

  completedSet = new Set((data || []).map((row) => row.date_key));
}

async function markReading(dateKey) {
  const { error } = await supabase
    .from("reading_progress")
    .upsert(
      { user_id: user.id, date_key: dateKey, completed: true },
      { onConflict: "user_id,date_key" }
    );

  if (error) throw error;
}

async function unmarkReading(dateKey) {
  const { error } = await supabase
    .from("reading_progress")
    .delete()
    .eq("user_id", user.id)
    .eq("date_key", dateKey);

  if (error) throw error;
}

function getReading(month, day) {
  const readings = readingPlan[month + 1];
  if (!readings || day > readings.length) return null;
  return readings[day - 1];
}

function updateNav() {
  if (currentMonthNameEl) {
    currentMonthNameEl.textContent = monthNames[currentMonth];
  }
  if (prevMonthBtn) prevMonthBtn.disabled = currentMonth === 0;
  if (nextMonthBtn) nextMonthBtn.disabled = currentMonth === 11;
}

function updateMonthStats() {
  if (!monthProgressTextEl) return;

  const daysInMonth = getDaysInMonth(currentMonth);
  const readings = readingPlan[currentMonth + 1] || [];
  let completed = 0;

  for (let day = 1; day <= Math.min(daysInMonth, readings.length); day++) {
    const key = dateKeyFor(currentMonth, day);
    if (completedSet.has(key)) completed++;
  }

  monthProgressTextEl.textContent = `${completed} de ${readings.length} leituras concluídas`;
}

function calculateStreak() {
  let streak = 0;
  const today = new Date();
  const cursor = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  while (cursor.getFullYear() === YEAR) {
    const key = dateKeyFor(cursor.getMonth(), cursor.getDate());
    if (!completedSet.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function updateAnnualStats() {
  const completed = completedSet.size;
  const percent = totalReadings
    ? Math.round((completed / totalReadings) * 100)
    : 0;

  if (annualProgressEl) annualProgressEl.textContent = `${percent}%`;
  if (progressBarEl) progressBarEl.style.width = `${percent}%`;
  if (totalCompletedEl) totalCompletedEl.textContent = completed;
  if (totalRemainingEl) totalRemainingEl.textContent = totalReadings - completed;
  if (currentStreakEl) currentStreakEl.textContent = calculateStreak();
}

function buildDayCell(day, dateKey, reading, isCompleted) {
  const cell = document.createElement("div");
  cell.className = `day-cell rounded-lg p-2 min-h-20 border animate-fade-in${
    isCompleted ? " border-2" : ""
  }`;
  cell.style.backgroundColor = isCompleted ? "#EDF7ED" : "#FFFFFF";
  cell.style.borderColor = isCompleted ? "#48BB78" : "#E2E8F0";
  cell.style.animationDelay = `${day * 15}ms`;
  cell.dataset.date = dateKey;

  if (reading) {
    cell.innerHTML = `
      <div class="flex items-start justify-between mb-1">
        <span class="text-xs font-semibold rounded px-1.5 py-0.5 planner-day-pill">${day}</span>
        <input type="checkbox" class="checkbox-custom planner-checkbox-accent" data-date="${dateKey}" ${
           isCompleted ? "checked" : ""
         } aria-label="Marcar leitura de ${reading} como concluida">
      </div>
      <p class="text-xs font-medium leading-tight mt-1 planner-reading-text">${reading}</p>
    `;
  } else {
    cell.innerHTML = `
      <span class="text-xs font-semibold planner-day-muted">${day}</span>
    `;
    cell.style.backgroundColor = "#F7FAFC";
  }

  cell.addEventListener("click", () => {
    window.location.href = `note.html?day=${dateKey}`;
  });

  const checkbox = cell.querySelector("input[type=\"checkbox\"]");
  if (checkbox) {
    checkbox.addEventListener("click", (event) => event.stopPropagation());
    checkbox.addEventListener("change", async (event) => {
      const isChecked = event.target.checked;
      event.target.disabled = true;

      try {
        if (isChecked) {
          await markReading(dateKey);
          completedSet.add(dateKey);
        } else {
          await unmarkReading(dateKey);
          completedSet.delete(dateKey);
        }

        cell.classList.toggle("border-2", isChecked);
        cell.style.backgroundColor = isChecked ? "#EDF7ED" : "#FFFFFF";
        cell.style.borderColor = isChecked ? "#48BB78" : "#E2E8F0";
        updateMonthStats();
        updateAnnualStats();
      } catch (error) {
        console.error(error);
        event.target.checked = !isChecked;
      } finally {
        event.target.disabled = false;
      }
    });
  }

  return cell;
}

function renderCalendar() {
  if (!calendarGrid) return;

  calendarGrid.innerHTML = "";

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfWeek(currentMonth);

  for (let i = 0; i < firstDay; i++) {
    const emptyCell = document.createElement("div");
    emptyCell.className = "min-h-20";
    calendarGrid.appendChild(emptyCell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const reading = getReading(currentMonth, day);
    const dateKey = dateKeyFor(currentMonth, day);
    const isCompleted = completedSet.has(dateKey);
    const cell = buildDayCell(day, dateKey, reading, isCompleted);
    calendarGrid.appendChild(cell);
  }

  updateNav();
  updateMonthStats();
  updateAnnualStats();
}

async function init() {
  await loadYearProgress();
  updateNav();
  renderCalendar();

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", async () => {
      if (currentMonth === 0) return;
      currentMonth -= 1;
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", async () => {
      if (currentMonth === 11) return;
      currentMonth += 1;
      renderCalendar();
    });
  }
}

init();
