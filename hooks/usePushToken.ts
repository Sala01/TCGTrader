// hooks/usePushToken.ts
import * as Notifications from 'expo-notifications'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import * as Device from 'expo-device'
import { Platform } from 'react-native'

export default function usePushToken(userId: string | null) {
  useEffect(() => {
    if (!userId) return

    const register = async () => {
      const { status } = await Notifications.getPermissionsAsync()
      let finalStatus = status
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync()
        finalStatus = newStatus
      }

      if (finalStatus !== 'granted') return

      const token = (await Notifications.getExpoPushTokenAsync()).data

      if (Device.isDevice && token) {
        await supabase
          .from('notification_tokens')
          .upsert({ user_id: userId, expo_token: token }, { onConflict: 'user_id' })
      }
    }

    register()
  }, [userId])
}
