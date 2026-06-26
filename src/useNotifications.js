import { useState, useEffect, useCallback, useRef } from 'react';

const SW_PATH = '/sw.js';

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

  // Mantém a ref dos goals atualizada
  useEffect(() => {
    goalsRef.current = goals;
  }, [goals]);

  // Registra o Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register(SW_PATH)
      .then((registration) => {
        setSwRegistration(registration);

        // Se as notificações estavam ativas antes do reload, reinicia
        if (localStorage.getItem('notifications_active') === 'true' && Notification.permission === 'granted') {
          const sw = registration.active || registration.installing || registration.waiting;
          if (sw) {
            // Espera o SW ficar ativo para enviar a mensagem
            if (sw.state === 'activated' || sw.state === 'activating') {
              sendMessageToSW(registration, {
                type: 'START_NOTIFICATIONS',
                goals: goalsRef.current,
              });
            } else {
              sw.addEventListener('statechange', () => {
                if (sw.state === 'activated') {
                  sendMessageToSW(registration, {
                    type: 'START_NOTIFICATIONS',
                    goals: goalsRef.current,
                  });
                }
              });
            }
          }
        }
      })
      .catch((err) => {
        console.error('Erro ao registrar Service Worker:', err);
      });
  }, []);

  // Atualiza os goals no Service Worker quando eles mudam
  useEffect(() => {
    if (swRegistration && isActive) {
      sendMessageToSW(swRegistration, {
        type: 'UPDATE_GOALS',
        goals,
      });
    }
  }, [goals, swRegistration, isActive]);

  const sendMessageToSW = (registration, message) => {
    const sw = registration.active;
    if (sw) {
      sw.postMessage(message);
    }
  };

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

      if (swRegistration) {
        sendMessageToSW(swRegistration, {
          type: 'START_NOTIFICATIONS',
          goals: goalsRef.current,
        });
      }

      // Notificação de confirmação
      if (swRegistration) {
        swRegistration.showNotification('🔔 Notificações Ativadas!', {
          body: 'Você receberá lembretes sobre seus objetivos a cada 2 horas.',
          icon: '/notification-icon.png',
          tag: 'notification-enabled',
        });
      }
    } else if (perm === 'denied') {
      alert('Notificações foram bloqueadas. Habilite nas configurações do navegador.');
    }
  }, [swRegistration]);

  const disableNotifications = useCallback(() => {
    setIsActive(false);
    localStorage.setItem('notifications_active', 'false');

    if (swRegistration) {
      sendMessageToSW(swRegistration, {
        type: 'STOP_NOTIFICATIONS',
      });
    }
  }, [swRegistration]);

  const toggleNotifications = useCallback(() => {
    if (isActive) {
      disableNotifications();
    } else {
      enableNotifications();
    }
  }, [isActive, enableNotifications, disableNotifications]);

  const sendTestNotification = useCallback(() => {
    if (!swRegistration) {
      alert('Service Worker não registrado ainda. Tente novamente.');
      return;
    }
    if (Notification.permission !== 'granted') {
      alert('Ative as notificações primeiro clicando em "Ativar lembretes".');
      return;
    }
    // Envia mensagem ao SW para disparar notificação imediatamente
    sendMessageToSW(swRegistration, {
      type: 'UPDATE_GOALS',
      goals: goalsRef.current,
    });
    sendMessageToSW(swRegistration, {
      type: 'SEND_TEST',
    });
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
