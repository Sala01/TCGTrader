import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';
import { Provider as PaperProvider } from 'react-native-paper'
import { SnackbarProvider } from '@/providers/SnackbarProvider'
import * as Notifications from 'expo-notifications'
import { router } from 'expo-router'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
})

import { useColorScheme } from '@/hooks/useColorScheme';
import { COLORS } from '../constants/GlobalStyles';


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

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      //console.log('Tocaste la notificación con data:', data);
      //router.push(`/chat/${data.chat_id}`)
    })

    return () => subscription.remove()
  }, [])


  if (!loaded) return null;

  return (
    <PaperProvider>
      <SnackbarProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
            <Stack.Screen name="card/[id]" options={{ title: 'Carta', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="search/index" options={{ title: 'Busqueda', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="inventory/add" options={{ title: 'Agregar Carta', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="inventory/massive" options={{ title: 'Agreggar Masivo', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="auth" options={{ title: 'Inicia Sesion', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="community/banlist/index" options={{ title: 'Ban List', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="community/metagame/index" options={{ title: 'Tier List', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="decklist/[deckTypeId]" options={{ title: 'Deck de Ejemplo', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="community/torneos/index" options={{ title: 'Torneos Recientes', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="edit-profile" options={{ title: 'Editar Perfil', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="inventory/auction" options={{ title: 'Crear Subastas', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="venta/[id]" options={{ title: 'Comprar', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="subasta/[id]" options={{ title: 'Subastar', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="pujar/[id]" options={{ title: 'Pujar', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="subastas" options={{ title: 'Subastas', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="community/foro/index" options={{ title: 'Foro', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="community/news/index" options={{ title: 'Noticias', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="community/foro/nuevo" options={{ title: 'Foro', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="community/foro/[id]" options={{ title: 'Foro', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="vendedor/[id]" options={{ title: 'Perfil Publico', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="chat/[id]" options={{ title: 'Chat', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="venta/concretar" options={{ title: 'Concretar Venta', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
            <Stack.Screen name="inventory/edit/[id]" options={{ title: 'Editar Inventario', headerTintColor: COLORS.colorFFF, headerStyle: { backgroundColor: COLORS.color0A0F1C } }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </SnackbarProvider>
    </PaperProvider>
  )
}

