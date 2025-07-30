// @ts-nocheck
import { useEffect, useState, useCallback } from 'react'
import { View, Image, FlatList, Clipboard, Linking } from 'react-native'
import { Text, Button, Card, Dialog, Portal, TextInput, IconButton } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'
import AuthGuard from '@/components/AuthGuard'
import useUser from '@/hooks/useUser'

export default function PerfilScreen() {
  const [section, setSection] = useState<'comentarios' | 'ventas' | 'compras'>('comentarios')
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [comments, setComments] = useState<any[]>([])
  const [ventas, setVentas] = useState<any[]>([])
  const [compras, setCompras] = useState<any[]>([])
  const [rating, setRating] = useState('N/A')
  const [reviewCount, setReviewCount] = useState(0)
  const [page, setPage] = useState(1)
  const pageSize = 10
  const router = useRouter()
  const { user } = useUser()
  const [reviewedSalesIds, setReviewedSalesIds] = useState<string[]>([])
  const [modalVisible, setModalVisible] = useState(false)
  const [selectedVentaId, setSelectedVentaId] = useState<string | null>(null)
  const [guiaInput, setGuiaInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [ratingModalVisible, setRatingModalVisible] = useState(false)
  const [reviewText, setReviewText] = useState('')
  const [selectedRating, setSelectedRating] = useState<number>(0)
  const [selectedVentaForReview, setSelectedVentaForReview] = useState<any>(null)

  const fetchProfile = async () => {
    setLoading(true)
    const userId = user.id
    const { data } = await supabase
      .from('users')
      .select(`username, avatar_url, sales_total, auction_status, forum_status, ban_reason, pais(nombre), estado(nombre)`)
      .eq('id', userId)
      .single()

    if (data) {
      setUserData({
        ...data,
        estado_nombre: data.estado?.nombre,
        pais_nombre: data.pais?.nombre,
      })
    }

    const { data: ratingsData } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', userId)

    if (Array.isArray(ratingsData) && ratingsData.length > 0) {
      const avg = (ratingsData.reduce((sum, r) => sum + Number(r.rating), 0) / ratingsData.length).toFixed(1)
      setRating(avg)
      setReviewCount(ratingsData.length)
    } else {
      setRating('N/A')
      setReviewCount(0)
    }
    setLoading(false)
  }

  const getReviewsId = async () => {
    const { data } = await supabase.from('reviews').select('sale_id')
    setReviewedSalesIds(data?.map(r => r.sale_id) || [])
  }

  const fetchData = async () => {
    const userId = user.id
    await getReviewsId()

    if (section === 'comentarios') {
      const { data } = await supabase
        .from('reviews')
        .select('*')
        .eq('reviewed_id', userId)
        .range((page - 1) * pageSize, page * pageSize - 1)
      setComments(prev => [...prev, ...(data || [])])
    } else {
      const col = section === 'ventas' ? 'user_id' : 'buyer_id'
      const { data } = await supabase
        .from('sales')
        .select('id, price, cantidad, shipping_code, inventory(cards(name), id), status, user_id')
        .eq(col, userId)
        .range((page - 1) * pageSize, page * pageSize - 1)
      section === 'ventas' ? setVentas(prev => [...prev, ...(data || [])]) : setCompras(prev => [...prev, ...(data || [])])
    }
  }

  useFocusEffect(useCallback(() => {
    fetchProfile()
    setPage(1)
    setComments([])
    setVentas([])
    setCompras([])
    fetchData()
  }, [section, user]))

  useEffect(() => {
    if (page > 1) fetchData()
  }, [page, section])

  const copyToClipboard = (text: string) => Clipboard.setString(text)

  const sendEmail = (vendedorId: string, ventaId: string, compradorId: string) => {
    const body = encodeURIComponent(`vendedor_id: ${vendedorId}\nventa_id: ${ventaId}\ncomprador_id: ${compradorId}\n\nEscribe tu mensaje abajo de esta línea y por favor no borres el texto anterior.\nAdjunta tu evidencia en este correo.`)
    Linking.openURL(`mailto:ayuda@onlycarry.com?subject=Reporte de vendedor&body=${body}`)
  }

  const submitReview = async () => {
    if (!selectedRating || !reviewText.trim() || !selectedVentaForReview) return
    setSubmitting(true)
    const { error } = await supabase.from('reviews').insert({
      rating: selectedRating,
      comentario: reviewText,
      reviewed_id: selectedVentaForReview.user_id,
      reviewer_id: user.id,
      sale_id: selectedVentaForReview.id
    });
    if (!error) {
      getReviewsId()
      setRatingModalVisible(false)
      setReviewText('')
      setSelectedRating(0)
    }
    setSubmitting(false)
  }

  const renderTabContent = () => {
    const data = section === 'ventas' ? ventas : compras
    return (
      <FlatList
        data={section === 'comentarios' ? comments : data}
        keyExtractor={(item, i) => (item.id || i).toString()}
        renderItem={({ item }) => (
          section === 'comentarios' ? (
            <Card style={{ margin: 8, backgroundColor: '#1C1C2E', borderRadius: 12 }}>
              <Card.Content>
                <Text style={{ color: 'white' }}>🗣️ {item.comentario} - ⭐ {item.rating}</Text>
              </Card.Content>
            </Card>
          ) : (
            <Card style={{ margin: 8, backgroundColor: '#1C1C2E', borderRadius: 12 }}>
              <Card.Content>
                <Text style={{ color: '#BFCED6', fontWeight: 'bold' }}>🃏 {item.inventory?.cards.name}</Text>
                <Text style={{ color: '#ccc' }}>
                  💲 Precio unitario: ${item.price / item.cantidad} 📦 Cantidad: {item.cantidad} 💰 Total: ${item.price}
                </Text>
                <Text style={{ color: '#ccc' }}>
                  🚚 Estado del envío: {item.status || 'N/A'}
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: '#ccc', flex: 1 }}>📄 Guía: {item.shipping_code || 'N/A'}</Text>
                  {item.shipping_code && (
                    <IconButton icon="content-copy" onPress={() => copyToClipboard(item.shipping_code)} iconColor="#00B0FF" />
                  )}
                </View>
              </Card.Content>
            </Card>

          )
        )}
        onEndReached={() => setPage(p => p + 1)}
        onEndReachedThreshold={0.5}
      />
    )
  }

  return (
    <AuthGuard>
      {userData && (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C' }}>
          <View style={{ alignItems: 'flex-end', padding: 8 }}>
            <IconButton
              icon="logout"
              iconColor="#FF5555"
              size={24}
              onPress={async () => {
                await supabase.auth.signOut()
                router.replace('/home')
              }}
            />
          </View>
          {user && (
            <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#1C1C2E', margin: 12, borderRadius: 16 }}>
              <Image
                source={{ uri: userData.avatar_url }}
                style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#00B0FF', marginRight: 12 }}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#BFCED6' }}>{userData.username}</Text>
                <Text style={{ fontSize: 14, color: '#ccc' }}>{user.email}</Text>
                <Text style={{ fontSize: 14, color: '#ccc' }}>{userData.pais_nombre}, {userData.estado_nombre}</Text>
                <Text style={{ color: '#ccc', marginTop: 4 }}>⭐ {rating} ({reviewCount})</Text>
              </View>
              <IconButton icon="pencil" iconColor="#00B0FF" onPress={() => router.push('/edit-profile')} />
            </View>
          )}


          <View style={{
            flexDirection: 'row',
            backgroundColor: '#1C1C2E',
            borderRadius: 32,
            marginHorizontal: 16,
            padding: 4,
            marginBottom: 16,
            justifyContent: 'space-between',
          }}>
            {[
              { key: 'comentarios', label: 'Coment.' },
              { key: 'ventas', label: 'Ventas' },
              { key: 'compras', label: 'Compras' },
            ].map(({ key, label }) => (
              <Button
                key={key}
                mode="contained"
                onPress={() => { setSection(key); setPage(1) }}
                buttonColor={section === key ? '#00B0FF' : 'transparent'}
                textColor={section === key ? '#fff' : '#BFCED6'}
                style={{
                  flex: 1,
                  marginHorizontal: 4,
                  borderRadius: 24,
                  elevation: section === key ? 2 : 0,
                  paddingVertical: 4,
                }}
                contentStyle={{ height: 40 }}
                labelStyle={{ fontSize: 13, textAlign: 'center' }}
              >
                {label}
              </Button>
            ))}

          </View>

          {renderTabContent()}
        </SafeAreaView>
      )}
    </AuthGuard>
  )
}
