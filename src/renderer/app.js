const zhCN = {
  appTitle: 'AI 额度监控',
  fiveHour: '5 小时',
  weekly: '本周',
  refresh: '刷新',
  settings: '设置',
  opacity: '透明度',
  threshold: '告警阈值',
  save: '保存凭据',
  delete: '清除凭据',
  configured: '已配置',
  notConfigured: '未配置',
  stale: '数据已过期',
  authError: '鉴权失败',
  rateLimited: '已限流',
  unavailable: '暂不可用',
  unknown: '未知状态',
  ok: '正常',
  platforms: { chatgpt: 'ChatGPT', grok: 'Grok', gemini: 'Gemini' },
  emptyHint: '请先在设置中配置凭据，或使用演示数据模式。',
};

function statusText(s) {
  const map = {
    ok: zhCN.ok,
    stale: zhCN.stale,
    auth_error: zhCN.authError,
    rate_limited: zhCN.rateLimited,
    unavailable: zhCN.unavailable,
    unknown: zhCN.unknown,
  };
  return map[s] || s;
}

function clampRatio(ratio) {
  if (Number.isNaN(ratio)) return 0;
  return Math.min(1, Math.max(0, ratio));
}

function remainingRatioToCss(remainingRatio) {
  const remaining = clampRatio(remainingRatio);
  const spent = 1 - remaining;
  const lerp = (a, b, t) => a + (b - a) * t;
  const r = Math.round(lerp(0x25, 0xdc, spent));
  const g = Math.round(lerp(0x63, 0x26, spent));
  const b = Math.round(lerp(0xeb, 0x26, spent));
  return `rgb(${r}, ${g}, ${b})`;
}

function ringSvg(ratio, label) {
  const color = remainingRatioToCss(ratio);
  const r = 42;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - clampRatio(ratio));
  const pct = `${Math.round(clampRatio(ratio) * 100)}%`;
  return `
    <div class="ring-wrap">
      <svg width="110" height="110" viewBox="0 0 110 110" aria-label="${label}">
        <circle cx="55" cy="55" r="${r}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="10" />
        <circle cx="55" cy="55" r="${r}" fill="none" stroke="${color}" stroke-width="10"
          stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${offset}"
          transform="rotate(-90 55 55)" />
        <text x="55" y="58" text-anchor="middle" fill="${color}" font-size="18" font-weight="600">${pct}</text>
      </svg>
      <div class="ring-label">${label}</div>
    </div>`;
}

function renderSnapshots(snaps) {
  const root = document.getElementById('platforms');
  if (!snaps || !snaps.length) {
    root.innerHTML = `<p class="hint">${zhCN.emptyHint}</p>`;
    return;
  }
  root.innerHTML = snaps
    .map((s) => {
      const name = zhCN.platforms[s.platformId] || s.platformId;
      const cls = s.status === 'ok' ? '' : s.status === 'stale' ? 'stale' : 'bad';
      const err = s.errorMessage ? ` · ${s.errorMessage}` : '';
      const when = s.fetchedAt ? new Date(s.fetchedAt).toLocaleString('zh-CN') : '';
      return `<section class="platform" data-id="${s.platformId}">
        <h2>${name}</h2>
        ${ringSvg(s.windows.fiveHour.remainingRatio, zhCN.fiveHour)}
        ${ringSvg(s.windows.weekly.remainingRatio, zhCN.weekly)}
        <div class="status ${cls}">${statusText(s.status)}${err}<br/><span class="hint">${when}</span></div>
      </section>`;
    })
    .join('');
}

async function boot() {
  document.getElementById('title').textContent = zhCN.appTitle;
  document.getElementById('btn-refresh').textContent = zhCN.refresh;
  document.getElementById('btn-settings').textContent = zhCN.settings;

  const api = window.aqdm;
  if (!api) {
    document.getElementById('platforms').innerHTML =
      '<p class="hint">预加载桥未就绪（请通过 Electron 启动）。</p>';
    return;
  }

  const prefs = await api.getPrefs();
  document.getElementById('opacity').value = String(prefs.opacity ?? 0.92);
  document.getElementById('threshold').value = String(await api.getThreshold());
  document.getElementById('mode').value = await api.getMode();

  const refreshCredBadges = async () => {
    for (const id of ['chatgpt', 'grok', 'gemini']) {
      const el = document.querySelector(`[data-cred="${id}"]`);
      if (!el) continue;
      el.textContent = (await api.secretsHas(id)) ? zhCN.configured : zhCN.notConfigured;
    }
  };

  api.onSnapshots(renderSnapshots);
  renderSnapshots(await api.getSnapshots());
  await refreshCredBadges();

  document.getElementById('btn-refresh').onclick = async () => {
    renderSnapshots(await api.refreshAll());
  };
  document.getElementById('btn-settings').onclick = () => {
    document.getElementById('settings').classList.toggle('open');
  };
  document.getElementById('opacity').onchange = async (e) => {
    await api.setOpacity(Number(e.target.value));
  };
  document.getElementById('threshold').onchange = async (e) => {
    await api.setThreshold(Number(e.target.value));
  };
  document.getElementById('mode').onchange = async (e) => {
    await api.setMode(e.target.value);
    renderSnapshots(await api.refreshAll());
  };
  document.getElementById('btn-save').onclick = async () => {
    const platformId = document.getElementById('plat').value;
    const kind = document.getElementById('kind').value;
    const secret = document.getElementById('secret').value;
    if (!secret) return;
    await api.secretsSet(platformId, kind, secret);
    document.getElementById('secret').value = '';
    await refreshCredBadges();
  };
  document.getElementById('btn-del').onclick = async () => {
    const platformId = document.getElementById('plat').value;
    await api.secretsDelete(platformId);
    await refreshCredBadges();
  };
}

boot();
