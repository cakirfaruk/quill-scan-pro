import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.f3a23c96de724efd8bdb943c8b98a400',
  appName: 'Stellara',
  webDir: 'dist',
  server: {
    url: 'https://f3a23c96-de72-4efd-8bdb-943c8b98a400.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: "DARK",
      backgroundColor: "#0a0a0f"
    },
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    },
    Keyboard: {
      resize: "body",
      style: "DARK",
      resizeOnFullScreen: true
    }
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
    scheme: "stellara"
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
