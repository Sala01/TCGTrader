import React, { useEffect, useState } from 'react'
import { View, Text, Image, FlatList, TouchableOpacity } from 'react-native'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import { Button, Card } from 'react-native-paper'

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
    <View style={{ marginTop: 24 }}>
      <FlatList
        horizontal
        data={subastas}
        keyExtractor={(item) => item.id.toString()}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingRight: 8, paddingLeft: 16 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/subasta/[id]', params: {
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
            }})}
          >
            <Card style={{ width: 160, marginRight: 12, backgroundColor: '#1C1C2E' }}>
              <Card.Cover source={{ uri: item.foto_url }} style={{ height: 180 }} />
              <Card.Content>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.users.username}</Text>
                <Text style={{ color: '#00B0FF', fontSize: 13 }}>Actual: ${item.valor_actual}</Text>
                <Text style={{ color: '#FFB300', fontSize: 12 }}>+${item.puja_minima} mínimo</Text>
                <Text style={{ color: '#ccc', fontSize: 12 }}>{getTiempoRestante(item.fecha_limite)}</Text>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        )}
        ListFooterComponent={() => (
          <Button
            mode="outlined"
            textColor="#00B0FF"
            style={{ alignSelf: 'center', borderColor: '#00B0FF', marginRight: 16 }}
            onPress={() => router.push('/subastas')}
          >
            Ver todas
          </Button>
        )}
      />
    </View>
  )
}
