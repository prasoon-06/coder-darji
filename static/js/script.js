/* ================================================
   CODER DARJI — UI, now powered by Flask backend
   ================================================ */

// ==================== LIVE STATS ====================
const liveStats = { threats: 0, scans: 0 };
function updateStats() {
  const t = document.getElementById('statThreats');
  const s = document.getElementById('statScans');
  if (t) t.textContent = liveStats.threats;
  if (s) s.textContent = liveStats.scans;
}

// ==================== MATRIX RAIN ====================
const canvas = document.getElementById('matrixCanvas');
const ctx = canvas.getContext('2d');
let columns, drops;

function initMatrix() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  columns = Math.floor(canvas.width / 14);
  drops = Array(columns).fill(1);
}

function drawMatrix() {
  ctx.fillStyle = 'rgba(10,10,10,0.05)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#00ff9f';
  ctx.font = '14px Share Tech Mono';
  const chars = 'アイウエオカキクケコ01CODERDARJI';
  for (let i = 0; i < columns; i++) {
    ctx.fillText(chars[Math.floor(Math.random() * chars.length)], i * 14, drops[i] * 14);
    if (drops[i] * 14 > canvas.height && Math.random() > 0.975) drops[i] = 0;
    drops[i]++;
  }
}

initMatrix();
window.addEventListener('resize', initMatrix);
setInterval(drawMatrix, 40);

// ==================== HELPERS ====================
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function scrollToEl(el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

function animateNumber(el, target, duration) {
  const start = performance.now();
  (function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - t, 3);
    el.textContent = Math.round(ease * target);
    if (t < 1) requestAnimationFrame(tick);
  })(start);
}

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

// ==================== BOOT SEQUENCE ====================
const bootLines = [
  '> CODER DARJI v2.0 — SECURE BOOT',
  '> Loading neural network weights.......... OK',
  '> NLP Engine initialized.................. OK',
  '> Threat pattern database connected....... OK',
  '> Real-time analysis module............... OK',
  '> ████████████████████████████████ 100%',
  '> SYSTEM ONLINE.',
];

(async function boot() {
  const terminal = document.getElementById('bootTerminal');
  for (const text of bootLines) {
    const line = document.createElement('div');
    line.classList.add('line');
    terminal.appendChild(line);
    for (const ch of text) {
      line.textContent += ch;
      await sleep(10 + Math.random() * 15);
    }
    await sleep(80);
  }
  await sleep(500);
  document.getElementById('bootOverlay').classList.add('done');
  document.getElementById('mainContent').classList.replace('main-hidden', 'main-visible');
  startTyping();
  renderBackendResult();
})();

// ==================== TYPING EFFECT ====================
const phrases = [
  'Got a suspicious message? Let AI reveal the truth.',
  'Paste it. Scan it. Stay protected.',
  'We detect scams before they detect you.',
];
let pIdx = 0, chIdx = 0, deleting = false;

function startTyping() {
  const el = document.getElementById('typingText');
  const current = phrases[pIdx];
  if (!deleting) {
    el.textContent = current.substring(0, chIdx++);
    if (chIdx > current.length) { deleting = true; setTimeout(startTyping, 2200); return; }
  } else {
    el.textContent = current.substring(0, chIdx--);
    if (chIdx < 0) { deleting = false; pIdx = (pIdx + 1) % phrases.length; chIdx = 0; setTimeout(startTyping, 350); return; }
  }
  setTimeout(startTyping, deleting ? 25 : 50);
}

// ==================== CTA → SCROLL ====================
const ctaBtn = document.getElementById('ctaBtn');
if (ctaBtn) {
  ctaBtn.addEventListener('click', () => scrollToEl(document.getElementById('scannerSection')));
}

// ==================== SCAN FORM ====================
const scanForm = document.getElementById('scanForm');
const msgInput = document.getElementById('msgInput');
const scanBtn = document.getElementById('scanBtn');
const scanLog = document.getElementById('scanLog');
const gaugeBar = document.getElementById('gaugeBar');
const gaugeLbl = document.getElementById('gaugeLbl');
const gaugeNum = document.getElementById('gaugeNum');

const scanSteps = [
  'Tokenizing input message...',
  'Running ML inference (TF-IDF + Logistic Regression)...',
  'Computing class probability...',
  'Extracting top contributing terms...',
  'Generating safety response (LLM)...',
  'Finalizing report...',
];

let isScanning = false;

function nowTimeStr() {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function addUserBubble(text) {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return;
  const bub = document.createElement('div');
  bub.className = 'wa-bubble outgoing';
  bub.innerHTML = `<p>${escapeHtml(text)}</p><span class="wa-time">${nowTimeStr()} ✓✓</span>`;
  chatBody.appendChild(bub);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function addBotBubble(text) {
  const chatBody = document.getElementById('chatBody');
  if (!chatBody) return;
  const bub = document.createElement('div');
  bub.className = 'wa-bubble incoming';
  bub.innerHTML = `<p>${text}</p><span class="wa-time">Coder Darji · ${nowTimeStr()}</span>`;
  chatBody.appendChild(bub);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function setScanningUI(on) {
  if (!gaugeBar || !gaugeLbl || !gaugeNum) return;
  if (on) {
    gaugeBar.classList.add('scanning');
    gaugeLbl.textContent = 'SCANNING';
    gaugeLbl.classList.add('scanning-text');
    gaugeNum.textContent = '—';
  } else {
    gaugeBar.classList.remove('scanning');
    gaugeLbl.classList.remove('scanning-text');
  }
}

async function playScanLog() {
  if (!scanLog) return;
  scanLog.innerHTML = '';
  for (let i = 0; i < scanSteps.length; i++) {
    const line = document.createElement('p');
    line.className = 'scan-log-line';
    line.textContent = scanSteps[i];
    line.style.animationDelay = `${i * 0.05}s`;
    scanLog.appendChild(line);
    await sleep(220 + Math.random() * 140);
  }
}

async function fetchAnalysis(message, extra) {
  const res = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, ...extra })
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`API error ${res.status}: ${txt}`);
  }
  return await res.json();
}

function applyGauge(probability, status, risk_level) {
  if (!gaugeBar || !gaugeLbl || !gaugeNum) return;
  const p = Number(probability || 0);
  const circumference = 2 * Math.PI * 85;
  gaugeBar.style.strokeDashoffset = circumference - (p / 100) * circumference;
  const isUncertain = (status === 'Needs More Context' || risk_level === 'Uncertain');
  const isScam = (status === 'SCAM' || status === 'Likely Scam' || status === 'Suspicious');
  gaugeLbl.textContent = isUncertain ? 'UNCERTAIN' : (isScam ? 'THREAT' : 'SAFE');
  gaugeLbl.style.color = isUncertain ? 'var(--yellow)' : (isScam ? 'var(--red)' : 'var(--neon)');
  animateNumber(gaugeNum, p, 900);
}

function finalizeLog(status, probability, risk_level) {
  if (!scanLog) return;
  const isUncertain = (status === 'Needs More Context' || risk_level === 'Uncertain');
  const isScam = (status === 'SCAM' || status === 'Likely Scam' || status === 'Suspicious');
  const doneLine = document.createElement('p');
  doneLine.className = 'scan-log-line';
  doneLine.style.color = isUncertain ? 'var(--yellow)' : (isScam ? 'var(--red)' : 'var(--neon)');
  doneLine.textContent = isUncertain
    ? `⚠ UNCERTAIN — Risk ${probability}%`
    : (isScam ? `🚨 ${status} — Risk ${probability}%` : `✓ ${status} — Risk ${probability}%`);
  scanLog.appendChild(doneLine);
}

async function startScanAjax() {
  if (isScanning) return;
  const text = (msgInput?.value || '').trim();
  if (!text) {
    if (msgInput) {
      msgInput.style.boxShadow = '0 0 0 2px var(--red)';
      setTimeout(() => msgInput.style.boxShadow = '', 800);
    }
    return;
  }

  isScanning = true;
  if (scanBtn) scanBtn.disabled = true;

  addUserBubble(text);
  if (msgInput) { msgInput.value = ''; msgInput.style.height = 'auto'; }

  setScanningUI(true);

  try {
    const [apiResult] = await Promise.all([fetchAnalysis(text), playScanLog()]);

    liveStats.scans++;
    const isScam = (apiResult.status === 'SCAM' || apiResult.status === 'Likely Scam' || apiResult.status === 'Suspicious');
    if (isScam) liveStats.threats++;
    updateStats();

    setScanningUI(false);
    applyGauge(apiResult.probability, apiResult.status, apiResult.risk_level);
    finalizeLog(apiResult.status, apiResult.probability, apiResult.risk_level);

    const emoji = (apiResult.status === 'Needs More Context') ? '⚠️' : (isScam ? '🚨' : '✅');
    addBotBubble(`${emoji} Analysis complete. Risk: <strong>${apiResult.probability}%</strong> — <strong>${escapeHtml(apiResult.status || '—')}</strong>. Redirecting to report...`);

    showVerdictFromBackend(apiResult);
    showReportFromBackend(apiResult);
    showFollowupFromBackend(apiResult);

    document.getElementById('reportSection')?.classList.add('reveal');
    document.getElementById('siteFooter')?.classList.add('reveal');

    setTimeout(() => scrollToEl(document.getElementById('reportSection')), 2500);

  } catch (err) {
    setScanningUI(false);
    addBotBubble(`❌ Error analyzing message. Try again.`);
    console.error(err);
  } finally {
    isScanning = false;
    if (scanBtn) scanBtn.disabled = false;
  }
}

if (scanBtn) scanBtn.addEventListener('click', startScanAjax);
if (msgInput) {
  msgInput.addEventListener('keydown', e => { if (e.ctrlKey && e.key === 'Enter') startScanAjax(); });
  msgInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 90) + 'px';
  });
}

// ==================== RENDER SERVER RESULT ====================
function renderBackendResult() {
  const R = window.SERVER_RESULT;
  if (!R || !R.hasResult) return;

  liveStats.scans++;
  if (R.probability >= 65) liveStats.threats++;
  updateStats();

  if (gaugeBar && gaugeLbl && gaugeNum) {
    gaugeBar.classList.remove('scanning');
    const circumference = 2 * Math.PI * 85;
    gaugeBar.style.strokeDashoffset = circumference - (R.probability / 100) * circumference;
    const isScam = (R.status === 'SCAM' || R.status === 'Likely Scam' || R.status === 'Suspicious');
    gaugeLbl.classList.remove('scanning-text');
    gaugeLbl.textContent = isScam ? 'THREAT' : (R.status === 'Needs More Context' ? 'UNCERTAIN' : 'SAFE');
    gaugeLbl.style.color = isScam ? 'var(--red)' : 'var(--neon)';
    animateNumber(gaugeNum, R.probability, 900);
  }

  if (scanLog) {
    const doneLine = document.createElement('p');
    doneLine.className = 'scan-log-line';
    const isScam = (R.status === 'SCAM' || R.status === 'Likely Scam' || R.status === 'Suspicious');
    doneLine.style.color = isScam ? 'var(--red)' : 'var(--neon)';
    doneLine.textContent = isScam ? `⚠ ${R.status} — Risk ${R.probability}%` : `✓ ${R.status} — Risk ${R.probability}%`;
    scanLog.appendChild(doneLine);
  }

  showVerdictFromBackend(R);
  showReportFromBackend(R);
  showFollowupFromBackend(R);

  document.getElementById('reportSection')?.classList.add('reveal');
  document.getElementById('siteFooter')?.classList.add('reveal');
  scrollToEl(document.getElementById('reportSection'));
}

// ==================== VERDICT ====================
function showVerdictFromBackend(R) {
  const box = document.getElementById('verdictBox');
  if (!box) return;

  const isScam = (R.status === 'SCAM' || R.status === 'Likely Scam' || R.status === 'Suspicious');
  const isUncertain = (R.status === 'Needs More Context' || R.risk_level === 'Uncertain');

  const stamp = document.getElementById('verdictStamp');
  stamp.textContent = isUncertain ? 'UNCERTAIN' : (isScam ? 'THREAT' : 'SAFE');
  stamp.className = 'verdict-stamp' + (isScam ? ' danger' : '');

  const scoreBar = document.getElementById('scoreBar');
  const circ = 2 * Math.PI * 60;
  scoreBar.style.stroke = isScam ? 'var(--red)' : 'var(--neon)';
  scoreBar.style.transition = 'none';
  scoreBar.style.strokeDashoffset = circ;
  requestAnimationFrame(() => {
    scoreBar.style.transition = 'stroke-dashoffset 1.5s cubic-bezier(.4,0,.2,1)';
    scoreBar.style.strokeDashoffset = circ - (R.probability / 100) * circ;
  });
  animateNumber(document.getElementById('scoreVal'), R.probability, 1200);

  const title = document.getElementById('verdictTitle');
  const desc = document.getElementById('verdictDesc');

  if (isUncertain) {
    title.textContent = 'UNCERTAIN — NEEDS CONTEXT';
    title.style.color = 'var(--yellow)';
    desc.textContent = 'Answer the follow-up questions to refine the probability.';
  } else if (isScam) {
    title.textContent = 'HIGH RISK — LIKELY SCAM';
    title.style.color = 'var(--red)';
    desc.textContent = 'This message matches patterns strongly associated with scam techniques.';
  } else {
    title.textContent = 'LOW RISK — APPEARS SAFE';
    title.style.color = 'var(--neon)';
    desc.textContent = 'No strong scam intent detected, but always remain cautious.';
  }

  box.classList.add('reveal');
}

// ==================== FOLLOWUP PANEL ====================
function showFollowupFromBackend(R) {
  const container = document.getElementById('followupPanel');
  if (!container) return;

  if (!R.is_uncertain) {
    container.style.display = 'none';
    return;
  }

  container.style.display = 'block';
  const questions = R.followup_questions || [];

  container.innerHTML = `
    <div class="followup-header">
      <span class="followup-icon">⚠</span>
      <span class="followup-title">WE'RE NOT SURE — HELP US DECIDE</span>
    </div>
    <p class="followup-sub">
      ML model is uncertain (${R.probability}%). Answer these quick questions to refine the result:
    </p>
    <div id="followupQuestions" class="followup-questions"></div>
    <button class="cta-btn" id="followupRefineBtn" style="margin-top:1.2rem;">
      <span>REFINE ANALYSIS</span>
      <svg class="arrow-icon" viewBox="0 0 24 24">
        <path d="M12 5v14M5 12l7 7 7-7" />
      </svg>
    </button>
  `;

  const qWrap = document.getElementById('followupQuestions');
  questions.forEach((q, i) => {
    const row = document.createElement('div');
    row.className = 'followup-q-row';
    row.style.animationDelay = `${i * 0.08}s`;
    row.innerHTML = `
      <div class="followup-q-text">${i + 1}. ${escapeHtml(q.text)}</div>
      <div class="followup-q-options">
        <label class="followup-radio-label">
          <input type="radio" name="${q.id}" value="yes">
          <span class="followup-radio-custom"></span>
          <span>Yes</span>
        </label>
        <label class="followup-radio-label">
          <input type="radio" name="${q.id}" value="no">
          <span class="followup-radio-custom"></span>
          <span>No</span>
        </label>
      </div>
    `;
    qWrap.appendChild(row);
  });

  document.getElementById('followupRefineBtn')?.addEventListener('click', async () => {
    const answers = {};
    questions.forEach(q => {
      const checked = container.querySelector(`input[name="${q.id}"]:checked`);
      if (checked) answers[q.id] = checked.value;
    });

    const btn = document.getElementById('followupRefineBtn');
    if (btn) { btn.disabled = true; btn.querySelector('span').textContent = 'ANALYZING...'; }

    try {
      const refined = await fetchAnalysis(R.message, {
        followup_answers: answers,
        followup_submitted: true
      });
      applyGauge(refined.probability, refined.status, refined.risk_level);
      finalizeLog(refined.status, refined.probability, refined.risk_level);
      showVerdictFromBackend(refined);
      showReportFromBackend(refined);
      container.style.display = 'none';
      scrollToEl(document.getElementById('reportSection'));
    } catch (e) {
      console.error(e);
      if (btn) { btn.disabled = false; btn.querySelector('span').textContent = 'REFINE ANALYSIS'; }
    }
  });
}

// ==================== MAIN REPORT ====================
function showReportFromBackend(R) {
  const isScam = (R.status === 'SCAM' || R.status === 'Likely Scam' || R.status === 'Suspicious');

  // Top metric cards
  const scamType = document.getElementById('rScamType');
  const conf = document.getElementById('rConfidence');
  const sev = document.getElementById('rSeverity');
  if (scamType) scamType.textContent = R.scam_type || '—';
  if (conf) conf.textContent = `${R.probability}%`;
  if (sev) {
    const p = R.probability;
    sev.textContent = (p >= 80) ? 'Very High' : (p >= 65) ? 'High' : (p >= 35) ? 'Medium' : 'Low';
    sev.style.color = (p >= 80) ? 'var(--red)' : (p >= 65) ? 'var(--yellow)' : 'var(--neon)';
  }

  const hl = Array.isArray(R.highlights) ? R.highlights : [];

  // ── Chips (keyword badges) ──
  const chips = document.getElementById('flaggedChips');
  if (chips) {
    chips.innerHTML = '';
    if (!hl.length) {
      chips.innerHTML = '<span style="color:var(--txt2);font-size:.82rem;">No suspicious keywords detected</span>';
    } else {
      hl.forEach((item, i) => {
        const c = document.createElement('span');
        c.className = 'chip';
        c.style.animationDelay = `${i * .07}s`;
        c.textContent = String(item[0]).toUpperCase();
        chips.appendChild(c);
      });
    }
  }

  // ── WHY THIS MESSAGE WAS FLAGGED ── always visible ──
  const whySection = document.getElementById('whyFlaggedSection');
  const whyList = document.getElementById('whyFlaggedList');
  if (whySection && whyList) {
    whySection.style.display = 'block';
    whyList.innerHTML = '';
    if (!hl.length) {
      whyList.innerHTML = `
        <div style="
          display:flex;align-items:center;gap:.6rem;
          padding:.65rem .9rem;
          background:rgba(0,255,159,.03);
          border:1px solid rgba(0,255,159,.1);
          border-radius:8px;
          font-family:var(--font-mono);
          font-size:.78rem;
          color:var(--neon);
        ">
          <span style="opacity:.6;">✓</span>
          <span>No statistically significant trigger words detected in this message.</span>
        </div>`;
    } else {
      hl.forEach((item, i) => {
        const [word, score, reason] = item;
        const row = document.createElement('div');
        row.className = 'flag-row';
        row.style.animationDelay = `${i * 0.07}s`;
        row.innerHTML = `
          <div class="flag-row-top">
            <span class="flag-word">${escapeHtml(String(word).toUpperCase())}</span>
            <span class="flag-impact">(impact&nbsp;${Number(score).toFixed(3)})</span>
          </div>
          <div class="flag-reason">— ${escapeHtml(reason || 'Flagged by model')}</div>
        `;
        whyList.appendChild(row);
      });
    }
  }

  // ── Analyzed message preview ──
  const preview = document.getElementById('previewBubble');
  if (preview) {
    let html = escapeHtml(R.message || '');
    [...new Set(hl.map(x => x[0]))].sort((a, b) => String(b).length - String(a).length).forEach(w => {
      html = html.replace(new RegExp(`(${escapeRegex(String(w))})`, 'gi'), '<span class="highlight">$1</span>');
    });
    preview.innerHTML = html || '—';
  }

  // ── Safety Recommendations ──
  const tipsList = document.getElementById('tipsList');
  if (tipsList) {
    tipsList.innerHTML = '';
    const sections = [
      { icon: '🎯', label: 'What This Scam Wants', text: R.scam_goal,    color: isScam ? 'var(--red)' : 'var(--neon)' },
      { icon: '⚡', label: 'What To Do',           text: R.what_to_do,   color: 'var(--yellow)' },
      { icon: '🛡️', label: 'How To Avoid',         text: R.how_to_avoid, color: 'var(--neon)' },
    ];
    sections.forEach((s, i) => {
      if (!s.text) return;
      const div = document.createElement('div');
      div.className = 'tip-item tip-item--detailed';
      div.style.cssText = `animation-delay:${i * 0.1}s; border-left-color:${s.color};`;
      div.innerHTML = `
        <div class="tip-label" style="color:${s.color}">
          <span>${s.icon}</span><span>${escapeHtml(s.label)}</span>
        </div>
        <div class="tip-body">${escapeHtml(s.text)}</div>
      `;
      tipsList.appendChild(div);
    });
    if (!tipsList.children.length) {
      tipsList.innerHTML = `<div class="tip-item"><span>🛡️</span><span>No tips available.</span></div>`;
    }
  }
}