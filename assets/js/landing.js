const STORAGE_PREFIX = "personal_budget_v3_";

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

function sumArray(array, field) {
  return (array || []).reduce((sum, item) => {
    return sum + (Number(item[field]) || 0);
  }, 0);
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

function getMonthSummary(month) {
  const saved = localStorage.getItem(STORAGE_PREFIX + month);

  if (!saved) {
    return null;
  }

  try {
    const data = JSON.parse(saved);
    const incomeFact = sumArray(data.income, "fact");
    const expensesFact = sumArray(data.fixed, "fact") + sumArray(data.variable, "fact");
    const savingsFact = Number(data.savingFact) || 0;
    const balanceFact = incomeFact - expensesFact - savingsFact;

    return { incomeFact, expensesFact, balanceFact };
  } catch {
    return null;
  }
}

function initLandingStats() {
  const monthsEl = document.getElementById("statMonths");
  const balanceEl = document.getElementById("statBalance");
  const expensesEl = document.getElementById("statExpenses");

  if (!monthsEl || !balanceEl || !expensesEl) {
    return;
  }

  const months = getSavedMonths();
  monthsEl.textContent = String(months.length);

  const currentMonth = getCurrentMonthValue();
  const summary = getMonthSummary(currentMonth);

  if (summary && (summary.incomeFact > 0 || summary.expensesFact > 0)) {
    balanceEl.textContent = formatRubles(summary.balanceFact);
    expensesEl.textContent = formatRubles(summary.expensesFact);
    return;
  }

  balanceEl.textContent = "—";
  expensesEl.textContent = "—";
}

document.addEventListener("DOMContentLoaded", initLandingStats);
