import { useEffect, useState, useCallback } from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Text, Card, ActivityIndicator, Button } from 'react-native-paper'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'expo-router'
import { useFocusEffect } from '@react-navigation/native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function InventoryScreen() {
  const [userData, setUserData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const [averageRating, setAverageRating] = useState('N/A')
  const [reviewCount, setReviewCount] = useState(0)
  const [recentReviews, setRecentReviews] = useState<any[]>([])


  const fetchProfile = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('users')
      .select(`
        username,
        avatar_url,
        sales_total,
        auction_status,
        forum_status,
        ban_reason,
        estados(nombre),
        municipios(nombre)
      `)
      .eq('id', (await supabase.auth.getUser()).data.user?.id)
      .single()

    if (!error) {
      setUserData({
        ...data,
        estado_nombre: data.estados?.nombre,
        municipio_nombre: data.municipios?.nombre,
      })
    }

    const userId = (await supabase.auth.getUser()).data.user?.id

    const { data: ratingsData } = await supabase
      .from('reviews')
      .select('rating, comentario, fecha')
      .eq('reviewed_id', userId)

    if (ratingsData && ratingsData.length > 0) {
      const total = ratingsData.length
      const avg = (
        ratingsData.reduce((sum, r) => sum + Number(r.rating), 0) / total
      ).toFixed(1)

      const sorted = [...ratingsData].sort(
        (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
      )

      setAverageRating(avg)
      setReviewCount(total)
      setRecentReviews(sorted.slice(0, 3))
    } else {
      setAverageRating('N/A')
      setReviewCount(0)
      setRecentReviews([])
    }

    setLoading(false)
  }

  useFocusEffect(
    useCallback(() => {
      fetchProfile()
    }, [])
  )

  if (loading) {
    return (
      <AuthGuard>
        <View style={styles.container}>
          <ActivityIndicator color="#00B0FF" />
        </View>
      </AuthGuard>
    )
  }

  if (!userData) {
    return (
      <AuthGuard>
        <View style={styles.container}>
          <Text style={{ color: 'white' }}>No se pudo cargar el perfil.</Text>
        </View>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard>
      <SafeAreaView style={styles.container}>
        <Image source={{ uri: userData.avatar_url }} style={styles.avatar} />
        <Text style={styles.username}>{userData.username}</Text>
        <Text style={styles.location}>
          {userData.municipio_nombre}, {userData.estado_nombre}
        </Text>

        <Button
          mode="outlined"
          onPress={() => router.push('/edit-profile')}
          style={styles.editButton}
          textColor="#00B0FF"
          icon="pencil"
        >
          Editar perfil
        </Button>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Historial de Ventas</Text>
            <Text style={styles.text}>🛒 Total de ventas: {userData.sales_total}</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Subastas</Text>
            {userData.auction_status === 'active' ? (
              <Text style={{ color: 'green' }}>✅ Activo</Text>
            ) : (
              <>
                <Text style={{ color: 'red' }}>🚫 Baneado</Text>
                <Text style={styles.text}>Motivo: {userData.ban_reason}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Foros</Text>
            {userData.forum_status === 'active' ? (
              <Text style={{ color: 'green' }}>✅ Activo</Text>
            ) : (
              <>
                <Text style={{ color: 'red' }}>🚫 Baneado</Text>
                <Text style={styles.text}>Motivo: {userData.ban_reason}</Text>
              </>
            )}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Reputación</Text>
            <Text style={styles.text}>⭐ {averageRating} ({reviewCount} valoraciones)</Text>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content>
            <Text variant="titleMedium">Últimos comentarios</Text>
            {recentReviews.length === 0 ? (
              <Text style={styles.text}>Este usuario aún no tiene comentarios.</Text>
            ) : (
              recentReviews.map((r, i) => (
                <Text key={i} style={styles.text}>🗣️ {r.comentario}</Text>
              ))
            )}
          </Card.Content>
        </Card>

      </SafeAreaView>
    </AuthGuard>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
    padding: 16,
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 12,
  },
  username: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#BFCED6',
  },
  location: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 20,
  },
  card: {
    width: '100%',
    marginBottom: 12,
    backgroundColor: '#BFCED6',
  },
  text: {
    color: '#1C1C1C',
    fontSize: 14,
  },
  editButton: {
    marginBottom: 16,
    borderColor: '#00B0FF',
  },
})
