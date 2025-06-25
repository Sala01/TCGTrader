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
import { MaterialCommunityIcons } from '@expo/vector-icons'

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
    const { data, error } = await supabase
      .from('users')
      .select(`username, avatar_url, sales_total, auction_status, forum_status, ban_reason, pais(nombre), estado(nombre)`)
      .eq('id', userId)
      .single()

    if (!error) {
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

  const getReviewsId = async ()  => {
    const { data: reviewed, error: datError } = await supabase
    .from('reviews')
    .select('sale_id')

    //console.log(reviewed);

    setReviewedSalesIds(reviewed?.map(r => r.sale_id) || [])
  }

  const fetchData = async () => {
    const userId = user.id

    await getReviewsId()

    if (section === 'comentarios') {
      const { data } = await supabase
        .from('reviews')
        .select('comentario')
        .eq('reviewed_id', userId)
        .range((page - 1) * pageSize, page * pageSize - 1)
      setComments(prev => [...prev, ...(data || [])])
    } else {
      const col = section === 'ventas' ? 'user_id' : 'buyer_id'
      const { data, error } = await supabase
        .from('sales')
        .select('id, price, cantidad, shipping_code, inventory(cards(name), id), status, user_id')
        .eq(col, userId)
        .range((page - 1) * pageSize, page * pageSize - 1)

      if (error) console.log(error);
      section === 'ventas' ? setVentas(prev => [...prev, ...(data || [])]) : setCompras(prev => [...prev, ...(data || [])])
    }
  }

  useFocusEffect(
    useCallback(() => {
      fetchProfile()
      setPage(1)
      setComments([])
      setVentas([])
      setCompras([])
      fetchData()
    }, [section, user])
  )

  useEffect(() => {
    if (page === 1) return
    fetchData()
  }, [page, section])

  const copyToClipboard = (text: string) => Clipboard.setString(text)

  const sendEmail = (vendedorId: string, ventaId: string, compradorId: string) => {
    const body = encodeURIComponent(`vendedor_id: ${vendedorId}\nventa_id: ${ventaId}\ncomprador_id: ${compradorId}\n\nEscribe tu mensaje abajo de esta línea y por favor no borres el texto anterior.\nAdjunta tu evidencia en este correo.`)
    Linking.openURL(`mailto:tcgtraderslatam@gmail.com?subject=Reporte de vendedor&body=${body}`)
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
    } else console.log(error)
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
            <Card style={{ margin: 8, backgroundColor: '#1C1C2E' }}>
              <Card.Content>
                <Text style={{ color: 'white' }}>🗣️ {item.comentario}</Text>
              </Card.Content>
            </Card>
          ) : (
            <Card style={{ margin: 8, backgroundColor: '#1C1C2E' }}>
              <Card.Content>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>🧾 {item.inventory?.cards.name}</Text>
                <Text style={{ color: 'white' }}>💲 Precio: ${item.price / item.cantidad}</Text>
                <Text style={{ color: 'white' }}>📦 Cantidad: {item.cantidad}</Text>
                <Text style={{ color: 'white' }}>💲 Total: ${item.price}</Text>
                <Text style={{ color: 'white' }}>📦 Estado: {item.status || 'N/A'}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={{ color: 'white', flex: 1 }}>📦 Guía: {item.shipping_code || 'N/A'}</Text>
                  {item.shipping_code && (
                    <IconButton icon="content-copy" onPress={() => copyToClipboard(item.shipping_code)} />
                  )}
                </View>
                {section === 'ventas' ? (
                  <Button mode="contained" style={{ marginTop: 8 }} onPress={() => {
                    setSelectedVentaId(item.id)
                    setGuiaInput(item.shipping_code || '')
                    setModalVisible(true)
                  }}>Agregar Guía de Envío</Button>
                ) : (
                  !reviewedSalesIds.includes(item.id) && (
                    <>
                      <Button mode="contained" style={{ marginTop: 8 }} onPress={() => {
                        setSelectedVentaForReview(item)
                        setRatingModalVisible(true)
                      }}>Marcar como recibido</Button>
                      <Button mode="outlined" onPress={() => sendEmail(item.user_id, item.id, user.id)} style={{ marginTop: 4 }}>Reportar vendedor</Button>
                    </>
                  )
                )}
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
        <>
          <Portal>
            <Dialog visible={modalVisible} onDismiss={() => setModalVisible(false)}>
              <Dialog.Title>Agregar guía de envío</Dialog.Title>
              <Dialog.Content>
                <TextInput label="Código de guía" value={guiaInput} onChangeText={setGuiaInput} mode="outlined" />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setModalVisible(false)}>Cancelar</Button>
                <Button loading={submitting} onPress={async () => {
                  if (!selectedVentaId || !guiaInput.trim()) return
                  setSubmitting(true)
                  const { error } = await supabase.from('sales').update({ shipping_code: guiaInput, status: 'Enviado' }).eq('id', selectedVentaId)
                  if (!error) {
                    setVentas(prev => prev.map(v => v.id === selectedVentaId ? { ...v, shipping_code: guiaInput, status: 'Enviado' } : v))
                    setModalVisible(false)
                    setGuiaInput('')
                  }
                  setSubmitting(false)
                }}>Guardar</Button>
              </Dialog.Actions>
            </Dialog>

            <Dialog visible={ratingModalVisible} onDismiss={() => setRatingModalVisible(false)}>
              <Dialog.Title>Califica al vendedor</Dialog.Title>
              <Dialog.Content>
                <View style={{ flexDirection: 'row', marginBottom: 12 }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <IconButton
                      key={star}
                      icon={selectedRating >= star ? 'star' : 'star-outline'}
                      iconColor="#FFD700"
                      size={30}
                      onPress={() => setSelectedRating(star)}
                    />
                  ))}
                </View>
                <TextInput
                  label="Comentario"
                  value={reviewText}
                  onChangeText={setReviewText}
                  multiline
                  mode="outlined"
                />
              </Dialog.Content>
              <Dialog.Actions>
                <Button onPress={() => setRatingModalVisible(false)}>Cancelar</Button>
                <Button loading={submitting} onPress={submitReview}>Enviar</Button>
              </Dialog.Actions>
            </Dialog>
          </Portal>

          <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C' }}>
            <View style={{ alignItems: 'center', padding: 16 }}>
              <Image source={{ uri: userData.avatar_url }} style={{ width: 100, height: 100, borderRadius: 50 }} />
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: '#BFCED6', marginTop: 8 }}>{userData.username}</Text>
              <Text style={{ color: '#ccc' }}>{userData.pais_nombre}, {userData.estado_nombre}</Text>
              <View style={{ flexDirection: 'row', marginTop: 8 }}>
                <Text style={{ color: userData.auction_status === 'active' ? 'green' : 'red', marginRight: 16 }}>🏷️ Subastas</Text>
                <Text style={{ color: userData.forum_status === 'active' ? 'green' : 'red' }}>💬 Foros</Text>
              </View>
              <Text style={{ color: '#ccc', marginTop: 8 }}>⭐ {rating} ({reviewCount})</Text>
              <Button mode="outlined" onPress={() => router.push('/edit-profile')} style={{ marginTop: 12, borderColor: '#00B0FF' }} textColor="#00B0FF">
                Editar perfil
              </Button>
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
              {['comentarios', 'ventas', 'compras'].map(key => (
                <Button key={key} mode={section === key ? 'contained' : 'outlined'} buttonColor={section === key ? '#00B0FF' : undefined} onPress={() => { setSection(key as any); setPage(1) }}>{key.charAt(0).toUpperCase() + key.slice(1)}</Button>
              ))}
            </View>
            {renderTabContent()}
          </SafeAreaView>
        </>
      )}
    </AuthGuard>
  )
}
