// Service Worker para Notificações Push - Tracker de Objetivos

const NOTIFICATION_INTERVAL = 2 * 60 * 60 * 1000; // 2 horas em milissegundos

// Quando o service worker é instalado
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Quando o service worker é ativado
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Escuta mensagens do app principal
self.addEventListener('message', (event) => {
  const { type, goals } = event.data;

  if (type === 'START_NOTIFICATIONS') {
    // Salva os goals no cache para usar nas notificações
    self.goalsData = goals || [];
    startNotificationTimer();
  }

  if (type === 'STOP_NOTIFICATIONS') {
    stopNotificationTimer();
  }

  if (type === 'UPDATE_GOALS') {
    self.goalsData = goals || [];
  }

  if (type === 'SEND_TEST') {
    sendGoalReminder();
  }
});

let notificationTimer = null;

function startNotificationTimer() {
  stopNotificationTimer(); // Limpa qualquer timer existente
  
  // Dispara a primeira notificação após o intervalo
  notificationTimer = setInterval(() => {
    sendGoalReminder();
  }, NOTIFICATION_INTERVAL);
}

function stopNotificationTimer() {
  if (notificationTimer) {
    clearInterval(notificationTimer);
    notificationTimer = null;
  }
}

function sendGoalReminder() {
  const goals = self.goalsData || [];
  
  if (goals.length === 0) {
    self.registration.showNotification('🎯 Tracker de Objetivos', {
      body: 'Você ainda não tem objetivos cadastrados. Que tal criar um agora?',
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: 'goal-reminder',
      renotify: true,
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Abrir App' }
      ]
    });
    return;
  }

  // Filtra objetivos não concluídos
  const pendingGoals = goals.filter(g => g.currentValue < g.targetValue);
  const completedCount = goals.length - pendingGoals.length;

  if (pendingGoals.length === 0) {
    self.registration.showNotification('🏆 Todos os objetivos alcançados!', {
      body: `Parabéns! Você completou todos os ${goals.length} objetivos. Hora de criar novos sonhos!`,
      icon: '/notification-icon.png',
      badge: '/notification-icon.png',
      tag: 'goal-reminder',
      renotify: true,
    });
    return;
  }

  // Pega um objetivo aleatório para destacar
  const randomGoal = pendingGoals[Math.floor(Math.random() * pendingGoals.length)];
  const progress = ((randomGoal.currentValue / randomGoal.targetValue) * 100).toFixed(0);
  
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const remaining = formatCurrency(randomGoal.targetValue - randomGoal.currentValue);

  // Varia as mensagens para não ficar repetitivo
  const messages = [
    `💪 "${randomGoal.title}" está em ${progress}%! Faltam ${remaining} para alcançar sua meta.`,
    `🔥 Você já progrediu ${progress}% em "${randomGoal.title}"! Continue assim!`,
    `📊 Lembrete: "${randomGoal.title}" precisa de mais ${remaining}. Você consegue!`,
    `⭐ Não esqueça do seu objetivo "${randomGoal.title}"! Já são ${progress}% concluídos.`,
    `🚀 Foco em "${randomGoal.title}"! Faltam apenas ${remaining} para a meta.`,
  ];

  const body = messages[Math.floor(Math.random() * messages.length)];

  const title = pendingGoals.length === 1
    ? '🎯 Lembrete do seu Objetivo'
    : `🎯 Você tem ${pendingGoals.length} objetivos em andamento`;

  self.registration.showNotification(title, {
    body,
    icon: '/notification-icon.png',
    badge: '/notification-icon.png',
    tag: 'goal-reminder',
    renotify: true,
    requireInteraction: false,
    data: { url: '/' },
    actions: [
      { action: 'open', title: 'Ver Objetivos' }
    ]
  });
}

// Quando o usuário clica na notificação
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se já tem uma aba aberta, foca nela
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Senão, abre uma nova aba
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});
