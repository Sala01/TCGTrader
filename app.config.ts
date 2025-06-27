import 'dotenv/config'

export default {
  expo: {
    name: 'TCG Trader',
    slug: 'tcg-trader',
    version: '1.0.0',
    owner: 'onlycarry',
    icon: './assets/images/logo.png',
    android: {
      package: 'com.onlycarry.tcgtrader',
      runtimeVersion: '1.0.0',
    },
    ios: {
      bundleIdentifier: 'com.onlycarry.tcgtrader',
      runtimeVersion: '1.0.0',
    },
    updates: {
      url: 'https://u.expo.dev/0c1f931a-be48-463a-9dae-149b06176d5c',
    },
    plugins: ['react-native-iap'],
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      eas: {
        projectId: '0c1f931a-be48-463a-9dae-149b06176d5c',
      },
    },
  },
}
