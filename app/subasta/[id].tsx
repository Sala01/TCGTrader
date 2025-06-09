import { useLocalSearchParams, router } from 'expo-router'
import { View, StyleSheet, ScrollView, Image } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'
import VendedorInfo from '@/components/VendedorInfo'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { formatDistanceToNowStrict, isAfter } from 'date-fns'

export default function SubastaDetalleScreen() {
  const params = useLocalSearchParams()

  const [subasta, setSubasta] = useState<any>(params?.foto_url ? {
    id: params.id,
    nombre: params.nombre,
    estado: params.estado,
    valor_actual: params.valor_actual,
    puja_minima: params.puja_minima,
    fecha_limite: params.fecha_limite,
    foto_url: params.foto_url,
    users: {
      id: params.vendedor_id,
      username: params.vendedor_nombre,
      avatar_url: params.vendedor_avatar,
      rating: params.vendedor_rating,
      sales_total: params.vendedor_ventas,
      estado_id: params.estado_usuario_id,
      municipio_id: params.municipio_usuario_id
    }
  } : null)

  const [pujas, setPujas] = useState<any[]>([])
  const [timeLeft, setTimeLeft] = useState('')
  const [finalizada, setFinalizada] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)

  // Autenticación
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])

  // Fetch fallback si no hay datos precargados
  useEffect(() => {
    if (!subasta && params.id) {
      const load = async () => {
        const { data, error } = await supabase
          .from('inventory')
          .select(`
            id,
            tipo,
            nombre,
            estado,
            valor_actual,
            puja_minima,
            fecha_limite,
            foto_url,
            users (
              id, username, avatar_url, rating, sales_total, estado_id, municipio_id
            )
          `)
          .eq('id', params.id)
          .single()

        if (data) setSubasta(data)
        if (error) console.error('Error loading fallback subasta:', error)
      }

      load()
    }
  }, [params.id])

  // Historial de pujas
  useEffect(() => {
    const fetchPujas = async () => {
      const { data } = await supabase
        .from('pujas')
        .select('monto, user_id, users(username)')
        .eq('inventario_id', params.id)
        .order('monto', { ascending: false })

      setPujas(data ?? [])
    }

    if (params.id) fetchPujas()
  }, [params.id])

  // Contador en vivo
  useEffect(() => {
    const interval = setInterval(() => {
      if (!subasta?.fecha_limite) return
      const end = new Date(subasta.fecha_limite)
      if (isNaN(end.getTime())) return

      const finished = isAfter(new Date(), end)
      setFinalizada(finished)

      if (!finished) {
        setTimeLeft(formatDistanceToNowStrict(end, { addSuffix: true }))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [subasta?.fecha_limite])

  const ganador = pujas?.[0]?.users?.username
  const ganadorId = pujas?.[0]?.user_id

  if (!subasta) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#00B0FF" />
        <Text style={{ color: 'white', marginTop: 16 }}>Cargando subasta...</Text>
      </View>
    )
  }

  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: subasta.foto_url }} style={styles.image} />

      <View style={styles.card}>
        <Text variant="titleLarge" style={styles.title}>{subasta.nombre}</Text>

        <Text style={styles.label}>Valor actual:</Text>
        <Text style={styles.value}>${subasta.valor_actual}</Text>

        <Text style={styles.label}>Estado:</Text>
        <Text style={styles.value}>{subasta.estado}</Text>

        <Text style={styles.label}>Tiempo restante:</Text>
        <Text style={[styles.value, finalizada && styles.finalizada]}>
          {finalizada ? 'Subasta finalizada' : timeLeft}
        </Text>

        {finalizada && ganador && (
          <Text style={styles.ganador}>
            🏆 Ganador: {ganador}
          </Text>
        )}

        <View style={styles.divider} />

        <VendedorInfo
          username={subasta.users.username}
          avatar_url={subasta.users.avatar_url}
          rating={parseFloat(subasta.users.rating ?? '0')}
          sales_total={parseInt(subasta.users.sales_total ?? '0')}
          estado_id={parseInt(subasta.users.estado_id ?? '0')}
          municipio_id={parseInt(subasta.users.municipio_id ?? '0')}
        />

        {!finalizada && (
          <Button
            mode="contained"
            icon="gavel"
            buttonColor="#00B0FF"
            textColor="#1C1C1C"
            style={styles.button}
            onPress={() => router.push({ pathname: '/pujar/[id]', params: { id: subasta.id } })}
          >
            Hacer una puja
          </Button>
        )}

        {finalizada && userId === subasta.users.id && (
          <Button
            icon="chat"
            mode="contained"
            buttonColor="#00B0FF"
            textColor="#1C1C1C"
            style={styles.button}
            onPress={() =>
              router.push({
                pathname: '/chat/[id]',
                params: {
                  id: subasta.users.id,
                  nombre: subasta.users.username,
                },
              })
            }
          >
            Contactar Vendedor
          </Button>
        )}

        <View style={styles.divider} />

        <Text style={styles.label}>Historial de pujas:</Text>
        {pujas.length > 0 ? (
          pujas.map((puja, index) => (
            <Text key={index} style={styles.value}>
              {puja.users?.username ?? 'Usuario'}: ${puja.monto}
            </Text>
          ))
        ) : (
          <Text style={styles.value}>No hay pujas aún</Text>
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
    padding: 16,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#0A0F1C',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    aspectRatio: 2 / 3,
    borderRadius: 12,
    marginBottom: 20,
    resizeMode: 'cover',
  },
  card: {
    backgroundColor: '#BFCED6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 25
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1C1C1C',
    marginBottom: 10,
  },
  label: {
    color: '#444',
    fontWeight: '600',
    marginTop: 8,
  },
  value: {
    color: '#1C1C1C',
  },
  finalizada: {
    color: '#D32F2F',
    fontWeight: 'bold',
  },
  ganador: {
    color: '#388E3C',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#999',
    marginVertical: 16,
  },
  button: {
    marginTop: 20,
    borderRadius: 10,
  },
})
