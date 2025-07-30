// hooks/usePushToken.ts
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

export default function usePushToken(userId: string | null) {
  useEffect(() => {
    console.log("pushId", userId);
    if (!userId) return

    const register = async () => {
      const { status } = await Notifications.getPermissionsAsync()
      let finalStatus = status
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync()
        finalStatus = newStatus
      }
      console.log("FinalStatus", finalStatus);
      if (finalStatus !== 'granted') return
      console.log("here");

      const token = (await Notifications.getExpoPushTokenAsync()).data

      console.log("token", token);

      if (Device.isDevice && token) {
        const { data, error } = await supabase
          .from('notification_tokens')
          .upsert({ user_id: userId, expo_token: token }, { onConflict: 'user_id' });

        if (error) {
          console.error('Error al guardar token de notificación:', error.message);
        }
      }
    }

    register()
  }, [userId])
}
