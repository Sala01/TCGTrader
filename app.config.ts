import 'dotenv/config'

export default {
  expo: {
    name: 'TCG Trader',
    slug: 'tcg-trader',
    version: '1.0.0',
    android: {
      package: 'com.onlycarry.tcgtrader',
    },
    ios: {
      bundleIdentifier: 'com.onlycarry.tcgtrader', // asegúrate de usar el mismo ID para iOS
    },
    plugins: ['react-native-iap'], // <-- 👈 ESTA LÍNEA ES LA QUE FALTA
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    },
  },
}
