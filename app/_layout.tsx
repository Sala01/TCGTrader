import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider as PaperProvider } from 'react-native-paper'
import { SnackbarProvider } from '@/providers/SnackbarProvider'



import { useColorScheme } from '@/hooks/useColorScheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) return null;

  return (
    <PaperProvider>
      <SnackbarProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="card/[id]" options={{ title: 'Carta', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="search/index" options={{ title: 'Busqueda', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="inventory/add" options={{ title: 'Agregar Carta', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="inventory/massive" options={{ title: 'Agreggar Masivo', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="auth" options={{ title: 'Inicia Sesion', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="community/banlist/index" options={{ title: 'Ban List', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="community/metagame/index" options={{ title: 'Tier List', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="decklist/[deckTypeId]" options={{ title: 'Deck de Ejemplo', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="community/torneos/index" options={{ title: 'Torneos Recientes', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="edit-profile" options={{ title: 'Editar Perfil', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="inventory/auction" options={{ title: 'Crear Subastas', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="venta/[id]" options={{ title: 'Comprar', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="subasta/[id]" options={{ title: 'Subastar', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="pujar/[id]" options={{ title: 'Pujar', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="subastas" options={{ title: 'Subastas', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="community/foro/index" options={{ title: 'Foro', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="community/news/index" options={{ title: 'Noticias', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="community/foro/nuevo" options={{ title: 'Foro', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="community/foro/[id]" options={{ title: 'Foro', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="vendedor/[id]" options={{ title: 'Perfil Publico', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="chat/[id]" options={{ title: 'Chat', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
            <Stack.Screen name="venta/concretar" options={{ title: 'Concretar Venta', headerTintColor: '#fff', headerStyle: { backgroundColor: '#0A0F1C' } }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SnackbarProvider>
    </PaperProvider>
  )
}

