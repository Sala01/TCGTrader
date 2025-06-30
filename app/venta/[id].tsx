import { useLocalSearchParams, router } from 'expo-router'
import { View, Image, StyleSheet } from 'react-native'
import { Text, Button } from 'react-native-paper'
import VendedorInfo from '@/components/VendedorInfo'
import { ScrollView } from 'react-native'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { crearConversacion } from '@/lib/crearConversacion'
import { useSnackbar } from '@/providers/SnackbarProvider'

export default function VentaDetalleScreen() {
  const {
    id,
    foto_url,
    nombre,
    precio,
    estado,
    vendedor_id,
    vendedor_nombre,
    vendedor_avatar,
    vendedor_rating,
    vendedor_ventas,
    estado_usuario_id,
    pais_usuario_id,
    cantidad_disponible,
    cantidad_deseable,
    intercambiable,
    solo_venta,
  } = useLocalSearchParams()
  const [userId, setUserId] = useState<string | null>(null)
  const { showSnackbar } = useSnackbar()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUserId(data?.user?.id ?? null)
    })
  }, [])


  return (
    <ScrollView style={styles.container}>
      <Image source={{ uri: foto_url as string }} style={styles.image} />

      <View style={styles.card}>
        <Text variant="titleLarge" style={styles.title}>{nombre}</Text>

        <Text style={styles.label}>Precio:</Text>
        <Text style={styles.value}>${precio}</Text>

        <Text style={styles.label}>Estado de la carta:</Text>
        <Text style={styles.value}>{estado}</Text>

        <Text style={styles.label}>Cantidad disponible:</Text>
        <Text style={styles.value}>{cantidad_disponible}</Text>

        <Text style={styles.label}>¿Solo venta?</Text>
        <Text style={styles.value}>
          {intercambiable === 'False' ? 'Sí' : 'No, también acepta intercambio'}
        </Text>

        <View style={styles.divider} />

        <VendedorInfo
          username={vendedor_nombre as string}
          avatar_url={vendedor_avatar as string}
          rating={parseFloat(vendedor_rating as string)}
          sales_total={parseInt(vendedor_ventas as string)}
          estado_id={parseInt(estado_usuario_id as string)}
          pais_id={parseInt(pais_usuario_id as string)}
        />
        <Button
          icon="account"
          mode="outlined"
          textColor="#00B0FF"
          style={{ marginTop: 12 }}
          onPress={() => router.push({ pathname: '/vendedor/[id]', params: { id: vendedor_id.toString() } })}
        >
          Ver perfil del vendedor
        </Button>

      </View>

      <Button
        icon="chat"
        mode="contained"
        buttonColor="#00B0FF"
        textColor="#1C1C1C"
        onPress={async () => {
          if (!userId || !vendedor_id) {
            showSnackbar('Inicia sesión para realizar una compra')
            return
          }

          await crearConversacion(userId, vendedor_id.toString(), id.toString())

          // Obtener ID de conversación existente o recién creada
          const user1 = userId
          const user2 = vendedor_id.toString()
          const orderedUsers = [user1, user2].sort() // ordena alfabéticamente

          const key = [orderedUsers[0], orderedUsers[1], id.toString()].join('-')

          //console.log(key)
          const { data: convo } = await supabase
            .from('conversations')
            .select('id')
            .eq('conversation_key', key)
            .single()

          if (convo?.id) {
            await supabase.from('messages').insert({
              conversation_id: convo.id,
              sender_id: userId,
              content: 'Hola, me interesa tu carta.',
            })

            router.push({
              pathname: '/chat/[id]',
              params: {
                id: key.toString(),
                nombre: vendedor_nombre?.toString() ?? '',
              },
            })
          }
        }}
        style={styles.button}
      >
        Contactar Vendedor
      </Button>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
    padding: 16,
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
  divider: {
    height: 1,
    backgroundColor: '#999',
    marginVertical: 16,
  },
  button: {
    marginTop: 20,
    borderRadius: 10,
    marginBottom: 20
  },
})
