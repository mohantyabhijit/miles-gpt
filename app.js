import { classifyTransaction } from "./categories.js";
import { CARD_RULES, estimateMiles, bestCardForTransaction } from "./cards.js";

const fileInput = document.getElementById("fileInput");
const humorMode = document.getElementById("humorMode");
let transactions = [];

fileInput.addEventListener("change", async (e) => {
  transactions = [];
  const files = [...(e.target.files || [])];
  for (const file of files) {
    const text = await file.text();
    transactions.push(...parseCsv(text, file.name));
  }
  renderAll(files.length);
});

humorMode.addEventListener("change", () => {
  if (transactions.length) renderStory(analyze(transactions));
});

function parseCsv(text, source) {
  const lines = text.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  return lines.slice(1).map((line) => {
    const cols = splitCsvRow(line);
    const row = Object.fromEntries(headers.map((h, i) => [h, cols[i] || ""]));
    const amount = Math.abs(Number(row.amount || row.spend || 0));
    const currency = (row.currency || "SGD").toUpperCase();
    const card = row.card || row.card_name || source.replace(/\.csv$/i, "");
    const cls = classifyTransaction(row.merchant || row.description || "Unknown", currency);
    return {
      date: row.date || "",
      merchant: cls.normalized,
      amount,
      currency,
      card,
      category: cls.category,
      spendType: cls.spendType,
    };
  }).filter((r) => r.amount > 0);
}

function splitCsvRow(row) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  for (const ch of row) {
    if (ch === '"') inQuotes = !inQuotes;
    else if (ch === "," && !inQuotes) {
      out.push(cur.trim());
      cur = "";
    } else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function analyze(txns) {
  const byCategory = {};
  const leakageByCategory = {};
  const byCard = {};
  let totalSpend = 0;
  let actualMiles = 0;
  let bestMiles = 0;

  for (const txn of txns) {
    totalSpend += txn.amount;
    byCategory[txn.category] = (byCategory[txn.category] || 0) + txn.amount;

    const actual = estimateMiles(txn, txn.card);
    const best = bestCardForTransaction(txn);
    actualMiles += actual;
    bestMiles += best.miles;
    const leak = best.miles - actual;
    leakageByCategory[txn.category] = (leakageByCategory[txn.category] || 0) + leak;

    byCard[txn.card] = (byCard[txn.card] || 0) + actual;
  }

  return {
    totalSpend,
    actualMiles,
    bestMiles,
    missedMiles: Math.max(0, bestMiles - actualMiles),
    byCategory,
    leakageByCategory,
    byCard,
  };
}

function renderAll(fileCount) {
  const result = analyze(transactions);
  document.getElementById("statusText").textContent = `Parsed ${transactions.length} transactions from ${fileCount} file(s).`;
  renderSpend(result);
  renderMiles(result);
  renderRecommendations(result);
  renderStory(result);
  renderTransactions(transactions);
}

function metric(label, value, className = "") {
  return `<div class="metric"><h4>${label}</h4><p class="${className}">${value}</p></div>`;
}

function renderSpend(result) {
  const spendSummary = document.getElementById("spendSummary");
  spendSummary.innerHTML = [
    metric("Total Spend", fmtMoney(result.totalSpend)),
    metric("Categories", Object.keys(result.byCategory).length),
    metric("Top Category", topKey(result.byCategory) || "-")
  ].join("");

  document.getElementById("categoryTable").innerHTML = toTable(result.byCategory, "Category", "Spend", fmtMoney);
}

function renderMiles(result) {
  document.getElementById("milesSummary").innerHTML = [
    metric("Actual Miles", fmtNum(result.actualMiles), "warn"),
    metric("Best Case Miles", fmtNum(result.bestMiles), "good"),
    metric("Miles Left", fmtNum(result.missedMiles), result.missedMiles > 0 ? "bad" : "good")
  ].join("");

  document.getElementById("leakageTable").innerHTML = toTable(result.leakageByCategory, "Category", "Missed Miles", fmtNum);
}

function renderRecommendations(result) {
  const topLeakCategory = topKey(result.leakageByCategory);
  const topSpendCategory = topKey(result.byCategory);
  const recs = [];

  if (topLeakCategory === "online_shopping") recs.push(cardRec("HSBC Revolution", "High earn for online + dining.", "Move ecommerce and food delivery spend."));
  if (topLeakCategory === "dining") recs.push(cardRec("UOB Preferred Platinum Visa", "Strong on dining/contactless.", "Use for in-person dining + mobile wallet payments."));
  if (["travel", "flights", "hotels", "foreign_currency"].includes(topSpendCategory)) recs.push(cardRec("Citi PremierMiles", "Consistent travel earn rates.", "Use for flights, hotels, and FCY purchases."));
  if (!recs.length) recs.push(cardRec("DBS Woman's World", "Great default for online spend.", "Use for e-commerce and subscriptions."));

  const projectedAnnual = result.missedMiles * 12;
  recs.push(`<p><strong>Projected annual uplift:</strong> ${fmtNum(projectedAnnual)} miles if behavior stays similar.</p>`);
  document.getElementById("recommendations").innerHTML = `<ul class="list">${recs.map((r) => `<li>${r}</li>`).join("")}</ul>`;
}

function cardRec(card, why, move) {
  return `<strong>${card}</strong> — ${why} <em>${move}</em>`;
}

function renderStory(result) {
  const miles = result.missedMiles;
  const flightsFraction = miles / 27000;
  const loungeVisits = Math.floor(miles / 1800);

  const formal = [
    `<p>You left <strong>${fmtNum(miles)} miles</strong> on the table this month.</p>`,
    `<p>That is roughly <strong>${flightsFraction.toFixed(2)}x</strong> of a one-way regional redemption (~27,000 miles), or about <strong>${loungeVisits}</strong> lounge visits of value.</p>`,
  ];

  const roasts = [
    "At this rate, your miles are filing a missing person report.",
    "Your wallet has talent. Your current card strategy does not.",
    "You could be flying to Japan, but instead you're donating miles to the void.",
  ];

  const humor = humorMode.checked ? `<p class="warn"><strong>Roast:</strong> ${roasts[Math.floor(Math.random() * roasts.length)]}</p>` : "";
  document.getElementById("storytelling").innerHTML = formal.join("") + humor;
}

function renderTransactions(txns) {
  const rows = txns.slice(0, 300).map((t) => `<tr>
      <td>${t.date}</td>
      <td>${t.merchant}</td>
      <td>${fmtMoney(t.amount)}</td>
      <td>${t.currency}</td>
      <td>${t.card}</td>
      <td>${t.category}</td>
      <td>${spendTypeText(t.spendType)}</td>
    </tr>`).join("");
  document.querySelector("#transactionsTable tbody").innerHTML = rows || '<tr><td colspan="7">No data yet.</td></tr>';
}

function spendTypeText(s) {
  return [s.online && "online", s.recurring && "recurring", s.foreign_currency && "fcy", s.contactless && "contactless"]
    .filter(Boolean)
    .join(" · ") || "-";
}

function toTable(obj, k, v, valFmt) {
  const entries = Object.entries(obj).sort((a, b) => b[1] - a[1]);
  if (!entries.length) return "<p class='tiny'>No data yet.</p>";
  return `<table><thead><tr><th>${k}</th><th>${v}</th></tr></thead><tbody>${entries
    .map(([key, val]) => `<tr><td>${key}</td><td>${valFmt(val)}</td></tr>`)
    .join("")}</tbody></table>`;
}

function topKey(obj) {
  return Object.entries(obj).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function fmtMoney(n) {
  return new Intl.NumberFormat("en-SG", { style: "currency", currency: "SGD", maximumFractionDigits: 2 }).format(n || 0);
}

function fmtNum(n) {
  return Math.round(n || 0).toLocaleString("en-SG");
}

window.__CARD_RULES = CARD_RULES;
