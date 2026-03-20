// ── Navbar scroll ──
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 20);
});

// ── Scroll reveal ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

// ── Generator logic ──
let tone = 'professional';
let busy = false;

function setTone(el, t) {
  document.querySelectorAll('.tone-pill').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  tone = t;
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 120) + 'px';
}

function handleKey(e) {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generate(); }
}

function esc(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

async function copyLine(btn, text) {
  try {
    await navigator.clipboard.writeText(text);
    btn.textContent = '✓ Copied';
    btn.classList.add('ok');
    setTimeout(() => { btn.textContent = 'Copy'; btn.classList.remove('ok'); }, 2000);
  } catch { btn.textContent = 'Failed'; setTimeout(() => btn.textContent = 'Copy', 1500); }
}

function showTyping() {
  const res = document.getElementById('genResults');
  const list = document.getElementById('resultList');
  res.classList.add('visible');
  list.innerHTML = `<div class="typing-row"><div class="t-dot"></div><div class="t-dot"></div><div class="t-dot"></div></div>`;
}

function showResults(subjects) {
  const list = document.getElementById('resultList');
  const toneMap = { professional:'Professional',catchy:'Catchy & Creative',urgent:'Urgency-Driven',friendly:'Warm & Friendly',curious:'Curiosity Hook' };
  list.innerHTML = subjects.map((item, i) => `
    <div class="result-item">
      <div class="result-num">${i+1}</div>
      <div class="result-text">
        <div class="result-line">${esc(item.line)}</div>
        ${item.why ? `<div class="result-why">${esc(item.why)}</div>` : ''}
      </div>
      <button class="copy-btn" onclick="copyLine(this,'${esc(item.line).replace(/'/g,"\\'")}')">Copy</button>
    </div>`).join('');
}

function showError(msg) {
  const list = document.getElementById('resultList');
  list.innerHTML = `<div style="padding:12px 4px;font-size:14px;color:#ef4444">${esc(msg)}</div>`;
}

async function generate() {
  if (busy) return;
  const input = document.getElementById('genInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  busy = true;
  const btn = document.getElementById('genBtn');
  btn.disabled = true;
  btn.innerHTML = `<div class="t-dot" style="background:white"></div><div class="t-dot" style="background:white;animation-delay:.15s"></div><div class="t-dot" style="background:white;animation-delay:.3s"></div>`;

  showTyping();

  const system = `You are SubjectAI, an expert email marketing copywriter. Generate exactly 5 email subject lines.
Tone requested: ${tone}
- professional: formal, clear, business-appropriate
- catchy: creative, memorable, wordplay
- urgent: FOMO, time-sensitive language
- friendly: warm, conversational
- curious: open loops, mystery, intrigue

Respond ONLY with valid JSON — no markdown, no backticks:
{"subjects":[{"line":"...","why":"..."},{"line":"...","why":"..."},{"line":"...","why":"..."},{"line":"...","why":"..."},{"line":"...","why":"..."}]}`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system,
        messages: [{ role: 'user', content: `Email: ${text}` }]
      })
    });
    const data = await res.json();
    const raw = (data.content?.[0]?.text || '').replace(/```json|```/g,'').trim();
    let parsed;
    try { parsed = JSON.parse(raw); } catch { parsed = null; }

    if (parsed?.subjects?.length) showResults(parsed.subjects);
    else showError('Unexpected response. Please try again.');
  } catch {
    showError('Connection error. Please check your network and try again.');
  } finally {
    busy = false;
    btn.disabled = false;
    btn.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate`;
  }
}

async function generate() {
  if (busy) return;
  const input = document.getElementById('genInput');
  const text = input.value.trim();
  if (!text) { input.focus(); return; }

  busy = true;
  const btn = document.getElementById('genBtn');
  btn.disabled = true;
  btn.innerHTML = `<div class="t-dot" style="background:white"></div><div class="t-dot" style="background:white;animation-delay:.15s"></div><div class="t-dot" style="background:white;animation-delay:.3s"></div>`;

  showTyping();

  try {
    // ✅ Ab Anthropic ko directly nahi, apne backend ko call karenge
    const res = await fetch('http://localhost:3000/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailText: text, tone: tone })
    });

    const data = await res.json();

    if (data.subjects?.length) {
      showResults(data.subjects);
    } else {
      showError(data.error || 'Unexpected response. Please try again.');
    }

  } catch {
    showError('Connection error. Backend chal raha hai? Check karo.');
  } finally {
    busy = false;
    btn.disabled = false;
    btn.innerHTML = `<svg fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24" width="15" height="15"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Generate`;
  }
}

// Quick suggestion on page load for demo feel
window.addEventListener('DOMContentLoaded', () => {
  const examples = [
    "Weekly newsletter with 5 productivity tips for remote workers",
    "Black Friday sale — 40% off all plans for 48 hours only",
    "Follow-up email after a job interview at a startup",
    "Cold outreach to introduce a new B2B SaaS analytics tool",
    "Monthly product update email for existing customers",
  ];
  const input = document.getElementById('genInput');
  const placeholder = examples[Math.floor(Math.random() * examples.length)];
  input.placeholder = `e.g. "${placeholder}"`;
});