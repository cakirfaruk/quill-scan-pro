// Call notification utilities
export const playRingtone = () => {
  // Create a simple beep sound using Web Audio API
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);
  
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  gainNode.gain.value = 0.3;
  
  const playBeep = () => {
    oscillator.start(0);
    setTimeout(() => {
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    }, 100);
  };
  
  playBeep();
  const interval = setInterval(playBeep, 2000);
  
  return {
    stop: () => {
      clearInterval(interval);
      try {
        oscillator.stop();
        audioContext.close();
      } catch (e) {
        console.log('Error stopping ringtone:', e);
      }
    }
  };
};

export const vibrate = () => {
  if ('vibrate' in navigator) {
    navigator.vibrate([200, 100, 200, 100, 200]);
  }
};

export const showBrowserNotification = (title: string, options?: NotificationOptions) => {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      ...options
    });
  }
};
