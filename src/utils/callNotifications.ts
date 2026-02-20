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
    
    // Very high frequency and maximum volume for alert
    oscillator.frequency.value = 1400;
    oscillator.type = 'sine';
    gainNode.gain.value = 1.0; // Maximum volume
    
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
  
  // Repeat every 1 second for maximum urgency
  interval = setInterval(playBeep, 1000);
  
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
