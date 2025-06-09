import { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Avatar, Text } from 'react-native-paper'
import { getUbicacion } from '@/lib/getUbicacion'

type Props = {
  username: string
  avatar_url?: string
  rating?: number
  sales_total?: number
  estado_id: number
  municipio_id: number
}

export default function VendedorInfo({
  username,
  avatar_url,
  rating,
  sales_total,
  estado_id,
  municipio_id,
}: Props) {
  const [ubicacion, setUbicacion] = useState({ estado: '', municipio: '' })

  useEffect(() => {
    getUbicacion(estado_id, municipio_id).then(setUbicacion)
  }, [estado_id, municipio_id])

  return (
    <View style={styles.container}>
      <Avatar.Image source={{ uri: avatar_url }} size={56} />
      <View style={styles.info}>
        <Text style={styles.username}>{username}</Text>
        <Text>⭐ {rating?.toFixed(1) ?? 'Sin calificación'}</Text>
        <Text>Ventas: {sales_total ?? 0}</Text>
        <Text>📍 {ubicacion.municipio}, {ubicacion.estado}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#BFCED6',
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
    alignItems: 'center',
  },
  info: {
    marginLeft: 12,
  },
  username: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#1C1C1C',
  },
})
