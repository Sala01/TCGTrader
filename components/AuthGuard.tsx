import { useEffect } from 'react'
import { useRouter } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import useUser from '@/hooks/useUser'
import usePushToken from '@/hooks/usePushToken'
import { COLORS } from '../constants/GlobalStyles';


export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useUser()
  usePushToken(user?.id ?? null)
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/auth?returnTo=profile&redirected=true')
    }
  }, [loading, user])  

  if (loading || !user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={COLORS.color00B0FF} />
      </View>
    )
  }

  return <>{children}</>
}
