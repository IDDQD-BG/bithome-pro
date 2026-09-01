"use strict";

/* BITHOME CLIENT · growth app — state, risk, signal, result (no mechanics). */

const API_BASE = "https://api-proxy.allximika.workers.dev";
const LS_KEY = "bithome.client.key";

let KEY = localStorage.getItem(LS_KEY) || "";
let AUTHD = false;

const el = (id) => document.getElementById(id);

function fmtUsd(v) {
  if (v == null) return "—";
  return "$" + Number(v).toLocaleString("en-US",
    v >= 1000 ? { maximumFractionDigits: 0 } : { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPct(v) {
  if (v == null) return "—";
  return (v >= 0 ? "+" : "") + Number(v).toFixed(2) + "%";
}

function fmtWhen(t) {
  if (!t) return "—";
  const d = new Date(t * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return p(d.getUTCHours()) + ":" + p(d.getUTCMinutes()) + " · " +
    p(d.getUTCDate()) + "." + p(d.getUTCMonth() + 1);
}

async function api(path, params) {
  const q = new URLSearchParams(params || {});
  const r = await fetch(API_BASE + path + "?" + q.toString(), { cache: "no-store" });
  let d = null;
  try { d = await r.json(); } catch (e) { throw new Error("bad JSON from " + path); }
  if (r.status !== 200 || (d && d.valid === false)) {
    const err = new Error((d && d.error) || ("HTTP " + r.status));
    err.status = r.status;
    throw err;
  }
  return d;
}

function authMsg(cls, txt) {
  el("authMsg").className = cls || "";
  el("authMsg").textContent = txt || "";
}

async function connect() {
  const inp = el("keyInput");
  const k = (inp.value || "").trim();
  if (!k && !KEY) { authMsg("err", "enter license key"); return; }
  KEY = k || KEY;
  el("authBtn").disabled = true;
  authMsg("", "verifying…");
  try {
    const d = await api("/api/client/state", { key: KEY });
    localStorage.setItem(LS_KEY, KEY);
    AUTHD = true;
    authMsg("ok", "CONNECTED · " + (d.plan || "PRO").toUpperCase());
    document.body.classList.add("authed");
    renderState(d);
    renderPortfolio(d);
    renderActivity(d);
    renderBilling(d);
    startPoll();
  } catch (e) {
    authMsg("err", e.status === 401 ? "invalid or expired license" : e.message);
  } finally {
    el("authBtn").disabled = false;
  }
}

let tPoll = null;
function startPoll() {
  if (tPoll) return;
  tPoll = setInterval(refresh, 30000);
}

async function refresh() {
  if (!AUTHD) return;
  try {
    const d = await api("/api/client/state", { key: KEY });
    renderState(d);
    renderPortfolio(d);
    renderActivity(d);
    renderBilling(d);
    status("live", "ok", "LIVE");
  } catch (e) {
    if (e.status === 401) { logout(); return; }
    status("live", "err", "DOWN");
  }
}

function setMode(label, cls) {
  const p = el("modePill");
  if (p) { p.textContent = label; p.className = cls || ""; }
}

function status(id, cls, txt) {
  const b = el("st_" + id);
  if (b) b.textContent = txt;
  const box = b && b.closest(".st");
  if (box) { box.classList.remove("ok", "err"); box.classList.add(cls || ""); }
}

function logout() {
  AUTHD = false;
  if (tPoll) { clearInterval(tPoll); tPoll = null; }
  localStorage.removeItem(LS_KEY);
  KEY = "";
  el("keyInput").value = "";
  setMode("LOCKED", "");
  status("live", "err", "—");
  el("heroLock") && (el("heroLock").style.display = "flex");
}

/* ---------- render ---------- */
function renderState(d) {
  const s = d.state || {};
  el("stState").textContent = s.state || "NORMAL";
  el("stState").className = "st-line " + (s.state || "NORMAL");
  el("stConf").textContent = s.confidence || "—";
  el("stConf").className = s.confidence || "—";
  el("stRisk").textContent = s.risk || "—";
  el("stRisk").className = s.risk || "—";
  el("stAuto").textContent = s.automation || "—";
  const g = el("stGate");
  g.textContent = s.gate === "OPEN" ? "RISK GATE OPEN · SYSTEM ACTIVE"
    : "RISK GATE CLOSED · SYSTEM STANDING BY";
  g.className = "st-gate " + (s.gate || "CLOSED");
  const lock = el("heroLock");
  if (lock) lock.style.display = "none";
}

function renderPortfolio(d) {
  const p = d.portfolio || {};
  el("pfEquity").textContent = fmtUsd(p.equity);
  el("pfBtc").textContent = p.btc_held == null ? "—" : Number(p.btc_held).toFixed(8);
  el("pfPnl").textContent = fmtPct(p.pnl_pct);
  el("pfPnl").style.color = p.pnl_pct == null ? "" : (p.pnl_pct >= 0 ? "#26d07c" : "#ff5f5f");
  el("pfTrades").textContent = p.trades == null ? "—" : p.trades;
  el("pfWin").textContent = p.win_rate_pct == null ? "—" : p.win_rate_pct.toFixed(1) + "%";
  el("pfCash").textContent = fmtUsd(p.cash);
}

function renderActivity(d) {
  const a = d.activity || {};
  const buy = a.last_buy, sell = a.last_sell;
  el("actBuy").textContent = buy ? "BUY · " + fmtUsd(buy.price) + " · " + fmtWhen(buy.t) : "—";
  el("actSell").textContent = sell ? "SELL · " + fmtUsd(sell.price) + " · " + fmtWhen(sell.t) : "—";
  const list = a.recent || [];
  el("actRecent").innerHTML = list.length ? list.slice().reverse().map((s) => `
    <div class="act-item">
      <span class="action ${s.action || ""}">${s.action === "BUY" ? "▲ BUY" : s.action === "SELL" ? "▼ SELL" : s.action}</span>
      <span>${fmtUsd(s.price)}</span>
      <span class="when">${s.pnl != null ? fmtPct(s.pnl) + " · " : ""}${fmtWhen(s.t)}</span>
    </div>`).join("")
    : '<div class="loading">no activity yet</div>';
}

function renderBilling(d) {
  el("billPlan").textContent = (d.plan || "—").toUpperCase();
  el("billBlocks").textContent = d.blocks_remaining == null ? "—" : Number(d.blocks_remaining).toLocaleString("en-US");
  el("billClient").textContent = d.client || "—";
}

function billingAction(act) {
  const m = el("billMsg");
  if (!AUTHD) { m.className = "bill-msg err"; m.textContent = "connect first"; return; }
  if (act === "manage") { m.className = "bill-msg"; m.textContent = "STRIPE CUSTOMER PORTAL · link pending…"; return; }
  m.className = "bill-msg ok";
  m.textContent = (act === "pause" ? "PAUSE" : "RESUME") + " requested — confirmation sent via support@bithome.pro";
}

/* ---------- tabs ---------- */
function setTab(name) {
  document.querySelectorAll(".tab").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  document.querySelectorAll(".tab-view").forEach((v) => {
    v.style.display = v.id === "tab-" + name ? "block" : "none";
  });
}

/* ---------- boot ---------- */
function boot() {
  const inp = el("keyInput");
  inp.value = KEY;
  inp.addEventListener("keydown", (e) => { if (e.key === "Enter") connect(); });
  if (KEY) connect();
}

window.addEventListener("load", boot);

document.addEventListener("DOMContentLoaded", () => {
  setTab("home");
});