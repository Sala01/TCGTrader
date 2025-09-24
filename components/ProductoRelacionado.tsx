// components/ProductoRelacionado.tsx
import { View, Image, StyleSheet } from 'react-native'
import { Text } from 'react-native-paper'
import { COLORS } from '../constants/GlobalStyles';


export default function ProductoRelacionado({ nombre, precio, foto_url }: { nombre: string; precio: string; foto_url: string }) {
  return (
    <View style={styles.card}>
      <Image source={{ uri: foto_url }} style={styles.image} />
      <View style={{ flex: 1 }}>
        <Text style={styles.title} numberOfLines={1}>{nombre}</Text>
        <Text style={styles.price}>${precio}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.color1C1C2E,
    padding: 10,
    margin: 10,
    borderRadius: 12,
  },
  image: {
    width: 50,
    height: 70,
    borderRadius: 6,
    marginRight: 12,
  },
  title: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  price: {
    color: COLORS.color00B0FF,
    marginTop: 4,
  },
})
