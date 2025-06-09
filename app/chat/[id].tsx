import { useEffect, useState, useRef } from 'react'
import { View, FlatList, TextInput, Image, KeyboardAvoidingView, Platform } from 'react-native'
import { Text, IconButton, ActivityIndicator } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { sendPushNotification } from '@/lib/sendPush'

export default function ChatDetailScreen() {
  const { id: conversationId } = useLocalSearchParams()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  useEffect(() => {
    if (userId && conversationId) {
      fetchConversationData()
    }
  }, [userId, conversationId])

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])

  const fetchConversationData = async () => {
    setLoading(true)

    const { data: convo, error } = await supabase
      .from('conversations')
      .select('user1, user2')
      .eq('id', conversationId)
      .single()

    if (error) return console.error(error)

    const otherId = convo.user1 === userId ? convo.user2 : convo.user1

    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', otherId)
      .single()

    setOtherUser({ id: otherId, ...userData })

    await fetchMessages()
    setLoading(false)
  }

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })

    if (!error) setMessages(data)
  }

  const sendMessage = async () => {
  if (!input.trim() || !userId) return

  await supabase.from('messages').insert({
    conversation_id: conversationId,
    sender_id: userId,
    content: input.trim(),
  })

  setInput('')

  // Obtener el otro usuario
  const otherId = otherUser.id

  // Buscar su token
  const { data } = await supabase
    .from('notification_tokens')
    .select('expo_token')
    .eq('user_id', otherId)
    .single()

  if (data?.expo_token) {
    await sendPushNotification(data.expo_token, 'Nuevo mensaje', input.trim())
  }
}


  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.sender_id === userId
    return (
      <View
        style={{
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          backgroundColor: isMe ? '#00B0FF' : '#1C1C2E',
          padding: 10,
          marginVertical: 4,
          marginHorizontal: 8,
          borderRadius: 12,
          maxWidth: '80%',
        }}
      >
        <Text style={{ color: 'white' }}>{item.content}</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator animating color="#00B0FF" />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#1C1C2E' }}>
        {otherUser?.avatar_url ? (
          <Image source={{ uri: otherUser.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
        ) : (
          <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#333', marginRight: 12 }} />
        )}
        <Text style={{ color: 'white', fontSize: 16 }}>{otherUser?.username ?? 'Usuario'}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingVertical: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 8,
          backgroundColor: '#1C1C2E',
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#888"
          style={{
            flex: 1,
            color: 'white',
            backgroundColor: '#2A2A3F',
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginRight: 8,
          }}
        />
        <IconButton icon="send" iconColor="#00B0FF" onPress={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}
