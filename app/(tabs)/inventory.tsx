// app/inventory/index.tsx
import { useEffect, useState } from 'react'
import { FlatList, View, Image, Alert } from 'react-native'
import { Card, Text, IconButton, Button, Divider } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { router } from 'expo-router'
import useUser from '@/hooks/useUser'
import AddInventoryButton from '@/components/AddButton'
import AuthGuard from '@/components/AuthGuard'
import { SafeAreaView } from 'react-native-safe-area-context'

interface InventoryItem {
  id: number
  foto_url: string
  estado: string
  precio: number
  name: string
  image_url: string
  tipo: 'venta' | 'subasta'
  valor_actual?: number
  puja_minima?: number
  fecha_limite?: string
}

export default function InventoryScreen() {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const { user } = useUser()
  const [vista, setVista] = useState<'venta' | 'subasta' | 'todas'>('venta')

  const fetchInventory = async () => {
    if (!user) return
    setLoading(true)
    const { data, error } = await supabase
      .from('inventory')
      .select(`
        id,
        foto_url,
        estado,
        precio,
        tipo,
        valor_actual,
        puja_minima,
        fecha_limite,
        cards:card_id (
          id,
          name,
          image_url
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (!error && data) {
      setItems(
        data.map((item) => ({
          ...item,
          name: item.cards?.name ?? 'Sin nombre',
          image_url: item.cards?.image_url ?? '',
        }))
      )
    }

    setLoading(false)
  }

  const confirmDelete = (id: number) => {
    showSnackbar('¿Eliminar carta?', 'Esta acción no se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => handleDelete(id)
      }
    ])
  }

  const handleDelete = async (id: number) => {
    const { error } = await supabase.from('inventory').delete().eq('id', id)
    if (!error) {
      setItems((prev) => prev.filter((i) => i.id !== id))
    }
  }

  useEffect(() => {
    fetchInventory()
  }, [user])

  const itemsFiltrados =
    vista === 'todas' ? items : items.filter((item) => item.tipo === vista)

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
    <AuthGuard>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 12 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 }}>
          <Button
            mode={vista === 'venta' ? 'contained' : 'outlined'}
            buttonColor="#00B0FF"
            onPress={() => setVista('venta')}
          >
            Ventas
          </Button>
          <Button
            mode={vista === 'subasta' ? 'contained' : 'outlined'}
            buttonColor="#FFB300"
            onPress={() => setVista('subasta')}
          >
            Subastas
          </Button>
          <Button
            mode={vista === 'todas' ? 'contained' : 'outlined'}
            buttonColor="#666"
            onPress={() => setVista('todas')}
          >
            Todas
          </Button>
        </View>

        <FlatList
          data={itemsFiltrados}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ paddingBottom: 80 }}
          ItemSeparatorComponent={() => <Divider />}
          refreshing={loading}
          onRefresh={fetchInventory}
          renderItem={({ item }) => (
            <Card style={{ backgroundColor: '#1C1C2E', marginBottom: 12 }}>
              <View style={{ flexDirection: 'row' }}>
                <Image
                  source={{ uri: item.foto_url }}
                  style={{ width: 100, height: 140, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 }}
                />
                <View style={{ flex: 1, padding: 12 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</Text>
                  <Text style={{ color: '#aaa', marginTop: 4 }}>Condición: {item.estado}</Text>

                  {item.tipo === 'subasta' ? (
                    <>
                      <Text style={{ color: '#00B0FF', marginTop: 4 }}>Actual: ${item.valor_actual}</Text>
                      <Text style={{ color: '#FFB300' }}>Puja mínima: ${item.puja_minima}</Text>
                      <Text style={{ color: '#ccc' }}>{getTiempoRestante(item.fecha_limite)}</Text>
                    </>
                  ) : (
                    <Text style={{ color: '#00B0FF', marginTop: 4 }}>${item.precio.toFixed(2)}</Text>
                  )}

                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <IconButton icon="pencil" iconColor="#00B0FF" onPress={() => router.push(`/inventory/edit/${item.id}`)} />
                    <IconButton icon="delete" iconColor="#FF5252" onPress={() => confirmDelete(item.id)} />
                  </View>
                </View>
              </View>
            </Card>
          )}
          ListEmptyComponent={
            loading
              ? null
              : () => (
                <Text style={{ color: 'gray', textAlign: 'center', marginTop: 32 }}>
                  No hay cartas en esta sección.
                </Text>
              )
          }
        />

        <AddInventoryButton />
      </SafeAreaView>
    </AuthGuard>
  )
}
