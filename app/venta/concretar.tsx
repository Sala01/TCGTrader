import { useLocalSearchParams, router } from 'expo-router'
import { useEffect, useState } from 'react'
import { View, TextInput, ScrollView, Image } from 'react-native'
import { Text, Button, ActivityIndicator } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import { sendPushNotification } from '@/lib/sendPush'
import { useSnackbar } from '@/providers/SnackbarProvider'
import { COLORS } from '../../constants/GlobalStyles';


export default function ConcretarVentaScreen() {
  const { inventario_id, comprador_id } = useLocalSearchParams()
  const [producto, setProducto] = useState<any>(null)
  const [cantidad, setCantidad] = useState('1')
  const [precio, setPrecio] = useState('')
  const [guiaEnvio, setGuiaEnvio] = useState('')
  const [loading, setLoading] = useState(true)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    const fetchProducto = async () => {
      const { data, error } = await supabase
        .from('inventory')
        .select('id, cantidad, precio, cards(name, id), foto_url, user_id')
        .eq('id', inventario_id)
        .single()

      if (error) {
        console.error(error)
        return
      }

      setProducto(data)
      setPrecio(data.precio?.toString() || '')
      setLoading(false)
    }

    if (inventario_id) fetchProducto()
  }, [inventario_id])

  const concretarVenta = async () => {
    if (!producto || !precio || !cantidad || parseInt(cantidad) < 1) {
      return showSnackbar('Verifica los datos ingresados.')
    }

    if (parseInt(cantidad) > producto.cantidad) {
      return showSnackbar('No puedes vender más de lo que tienes.')
    }

    const cantidadVendida = parseInt(cantidad)
    const precioTotal = parseFloat(precio) * cantidadVendida

    const status = !guiaEnvio || guiaEnvio.trim() === '' ? 'Pendiente de Envio' : 'Enviado';

    const { error: ventaError } = await supabase.from('sales').insert({
      inventory_id: producto.id,
      user_id: producto.user_id,
      buyer_id: comprador_id,
      cantidad: cantidadVendida,
      price: precioTotal,
      card_id: producto.cards.id,
      shipping_code: guiaEnvio || null,
      status: status,
    })

    if (ventaError) {
      console.error(ventaError)
      return showSnackbar('No se pudo registrar la venta.')
    }

    const nuevaCantidad = producto.cantidad - cantidadVendida

    const { error: invError } = await supabase
      .from('inventory')
      .update({
        cantidad: nuevaCantidad,
        estatus: nuevaCantidad <= 0 ? 'vendida' : 'activa',
      })
      .eq('id', producto.id)

    if (invError) {
      console.error(invError)
      return showSnackbar('No se pudo actualizar el inventario.')
    }

    // Notificar al comprador
    const { data: tokenData } = await supabase
      .from('notification_tokens')
      .select('expo_token')
      .eq('user_id', comprador_id)
      .single()

    if (tokenData?.expo_token) {
      await sendPushNotification(
        tokenData.expo_token,
        'Compra confirmada',
        `Tu compra de ${producto.nombre} ha sido registrada.`
      )
    }

    showSnackbar('La venta se ha concretado correctamente.', COLORS.color00B0FF)
    router.back()
  }

  if (loading) {
    return <ActivityIndicator animating color={COLORS.color00B0FF} style={{ marginTop: 40 }} />
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: COLORS.color0A0F1C, padding: 16 }}>
      {producto?.foto_url && (
        <Image
          source={{ uri: producto.foto_url }}
          style={{ width: '100%', height: 180, borderRadius: 12, marginBottom: 16 }}
        />
      )}

      <Text style={{ color: COLORS.white, fontSize: 18, marginBottom: 4 }}>
        {producto?.nombre}
      </Text>

      <Text style={{ color: COLORS.colorCCC }}>Cantidad disponible: {producto?.cantidad}</Text>

      <TextInput
        placeholder="Cantidad a vender"
        value={cantidad}
        onChangeText={setCantidad}
        keyboardType="numeric"
        placeholderTextColor={COLORS.color888}
        style={{
          color: COLORS.white,
          backgroundColor: COLORS.color1C1C2E,
          padding: 12,
          borderRadius: 8,
          marginTop: 16,
        }}
      />

      <TextInput
        placeholder="Precio por unidad"
        value={precio}
        onChangeText={setPrecio}
        keyboardType="decimal-pad"
        placeholderTextColor={COLORS.color888}
        style={{
          color: COLORS.white,
          backgroundColor: COLORS.color1C1C2E,
          padding: 12,
          borderRadius: 8,
          marginTop: 12,
        }}
      />

      <TextInput
        placeholder="Guía de envío (opcional)"
        value={guiaEnvio}
        onChangeText={setGuiaEnvio}
        placeholderTextColor={COLORS.color888}
        style={{
          color: COLORS.white,
          backgroundColor: COLORS.color1C1C2E,
          padding: 12,
          borderRadius: 8,
          marginTop: 12,
        }}
      />

      <Button mode="contained" onPress={concretarVenta} style={{ marginTop: 24, backgroundColor: COLORS.color00B0FF }}>
        Confirmar Venta
      </Button>
    </ScrollView>
  )
}
