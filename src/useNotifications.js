import { useState, useEffect, useCallback, useRef } from 'react';

const SW_PATH = '/sw.js';
const SYNC_TAG = 'goal-reminder';
const NOTIFICATION_INTERVAL = 1 * 60 * 1000; // 1 minuto (TESTE)
const DB_NAME = 'goal-tracker-db';
const DB_VERSION = 1;
const GOALS_STORE = 'goals';
const SETTINGS_STORE = 'settings';

// ===== IndexedDB helpers (compartilhado com o SW) =====

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

async function saveGoalsToDB(goals) {
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

async function getLastNotificationTime() {
  try {
    const db = await openDB();
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const req = tx.objectStore(SETTINGS_STORE).get('lastNotificationTime');
    return new Promise((resolve) => {
      req.onsuccess = () => { db.close(); resolve(req.result?.value || 0); };
      req.onerror = () => { db.close(); resolve(0); };
    });
  } catch {
    return 0;
  }
}

// ===== Hook =====

export function useNotifications(goals) {
  const [permission, setPermission] = useState(() => {
    if (typeof Notification === 'undefined') return 'unsupported';
    return Notification.permission;
  });
  const [isActive, setIsActive] = useState(() => {
    return localStorage.getItem('notifications_active') === 'true';
  });
  const [swRegistration, setSwRegistration] = useState(null);
  const goalsRef = useRef(goals);
  const fallbackTimerRef = useRef(null);

  // Mantém a ref dos goals atualizada
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  // ===== Fallback: timer na página (para browsers sem Periodic Sync) =====

  const startFallbackTimer = useCallback((reg) => {
    if (fallbackTimerRef.current) clearInterval(fallbackTimerRef.current);

    // Checa a cada 60s se já passou 2h desde a última notificação
    fallbackTimerRef.current = setInterval(async () => {
      const lastTime = await getLastNotificationTime();
      if (Date.now() - lastTime >= NOTIFICATION_INTERVAL) {
        const sw = reg.active;
        if (sw) sw.postMessage({ type: 'SEND_TEST' });
      }
    }, 60_000);
  }, []);

  const clearFallbackTimer = useCallback(() => {
    if (fallbackTimerRef.current) {
      clearInterval(fallbackTimerRef.current);
      fallbackTimerRef.current = null;
    }
  }, []);

  // ===== Registra o Service Worker =====

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register(SW_PATH)
      .then(async (registration) => {
        setSwRegistration(registration);

        // Se notificações estavam ativas, re-registra tudo
        if (localStorage.getItem('notifications_active') === 'true' && Notification.permission === 'granted') {
          await navigator.serviceWorker.ready;

          // Sincroniza goals no IndexedDB e no SW
          await saveGoalsToDB(goalsRef.current);
          registration.active?.postMessage({ type: 'UPDATE_GOALS', goals: goalsRef.current });

          // Tenta registrar Periodic Sync
          if ('periodicSync' in registration) {
            try {
              await registration.periodicSync.register(SYNC_TAG, { minInterval: NOTIFICATION_INTERVAL });
            } catch {
              startFallbackTimer(registration);
            }
          } else {
            startFallbackTimer(registration);
          }
        }
      })
      .catch((err) => console.error('Erro ao registrar Service Worker:', err));

    return () => clearFallbackTimer();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ===== Atualiza goals no IndexedDB + SW quando mudam =====

  useEffect(() => {
    if (swRegistration && isActive) {
      saveGoalsToDB(goals);
      swRegistration.active?.postMessage({ type: 'UPDATE_GOALS', goals });
    }
  }, [goals, swRegistration, isActive]);

  // ===== Checar ao voltar pra aba (visibilitychange) =====

  useEffect(() => {
    if (!isActive || !swRegistration) return;

    const handleVisibility = async () => {
      if (document.visibilityState !== 'visible') return;
      const lastTime = await getLastNotificationTime();
      if (Date.now() - lastTime >= NOTIFICATION_INTERVAL) {
        swRegistration.active?.postMessage({ type: 'SEND_TEST' });
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isActive, swRegistration]);

  // ===== Ativar notificações =====

  const enableNotifications = useCallback(async () => {
    if (typeof Notification === 'undefined') {
      alert('Seu navegador não suporta notificações.');
      return;
    }

    let perm = Notification.permission;
    if (perm === 'default') {
      perm = await Notification.requestPermission();
      setPermission(perm);
    }

    if (perm === 'granted') {
      setIsActive(true);
      localStorage.setItem('notifications_active', 'true');

      await saveGoalsToDB(goalsRef.current);

      if (swRegistration) {
        swRegistration.active?.postMessage({ type: 'UPDATE_GOALS', goals: goalsRef.current });

        // Registrar Periodic Sync ou fallback
        if ('periodicSync' in swRegistration) {
          try {
            await swRegistration.periodicSync.register(SYNC_TAG, { minInterval: NOTIFICATION_INTERVAL });
            console.log('✅ Periodic Background Sync registrado');
          } catch {
            console.warn('⚠️ Periodic Sync indisponível, usando fallback');
            startFallbackTimer(swRegistration);
          }
        } else {
          startFallbackTimer(swRegistration);
        }

        // Notificação de confirmação
        swRegistration.showNotification('🔔 Notificações Ativadas!', {
          body: 'Você receberá lembretes sobre seus objetivos a cada 2 horas.',
          icon: '/notification-icon.png',
          tag: 'notification-enabled',
        });
      }
    } else if (perm === 'denied') {
      alert('Notificações foram bloqueadas. Habilite nas configurações do navegador.');
    }
  }, [swRegistration, startFallbackTimer]);

  // ===== Desativar notificações =====

  const disableNotifications = useCallback(async () => {
    setIsActive(false);
    localStorage.setItem('notifications_active', 'false');
    clearFallbackTimer();

    if (swRegistration) {
      if ('periodicSync' in swRegistration) {
        try { await swRegistration.periodicSync.unregister(SYNC_TAG); } catch { /* ok */ }
      }
      swRegistration.active?.postMessage({ type: 'STOP_NOTIFICATIONS' });
    }
  }, [swRegistration, clearFallbackTimer]);

  // ===== Toggle =====

  const toggleNotifications = useCallback(() => {
    if (isActive) disableNotifications();
    else enableNotifications();
  }, [isActive, enableNotifications, disableNotifications]);

  // ===== Testar =====

  const sendTestNotification = useCallback(() => {
    if (!swRegistration) {
      alert('Service Worker não registrado ainda. Tente novamente.');
      return;
    }
    if (Notification.permission !== 'granted') {
      alert('Ative as notificações primeiro clicando em "Ativar lembretes".');
      return;
    }
    swRegistration.active?.postMessage({ type: 'UPDATE_GOALS', goals: goalsRef.current });
    swRegistration.active?.postMessage({ type: 'SEND_TEST' });
  }, [swRegistration]);

  return {
    permission,
    isActive,
    toggleNotifications,
    enableNotifications,
    disableNotifications,
    sendTestNotification,
  };
}
