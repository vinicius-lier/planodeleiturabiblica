// Planner anual com leitura dinâmica (frontend-only).
// Persistência mínima (localStorage):
// - plannerYear (ano atual)
// - chaptersRead (total de capítulos já lidos)

const TOTAL_CHAPTERS = 1189;
const STORAGE_KEYS = {
  plannerYear: "plannerYear",
  chaptersRead: "chaptersRead"
};

// Abreviações exibidas no planner (mantém o padrão atual do projeto).
// Os códigos OSIS são usados para navegar para `biblia.html`.
const BIBLE_BOOKS = [
  { abbrev: "Gn", osis: "GEN", chapters: 50 },
  { abbrev: "Êx", osis: "EXO", chapters: 40 },
  { abbrev: "Lv", osis: "LEV", chapters: 27 },
  { abbrev: "Nm", osis: "NUM", chapters: 36 },
  { abbrev: "Dt", osis: "DEU", chapters: 34 },
  { abbrev: "Js", osis: "JOS", chapters: 24 },
  { abbrev: "Jz", osis: "JDG", chapters: 21 },
  { abbrev: "Rt", osis: "RUT", chapters: 4 },
  { abbrev: "1Sm", osis: "1SA", chapters: 31 },
  { abbrev: "2Sm", osis: "2SA", chapters: 24 },
  { abbrev: "1Rs", osis: "1KI", chapters: 22 },
  { abbrev: "2Rs", osis: "2KI", chapters: 25 },
  { abbrev: "1Cr", osis: "1CH", chapters: 29 },
  { abbrev: "2Cr", osis: "2CH", chapters: 36 },
  { abbrev: "Ed", osis: "EZR", chapters: 10 },
  { abbrev: "Ne", osis: "NEH", chapters: 13 },
  { abbrev: "Et", osis: "EST", chapters: 10 },
  { abbrev: "Jó", osis: "JOB", chapters: 42 },
  { abbrev: "Sl", osis: "PSA", chapters: 150 },
  { abbrev: "Pv", osis: "PRO", chapters: 31 },
  { abbrev: "Ec", osis: "ECC", chapters: 12 },
  { abbrev: "Ct", osis: "SNG", chapters: 8 },
  { abbrev: "Is", osis: "ISA", chapters: 66 },
  { abbrev: "Jr", osis: "JER", chapters: 52 },
  { abbrev: "Lm", osis: "LAM", chapters: 5 },
  { abbrev: "Ez", osis: "EZK", chapters: 48 },
  { abbrev: "Dn", osis: "DAN", chapters: 12 },
  { abbrev: "Os", osis: "HOS", chapters: 14 },
  { abbrev: "Jl", osis: "JOL", chapters: 3 },
  { abbrev: "Am", osis: "AMO", chapters: 9 },
  { abbrev: "Ob", osis: "OBA", chapters: 1 },
  { abbrev: "Jn", osis: "JON", chapters: 4 },
  { abbrev: "Mq", osis: "MIC", chapters: 7 },
  { abbrev: "Na", osis: "NAM", chapters: 3 },
  { abbrev: "Hc", osis: "HAB", chapters: 3 },
  { abbrev: "Sf", osis: "ZEP", chapters: 3 },
  { abbrev: "Ag", osis: "HAG", chapters: 2 },
  { abbrev: "Zc", osis: "ZEC", chapters: 14 },
  { abbrev: "Ml", osis: "MAL", chapters: 4 },
  { abbrev: "Mt", osis: "MAT", chapters: 28 },
  { abbrev: "Mc", osis: "MRK", chapters: 16 },
  { abbrev: "Lc", osis: "LUK", chapters: 24 },
  { abbrev: "Jo", osis: "JHN", chapters: 21 },
  { abbrev: "At", osis: "ACT", chapters: 28 },
  { abbrev: "Rm", osis: "ROM", chapters: 16 },
  { abbrev: "1Co", osis: "1CO", chapters: 16 },
  { abbrev: "2Co", osis: "2CO", chapters: 13 },
  { abbrev: "Gl", osis: "GAL", chapters: 6 },
  { abbrev: "Ef", osis: "EPH", chapters: 6 },
  { abbrev: "Fp", osis: "PHP", chapters: 4 },
  { abbrev: "Cl", osis: "COL", chapters: 4 },
  { abbrev: "1Ts", osis: "1TH", chapters: 5 },
  { abbrev: "2Ts", osis: "2TH", chapters: 3 },
  { abbrev: "1Tm", osis: "1TI", chapters: 6 },
  { abbrev: "2Tm", osis: "2TI", chapters: 4 },
  { abbrev: "Tt", osis: "TIT", chapters: 3 },
  { abbrev: "Fm", osis: "PHM", chapters: 1 },
  { abbrev: "Hb", osis: "HEB", chapters: 13 },
  { abbrev: "Tg", osis: "JAS", chapters: 5 },
  { abbrev: "1Pe", osis: "1PE", chapters: 5 },
  { abbrev: "2Pe", osis: "2PE", chapters: 3 },
  { abbrev: "1Jo", osis: "1JN", chapters: 5 },
  { abbrev: "2Jo", osis: "2JN", chapters: 1 },
  { abbrev: "3Jo", osis: "3JN", chapters: 1 },
  { abbrev: "Jd", osis: "JUD", chapters: 1 },
  { abbrev: "Ap", osis: "REV", chapters: 22 }
];

const BIBLE = (() => {
  const chapters = [];
  for (const book of BIBLE_BOOKS) {
    for (let chapter = 1; chapter <= book.chapters; chapter++) {
      chapters.push({
        index: chapters.length,
        abbrev: book.abbrev,
        osis: book.osis,
        chapter
      });
    }
  }

  if (chapters.length !== TOTAL_CHAPTERS) {
    throw new Error(
      `TOTAL_CHAPTERS inválido: esperado ${TOTAL_CHAPTERS}, gerado ${chapters.length}`
    );
  }

  return chapters;
})();

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const pad2 = (value) => String(value).padStart(2, "0");
const startOfLocalDay = (date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());
const dateKeyFor = (year, monthIndex, day) =>
  `${year}-${pad2(monthIndex + 1)}-${pad2(day)}`;

function clampInt(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, Math.trunc(value)));
}

function readIntFromStorage(key, fallback) {
  const raw = localStorage.getItem(key);
  const parsed = Number.parseInt(String(raw ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function getCurrentYear(now = new Date()) {
  return now.getFullYear();
}

function resetIfNewYear() {
  const yearNow = getCurrentYear();
  const storedYear = readIntFromStorage(STORAGE_KEYS.plannerYear, yearNow);

  if (storedYear !== yearNow) {
    localStorage.setItem(STORAGE_KEYS.plannerYear, String(yearNow));
    localStorage.setItem(STORAGE_KEYS.chaptersRead, "0");
  } else if (!localStorage.getItem(STORAGE_KEYS.plannerYear)) {
    localStorage.setItem(STORAGE_KEYS.plannerYear, String(yearNow));
  }
}

function getChaptersRead() {
  return clampInt(
    readIntFromStorage(STORAGE_KEYS.chaptersRead, 0),
    0,
    TOTAL_CHAPTERS
  );
}

function setChaptersRead(value) {
  const clamped = clampInt(value, 0, TOTAL_CHAPTERS);
  localStorage.setItem(STORAGE_KEYS.chaptersRead, String(clamped));
  return clamped;
}

function calculateDaysRemaining(now = new Date()) {
  const year = getCurrentYear(now);
  const today = startOfLocalDay(now);
  const end = new Date(year, 11, 31);
  const diff = end.getTime() - today.getTime();
  const days = Math.floor(diff / MS_PER_DAY) + 1; // inclui hoje
  return Math.max(1, days);
}

function calculateChaptersToday(now = new Date()) {
  const chaptersRead = getChaptersRead();
  const chaptersRemaining = TOTAL_CHAPTERS - chaptersRead;
  if (chaptersRemaining <= 0) return 0;

  const daysRemaining = calculateDaysRemaining(now);
  const chaptersToday = Math.ceil(chaptersRemaining / daysRemaining);
  return Math.max(1, Math.min(chaptersRemaining, chaptersToday));
}

function getTodayReading(now = new Date()) {
  const chaptersRead = getChaptersRead();
  const chaptersToday = calculateChaptersToday(now);
  return BIBLE.slice(
    chaptersRead,
    Math.min(TOTAL_CHAPTERS, chaptersRead + chaptersToday)
  );
}

function markAsRead(now = new Date()) {
  const chaptersToday = calculateChaptersToday(now);
  if (chaptersToday <= 0) return getChaptersRead();
  return setChaptersRead(getChaptersRead() + chaptersToday);
}

function formatReading(chapters) {
  if (!chapters || chapters.length === 0) return null;

  const groups = [];
  let current = null;

  for (const item of chapters) {
    if (!current) {
      current = { abbrev: item.abbrev, start: item.chapter, end: item.chapter };
      continue;
    }

    if (item.abbrev === current.abbrev && item.chapter === current.end + 1) {
      current.end = item.chapter;
      continue;
    }

    groups.push(current);
    current = { abbrev: item.abbrev, start: item.chapter, end: item.chapter };
  }

  if (current) groups.push(current);

  return groups
    .map((g) =>
      g.start === g.end ? `${g.abbrev} ${g.start}` : `${g.abbrev} ${g.start}–${g.end}`
    )
    .join("; ");
}

function getBibleRouteForChapters(chapters, dateKey) {
  if (!chapters || chapters.length === 0) return null;
  const first = chapters[0];
  if (!first?.osis || !first?.chapter) return null;

  const params = new URLSearchParams({
    book: String(first.osis),
    chapter: String(first.chapter),
    origin: "planner",
    day: String(dateKey || "")
  });

  return `biblia.html?${params.toString()}`;
}

function isLeapYear(year) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function buildIdealPlanForYear(year) {
  const plan = new Map();
  const start = new Date(year, 0, 1);
  const end = new Date(year, 11, 31);

  let chaptersRead = 0;
  for (
    let cursor = new Date(start);
    cursor.getTime() <= end.getTime();
    cursor.setDate(cursor.getDate() + 1)
  ) {
    const cursorDay = startOfLocalDay(cursor);
    const daysRemaining = Math.floor((end.getTime() - cursorDay.getTime()) / MS_PER_DAY) + 1;
    const remaining = TOTAL_CHAPTERS - chaptersRead;
    const count = remaining > 0 ? Math.ceil(remaining / Math.max(1, daysRemaining)) : 0;
    const safeCount = Math.max(0, Math.min(remaining, count));

    const key = dateKeyFor(year, cursor.getMonth(), cursor.getDate());
    plan.set(key, { startIndex: chaptersRead, count: safeCount });
    chaptersRead += safeCount;
  }

  // Ajuste de segurança para fechar exatamente em 1189 capítulos no ano.
  if (chaptersRead !== TOTAL_CHAPTERS) {
    const delta = TOTAL_CHAPTERS - chaptersRead;
    const lastKey = `${year}-12-31`;
    const last = plan.get(lastKey);
    if (last) last.count = Math.max(0, last.count + delta);
  }

  return plan;
}

function buildCompletedSetFromChaptersRead({ year, chaptersRead, plan }) {
  const completed = new Set();
  for (const [dateKey, entry] of plan.entries()) {
    if (entry.startIndex + entry.count <= chaptersRead) completed.add(dateKey);
  }

  // Safety: só mantém date_keys do ano atual.
  for (const key of completed) {
    if (!String(key).startsWith(`${year}-`)) completed.delete(key);
  }

  return completed;
}

function calculateStreak({ year, completedSet }) {
  let streak = 0;
  const cursor = startOfLocalDay(new Date());

  while (cursor.getFullYear() === year) {
    const key = dateKeyFor(year, cursor.getMonth(), cursor.getDate());
    if (!completedSet.has(key)) break;
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

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
const mainTitleEl = document.getElementById("main-title");

function renderFatal(message) {
  if (!calendarGrid) return;
  console.error(message);
  calendarGrid.innerHTML = "";

  const card = document.createElement("div");
  card.className = "note-card";

  const p = document.createElement("p");
  p.className = "status";
  p.textContent = message;

  card.appendChild(p);
  calendarGrid.appendChild(card);
}

function getDaysInMonth(year, monthIndex) {
  return new Date(year, monthIndex + 1, 0).getDate();
}

function getFirstDayOfWeek(year, monthIndex) {
  return new Date(year, monthIndex, 1).getDay();
}

function isTodayDateKey(year, dateKey) {
  const today = startOfLocalDay(new Date());
  const key = dateKeyFor(year, today.getMonth(), today.getDate());
  return dateKey === key;
}

function updateNav({ currentMonth }) {
  if (currentMonthNameEl) currentMonthNameEl.textContent = monthNames[currentMonth];
  if (prevMonthBtn) prevMonthBtn.disabled = currentMonth === 0;
  if (nextMonthBtn) nextMonthBtn.disabled = currentMonth === 11;
}

function updateMonthStats({ year, currentMonth, completedSet }) {
  if (!monthProgressTextEl) return;
  const daysInMonth = getDaysInMonth(year, currentMonth);
  let completed = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const key = dateKeyFor(year, currentMonth, day);
    if (completedSet.has(key)) completed++;
  }
  monthProgressTextEl.textContent = `${completed} de ${daysInMonth} leituras concluídas`;
}

function updateAnnualStats({ year, completedSet, totalReadings }) {
  const chaptersRead = getChaptersRead();
  const percent = TOTAL_CHAPTERS ? Math.round((chaptersRead / TOTAL_CHAPTERS) * 100) : 0;

  if (annualProgressEl) annualProgressEl.textContent = `${percent}%`;
  if (progressBarEl) progressBarEl.style.width = `${percent}%`;
  if (totalCompletedEl) totalCompletedEl.textContent = String(completedSet.size);
  if (totalRemainingEl) totalRemainingEl.textContent = String(totalReadings - completedSet.size);
  if (currentStreakEl) currentStreakEl.textContent = String(
    calculateStreak({ year, completedSet })
  );
}

function buildDayCell({
  year,
  day,
  dateKey,
  chapters,
  isCompleted,
  isToday,
  isTodayLocked,
  onMarkToday
}) {
  const reading = formatReading(chapters);
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
          (isTodayLocked || (!isToday && isCompleted)) ? "checked" : ""
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

  cell.addEventListener("click", (event) => {
    // Evita navegação ao interagir com a checkbox (especialmente em mobile).
    if (event?.target?.closest?.('input[type="checkbox"]')) return;

    const route = getBibleRouteForChapters(chapters, dateKey);
    if (route) {
      window.location.href = route;
      return;
    }
    window.location.href = `note.html?day=${dateKey}`;
  });

  const checkbox = cell.querySelector('input[type="checkbox"]');
  if (checkbox) {
    const stop = (event) => event.stopPropagation();
    checkbox.addEventListener("pointerdown", stop);
    checkbox.addEventListener("mousedown", stop);
    checkbox.addEventListener("touchstart", stop, { passive: true });
    checkbox.addEventListener("click", stop);
    checkbox.disabled = !isToday || isTodayLocked;

    checkbox.addEventListener("change", (event) => {
      const wantsCheck = event.target.checked;

      if (!isToday) {
        // Sem histórico por dia, não desfazemos progresso em datas passadas.
        if (!wantsCheck) event.target.checked = true;
        return;
      }

      if (!wantsCheck) return;
      onMarkToday();
    });
  }

  return cell;
}

function init() {
  if (!calendarGrid) {
    renderFatal("Erro: calendario nao encontrado (#calendar-grid).");
    return;
  }

  resetIfNewYear();

  const year = getCurrentYear();
  const totalReadings = isLeapYear(year) ? 366 : 365;
  const now = new Date();
  let currentMonth = now.getFullYear() === year ? now.getMonth() : 0;

  const sessionState = {
    lockedTodayKey: null,
    lockedTodayChapters: null
  };

  let plan = buildIdealPlanForYear(year);
  let completedSet = buildCompletedSetFromChaptersRead({
    year,
    chaptersRead: getChaptersRead(),
    plan
  });

  // Header nav: mantém o botão sem backend nesta página.
  document.querySelectorAll(".logout-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = "index.html";
    });
  });

  function refreshDerivedState() {
    plan = buildIdealPlanForYear(year);
    completedSet = buildCompletedSetFromChaptersRead({
      year,
      chaptersRead: getChaptersRead(),
      plan
    });
  }

  function renderCalendar() {
    calendarGrid.innerHTML = "";

    if (mainTitleEl) mainTitleEl.textContent = `Plano de Leitura Bíblica ${year}`;

    const daysInMonth = getDaysInMonth(year, currentMonth);
    const firstDay = getFirstDayOfWeek(year, currentMonth);
    const today = startOfLocalDay(new Date());
    const todayKey = dateKeyFor(year, today.getMonth(), today.getDate());
    const isTodayLocked = sessionState.lockedTodayKey === todayKey;

    for (let i = 0; i < firstDay; i++) {
      const emptyCell = document.createElement("div");
      emptyCell.className = "min-h-20";
      calendarGrid.appendChild(emptyCell);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = dateKeyFor(year, currentMonth, day);
      const isToday = isTodayDateKey(year, dateKey);

      const chapters = isToday
        ? (isTodayLocked ? sessionState.lockedTodayChapters : getTodayReading(new Date()))
        : (() => {
            const entry = plan.get(dateKey);
            if (!entry || entry.count <= 0) return [];
            return BIBLE.slice(entry.startIndex, entry.startIndex + entry.count);
          })();

      const cell = buildDayCell({
        year,
        day,
        dateKey,
        chapters,
        isCompleted: completedSet.has(dateKey),
        isToday,
        isTodayLocked: isToday && isTodayLocked,
        onMarkToday: () => {
          // "Marca leitura" do dia: trava visualmente a leitura de hoje na sessão,
          // avança chaptersRead e recalcula automaticamente a leitura seguinte.
          sessionState.lockedTodayKey = todayKey;
          sessionState.lockedTodayChapters = chapters;
          markAsRead(new Date());
          refreshDerivedState();
          renderCalendar();
        }
      });

      calendarGrid.appendChild(cell);
    }

    updateNav({ currentMonth });
    updateMonthStats({ year, currentMonth, completedSet });
    updateAnnualStats({ year, completedSet, totalReadings });
  }

  renderCalendar();

  if (prevMonthBtn) {
    prevMonthBtn.addEventListener("click", () => {
      if (currentMonth === 0) return;
      currentMonth -= 1;
      renderCalendar();
    });
  }

  if (nextMonthBtn) {
    nextMonthBtn.addEventListener("click", () => {
      if (currentMonth === 11) return;
      currentMonth += 1;
      renderCalendar();
    });
  }
}

try {
  init();
} catch (error) {
  renderFatal(error?.message || "Erro inesperado ao inicializar o planner.");
}
