/*
  ==========================================================
  JAVASCRIPT-ЛОГИКА
  ==========================================================
*/

const STORAGE_PREFIX = "personal_budget_v3_";

const chartColors = [
  "#6366f1",
  "#ec4899",
  "#14b8a6",
  "#f59e0b",
  "#8b5cf6",
  "#ef4444",
  "#22c55e",
  "#06b6d4",
  "#f97316",
  "#a855f7",
  "#84cc16",
  "#e11d48",
  "#0ea5e9",
  "#d946ef",
  "#64748b",
  "#ca8a04",
  "#7c3aed",
  "#059669",
  "#db2777",
  "#2563eb",
  "#65a30d",
  "#c026d3",
  "#0891b2",
  "#ea580c"
];

const defaultData = {
  budgetMode: "personal",
  income: [
    { name: "Зарплата", plan: 0, fact: 0, limit: 0 }
  ],
  fixed: [
    { name: "Жильё / коммунальные услуги", plan: 0, fact: 0, limit: 0 },
    { name: "Связь и интернет", plan: 0, fact: 0, limit: 0 }
  ],
  variable: [
    { name: "Продукты", plan: 0, fact: 0, limit: 0 },
    { name: "Транспорт", plan: 0, fact: 0, limit: 0 },
    { name: "Покупки", plan: 0, fact: 0, limit: 0 }
  ],
  savingName: "",
  savingPlan: 0,
  savingFact: 0
};

const elements = {
  budgetMode: document.getElementById("budgetMode"),
  monthSelect: document.getElementById("monthSelect"),

  incomeRows: document.getElementById("incomeRows"),
  fixedRows: document.getElementById("fixedRows"),
  variableRows: document.getElementById("variableRows"),

  savingName: document.getElementById("savingName"),
  savingPlan: document.getElementById("savingPlan"),
  savingFact: document.getElementById("savingFact"),

  totalIncomeFact: document.getElementById("totalIncomeFact"),
  totalExpensesFact: document.getElementById("totalExpensesFact"),
  totalSavingsFact: document.getElementById("totalSavingsFact"),
  expensePercent: document.getElementById("expensePercent"),

  balance: document.getElementById("balance"),
  resultBox: document.getElementById("resultBox"),
  advice: document.getElementById("advice"),

  progressText: document.getElementById("progressText"),
  progressFill: document.getElementById("progressFill"),

  incomePlanCell: document.getElementById("incomePlanCell"),
  incomeFactCell: document.getElementById("incomeFactCell"),
  incomeDiffCell: document.getElementById("incomeDiffCell"),

  expensesPlanCell: document.getElementById("expensesPlanCell"),
  expensesFactCell: document.getElementById("expensesFactCell"),
  expensesDiffCell: document.getElementById("expensesDiffCell"),

  savingsPlanCell: document.getElementById("savingsPlanCell"),
  savingsFactCell: document.getElementById("savingsFactCell"),
  savingsDiffCell: document.getElementById("savingsDiffCell"),

  balancePlanCell: document.getElementById("balancePlanCell"),
  balanceFactCell: document.getElementById("balanceFactCell"),
  balanceDiffCell: document.getElementById("balanceDiffCell"),

  categoryList: document.getElementById("categoryList"),
  limitList: document.getElementById("limitList"),
  historyList: document.getElementById("historyList"),

  incomeChart: document.getElementById("incomeChart"),
  incomeChartLegend: document.getElementById("incomeChartLegend"),
  expenseChart: document.getElementById("expenseChart"),
  chartLegend: document.getElementById("chartLegend"),

  saveStatus: document.getElementById("saveStatus"),
  importFile: document.getElementById("importFile")
};

function formatRubles(value) {
  const number = Number(value) || 0;

  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0
  }).format(number);
}

function getCurrentMonthValue() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");

  return `${year}-${month}`;
}

function getStorageKey(month = elements.monthSelect.value) {
  return STORAGE_PREFIX + month;
}

function safeClone(data) {
  return JSON.parse(JSON.stringify(data));
}

function createBudgetRow(type, item = { name: "", plan: 0, fact: 0, limit: 0 }) {
  const row = document.createElement("div");
  row.className = "row";
  row.dataset.type = type;

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.placeholder = "Название";
  nameInput.className = "item-name";
  nameInput.value = item.name || "";

  const planInput = document.createElement("input");
  planInput.type = "number";
  planInput.min = "0";
  planInput.placeholder = "План, ₽";
  planInput.className = "item-plan";
  planInput.value = item.plan || "";

  const factInput = document.createElement("input");
  factInput.type = "number";
  factInput.min = "0";
  factInput.placeholder = "Факт, ₽";
  factInput.className = "item-fact";
  factInput.value = item.fact || "";

  const limitInput = document.createElement("input");
  limitInput.type = "number";
  limitInput.min = "0";
  limitInput.placeholder = type === "income" ? "—" : "Лимит, ₽";
  limitInput.className = "item-limit";
  limitInput.value = item.limit || "";

  if (type === "income") {
    limitInput.disabled = true;
  }

  const deleteButton = document.createElement("button");
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "×";
  deleteButton.title = "Удалить строку";

  nameInput.addEventListener("input", handleChange);
  planInput.addEventListener("input", handleChange);
  factInput.addEventListener("input", handleChange);
  limitInput.addEventListener("input", handleChange);

  deleteButton.addEventListener("click", function () {
    row.remove();
    handleChange();
  });

  row.appendChild(nameInput);
  row.appendChild(planInput);
  row.appendChild(factInput);
  row.appendChild(limitInput);
  row.appendChild(deleteButton);

  return row;
}

function addRow(type, item) {
  let container;

  if (type === "income") container = elements.incomeRows;
  if (type === "fixed") container = elements.fixedRows;
  if (type === "variable") container = elements.variableRows;

  container.appendChild(createBudgetRow(type, item));
  handleChange();
}

function collectRows(type) {
  const rows = document.querySelectorAll(`.row[data-type="${type}"]`);
  const result = [];

  rows.forEach(row => {
    const name = row.querySelector(".item-name").value.trim();
    const plan = Number(row.querySelector(".item-plan").value) || 0;
    const fact = Number(row.querySelector(".item-fact").value) || 0;
    const limit = Number(row.querySelector(".item-limit").value) || 0;

    result.push({ name, plan, fact, limit });
  });

  return result;
}

function sumRows(type, field) {
  return collectRows(type).reduce((sum, item) => {
    return sum + (Number(item[field]) || 0);
  }, 0);
}

function collectData() {
  return {
    budgetMode: elements.budgetMode.value,
    income: collectRows("income"),
    fixed: collectRows("fixed"),
    variable: collectRows("variable"),
    savingName: elements.savingName.value.trim(),
    savingPlan: Number(elements.savingPlan.value) || 0,
    savingFact: Number(elements.savingFact.value) || 0
  };
}

function saveData() {
  const data = collectData();
  localStorage.setItem(getStorageKey(), JSON.stringify(data));
  elements.saveStatus.textContent = "Сохранено автоматически.";
  updateHistory();
}

function loadData() {
  const saved = localStorage.getItem(getStorageKey());
  const data = saved ? JSON.parse(saved) : safeClone(defaultData);

  elements.incomeRows.innerHTML = "";
  elements.fixedRows.innerHTML = "";
  elements.variableRows.innerHTML = "";

  elements.budgetMode.value = data.budgetMode || "personal";

  data.income.forEach(item => {
    elements.incomeRows.appendChild(createBudgetRow("income", item));
  });

  data.fixed.forEach(item => {
    elements.fixedRows.appendChild(createBudgetRow("fixed", item));
  });

  data.variable.forEach(item => {
    elements.variableRows.appendChild(createBudgetRow("variable", item));
  });

  elements.savingName.value = data.savingName || "";
  elements.savingPlan.value = data.savingPlan || "";
  elements.savingFact.value = data.savingFact || "";

  calculateBudget();
  updateHistory();

  elements.saveStatus.textContent = "Данные месяца загружены.";
}

function handleChange() {
  calculateBudget();
  saveData();
}

function calculateBudget() {
  const incomePlan = sumRows("income", "plan");
  const incomeFact = sumRows("income", "fact");

  const fixedPlan = sumRows("fixed", "plan");
  const fixedFact = sumRows("fixed", "fact");

  const variablePlan = sumRows("variable", "plan");
  const variableFact = sumRows("variable", "fact");

  const expensesPlan = fixedPlan + variablePlan;
  const expensesFact = fixedFact + variableFact;

  const savingsPlan = Number(elements.savingPlan.value) || 0;
  const savingsFact = Number(elements.savingFact.value) || 0;

  const balancePlan = incomePlan - expensesPlan - savingsPlan;
  const balanceFact = incomeFact - expensesFact - savingsFact;

  const expensePercent = incomeFact > 0
    ? Math.round((expensesFact / incomeFact) * 100)
    : 0;

  elements.totalIncomeFact.textContent = formatRubles(incomeFact);
  elements.totalExpensesFact.textContent = formatRubles(expensesFact);
  elements.totalSavingsFact.textContent = formatRubles(savingsFact);
  elements.expensePercent.textContent = expensePercent + "%";
  elements.balance.textContent = formatRubles(balanceFact);

  updateResultBox(balanceFact, incomeFact);
  updateProgress(expensePercent);

  updatePlanFactTable({
    incomePlan,
    incomeFact,
    expensesPlan,
    expensesFact,
    savingsPlan,
    savingsFact,
    balancePlan,
    balanceFact
  });

  const expenseCategories = getExpenseCategories();
  const incomeCategories = getIncomeCategories();

  updateCategories(expenseCategories, expensesFact);
  updateLimits(expenseCategories);

  drawCategoryChart({
    canvas: elements.incomeChart,
    legendEl: elements.incomeChartLegend,
    categories: incomeCategories,
    total: incomeFact,
    centerLabel: "Доходы",
    emptyMessage: "Добавьте фактические доходы — диаграмма появится автоматически.",
    colorOffset: 0
  });

  drawCategoryChart({
    canvas: elements.expenseChart,
    legendEl: elements.chartLegend,
    categories: expenseCategories,
    total: expensesFact,
    centerLabel: "Расходы",
    emptyMessage: "Добавьте фактические расходы — диаграмма появится автоматически.",
    colorOffset: 8
  });
}

function updateResultBox(balanceFact, incomeFact) {
  elements.resultBox.className = "big-result";

  if (incomeFact <= 0) {
    elements.advice.textContent = "Добавьте фактический доход, чтобы калькулятор смог оценить бюджет.";
    return;
  }

  if (balanceFact > incomeFact * 0.15) {
    elements.resultBox.classList.add("good");
    elements.advice.textContent =
      "Бюджет выглядит спокойно. После расходов и накоплений остаётся хороший запас. Можно оставить его как резерв или направить часть на финансовую цель.";
    return;
  }

  if (balanceFact >= 0) {
    elements.resultBox.classList.add("warning");
    elements.advice.textContent =
      "Бюджет сходится, но запас небольшой. Стоит посмотреть переменные расходы, лимиты и категории, где факт приблизился к максимуму.";
    return;
  }

  elements.resultBox.classList.add("bad");
  elements.advice.textContent =
    "Бюджет ушёл в минус. Фактические расходы и накопления больше дохода. Посмотрите категории с перерасходом и временно уменьшите необязательные траты.";
}

function updateProgress(percent) {
  const safePercent = Math.min(percent, 100);

  elements.progressFill.style.width = safePercent + "%";
  elements.progressText.textContent = percent + "%";

  if (percent <= 60) {
    elements.progressFill.style.background = "var(--good)";
  } else if (percent <= 85) {
    elements.progressFill.style.background = "var(--warning)";
  } else {
    elements.progressFill.style.background = "var(--bad)";
  }
}

function updatePlanFactTable(data) {
  setMoneyCell(elements.incomePlanCell, data.incomePlan);
  setMoneyCell(elements.incomeFactCell, data.incomeFact);
  setDiffCell(elements.incomeDiffCell, data.incomeFact - data.incomePlan);

  setMoneyCell(elements.expensesPlanCell, data.expensesPlan);
  setMoneyCell(elements.expensesFactCell, data.expensesFact);
  setDiffCell(elements.expensesDiffCell, data.expensesPlan - data.expensesFact);

  setMoneyCell(elements.savingsPlanCell, data.savingsPlan);
  setMoneyCell(elements.savingsFactCell, data.savingsFact);
  setDiffCell(elements.savingsDiffCell, data.savingsFact - data.savingsPlan);

  setMoneyCell(elements.balancePlanCell, data.balancePlan);
  setMoneyCell(elements.balanceFactCell, data.balanceFact);
  setDiffCell(elements.balanceDiffCell, data.balanceFact - data.balancePlan);
}

function setMoneyCell(cell, value) {
  cell.textContent = formatRubles(value);
  cell.className = "";
}

function setDiffCell(cell, value) {
  cell.textContent = formatRubles(value);

  if (value > 0) {
    cell.className = "plus";
  } else if (value < 0) {
    cell.className = "minus";
  } else {
    cell.className = "";
  }
}

function getIncomeCategories() {
  return collectRows("income")
    .map(item => ({
      name: item.name || "Без названия",
      amount: item.fact
    }))
    .filter(item => item.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}

function getExpenseCategories() {
  const fixed = collectRows("fixed").map(item => ({
    name: item.name || "Без названия",
    amount: item.fact,
    plan: item.plan,
    limit: item.limit,
    group: "Обязательные"
  }));

  const variable = collectRows("variable").map(item => ({
    name: item.name || "Без названия",
    amount: item.fact,
    plan: item.plan,
    limit: item.limit,
    group: "Переменные"
  }));

  return [...fixed, ...variable]
    .filter(item => item.amount > 0 || item.limit > 0)
    .sort((a, b) => b.amount - a.amount);
}

function updateCategories(categories, totalExpensesFact) {
  elements.categoryList.innerHTML = "";

  const visible = categories.filter(item => item.amount > 0);

  if (visible.length === 0) {
    const empty = document.createElement("div");
    empty.className = "small-text";
    empty.textContent = "Пока фактических расходов нет. Добавьте суммы в колонку «Факт».";
    elements.categoryList.appendChild(empty);
    return;
  }

  visible.forEach(item => {
    const percent = totalExpensesFact > 0
      ? Math.round((item.amount / totalExpensesFact) * 100)
      : 0;

    const line = document.createElement("div");
    line.className = "category-line";

    const top = document.createElement("div");
    top.className = "category-top";

    const title = document.createElement("strong");
    title.textContent = item.name + " · " + item.group;

    const value = document.createElement("span");
    value.textContent = formatRubles(item.amount) + " · " + percent + "%";

    const bar = document.createElement("div");
    bar.className = "category-bar";

    const fill = document.createElement("div");
    fill.className = "category-fill";
    fill.style.width = percent + "%";

    top.appendChild(title);
    top.appendChild(value);
    bar.appendChild(fill);

    line.appendChild(top);
    line.appendChild(bar);

    elements.categoryList.appendChild(line);
  });
}

function updateLimits(categories) {
  elements.limitList.innerHTML = "";

  const limited = categories.filter(item => item.limit > 0);

  if (limited.length === 0) {
    const empty = document.createElement("div");
    empty.className = "small-text";
    empty.textContent = "Пока лимитов нет. Укажите лимит в строках расходов.";
    elements.limitList.appendChild(empty);
    return;
  }

  limited.forEach(item => {
    const percent = item.limit > 0
      ? Math.round((item.amount / item.limit) * 100)
      : 0;

    const safePercent = Math.min(percent, 100);

    const line = document.createElement("div");
    line.className = "limit-line";

    const top = document.createElement("div");
    top.className = "limit-top";

    const title = document.createElement("strong");
    title.textContent = item.name + " · лимит " + formatRubles(item.limit);

    const value = document.createElement("span");
    value.textContent = formatRubles(item.amount) + " · " + percent + "%";

    const bar = document.createElement("div");
    bar.className = "limit-bar";

    const fill = document.createElement("div");
    fill.className = "limit-fill";
    fill.style.width = safePercent + "%";

    if (percent < 80) {
      fill.classList.add("good");
    } else if (percent <= 100) {
      fill.classList.add("warning");
    } else {
      fill.classList.add("bad");
    }

    top.appendChild(title);
    top.appendChild(value);
    bar.appendChild(fill);

    line.appendChild(top);
    line.appendChild(bar);

    elements.limitList.appendChild(line);
  });
}

function drawCategoryChart(options) {
  const {
    canvas,
    legendEl,
    categories,
    total,
    centerLabel,
    emptyMessage,
    colorOffset = 0
  } = options;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 120;

  ctx.clearRect(0, 0, width, height);
  legendEl.innerHTML = "";

  const visible = categories.filter(item => item.amount > 0);

  if (visible.length === 0 || total <= 0) {
    ctx.fillStyle = "#f6f1ea";
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#777777";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Нет данных", centerX, centerY);

    const empty = document.createElement("div");
    empty.className = "small-text";
    empty.textContent = emptyMessage;
    legendEl.appendChild(empty);
    return;
  }

  let startAngle = -Math.PI / 2;

  visible.forEach((item, index) => {
    const sliceAngle = (item.amount / total) * Math.PI * 2;
    const color = chartColors[(index + colorOffset) % chartColors.length];

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();

    startAngle += sliceAngle;

    const percent = Math.round((item.amount / total) * 100);

    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";

    const dot = document.createElement("span");
    dot.className = "legend-dot";
    dot.style.background = color;

    const text = document.createElement("span");
    text.textContent = `${item.name}: ${formatRubles(item.amount)} · ${percent}%`;

    legendItem.appendChild(dot);
    legendItem.appendChild(text);
    legendEl.appendChild(legendItem);
  });

  ctx.beginPath();
  ctx.arc(centerX, centerY, 55, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  ctx.fillStyle = "#5f4633";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";
  ctx.fillText(centerLabel, centerX, centerY - 4);

  ctx.font = "13px Arial";
  ctx.fillStyle = "#777777";
  ctx.fillText(formatRubles(total), centerX, centerY + 18);
}

function getSummaryData() {
  const incomeFact = sumRows("income", "fact");
  const expensesFact = sumRows("fixed", "fact") + sumRows("variable", "fact");
  const savingsFact = Number(elements.savingFact.value) || 0;
  const balanceFact = incomeFact - expensesFact - savingsFact;

  const expensePercent = incomeFact > 0
    ? Math.round((expensesFact / incomeFact) * 100)
    : 0;

  return {
    incomeFact,
    expensesFact,
    savingsFact,
    balanceFact,
    expensePercent
  };
}

function copySummary() {
  const data = getSummaryData();

  const text = `
Итог бюджета за ${elements.monthSelect.value}

Режим: ${getModeTitle(elements.budgetMode.value)}
Доходы, факт: ${formatRubles(data.incomeFact)}
Расходы, факт: ${formatRubles(data.expensesFact)}
Накопления, факт: ${formatRubles(data.savingsFact)}
Остаток: ${formatRubles(data.balanceFact)}
Расходы от дохода: ${data.expensePercent}%

Цель накоплений: ${elements.savingName.value.trim() || "не указана"}
  `.trim();

  navigator.clipboard.writeText(text)
    .then(() => alert("Итог скопирован."))
    .catch(() => alert("Не получилось скопировать автоматически. Можно выделить итог вручную."));
}

function getModeTitle(mode) {
  if (mode === "family") return "Семейный бюджет";
  if (mode === "project") return "Бюджет проекта";
  return "Личный бюджет";
}

function exportCSV() {
  const data = collectData();
  const month = elements.monthSelect.value;

  const rows = [
    ["Месяц", month],
    ["Режим", getModeTitle(data.budgetMode)],
    [],
    ["Раздел", "Название", "План, ₽", "Факт, ₽", "Лимит, ₽"]
  ];

  data.income.forEach(item => {
    rows.push(["Доходы", item.name, item.plan, item.fact, ""]);
  });

  data.fixed.forEach(item => {
    rows.push(["Обязательные расходы", item.name, item.plan, item.fact, item.limit]);
  });

  data.variable.forEach(item => {
    rows.push(["Переменные расходы", item.name, item.plan, item.fact, item.limit]);
  });

  rows.push([]);
  rows.push(["Накопления", data.savingName, data.savingPlan, data.savingFact, ""]);

  const summary = getSummaryData();

  rows.push([]);
  rows.push(["Итог", "Доходы факт", "", summary.incomeFact, ""]);
  rows.push(["Итог", "Расходы факт", "", summary.expensesFact, ""]);
  rows.push(["Итог", "Накопления факт", "", summary.savingsFact, ""]);
  rows.push(["Итог", "Остаток", "", summary.balanceFact, ""]);
  rows.push(["Итог", "Расходы от дохода", "", summary.expensePercent + "%", ""]);

  const csv = rows
    .map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(";"))
    .join("\n");

  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-${month}.csv`;
  link.click();

  URL.revokeObjectURL(url);
}

function importCSVFile(event) {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function (e) {
    try {
      importCSV(e.target.result);
      alert("CSV импортирован в выбранный месяц.");
    } catch (error) {
      alert("Не получилось импортировать CSV. Проверьте структуру файла.");
      console.error(error);
    }
  };

  reader.readAsText(file, "UTF-8");
  event.target.value = "";
}

function importCSV(text) {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter(line => line.trim() !== "");

  const imported = safeClone(defaultData);

  imported.income = [];
  imported.fixed = [];
  imported.variable = [];

  lines.forEach(line => {
    const columns = parseCSVLine(line);
    const section = columns[0] || "";
    const name = columns[1] || "";
    const plan = Number(String(columns[2] || "0").replace(",", ".")) || 0;
    const fact = Number(String(columns[3] || "0").replace(",", ".")) || 0;
    const limit = Number(String(columns[4] || "0").replace(",", ".")) || 0;

    if (section === "Режим") {
      if (name === "Семейный бюджет") imported.budgetMode = "family";
      if (name === "Бюджет проекта") imported.budgetMode = "project";
      if (name === "Личный бюджет") imported.budgetMode = "personal";
    }

    if (section === "Доходы") {
      imported.income.push({ name, plan, fact, limit: 0 });
    }

    if (section === "Обязательные расходы") {
      imported.fixed.push({ name, plan, fact, limit });
    }

    if (section === "Переменные расходы") {
      imported.variable.push({ name, plan, fact, limit });
    }

    if (section === "Накопления") {
      imported.savingName = name;
      imported.savingPlan = plan;
      imported.savingFact = fact;
    }
  });

  if (imported.income.length === 0) {
    imported.income.push({ name: "Доход", plan: 0, fact: 0, limit: 0 });
  }

  localStorage.setItem(getStorageKey(), JSON.stringify(imported));
  loadData();
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ";" && !insideQuotes) {
      result.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current);
  return result;
}

function clearCurrentMonth() {
  const confirmed = confirm("Очистить данные только выбранного месяца?");

  if (!confirmed) return;

  localStorage.removeItem(getStorageKey());
  loadData();
}

function getSavedMonths() {
  const months = [];

  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);

    if (key && key.startsWith(STORAGE_PREFIX)) {
      months.push(key.replace(STORAGE_PREFIX, ""));
    }
  }

  return months.sort();
}

function updateHistory() {
  elements.historyList.innerHTML = "";

  const months = getSavedMonths();

  if (months.length === 0) {
    const empty = document.createElement("div");
    empty.className = "small-text";
    empty.textContent = "Пока нет сохранённых месяцев.";
    elements.historyList.appendChild(empty);
    return;
  }

  const historyData = months.map(month => {
    const saved = localStorage.getItem(getStorageKey(month));
    const data = saved ? JSON.parse(saved) : safeClone(defaultData);

    const incomeFact = sumArray(data.income, "fact");
    const expensesFact = sumArray(data.fixed, "fact") + sumArray(data.variable, "fact");
    const savingsFact = Number(data.savingFact) || 0;
    const balanceFact = incomeFact - expensesFact - savingsFact;

    return {
      month,
      incomeFact,
      expensesFact,
      savingsFact,
      balanceFact
    };
  });

  const maxIncome = Math.max(...historyData.map(item => item.incomeFact), 1);

  historyData.forEach(item => {
    const percent = Math.round((item.incomeFact / maxIncome) * 100);

    const line = document.createElement("div");
    line.className = "history-line";

    const top = document.createElement("div");
    top.className = "history-top";

    const title = document.createElement("strong");
    title.textContent = item.month;

    const value = document.createElement("span");
    value.textContent =
      "Доход: " + formatRubles(item.incomeFact) +
      " · Расходы: " + formatRubles(item.expensesFact) +
      " · Остаток: " + formatRubles(item.balanceFact);

    const bar = document.createElement("div");
    bar.className = "history-bar";

    const fill = document.createElement("div");
    fill.className = "history-fill";
    fill.style.width = percent + "%";

    top.appendChild(title);
    top.appendChild(value);
    bar.appendChild(fill);

    line.appendChild(top);
    line.appendChild(bar);

    elements.historyList.appendChild(line);
  });
}

function sumArray(array, field) {
  return (array || []).reduce((sum, item) => {
    return sum + (Number(item[field]) || 0);
  }, 0);
}

document.getElementById("addIncomeBtn").addEventListener("click", function () {
  addRow("income", { name: "", plan: 0, fact: 0, limit: 0 });
});

document.getElementById("addFixedBtn").addEventListener("click", function () {
  addRow("fixed", { name: "", plan: 0, fact: 0, limit: 0 });
});

document.getElementById("addVariableBtn").addEventListener("click", function () {
  addRow("variable", { name: "", plan: 0, fact: 0, limit: 0 });
});

document.getElementById("copyBtn").addEventListener("click", copySummary);
document.getElementById("exportBtn").addEventListener("click", exportCSV);

document.getElementById("importBtn").addEventListener("click", function () {
  elements.importFile.click();
});

elements.importFile.addEventListener("change", importCSVFile);

document.getElementById("printBtn").addEventListener("click", function () {
  window.print();
});

document.getElementById("clearBtn").addEventListener("click", clearCurrentMonth);

elements.monthSelect.addEventListener("change", loadData);
elements.budgetMode.addEventListener("change", handleChange);
elements.savingName.addEventListener("input", handleChange);
elements.savingPlan.addEventListener("input", handleChange);
elements.savingFact.addEventListener("input", handleChange);

window.addEventListener("DOMContentLoaded", function () {
  elements.monthSelect.value = getCurrentMonthValue();
  loadData();
});