import React, { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, StyleSheet } from 'react-native'
import { Text, Button, Card } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

export default function ActiveAuctionsSection() {
  const [subastas, setSubastas] = useState<any[]>([])

  useEffect(() => {
    const fetchSubastas = async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          valor_actual,
          puja_minima,
          estado,
          fecha_limite,
          foto_url,
          created_at,
          users ( id, username, avatar_url )
        `)
        .eq('tipo', 'subasta')
        .eq('estatus', 'activa')
        .order('created_at', { ascending: false })
        .limit(5)

      if (!error && data) setSubastas(data)
    }

    fetchSubastas()
  }, [])

  const getTiempoRestante = (fechaLimite: string) => {
    const ahora = new Date()
    const fin = new Date(fechaLimite)
    const diff = fin.getTime() - ahora.getTime()
    if (diff <= 0) return 'Finalizada'
    const h = Math.floor(diff / 3600000)
    const m = Math.floor((diff % 3600000) / 60000)
    return `${h}h ${m}m restantes`
  }

  if (subastas.length === 0) return null

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={subastas}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/subasta/[id]',
                params: {
                  id: item.id.toString(),
                  nombre: 'Carta en Subasta',
                  estado: item.estado,
                  valor_actual: item.valor_actual?.toString(),
                  puja_minima: item.puja_minima?.toString(),
                  fecha_limite: item.fecha_limite,
                  foto_url: item.foto_url,
                  vendedor_id: item.users.id,
                  vendedor_nombre: item.users.username,
                  vendedor_avatar: item.users.avatar_url,
                  vendedor_rating: '0',
                  vendedor_ventas: '0',
                  estado_usuario_id: '0',
                  municipio_usuario_id: '0',
                },
              })
            }
          >
            <Card style={styles.card} elevation={3}>
              <Card.Cover source={{ uri: item.foto_url }} style={styles.image} />
              <Card.Content style={styles.cardContent}>
                <Text style={styles.username}>{item.users.username}</Text>
                <Text style={styles.valorActual}>Actual: ${item.valor_actual}</Text>
                <Text style={styles.minimo}>+${item.puja_minima} mínimo</Text>
                <Text style={styles.tiempo}>{getTiempoRestante(item.fecha_limite)}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
        ListFooterComponent={() => (
          <Button
            mode="outlined"
            textColor="#00C8FF"
            style={styles.footerButton}
            onPress={() => router.push('/subastas')}
          >
            Ver todas
          </Button>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  scrollContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  card: {
    width: 160,
    marginRight: 12,
    backgroundColor: '#1C1C2E',
    borderRadius: 16,
    overflow: 'hidden',
  },
  image: {
    height: 180,
    resizeMode: 'cover',
  },
  cardContent: {
    marginTop: 8,
  },
  username: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 13,
    marginBottom: 2,
  },
  valorActual: {
    color: '#00C8FF',
    fontWeight: 'bold',
    fontSize: 13,
  },
  minimo: {
    color: '#FFB300',
    fontSize: 12,
    marginTop: 2,
  },
  tiempo: {
    color: '#bbb',
    fontSize: 12,
    marginTop: 2,
  },
  footerButton: {
    alignSelf: 'center',
    borderColor: '#00C8FF',
    borderRadius: 30,
    marginRight: 16,
    marginTop: 8,
  },
})
