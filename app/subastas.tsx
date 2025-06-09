import React, { useEffect, useState } from 'react'
import { View, FlatList, TouchableOpacity, Image, StyleSheet } from 'react-native'
import { Text, Card, Appbar, SegmentedButtons, Menu, Button } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'

export default function SubastasScreen() {
  const [subastas, setSubastas] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'todas' | 'urgentes'>('todas')
  const [orden, setOrden] = useState<'recientes' | 'valor'>('recientes')
  const [menuVisible, setMenuVisible] = useState(false)

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

  const filtradas = subastas
    .filter((s) => {
      if (filtro === 'todas') return true
      const fin = new Date(s.fecha_limite)
      const ahora = new Date()
      const diffMs = fin.getTime() - ahora.getTime()
      return diffMs <= 3600000
    })
    .sort((a, b) => {
      if (orden === 'recientes') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      } else {
        return (b.valor_actual ?? 0) - (a.valor_actual ?? 0)
      }
    })

  return (
    <View style={styles.container}>
      <Appbar.Header elevated mode="center-aligned" style={{ backgroundColor: '#0A0F1C' }}>
        <Appbar.BackAction onPress={() => router.back()} />
        <Appbar.Content title="Subastas activas" titleStyle={{ color: 'white' }} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={<Appbar.Action icon="tune" color="white" onPress={() => setMenuVisible(true)} />}>
          <Menu.Item onPress={() => { setOrden('recientes'); setMenuVisible(false) }} title="Más recientes" />
          <Menu.Item onPress={() => { setOrden('valor'); setMenuVisible(false) }} title="Mayor valor actual" />
        </Menu>
      </Appbar.Header>

      <SegmentedButtons
        value={filtro}
        onValueChange={(val) => setFiltro(val as 'todas' | 'urgentes')}
        buttons={[
          { value: 'todas', label: 'Todas', labelStyle: { color: filtro === 'todas' ? '#000' : '#FFF' } },
          { value: 'urgentes', label: 'Finalizan pronto', labelStyle: { color: filtro === 'urgentes' ? '#000' : '#FFF' } },
        ]}
        style={{ marginHorizontal: 16, marginTop: 16 }}
        theme={{ colors: { secondaryContainer: '#00B0FF' } }}
      />

      <FlatList
        data={filtradas}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ padding: 16 }}
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
            style={{ marginBottom: 16 }}
          >
            <Card style={{ backgroundColor: '#1C1C2E' }}>
              <View style={{ flexDirection: 'row' }}>
                <Image source={{ uri: item.foto_url }} style={styles.image} />
                <Card.Content style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold', marginBottom: 4 }}>{item.users.username}</Text>
                  <Text style={{ color: '#00B0FF' }}>Actual: ${item.valor_actual}</Text>
                  <Text style={{ color: '#FFB300' }}>Puja mínima: ${item.puja_minima}</Text>
                  <Text style={{ color: '#ccc' }}>{getTiempoRestante(item.fecha_limite)}</Text>
                </Card.Content>
              </View>
            </Card>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ color: 'gray', textAlign: 'center', marginTop: 40 }}>No hay subastas activas.</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  image: {
    width: 100,
    height: 140,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
  },
})
