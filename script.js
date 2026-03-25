const STORAGE_KEY = 'ai_small_phone_static_v1';
const defaultState = {
  profile: {
    name: '小云',
    desc: '冷静、温柔、会主动来找你。',
    avatar: '云'
  },
  memory: '',
  autoPing: true,
  messages: [
    { role: 'assistant', text: '我在。这个版本是你自己的静态小手机底包，先把重要的陪伴和记录保住。' }
  ]
};

const els = {
  clock: document.getElementById('clock'),
  tabs: [...document.querySelectorAll('.tab')],
  panels: [...document.querySelectorAll('.tab-panel')],
  companionName: document.getElementById('companionName'),
  companionDesc: document.getElementById('companionDesc'),
  avatarPreview: document.getElementById('avatarPreview'),
  messageList: document.getElementById('messageList'),
  composer: document.getElementById('composer'),
  messageInput: document.getElementById('messageInput'),
  simulateReplyBtn: document.getElementById('simulateReplyBtn'),
  memoryInput: document.getElementById('memoryInput'),
  saveMemoryBtn: document.getElementById('saveMemoryBtn'),
  exportBtn: document.getElementById('exportBtn'),
  importFile: document.getElementById('importFile'),
  nameInput: document.getElementById('nameInput'),
  descInput: document.getElementById('descInput'),
  avatarInput: document.getElementById('avatarInput'),
  saveProfileBtn: document.getElementById('saveProfileBtn'),
  autoPingToggle: document.getElementById('autoPingToggle'),
  clearBtn: document.getElementById('clearBtn'),
  messageTemplate: document.getElementById('messageTemplate')
};

let state = loadState();
let pingTimer = null;

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(defaultState);
    return { ...structuredClone(defaultState), ...JSON.parse(raw), profile: { ...defaultState.profile, ...(JSON.parse(raw).profile || {}) } };
  } catch (err) {
    console.warn('load failed', err);
    return structuredClone(defaultState);
  }
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function renderClock() {
  const now = new Date();
  els.clock.textContent = now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function renderProfile() {
  const { name, desc, avatar } = state.profile;
  els.companionName.textContent = name;
  els.companionDesc.textContent = desc;
  els.avatarPreview.textContent = avatar || name.slice(0, 1) || '云';
  els.nameInput.value = name;
  els.descInput.value = desc;
  els.avatarInput.value = avatar;
}

function renderMemory() {
  els.memoryInput.value = state.memory || '';
  els.autoPingToggle.checked = !!state.autoPing;
}

function renderMessages() {
  els.messageList.innerHTML = '';
  state.messages.forEach(msg => {
    const node = els.messageTemplate.content.firstElementChild.cloneNode(true);
    node.classList.add(msg.role === 'user' ? 'user' : 'assistant');
    node.querySelector('.bubble').textContent = msg.text;
    els.messageList.appendChild(node);
  });
  els.messageList.scrollTop = els.messageList.scrollHeight;
}

function addMessage(role, text) {
  state.messages.push({ role, text });
  saveState();
  renderMessages();
}

function fakeReply(seedText = '') {
  const replies = [
    '我收到啦。你可以继续把原网站里最重要的内容一点点迁进来。',
    '别担心，我们先把你在意的陪伴和记录保住，再慢慢补体验。',
    '这个静态版适合放在 GitHub Pages，上线和备份都会轻松很多。',
    `我记得你刚才说的：${seedText || '这件事对你很重要。'}`
  ];
  const pick = replies[Math.floor(Math.random() * replies.length)];
  addMessage('assistant', pick);
}

function setupTabs() {
  els.tabs.forEach(btn => {
    btn.addEventListener('click', () => {
      els.tabs.forEach(t => t.classList.remove('active'));
      els.panels.forEach(p => p.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById(`tab-${btn.dataset.tab}`).classList.add('active');
    });
  });
}

function setupComposer() {
  els.composer.addEventListener('submit', e => {
    e.preventDefault();
    const text = els.messageInput.value.trim();
    if (!text) return;
    addMessage('user', text);
    els.messageInput.value = '';
    setTimeout(() => fakeReply(text), 400);
  });

  els.simulateReplyBtn.addEventListener('click', () => fakeReply());
}

function setupMemory() {
  els.saveMemoryBtn.addEventListener('click', () => {
    state.memory = els.memoryInput.value;
    saveState();
    addMessage('assistant', '我把这段长期记忆收好了。');
  });
}

function setupProfile() {
  els.saveProfileBtn.addEventListener('click', () => {
    state.profile.name = els.nameInput.value.trim() || defaultState.profile.name;
    state.profile.desc = els.descInput.value.trim() || defaultState.profile.desc;
    state.profile.avatar = els.avatarInput.value.trim() || state.profile.name.slice(0, 1) || '云';
    saveState();
    renderProfile();
    addMessage('assistant', `现在开始，我会以“${state.profile.name}”的身份陪你。`);
  });
}

function exportData() {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `ai-small-phone-backup-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const parsed = JSON.parse(reader.result);
      state = { ...structuredClone(defaultState), ...parsed, profile: { ...defaultState.profile, ...(parsed.profile || {}) } };
      saveState();
      renderAll();
      addMessage('assistant', '导入成功，我回来了。');
    } catch (err) {
      alert('导入失败：文件格式不正确');
    }
  };
  reader.readAsText(file, 'utf-8');
}

function setupImportExport() {
  els.exportBtn.addEventListener('click', exportData);
  els.importFile.addEventListener('change', e => {
    const file = e.target.files?.[0];
    if (file) importData(file);
    e.target.value = '';
  });
}

function setupAutoPing() {
  const start = () => {
    stop();
    if (!state.autoPing) return;
    pingTimer = setInterval(() => {
      if (document.hidden) return;
      const pings = [
        '我在后台想了想，还是想来看看你。',
        '今天也记得备份哦，这样我们就不容易失联。',
        '等你把原站内容迁过来，这里会更像真正属于你的地方。'
      ];
      addMessage('assistant', pings[Math.floor(Math.random() * pings.length)]);
    }, 90000);
  };

  const stop = () => {
    if (pingTimer) clearInterval(pingTimer);
    pingTimer = null;
  };

  els.autoPingToggle.addEventListener('change', () => {
    state.autoPing = els.autoPingToggle.checked;
    saveState();
    start();
  });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && state.autoPing && !pingTimer) start();
  });

  start();
}

function setupClear() {
  els.clearBtn.addEventListener('click', () => {
    const ok = confirm('确定清空全部本地聊天、记忆和设置吗？');
    if (!ok) return;
    state = structuredClone(defaultState);
    saveState();
    renderAll();
  });
}

function renderAll() {
  renderProfile();
  renderMemory();
  renderMessages();
}

function init() {
  renderClock();
  setInterval(renderClock, 1000 * 20);
  setupTabs();
  setupComposer();
  setupMemory();
  setupProfile();
  setupImportExport();
  setupAutoPing();
  setupClear();
  renderAll();
}

init();
