import { useLocalSearchParams } from 'expo-router'
import { Dimensions, ScrollView, View, Image, FlatList, TouchableOpacity } from 'react-native'
import { Text, Card, Divider, Title, Subheading, IconButton, Button } from 'react-native-paper'
import { LineChart } from 'react-native-chart-kit'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

const screenWidth = Dimensions.get('window').width
const fallbackUrl = 'https://static.wikia.nocookie.net/yugioh/images/8/85/TheWingedDragonofRa-GBI-AE-Back.png/revision/latest?cb=20120824234540'

export default function CardDetailScreen() {
  const {
    id,
    name,
    image_url,
    rarity,
    description,
    number,
    attribute,
    monster_type,
    card_type,
    attack,
    defense,
  } = useLocalSearchParams()

  const [suggested, setSuggested] = useState<any[]>([])
  const [imageError, setImageError] = useState(false)
  const [errorImages, setErrorImages] = useState<{ [id: string]: boolean }>({})
  const [listings, setListings] = useState<any[]>([])
  const [priceHistory, setPriceHistory] = useState<{ fecha: string; precio: number }[]>([])

  useEffect(() => {
    const fetchSuggested = async () => {
      if (!id) return
      const { data, error } = await supabase.rpc('cards_also_viewed', {
        card_id: Number(id),
      })
      if (!error) setSuggested(data || [])
      else console.error('Error fetching suggestions:', error)
    }

    const fetchListings = async () => {
      if (!id) return
      const { data, error } = await supabase
        .from('inventory')
        .select(`
          id,
          tipo,
          precio,
          valor_actual,
          puja_minima,
          estado,
          fecha_limite,
          intercambiable,
          cantidad,
          foto_url,
          users (
            id,
            username,
            avatar_url,
            rating,
            sales_total,
            estado_id,
            pais_id
          )
        `)
        .eq('card_id', id)
        .eq('estatus', 'activa')

      if (!error) setListings(data || [])
      else console.error('Error fetching listings:', error)
    }

    const fetchPriceHistory = async () => {
      if (!id) return
      const { data, error } = await supabase
        .from('inventory')
        .select('precio, created_at')
        .eq('card_id', id)
        .eq('tipo', 'venta')
        .order('created_at', { ascending: true })

      if (error) return console.error('Error fetching price history:', error)

      const grouped = new Map<string, number[]>()
      for (const row of data) {
        const date = new Date(row.created_at).toISOString().slice(0, 7)
        if (!grouped.has(date)) grouped.set(date, [])
        grouped.get(date)?.push(row.precio)
      }
      const result = Array.from(grouped.entries()).map(([fecha, precios]) => ({
        fecha,
        precio: parseFloat((precios.reduce((a, b) => a + b, 0) / precios.length).toFixed(2)),
      }))
      setPriceHistory(result)
    }

    fetchSuggested()
    fetchListings()
    fetchPriceHistory()
  }, [id])

  const ventas = listings.filter((l) => l.tipo === 'venta')
  const subastas = listings.filter((l) => l.tipo === 'subasta')

  const getTiempoRestante = (fechaLimite: string | undefined) => {
    if (!fechaLimite) return ''
    const ahora = new Date()
    const fin = new Date(fechaLimite)
    const diffMs = fin.getTime() - ahora.getTime()
    if (diffMs <= 0) return 'Finalizada'
    const horas = Math.floor(diffMs / 3600000)
    const minutos = Math.floor((diffMs % 3600000) / 60000)
    return `${horas}h ${minutos}m restantes`
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#0A0F1C' }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Image
          source={{ uri: !imageError && image_url ? image_url.toString() : fallbackUrl }}
          onError={() => setImageError(true)}
          style={{ width: 130, height: 190, borderRadius: 8 }}
        />
        <View style={{ flex: 1 }}>
          <Title style={{ color: 'white' }}>{name}</Title>
          <Text style={{ color: '#aaa' }}>{number}</Text>
          <Text style={{ color: '#ddd', marginTop: 4 }}>{rarity}</Text>
        </View>
      </View>

      <Divider style={{ marginVertical: 16 }} />

      <View>
        <Subheading style={{ color: 'white' }}>Detalles</Subheading>
        <Text style={{ color: '#ccc', marginTop: 4 }}>{description}</Text>

        <Divider style={{ marginVertical: 16 }} />

        <Subheading style={{ color: 'white' }}>Stats</Subheading>
        <Text style={{ color: '#ccc' }}>Number: {number}</Text>
        <Text style={{ color: '#ccc' }}>Type: {card_type}</Text>
        <Text style={{ color: '#ccc' }}>Monster Type: {monster_type}</Text>
        <Text style={{ color: '#ccc' }}>Attribute: {attribute}</Text>
        <Text style={{ color: '#ccc' }}>ATK/DEF: {attack} / {defense}</Text>
      </View>

      <Divider style={{ marginVertical: 16 }} />
      <Subheading style={{ color: 'white', marginBottom: 8 }}>Historial de Precios</Subheading>
      {priceHistory.length === 0 ? (
        <Text style={{ color: 'gray', textAlign: 'center' }}>Sin datos de precios.</Text>
      ) : (
        <LineChart
          data={{
            labels: priceHistory.map((p) => p.fecha),
            datasets: [{ data: priceHistory.map((p) => isNaN(p.precio) ? 0 : p.precio) }],
          }}
          width={screenWidth - 32}
          height={220}
          yAxisSuffix="$"
          chartConfig={{
            backgroundColor: '#0A0F1C',
            backgroundGradientFrom: '#0A0F1C',
            backgroundGradientTo: '#0A0F1C',
            decimalPlaces: 2,
            color: (opacity = 1) => `rgba(0, 176, 255, ${opacity})`,
            labelColor: () => '#ccc',
            propsForDots: {
              r: '4',
              strokeWidth: '2',
              stroke: '#00B0FF',
            },
          }}
          bezier
          style={{ borderRadius: 12 }}
        />
      )}

      <Divider style={{ marginVertical: 16 }} />
      <Subheading style={{ color: 'white', marginBottom: 8 }}>En venta</Subheading>
      {ventas.length > 0 ? (
        ventas.map((item) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/venta/[id]',
                params: {
                  id: item.id.toString(),
                  foto_url: item.foto_url,
                  nombre: name,
                  precio: item.precio.toString(),
                  estado: item.estado,
                  cantidad_disponible: item.cantidad.toString(),
                  intercambiable: item.intercambiable.toString(),
                  vendedor_id: item.users.id,
                  vendedor_nombre: item.users.username,
                  vendedor_avatar: item.users.avatar_url,
                  vendedor_rating: item.users.rating?.toString(),
                  vendedor_ventas: item.users.sales_total?.toString(),
                  estado_usuario_id: item.users.estado_id?.toString(),
                  pais_usuario_id: item.users.pais_id?.toString(),
                },
              })

            }
          >
            <Card key={item.id} style={{ marginBottom: 12, backgroundColor: '#1C1C2E' }}>
              <Card.Title
                title={item.users.username}
                left={() => (
                  <Image source={{ uri: item.users.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                )}
                titleStyle={{ color: 'white' }}
              />
              <Card.Content>
                <Text style={{ color: '#00B0FF' }}>Precio: ${item.precio}</Text>
                <Text style={{ color: '#ccc' }}>Condición: {item.estado}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ color: '#ccc', textAlign: 'center' }}>No hay ventas activas para esta carta.</Text>
      )}

      <Divider style={{ marginVertical: 16 }} />
      <Subheading style={{ color: 'white', marginBottom: 8 }}>En subasta</Subheading>
      {subastas.length > 0 ? (
        subastas.map((item) => (
          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/subasta/[id]',
                params: {
                  id: item.id.toString(),
                  nombre: name,
                  foto_url: item.foto_url,
                  estado: item.estado,
                  valor_actual: item.valor_actual?.toString(),
                  fecha_limite: item.fecha_limite,
                  vendedor_id: item.users.id,
                  vendedor_nombre: item.users.username,
                  vendedor_avatar: item.users.avatar_url,
                  vendedor_rating: item.users.rating?.toString(),
                  vendedor_ventas: item.users.sales_total?.toString(),
                  estado_usuario_id: item.users.estado_id?.toString(),
                  pais_usuario_id: item.users.pais_id?.toString(),
                }
              })
            }
          >
            <Card key={item.id} style={{ marginBottom: 12, backgroundColor: '#1C1C2E' }}>
              <Card.Title
                title={item.users.username}
                left={() => (
                  <Image source={{ uri: item.users.avatar_url }} style={{ width: 40, height: 40, borderRadius: 20 }} />
                )}
                titleStyle={{ color: 'white' }}
              />
              <Card.Content>
                <Text style={{ color: '#00B0FF' }}>Actual: ${item.valor_actual}</Text>
                <Text style={{ color: '#FFB300' }}>Puja mínima: ${item.puja_minima}</Text>
                <Text style={{ color: '#ccc' }}>Condición: {item.estado}</Text>
                <Text style={{ color: '#ccc' }}>{getTiempoRestante(item.fecha_limite)}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ color: '#ccc', textAlign: 'center' }}>No hay subastas activas para esta carta.</Text>
      )}

      {ventas.length === 0 && subastas.length === 0 && (
        <>
          <Divider style={{ marginVertical: 16 }} />
          <Text style={{ color: '#ccc', textAlign: 'center' }}>
            Actualmente no hay publicaciones activas de esta carta.
          </Text>
        </>
      )}

      <Divider style={{ marginVertical: 16 }} />
      <Subheading style={{ color: 'white', marginBottom: 8 }}>Otros usuarios también vieron</Subheading>
      <FlatList
        data={suggested}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingRight: 8 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/card/[id]', params: { ...item, id: item.id.toString() } })}
          >
            <Card style={{ width: 160, marginRight: 12, backgroundColor: '#1C1C2E' }}>
              <Card.Cover
                source={{ uri: !errorImages[item.id] && item.image_url ? item.image_url : fallbackUrl }}
                onError={() => setErrorImages((prev) => ({ ...prev, [item.id]: true }))}
                style={{ height: 180 }}
              />
              <Card.Content>
                <Text style={{ color: 'white', fontWeight: 'bold' }} numberOfLines={2}>{item.name}</Text>
                <Text style={{ color: '#aaa', fontSize: 12, marginTop: 4 }}>{item.rarity}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  )
}
