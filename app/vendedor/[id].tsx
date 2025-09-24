
import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, StyleSheet, FlatList } from 'react-native'
import { Text, Button, Card, Avatar } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import VendedorInfo from '@/components/VendedorInfo'
import { COLORS } from '../../constants/GlobalStyles';


export default function VendedorPerfilScreen() {
  const { id } = useLocalSearchParams()
  const [vendedor, setVendedor] = useState<any>(null)
  const [reviews, setReviews] = useState<any[]>([])

  useEffect(() => {
    const fetchData = async () => {
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('id', id)
        .single()

      const { data: opiniones } = await supabase
        .from('reviews')
        .select('id, comentario, rating, created_at, reviewer:users(username, avatar_url)')
        .eq('reviewed_id', id)
        .order('created_at', { ascending: false })

      
      const { data: cartas } = await supabase
        .from('inventory')
        .select('id, precio, foto_url, cards(name)')
        .eq('user_id', id)
        .eq('tipo', 'venta')
        .order('created_at', { ascending: false })

      if (cartas) {
        user.cartas = cartas.map(c => ({
          id: c.id,
          precio: c.precio,
          foto_url: c.foto_url,
          name: c.cards?.name ?? 'Sin nombre'
        }))
      }

      setVendedor(user)
      setReviews(opiniones ?? [])
    }

    if (id) fetchData()
  }, [id])

  if (!vendedor) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Cargando perfil...</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <VendedorInfo
        username={vendedor.username}
        avatar_url={vendedor.avatar_url}
        rating={parseFloat(vendedor.rating ?? '0')}
        sales_total={parseInt(vendedor.sales_total ?? '0')}
        estado_id={parseInt(vendedor.estado_id ?? '0')}
        pais_id={parseInt(vendedor.pais_id ?? '0')}
      />

      <Text style={styles.subtitulo}>Valoraciones recientes:</Text>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.reviewCard}>
            <Card.Title
              title={item.reviewer.username}
              left={(props) => <Avatar.Image {...props} size={36} source={{ uri: item.reviewer.avatar_url }} />}
              subtitle={`⭐ ${item.rating}`}
            />
            <Card.Content>
              <Text>{item.comentario}</Text>
            </Card.Content>
          </Card>
        )}
        ListEmptyComponent={
          <Text style={{ color: COLORS.color888, textAlign: 'center', marginTop: 12 }}>
            Este vendedor aún no tiene valoraciones.
          </Text>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.color0A0F1C,
    padding: 16,
  },
  title: {
    color: COLORS.colorFFF,
    fontSize: 18,
    textAlign: 'center',
    marginTop: 20,
  },
  button: {
    marginVertical: 16,
    borderRadius: 10,
  },
  subtitulo: {
    color: COLORS.colorBFCED6,
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 12,
  },
  reviewCard: {
    marginBottom: 12,
    backgroundColor: COLORS.color1C1C2E,
  },
})
