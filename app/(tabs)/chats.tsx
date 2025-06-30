import { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Image } from 'react-native'
import { Text, List, ActivityIndicator } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import AuthGuard from '@/components/AuthGuard'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function ConversationsScreen() {
  const [conversations, setConversations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (userId) fetchConversations()
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('conversations-updates')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          fetchConversations()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  const fetchConversations = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('conversations')
      .select(`
        id,
        user1,
        user2,
        created_at,
        messages (
          id,
          content,
          created_at,
          sender_id
        ),
        user1_data: user1 (username, avatar_url),
        user2_data: user2 (username, avatar_url)
      `)
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setConversations(data)
    setLoading(false)
  }

  const renderItem = ({ item }: { item: any }) => {
    const lastMessage = item.messages?.[item.messages.length - 1]?.content || 'Sin mensajes'
    const isUser1 = item.user1 === userId
    const otherUser = isUser1 ? item.user2_data : item.user1_data

    return (
      <TouchableOpacity onPress={() => router.push(`/chat/${item.id}`)}>
        <List.Item
          title={otherUser?.username ?? 'Usuario'}
          description={lastMessage}
          titleStyle={{ color: 'white' }}
          descriptionStyle={{ color: '#aaa' }}
          left={() =>
            otherUser?.avatar_url ? (
              <Image
                source={{ uri: otherUser.avatar_url }}
                style={{ width: 40, height: 40, borderRadius: 20, margin: 8 }}
              />
            ) : (
              <List.Icon icon="account" color="#00B0FF" />
            )
          }
          style={{ backgroundColor: '#1C1C2E', marginBottom: 8, borderRadius: 12 }}
        />
      </TouchableOpacity>
    )
  }

  return (
    <AuthGuard>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 12 }}>
        {loading ? (
          <ActivityIndicator animating color="#00B0FF" />
        ) : conversations.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
            <Text style={{ color: 'gray', fontSize: 16, textAlign: 'center' }}>
              No tienes chats activos todavía. Envía una oferta o responde una para comenzar una conversación.
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        )}
      </SafeAreaView>
    </AuthGuard>
  )
}
