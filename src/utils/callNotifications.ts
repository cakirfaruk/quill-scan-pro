// Call notification utilities
export const playRingtone = () => {
  let interval: NodeJS.Timeout;
  let currentAudioContext: AudioContext | null = null;
  
  const playBeep = () => {
    // Create new audio context and oscillator for each beep
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Higher frequency and volume for more noticeable sound
    oscillator.frequency.value = 1000;
    oscillator.type = 'sine';
    gainNode.gain.value = 0.8;
    
    oscillator.start(0);
    
    // Fade out
    setTimeout(() => {
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
      }, 400);
    }, 300);
    
    currentAudioContext = audioContext;
  };
  
  // Play immediately
  playBeep();
  
  // Repeat every 1.5 seconds for more urgency
  interval = setInterval(playBeep, 1500);
  
  return {
    stop: () => {
      clearInterval(interval);
      if (currentAudioContext) {
        try {
          currentAudioContext.close();
        } catch (e) {
          console.log('Error closing audio context:', e);
        }
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
