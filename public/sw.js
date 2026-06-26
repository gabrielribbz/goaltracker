// Service Worker - Tracker de Objetivos
// Usa Periodic Background Sync + IndexedDB para notificações confiáveis a cada 2h

const SYNC_TAG = 'goal-reminder';
const DB_NAME = 'goal-tracker-db';
const DB_VERSION = 1;
const GOALS_STORE = 'goals';
const SETTINGS_STORE = 'settings';

// ===== IndexedDB Helpers =====

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(GOALS_STORE)) {
        db.createObjectStore(GOALS_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveGoals(goals) {
  const db = await openDB();
  const tx = db.transaction(GOALS_STORE, 'readwrite');
  const store = tx.objectStore(GOALS_STORE);
  store.clear();
  goals.forEach((g) => store.put(g));
  return new Promise((res, rej) => {
    tx.oncomplete = () => { db.close(); res(); };
    tx.onerror = () => { db.close(); rej(tx.error); };
  });
}

async function getGoals() {
  const db = await openDB();
  const tx = db.transaction(GOALS_STORE, 'readonly');
  const req = tx.objectStore(GOALS_STORE).getAll();
  return new Promise((res, rej) => {
    req.onsuccess = () => { db.close(); res(req.result); };
    req.onerror = () => { db.close(); rej(req.error); };
  });
}

async function saveSetting(key, value) {
  const db = await openDB();
  const tx = db.transaction(SETTINGS_STORE, 'readwrite');
  tx.objectStore(SETTINGS_STORE).put({ key, value });
  return new Promise((res) => {
    tx.oncomplete = () => { db.close(); res(); };
    tx.onerror = () => { db.close(); res(); };
  });
}

// ===== Lifecycle =====

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

// ===== Periodic Background Sync (principal) =====

self.addEventListener('periodicsync', (event) => {
  if (event.tag === SYNC_TAG) {
    event.waitUntil(sendGoalReminder());
  }
});

// ===== Mensagens do App =====

self.addEventListener('message', (event) => {
  const { type, goals } = event.data;

  if (type === 'UPDATE_GOALS') {
    saveGoals(goals || []);
  }

  if (type === 'SEND_TEST') {
    event.waitUntil(sendGoalReminder());
  }

  if (type === 'STOP_NOTIFICATIONS') {
    // Limpa dados se necessário
  }
});

// ===== Lógica de Notificação =====

async function sendGoalReminder() {
  let goals = [];
  try {
    goals = await getGoals();
  } catch (err) {
    console.error('Erro ao ler goals do IndexedDB:', err);
  }

  await saveSetting('lastNotificationTime', Date.now());

  if (goals.length === 0) {
    return self.registration.showNotification('🎯 Tracker de Objetivos', {
      body: 'Você ainda não tem objetivos cadastrados. Que tal criar um agora?',
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: 'goal-reminder',
      renotify: true,
      actions: [{ action: 'open', title: 'Abrir App' }],
    });
  }

  const pending = goals.filter((g) => g.currentValue < g.targetValue);

  if (pending.length === 0) {
    return self.registration.showNotification('🏆 Todos os objetivos alcançados!', {
      body: `Parabéns! Você completou todos os ${goals.length} objetivos. Hora de criar novos sonhos!`,
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: 'goal-reminder',
      renotify: true,
    });
  }

  const goal = pending[Math.floor(Math.random() * pending.length)];
  const progress = ((goal.currentValue / goal.targetValue) * 100).toFixed(0);
  const fmt = (v) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
  const remaining = fmt(goal.targetValue - goal.currentValue);

  const messages = [
    `💪 "${goal.title}" está em ${progress}%! Faltam ${remaining} para alcançar sua meta.`,
    `🔥 Você já progrediu ${progress}% em "${goal.title}"! Continue assim!`,
    `📊 Lembrete: "${goal.title}" precisa de mais ${remaining}. Você consegue!`,
    `⭐ Não esqueça do seu objetivo "${goal.title}"! Já são ${progress}% concluídos.`,
    `🚀 Foco em "${goal.title}"! Faltam apenas ${remaining} para a meta.`,
  ];

  const title = pending.length === 1
    ? '🎯 Lembrete do seu Objetivo'
    : `🎯 Você tem ${pending.length} objetivos em andamento`;

  return self.registration.showNotification(title, {
    body: messages[Math.floor(Math.random() * messages.length)],
    icon: '/notification-icon.png',
    badge: '/notification-icon.png',
    tag: 'goal-reminder',
    renotify: true,
    requireInteraction: false,
    data: { url: '/' },
    actions: [{ action: 'open', title: 'Ver Objetivos' }],
  });
}

// ===== Clique na Notificação =====

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
