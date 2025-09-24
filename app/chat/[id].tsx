import { useEffect, useState, useRef, useCallback } from 'react'
import { View, FlatList, TextInput, Image, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native'
import { useFocusEffect } from '@react-navigation/native'
import { Text, IconButton, ActivityIndicator, Button } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { sendPushNotification } from '@/lib/sendPush'
import { COLORS } from '../../constants/GlobalStyles';


function ProductoRelacionado({ nombre, precio, foto_url, onConcretar }: { nombre: string; precio: string; foto_url: string; onConcretar?: () => void }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: foto_url }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{nombre}</Text>
        <Text style={styles.price}>${precio}</Text>
      </View>
      {onConcretar && (
        <Button mode="contained" onPress={onConcretar} style={styles.button} labelStyle={{ fontSize: 12 }}>Concretar</Button>
      )}
    </View>
  )
}

export default function ChatDetailScreen() {
  const { id: conversationId } = useLocalSearchParams()
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [otherUser, setOtherUser] = useState<any>(null)
  const [producto, setProducto] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openChat, setOpenChat] = useState(true)
  const flatListRef = useRef<FlatList>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
      //console.log(data?.user?.id);
    })
  }, [])


  useFocusEffect(
    useCallback(() => {
      if (userId && conversationId) {
        fetchConversationData()
      }
    }, [userId, conversationId])
  )

  useEffect(() => {
    if (!conversationId) return

    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          console.log('📩 Nuevo mensaje recibido vía Realtime:', payload)
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
      .select('user1, user2, inventory_id, closed')
      .eq('id', conversationId)
      .single()

    if (error) return console.error(error)

    setOpenChat(convo.closed)

    const otherId = convo.user1 === userId ? convo.user2 : convo.user1

    const { data: userData } = await supabase
      .from('users')
      .select('username, avatar_url')
      .eq('id', otherId)
      .single()

    setOtherUser({ id: otherId, ...userData })

    await fetchMessages()

    const { data: prod, error: errorInv } = await supabase
      .from('inventory')
      .select('id, precio, foto_url, cards(name), user_id')
      .eq('id', convo.inventory_id)
      .single()

    if (prod) setProducto(prod)

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

    // Forzar scroll al final
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true })
    }, 100) // pequeño delay para que se renderice el nuevo mensaje

    // Enviar notificación push
    const otherId = otherUser.id
    const { data } = await supabase
      .from('notification_tokens')
      .select('expo_token')
      .eq('user_id', otherId)
      .single()

    if (data?.expo_token) {
      await sendPushNotification(data.expo_token, 'Nuevo mensaje', input.trim())
    }

    await fetchMessages();
  }


  const concretarVenta = () => {
    //console.log(otherUser.id);
    if (!producto || !producto.id || !userId) return
    router.push({
      pathname: '/venta/concretar',
      params: {
        inventario_id: producto.id.toString(),
        comprador_id: otherUser.id,
      }
    })
  }

  const renderItem = ({ item }: { item: any }) => {
    const isMe = item.sender_id === userId
    return (
      <View
        style={{
          alignSelf: isMe ? 'flex-end' : 'flex-start',
          backgroundColor: isMe ? COLORS.color00B0FF : COLORS.color1C1C2E,
          padding: 10,
          marginVertical: 4,
          marginHorizontal: 8,
          borderRadius: 12,
          maxWidth: '80%',
        }}
      >
        <Text style={{ color: COLORS.white }}>{item.content}</Text>
      </View>
    )
  }

  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.color0A0F1C, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator animating color={COLORS.color00B0FF} />
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.color0A0F1C }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 12, backgroundColor: COLORS.color1C1C2E }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {otherUser?.avatar_url ? (
            <Image source={{ uri: otherUser.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20, marginRight: 12 }} />
          ) : (
            <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.color333, marginRight: 12 }} />
          )}
          <Text style={{ color: COLORS.white, fontSize: 16 }}>{otherUser?.username ?? 'Usuario'}</Text>
        </View>
        <IconButton
          icon="account"
          iconColor={COLORS.color00B0FF}
          onPress={() =>
            router.push({ pathname: '/vendedor/[id]', params: { id: otherUser.id } })
          }
        />
      </View>

      {producto && (
        <ProductoRelacionado
          nombre={producto.cards.name}
          precio={producto.precio.toString()}
          foto_url={producto.foto_url}
          onConcretar={userId === producto.user_id ? concretarVenta : undefined}
        />
      )}

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
          backgroundColor: COLORS.color1C1C2E,
        }}
      >
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe un mensaje..."
          placeholderTextColor={COLORS.color888}
          style={{
            flex: 1,
            color: COLORS.white,
            backgroundColor: COLORS.color2A2A3F,
            borderRadius: 20,
            paddingHorizontal: 12,
            paddingVertical: 8,
            marginRight: 8,
          }}
        />
        <IconButton icon="send" iconColor={COLORS.color00B0FF} onPress={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.color1C1C2E,
    padding: 10,
    margin: 10,
    borderRadius: 12,
  },
  image: {
    width: 50,
    height: 70,
    borderRadius: 6,
    marginRight: 12,
  },
  title: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  price: {
    color: COLORS.color00B0FF,
    marginTop: 4,
  },
  button: {
    marginLeft: 12,
  },
})
