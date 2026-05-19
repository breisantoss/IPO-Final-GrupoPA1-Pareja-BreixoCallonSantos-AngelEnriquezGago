/**
 * ============================================================
 *  NATIVO — script.js
 *  Prototipo funcional con cuenta local, perfil, historial,
 *  donaciones persistentes y logros.
 * ============================================================
 */

'use strict';

const STORAGE_KEY = 'nativo.users.v2';
const SESSION_KEY = 'nativo.currentUser.v2';
const RING_RADIUS = 90;
const RING_CIRCUMF = 2 * Math.PI * RING_RADIUS;

const defaultProjects = [
  { id: 1, name: 'Huerto Comunitario', desc: 'Transformamos un solar abandonado en fuente de alimentos frescos para 80 familias del barrio.', icon: '🥬', color: '#3D9A6F', bgColor: 'rgba(61,154,111,0.1)', goal: 500, funded: 320, tag: 'Alimentación', tagColor: '#3D9A6F' },
  { id: 2, name: 'Biblioteca Verde', desc: 'Un espacio de aprendizaje sostenible con energía solar para todos los niños del municipio.', icon: '📚', color: '#4A9FD4', bgColor: 'rgba(74,159,212,0.1)', goal: 300, funded: 185, tag: 'Educación', tagColor: '#4A9FD4' },
  { id: 3, name: 'Parque Solar Comunitario', desc: 'Instalamos paneles solares en el parque para reducir la huella de carbono del vecindario.', icon: '☀️', color: '#E8A020', bgColor: 'rgba(232,160,32,0.1)', goal: 800, funded: 560, tag: 'Energía', tagColor: '#E8A020' },
  { id: 4, name: 'Agua Limpia Rural', desc: 'Sistema de filtración de agua para tres comunidades rurales sin acceso a agua potable.', icon: '💧', color: '#8B6DB5', bgColor: 'rgba(139,109,181,0.1)', goal: 400, funded: 210, tag: 'Agua', tagColor: '#8B6DB5' },
];

const achievementCatalog = [
  { id: 'first_steps', icon: '👣', title: 'Primer paseo', desc: 'Añade tus primeros pasos.' },
  { id: 'steps_2500', icon: '🌿', title: 'Semilla activa', desc: 'Llega a 2.500 pasos en un día.' },
  { id: 'steps_5000', icon: '⚡', title: 'Media meta', desc: 'Llega a 5.000 pasos en un día.' },
  { id: 'steps_10000', icon: '🏆', title: 'Objetivo diario', desc: 'Completa 10.000 pasos en un día.' },
  { id: 'first_donation', icon: '💚', title: 'Primer impacto', desc: 'Realiza tu primera donación.' },
  { id: 'donated_100', icon: '🌍', title: 'Impacto global', desc: 'Dona 100 créditos en total.' },
  { id: 'three_days', icon: '🔥', title: 'Constancia', desc: 'Registra actividad durante 3 días.' },
  { id: 'project_completed', icon: '🎉', title: 'Proyecto completado', desc: 'Ayuda a completar un proyecto.' },
];

const state = {
  user: null,
  users: {},
  todayKey: todayKey(),
  steps: 0,
  stepsGoal: 10000,
  stepsToday: 0,
  STEPS_PER_CREDIT: 100,
  credits: 50,
  creditsEarnedToday: 0,
  creditsTotal: 50,
  creditsDonated: 0,
  streak: 0,
  modal: { open: false, projectId: null, selectedAmount: 0 },
  donationHistory: [],
  dailyHistory: {},
  achievements: {},
  activeTab: 'home',
  achievementShown: false,
  projects: structuredCloneSafe(defaultProjects),
};

const DOM = {
  authScreen: () => document.getElementById('auth-screen'),
  authForm: () => document.getElementById('auth-form'),
  authName: () => document.getElementById('auth-name'),
  authEmail: () => document.getElementById('auth-email'),
  authPassword: () => document.getElementById('auth-password'),
  authSubmit: () => document.getElementById('auth-submit'),
  loginTab: () => document.getElementById('login-tab'),
  registerTab: () => document.getElementById('register-tab'),
  nameField: () => document.getElementById('name-field'),
  greetingName: () => document.getElementById('greeting-name'),
  headerAvatar: () => document.getElementById('header-avatar'),
  ringFill: () => document.getElementById('ring-fill'),
  ringDot: () => document.getElementById('ring-dot'),
  ringSteps: () => document.getElementById('ring-steps'),
  ringPercent: () => document.getElementById('ring-percent'),
  energyVal: () => document.getElementById('energy-val'),
  energyProg: () => document.getElementById('energy-progress'),
  creditsDisp: () => document.getElementById('credits-display'),
  creditsToday: () => document.getElementById('credits-today'),
  cstatTotal: () => document.getElementById('cstat-total'),
  cstatDon: () => document.getElementById('cstat-donated'),
  cstatSteps: () => document.getElementById('cstat-steps-today'),
  streakCount: () => document.getElementById('streak-count'),
  creditsProjDisp: () => document.getElementById('credits-projects-disp'),
  achBanner: () => document.getElementById('achievement-banner'),
  projectsList: () => document.getElementById('projects-list'),
  impSteps: () => document.getElementById('imp-steps'),
  impEnergy: () => document.getElementById('imp-energy'),
  impDonated: () => document.getElementById('imp-donated'),
  impCO2: () => document.getElementById('imp-co2'),
  timelineEmpty: () => document.getElementById('timeline-empty'),
  timelineList: () => document.getElementById('timeline-list'),
  modalBackdrop: () => document.getElementById('modal-backdrop'),
  modalTitle: () => document.getElementById('modal-title'),
  modalDesc: () => document.getElementById('modal-desc'),
  modalIcon: () => document.getElementById('modal-icon'),
  modalProgText: () => document.getElementById('modal-progress-text'),
  modalProgFill: () => document.getElementById('modal-progress-fill'),
  modalCredAvail: () => document.getElementById('modal-credits-avail'),
  dpAmount: () => document.getElementById('dp-amount'),
  dpRemaining: () => document.getElementById('dp-remaining'),
  btnDonate: () => document.getElementById('btn-donate'),
  customInput: () => document.getElementById('custom-input'),
  toastContainer: () => document.getElementById('toast-container'),
  navBtns: () => document.querySelectorAll('.nav-btn'),
  tabScreens: () => document.querySelectorAll('.tab-screen'),
  profileAvatar: () => document.getElementById('profile-avatar'),
  profileName: () => document.getElementById('profile-name'),
  profileEmail: () => document.getElementById('profile-email'),
  profileLevel: () => document.getElementById('profile-level'),
  profileDays: () => document.getElementById('profile-days'),
  profileBest: () => document.getElementById('profile-best'),
  profileStreak: () => document.getElementById('profile-streak'),
  profileAchievements: () => document.getElementById('profile-achievements'),
  dailyHistoryList: () => document.getElementById('daily-history-list'),
  achievementsGrid: () => document.getElementById('achievements-grid'),
  donationSummaryList: () => document.getElementById('donation-summary-list'),
};

let authMode = 'login';

function setAuthMode(mode) {
  authMode = mode;
  DOM.loginTab().classList.toggle('active', mode === 'login');
  DOM.registerTab().classList.toggle('active', mode === 'register');
  DOM.nameField().style.display = mode === 'register' ? 'flex' : 'none';
  DOM.authSubmit().textContent = mode === 'register' ? 'Crear cuenta' : 'Entrar';
  DOM.authPassword().setAttribute('autocomplete', mode === 'register' ? 'new-password' : 'current-password');
}

function loadUsers() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
  catch { return {}; }
}

function saveUsers() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.users));
}

function saveCurrentUser() {
  if (!state.user) return;
  syncTodayEntry();
  const email = state.user.email;
  state.users[email] = {
    ...state.user,
    steps: state.steps,
    stepsGoal: state.stepsGoal,
    stepsToday: state.stepsToday,
    credits: state.credits,
    creditsEarnedToday: state.creditsEarnedToday,
    creditsTotal: state.creditsTotal,
    creditsDonated: state.creditsDonated,
    streak: state.streak,
    donationHistory: state.donationHistory,
    dailyHistory: state.dailyHistory,
    achievements: state.achievements,
    projects: state.projects,
    todayKey: state.todayKey,
    achievementShown: state.achievementShown,
  };
  saveUsers();
  localStorage.setItem(SESSION_KEY, email);
}

function createUser({ name, email, password }) {
  const cleanEmail = email.trim().toLowerCase();
  return {
    name: name.trim() || cleanEmail.split('@')[0],
    email: cleanEmail,
    password,
    createdAt: new Date().toISOString(),
    steps: 0,
    stepsGoal: 10000,
    stepsToday: 0,
    credits: 50,
    creditsEarnedToday: 0,
    creditsTotal: 50,
    creditsDonated: 0,
    streak: 0,
    donationHistory: [],
    dailyHistory: {},
    achievements: {},
    projects: structuredCloneSafe(defaultProjects),
    todayKey: todayKey(),
    achievementShown: false,
  };
}

function loginUser(user) {
  state.user = user;
  state.todayKey = user.todayKey || todayKey();
  state.steps = user.steps || 0;
  state.stepsGoal = user.stepsGoal || 10000;
  state.stepsToday = user.stepsToday || 0;
  state.credits = Number.isFinite(user.credits) ? user.credits : 50;
  state.creditsEarnedToday = user.creditsEarnedToday || 0;
  state.creditsTotal = Number.isFinite(user.creditsTotal) ? user.creditsTotal : 50;
  state.creditsDonated = user.creditsDonated || 0;
  state.streak = user.streak || 0;
  state.donationHistory = user.donationHistory || [];
  state.dailyHistory = user.dailyHistory || {};
  state.achievements = user.achievements || {};
  state.projects = user.projects || structuredCloneSafe(defaultProjects);
  state.achievementShown = !!user.achievementShown;
  checkDayRollover();
  DOM.authScreen().classList.add('hidden');
  renderAll();
  showToast(`Hola, ${state.user.name} 👋`, 'success');
  saveCurrentUser();
}

function handleAuthSubmit(e) {
  e.preventDefault();
  const name = DOM.authName().value;
  const email = DOM.authEmail().value.trim().toLowerCase();
  const password = DOM.authPassword().value;
  if (!email || !password || password.length < 4) { showToast('La contraseña debe tener al menos 4 caracteres.', 'error'); return; }
  state.users = loadUsers();
  if (authMode === 'register') {
    if (state.users[email]) { showToast('Ya existe una cuenta con ese email.', 'error'); return; }
    const user = createUser({ name, email, password });
    state.users[email] = user;
    saveUsers();
    loginUser(user);
  } else {
    const user = state.users[email];
    if (!user || user.password !== password) { showToast('Email o contraseña incorrectos.', 'error'); return; }
    loginUser(user);
  }
}

function quickDemoLogin() {
  state.users = loadUsers();
  const email = 'demo@nativo.app';
  if (!state.users[email]) state.users[email] = createUser({ name: 'Ana', email, password: 'demo' });
  saveUsers();
  loginUser(state.users[email]);
}

function logout() {
  saveCurrentUser();
  localStorage.removeItem(SESSION_KEY);
  state.user = null;
  DOM.authScreen().classList.remove('hidden');
  setTab('home');
  showToast('Sesión cerrada. Tus datos quedan guardados.', 'info');
}

function checkDayRollover() {
  const current = todayKey();
  if (state.todayKey === current) return;
  syncTodayEntry();
  state.todayKey = current;
  state.stepsToday = 0;
  state.creditsEarnedToday = 0;
  state.achievementShown = false;
}

function syncTodayEntry() {
  if (!state.todayKey) state.todayKey = todayKey();
  const existing = state.dailyHistory[state.todayKey] || { date: state.todayKey, steps: 0, creditsEarned: 0, creditsDonated: 0 };
  state.dailyHistory[state.todayKey] = {
    ...existing,
    date: state.todayKey,
    steps: state.stepsToday,
    creditsEarned: state.creditsEarnedToday,
    creditsDonated: donationsForDate(state.todayKey),
  };
}

function donationsForDate(key) {
  return state.donationHistory.filter(d => d.dateKey === key).reduce((sum, d) => sum + d.amount, 0);
}

function updateRing() {
  const pct = Math.min(state.stepsToday / state.stepsGoal, 1);
  const offset = RING_CIRCUMF * (1 - pct);
  const fill = DOM.ringFill(); const dot = DOM.ringDot();
  if (!fill || !dot) return;
  fill.style.strokeDashoffset = offset;
  const angle = pct * 2 * Math.PI - Math.PI / 2;
  dot.setAttribute('cx', 110 + RING_RADIUS * Math.cos(angle));
  dot.setAttribute('cy', 110 + RING_RADIUS * Math.sin(angle));
  dot.style.opacity = pct > 0 ? '1' : '0';
  DOM.ringSteps().textContent = formatNumber(state.stepsToday);
  DOM.ringPercent().textContent = Math.round(pct * 100) + '%';
}

function updateEnergy() {
  const pct = Math.min(state.stepsToday / state.stepsGoal, 1);
  const kj = (state.stepsToday * 0.04).toFixed(1);
  DOM.energyProg().style.width = (pct * 100) + '%';
  DOM.energyVal().textContent = kj + ' kJ';
}

function updateCreditsPanel() {
  const credEl = DOM.creditsDisp();
  const prevVal = parseInt(credEl.dataset.prev || '-1');
  if (state.credits !== prevVal) { credEl.classList.remove('credit-bounce'); void credEl.offsetWidth; credEl.classList.add('credit-bounce'); credEl.dataset.prev = state.credits; }
  credEl.textContent = formatNumber(state.credits);
  DOM.creditsToday().textContent = '+' + formatNumber(state.creditsEarnedToday);
  DOM.cstatTotal().textContent = formatNumber(state.creditsTotal);
  DOM.cstatDon().textContent = formatNumber(state.creditsDonated);
  DOM.cstatSteps().textContent = formatNumber(state.stepsToday);
  DOM.streakCount().textContent = state.streak;
  const projDisp = DOM.creditsProjDisp(); if (projDisp) projDisp.textContent = formatNumber(state.credits);
}

function renderIdentity() {
  if (!state.user) return;
  const initial = state.user.name.trim().charAt(0).toUpperCase() || 'N';
  DOM.greetingName().textContent = state.user.name;
  DOM.headerAvatar().textContent = initial;
  DOM.profileAvatar().textContent = initial;
  DOM.profileName().textContent = state.user.name;
  DOM.profileEmail().textContent = state.user.email;
}

function renderProjects() {
  const container = DOM.projectsList(); if (!container) return;
  container.innerHTML = '';
  state.projects.forEach((p, i) => {
    const pct = Math.min(100, Math.round((p.funded / p.goal) * 100));
    const card = document.createElement('article');
    card.className = 'project-card'; card.setAttribute('role', 'listitem'); card.style.animationDelay = (i * 0.06) + 's';
    card.innerHTML = `
      <div class="pcard-header"><div class="pcard-icon-wrap" style="background:${p.bgColor}">${p.icon}</div><div class="pcard-info"><h3 class="pcard-name">${escapeHTML(p.name)}</h3><p class="pcard-desc">${escapeHTML(p.desc)}</p><span class="pcard-tag" style="background:${p.bgColor}; color:${p.color}">${escapeHTML(p.tag)}</span></div></div>
      <div class="pcard-progress-section"><div class="pcard-progress-labels"><span class="pcard-funded">${formatNumber(p.funded)} <small style="font-weight:400;color:var(--text-3)">créditos</small></span><span class="pcard-goal">Meta: ${formatNumber(p.goal)}</span></div><div class="pcard-progress-track"><div class="pcard-progress-fill" style="width:${pct}%; background: linear-gradient(90deg, ${p.color}99, ${p.color})"></div></div></div>
      <div class="pcard-footer"><p class="pcard-percent"><strong>${pct}%</strong> financiado</p><button class="btn-donate-card" onclick="openDonateModal(${p.id})" style="background:${p.color}" aria-label="Donar créditos a ${escapeHTML(p.name)}" ${p.funded >= p.goal ? 'disabled title="¡Proyecto completado!"' : ''}>${p.funded >= p.goal ? '✓ Completado' : '🪙 Donar'}</button></div>`;
    container.appendChild(card);
  });
}

function updateImpact() {
  const kj = (state.steps * 0.04).toFixed(1);
  const co2 = Math.round(state.steps * 0.057);
  if (DOM.impSteps()) DOM.impSteps().textContent = formatNumber(state.steps);
  if (DOM.impEnergy()) DOM.impEnergy().textContent = kj;
  if (DOM.impDonated()) DOM.impDonated().textContent = formatNumber(state.creditsDonated);
  if (DOM.impCO2()) DOM.impCO2().textContent = formatNumber(co2);
}

function renderDonationHistory() {
  const empty = DOM.timelineEmpty(); const list = DOM.timelineList(); if (!empty || !list) return;
  if (state.donationHistory.length === 0) { empty.style.display = 'flex'; list.innerHTML = ''; return; }
  empty.style.display = 'none'; list.innerHTML = '';
  [...state.donationHistory].reverse().slice(0, 12).forEach(entry => {
    const li = document.createElement('li'); li.className = 'timeline-item fade-in';
    li.innerHTML = `<div class="ti-dot" style="background:${entry.bgColor}">${entry.icon}</div><div class="ti-info"><p class="ti-project">${escapeHTML(entry.projectName)}</p><p class="ti-time">${entry.time}</p></div><span class="ti-amount">-${entry.amount} 🪙</span>`;
    list.appendChild(li);
  });
}

function renderProfile() {
  if (!state.user) return;
  syncTodayEntry();
  const daily = Object.values(state.dailyHistory).sort((a, b) => b.date.localeCompare(a.date));
  const activeDays = daily.filter(d => d.steps > 0 || d.creditsDonated > 0).length;
  const bestDay = daily.reduce((max, d) => Math.max(max, d.steps || 0), 0);
  const unlocked = achievementCatalog.filter(a => state.achievements[a.id]).length;
  DOM.profileDays().textContent = activeDays;
  DOM.profileBest().textContent = formatNumber(bestDay);
  DOM.profileStreak().textContent = state.streak;
  DOM.profileAchievements().textContent = `${unlocked}/${achievementCatalog.length}`;
  DOM.profileLevel().textContent = getUserLevel();

  DOM.dailyHistoryList().innerHTML = daily.slice(0, 7).map(d => `<li><span>${formatDate(d.date)}</span><strong>${formatNumber(d.steps || 0)} pasos</strong><small>+${formatNumber(d.creditsEarned || 0)} 🪙 · ${formatNumber(d.creditsDonated || 0)} donados</small></li>`).join('') || '<li><span>Sin actividad todavía</span><strong>0 pasos</strong><small>Empieza simulando movimiento</small></li>';

  DOM.achievementsGrid().innerHTML = achievementCatalog.map(a => {
    const ok = !!state.achievements[a.id];
    return `<div class="achievement-card ${ok ? 'unlocked' : 'locked'}"><span>${a.icon}</span><strong>${a.title}</strong><small>${a.desc}</small></div>`;
  }).join('');

  const byProject = {};
  state.donationHistory.forEach(d => { byProject[d.projectName] = (byProject[d.projectName] || 0) + d.amount; });
  const entries = Object.entries(byProject).sort((a,b)=>b[1]-a[1]);
  DOM.donationSummaryList().innerHTML = entries.length ? entries.map(([name, amount]) => `<li><span>${escapeHTML(name)}</span><strong>${formatNumber(amount)} 🪙</strong></li>`).join('') : '<li><span>No hay donaciones registradas</span><strong>0 🪙</strong></li>';
}

function addSteps(n) {
  if (!state.user) { showToast('Inicia sesión para guardar tus pasos.', 'error'); return; }
  if (typeof n !== 'number' || n <= 0) return;
  checkDayRollover();
  const prevStepsToday = state.stepsToday;
  const prevTotalSteps = state.steps;
  state.steps += n; state.stepsToday += n;
  const newCredits = Math.floor(state.steps / state.STEPS_PER_CREDIT) - Math.floor(prevTotalSteps / state.STEPS_PER_CREDIT);
  if (newCredits > 0) {
    state.credits += newCredits; state.creditsEarnedToday += newCredits; state.creditsTotal += newCredits;
    showCreditFloat('+' + newCredits + ' 🪙');
    showToast(`⚡ +${newCredits} crédito${newCredits > 1 ? 's' : ''} generado${newCredits > 1 ? 's' : ''}`, 'success');
  }
  updateStreakForActivity();
  unlockAchievement('first_steps');
  [2500, 5000, 10000].forEach(m => { if (prevStepsToday < m && state.stepsToday >= m) unlockAchievement(`steps_${m}`); });
  [2500, 5000, 7500, 10000].forEach(m => { if (prevStepsToday < m && state.stepsToday >= m) triggerMilestone(m); });
  if (state.stepsToday >= state.stepsGoal && !state.achievementShown) {
    state.achievementShown = true;
    setTimeout(() => { DOM.achBanner().classList.remove('hidden'); showToast('🏆 ¡Objetivo diario completado!', 'info'); }, 400);
  }
  renderAll(); saveCurrentUser();
}

function updateStreakForActivity() {
  syncTodayEntry();
  const days = Object.values(state.dailyHistory).filter(d => d.steps > 0).map(d => d.date).sort().reverse();
  let count = 0; let cursor = new Date(todayKey() + 'T00:00:00');
  while (days.includes(toKey(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
  state.streak = count;
  if (Object.values(state.dailyHistory).filter(d => d.steps > 0).length >= 3) unlockAchievement('three_days', false);
}

function triggerMilestone(milestone) {
  const ring = DOM.ringFill();
  if (ring) { ring.classList.remove('milestone'); void ring.offsetWidth; ring.classList.add('milestone'); setTimeout(() => ring.classList.remove('milestone'), 2500); }
  const msgs = {2500:'🌿 ¡2.500 pasos! ¡Bien hecho!',5000:'⚡ ¡Mitad del camino! 5.000 pasos',7500:'🔥 ¡7.500 pasos! ¡Casi lo tienes!',10000:'🏆 ¡10.000 pasos! ¡Eres un crack!'};
  if (msgs[milestone]) showToast(msgs[milestone], 'info');
}

function openDonateModal(projectId) {
  const project = state.projects.find(p => p.id === projectId); if (!project) return;
  state.modal = { open: true, projectId, selectedAmount: 0 };
  const customInput = DOM.customInput(); if (customInput) customInput.value = '';
  document.querySelectorAll('.amount-chip').forEach(chip => chip.classList.remove('selected'));
  const pct = Math.round((project.funded / project.goal) * 100);
  DOM.modalTitle().textContent = project.name; DOM.modalDesc().textContent = project.desc; DOM.modalIcon().textContent = project.icon; DOM.modalIcon().style.background = project.bgColor;
  DOM.modalProgText().textContent = `${formatNumber(project.funded)} / ${formatNumber(project.goal)} créditos`;
  DOM.modalProgFill().style.width = pct + '%'; DOM.modalProgFill().style.background = `linear-gradient(90deg, ${project.color}88, ${project.color})`;
  DOM.modalCredAvail().textContent = formatNumber(state.credits);
  updateDonationPreview(0, project); DOM.btnDonate().disabled = true;
  DOM.modalBackdrop().classList.add('open'); document.body.style.overflow = 'hidden';
}

function closeModal() { state.modal.open = false; DOM.modalBackdrop().classList.remove('open'); document.body.style.overflow = ''; }

function selectAmount(amount) {
  if (isNaN(amount) || amount < 0) amount = 0;
  state.modal.selectedAmount = amount;
  document.querySelectorAll('.amount-chip').forEach(chip => chip.classList.toggle('selected', parseInt(chip.dataset.amount) === amount));
  const customInput = DOM.customInput(); if (customInput && document.activeElement !== customInput && [5,10,25,50].includes(amount)) customInput.value = '';
  const project = state.projects.find(p => p.id === state.modal.projectId); if (project) updateDonationPreview(amount, project);
  DOM.btnDonate().disabled = !(amount > 0 && amount <= state.credits && project && project.funded < project.goal);
}

function updateDonationPreview(amount, project) {
  const remaining = Math.max(0, (project.goal - project.funded) - amount);
  DOM.dpAmount().textContent = amount + ' 🪙'; DOM.dpRemaining().textContent = remaining + ' 🪙 restantes';
}

function confirmDonate() {
  const amount = state.modal.selectedAmount;
  const project = state.projects.find(p => p.id === state.modal.projectId);
  if (!project || amount <= 0) return;
  if (amount > state.credits) { showToast('No tienes suficientes créditos', 'error'); DOM.creditsDisp().classList.remove('shake'); void DOM.creditsDisp().offsetWidth; DOM.creditsDisp().classList.add('shake'); return; }
  if (project.funded >= project.goal) { showToast('Este proyecto ya está completamente financiado', 'info'); closeModal(); return; }
  const donateAmt = Math.min(amount, project.goal - project.funded);
  state.credits -= donateAmt; state.creditsDonated += donateAmt; project.funded += donateAmt;
  const now = new Date();
  state.donationHistory.push({ projectId: project.id, projectName: project.name, icon: project.icon, bgColor: project.bgColor, color: project.color, amount: donateAmt, time: formatTime(now), iso: now.toISOString(), dateKey: state.todayKey });
  unlockAchievement('first_donation'); if (state.creditsDonated >= 100) unlockAchievement('donated_100'); if (project.funded >= project.goal) unlockAchievement('project_completed');
  triggerDonationParticles();
  const btn = DOM.btnDonate(); btn.innerHTML = '<span class="btn-text">¡Donado!</span> <span class="btn-icon">✓</span>'; btn.classList.add('success');
  setTimeout(() => { closeModal(); btn.innerHTML = '<span class="btn-text">Donar créditos</span> <span class="btn-icon">🌿</span>'; btn.classList.remove('success'); showToast(`🌿 Has donado ${donateAmt} créditos a ${project.name}`, 'success'); renderAll(); saveCurrentUser(); }, 800);
}

function setTab(tabId) {
  if (state.activeTab === tabId) { if (tabId === 'profile') renderProfile(); return; }
  state.activeTab = tabId;
  DOM.tabScreens().forEach(screen => screen.classList.toggle('active', screen.id === `tab-${tabId}`));
  DOM.navBtns().forEach(btn => btn.classList.toggle('active', btn.dataset.tab === tabId));
  if (tabId === 'projects') renderProjects();
  if (tabId === 'impact') { updateImpact(); renderDonationHistory(); }
  if (tabId === 'profile') renderProfile();
}

function unlockAchievement(id, notify = true) {
  if (state.achievements[id]) return;
  state.achievements[id] = new Date().toISOString();
  const ach = achievementCatalog.find(a => a.id === id);
  if (notify && ach) showToast(`🏅 Logro desbloqueado: ${ach.title}`, 'info');
}

function simulateNewDay() {
  syncTodayEntry();
  const d = new Date(state.todayKey + 'T00:00:00'); d.setDate(d.getDate() + 1);
  state.todayKey = toKey(d); state.stepsToday = 0; state.creditsEarnedToday = 0; state.achievementShown = false;
  DOM.achBanner().classList.add('hidden');
  renderAll(); saveCurrentUser(); showToast('Se ha simulado un nuevo día.', 'info');
}

function exportProfileData() {
  if (!state.user) return;
  saveCurrentUser();
  const data = JSON.stringify(state.users[state.user.email], null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = `nativo-${state.user.email}.json`; a.click(); URL.revokeObjectURL(url);
  showToast('Datos exportados en JSON.', 'success');
}

function renderAll() { renderIdentity(); updateRing(); updateEnergy(); updateCreditsPanel(); renderProjects(); renderDonationHistory(); updateImpact(); renderProfile(); }

function showToast(message, type = 'success', duration = 3000) {
  const container = DOM.toastContainer(); if (!container) return;
  const icons = { success: '✅', error: '❌', info: '💡' };
  const toast = document.createElement('div'); toast.className = `toast toast-${type}`; toast.innerHTML = `<span class="toast-icon">${icons[type] || '💬'}</span><span>${escapeHTML(message)}</span>`;
  container.appendChild(toast); setTimeout(() => { toast.classList.add('hiding'); setTimeout(() => toast.remove(), 300); }, duration);
}

function showCreditFloat(text) {
  const el = document.createElement('div'); el.className = 'credit-pop'; el.textContent = text;
  const credEl = DOM.creditsDisp();
  if (credEl) { const rect = credEl.getBoundingClientRect(); el.style.left = (rect.left + rect.width / 2 - 30) + 'px'; el.style.top = (rect.top - 10) + 'px'; }
  else { el.style.left = '50%'; el.style.top = '40%'; el.style.transform = 'translateX(-50%)'; }
  document.body.appendChild(el); setTimeout(() => el.remove(), 1200);
}

function triggerDonationParticles() {
  const emojis = ['🌿', '⚡', '🪙', '✨', '💚']; const btn = DOM.btnDonate(); if (!btn) return;
  const rect = btn.getBoundingClientRect(); const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2;
  for (let i=0;i<8;i++) { const particle = document.createElement('div'); particle.className = 'particle'; particle.textContent = emojis[Math.floor(Math.random()*emojis.length)]; const angle = (i/8)*2*Math.PI; const dist = 60 + Math.random()*40; particle.style.left = cx+'px'; particle.style.top = cy+'px'; particle.style.setProperty('--tx', Math.cos(angle)*dist+'px'); particle.style.setProperty('--ty', (Math.sin(angle)*dist-30)+'px'); particle.style.animationDelay = (i*0.05)+'s'; document.body.appendChild(particle); setTimeout(()=>particle.remove(),900); }
}

function injectRingGradient() {
  const svg = document.querySelector('.progress-ring'); if (!svg || svg.querySelector('#ringGradient')) return;
  const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
  defs.innerHTML = `<linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#2C7A53"/><stop offset="50%" stop-color="#3D9A6F"/><stop offset="100%" stop-color="#7DD1A8"/></linearGradient>`;
  svg.prepend(defs);
}

function getUserLevel() {
  if (state.creditsDonated >= 250) return 'Nivel Bosque';
  if (state.creditsDonated >= 100) return 'Nivel Árbol';
  if (state.creditsDonated >= 25) return 'Nivel Brote';
  return 'Nivel Semilla';
}
function todayKey() { return toKey(new Date()); }
function toKey(date) { return date.toISOString().slice(0,10); }
function formatNumber(n) { return Number(n || 0).toLocaleString('es-ES'); }
function formatDate(key) { return new Date(key + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: '2-digit', month: 'short' }); }
function formatTime(date) { const now = new Date(); const diff = Math.floor((now-date)/1000); if (diff<60) return 'Ahora mismo'; if (diff<3600) return `Hace ${Math.floor(diff/60)} min`; if (diff<86400) return `Hace ${Math.floor(diff/3600)} h`; return date.toLocaleDateString('es-ES',{day:'2-digit',month:'short'}); }
function escapeHTML(str) { return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c])); }
function structuredCloneSafe(obj) { return JSON.parse(JSON.stringify(obj)); }

function init() {
  injectRingGradient();
  const ringFill = DOM.ringFill(); if (ringFill) { ringFill.style.strokeDasharray = RING_CIRCUMF; ringFill.style.strokeDashoffset = RING_CIRCUMF; }
  setAuthMode('login');
  DOM.authForm().addEventListener('submit', handleAuthSubmit);
  state.users = loadUsers();
  const sessionEmail = localStorage.getItem(SESSION_KEY);
  if (sessionEmail && state.users[sessionEmail]) loginUser(state.users[sessionEmail]);
  else { renderAll(); DOM.authScreen().classList.remove('hidden'); }
  console.log('%c🌿 Nativo iniciado', 'color: #3D9A6F; font-weight: bold; font-size: 14px;');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();

document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && state.modal.open) closeModal(); });

(function setupSwipeToClose() {
  let startY = 0;
  document.addEventListener('DOMContentLoaded', () => {
    const sheet = document.getElementById('modal-sheet'); if (!sheet) return;
    sheet.addEventListener('touchstart', e => { startY = e.touches[0].clientY; }, { passive: true });
    sheet.addEventListener('touchmove', e => { const deltaY = e.touches[0].clientY - startY; if (deltaY > 0) { sheet.style.transform = `translateY(${deltaY}px)`; sheet.style.transition = 'none'; } }, { passive: true });
    sheet.addEventListener('touchend', e => { const deltaY = e.changedTouches[0].clientY - startY; sheet.style.transition = ''; if (deltaY > 100) closeModal(); sheet.style.transform = ''; });
  });
})();
