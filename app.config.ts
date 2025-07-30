import 'dotenv/config'

export default {
  expo: {
    name: 'TCG Trader',
    slug: 'tcg-trader',
    version: '1.0.0-b2',
    projectId: '0c1f931a-be48-463a-9dae-149b06176d5c',
    owner: 'onlycarry',
    scheme: 'myapp',
    orientation: 'portrait',
    icon: './assets/images/logo.png',
    splash: {
      image: './assets/images/splash.png',
      resizeMode: 'cover',
      backgroundColor: '#0A0F1C'
    },
    userInterfaceStyle: 'automatic',
    newArchEnabled: true,
    ios: {
      bundleIdentifier: 'com.onlycarry.tcgtrader',
      supportsTablet: true,
      runtimeVersion: '1.0.0'
    },
    android: {
      googleServicesFile: './android/app/google-services.json',
      useNextNotificationsApi: true,
      package: 'com.onlycarry.tcgtrader',
      runtimeVersion: '1.0.0',
      adaptiveIcon: {
        foregroundImage: './assets/images/logo.png',
        backgroundColor: '#0A0F1C'
      },
      targetSdkVersion: 35
    },
    web: {
      favicon: './assets/images/favicon.png'
    },
    updates: {
      url: 'https://u.expo.dev/0c1f931a-be48-463a-9dae-149b06176d5c',
    },
    plugins: [
      'react-native-iap',
      [
        'expo-splash-screen',
        {
          image: './assets/images/splash.png',
          resizeMode: 'contain',
          backgroundColor: '#0A0F1C'
        }
      ],
      'expo-notifications'
    ],
    experiments: {
      typedRoutes: true
    },
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: '0c1f931a-be48-463a-9dae-149b06176d5c',
      },
    },
  },
}
