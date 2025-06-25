import { useEffect, useState } from 'react'
import { View, Image, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { TextInput, Button, Text, Menu, Card, Subheading, IconButton } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import useUser from '@/hooks/useUser'
import SearchBarInline from '@/components/SearchBarInline'
import * as FileSystem from 'expo-file-system'
import { decode as atob } from 'base-64'
import { useSnackbar } from '@/providers/SnackbarProvider'


const estados = ['NM', 'LP', 'MP', 'HP', 'D']

type Card = {
  id: number
  name: string
  image_url: string
  rarity: string
  number: string
}

export default function AddBulkInventoryScreen() {
  const { user } = useUser()
  const [selectedCard, setSelectedCard] = useState<Card | null>(null)
  const [estado, setEstado] = useState('NM')
  const [precio, setPrecio] = useState('')
  const [cantidad, setCantidad] = useState('1')
  const [image, setImage] = useState<any>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [cartas, setCartas] = useState<any[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const { showSnackbar } = useSnackbar()


  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: false,
      quality: 0.8,
    })

    if (!result.canceled) {
      setImage(result.assets[0])
    }
  }

  const handleAddToList = () => {
    if (!selectedCard || !precio || !image) return showSnackbar('Completa todos los campos')

    setCartas((prev) => [
      ...prev,
      {
        ...selectedCard,
        estado,
        precio,
        cantidad,
        image,
      },
    ])

    setSelectedCard(null)
    setPrecio('')
    setCantidad('1')
    setImage(null)
    setResetKey(prev => prev + 1)
  }

  const handleUploadAll = async () => {
    if (!cartas.length) return
    setSubiendo(true)
  
    try {
      for (const carta of cartas) {
        const fileUri = carta.image.uri
        const fileExt = fileUri.split('.').pop() || 'jpg'
        const fileName = `${user.id}/${carta.number}_${Math.random()}.${fileExt}`
  
        // 1. Leer imagen como base64
        const base64 = await FileSystem.readAsStringAsync(fileUri, {
          encoding: FileSystem.EncodingType.Base64,
        })
  
        // 2. Convertir a Uint8Array
        const binary = atob(base64)
        const byteArray = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) {
          byteArray[i] = binary.charCodeAt(i)
        }
  
        // 3. Subir el Uint8Array directamente a Supabase
        const { error: uploadError } = await supabase.storage
          .from('inventory-photos')
          .upload(fileName, byteArray, {
            contentType: `image/${fileExt}`,
          })
  
        if (uploadError) throw uploadError
  
        const { data: urlData } = supabase.storage.from('inventory-photos').getPublicUrl(fileName)
        const foto_url = urlData.publicUrl
  
        const { error } = await supabase.from('inventory').insert({
          user_id: user.id,
          card_id: carta.id,
          cantidad: parseInt(carta.cantidad),
          precio: parseFloat(carta.precio),
          estado: carta.estado,
          intercambiable: true,
          foto_url,
        })
  
        if (error) throw error
      }
  
      showSnackbar('Cartas subidas exitosamente')
      setCartas([])
    } catch (e) {
      console.error('Upload Error', e)
      showSnackbar('Error al subir algunas cartas')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 16 }}
    >
      <FlatList
        ListHeaderComponent={
          <>
            <SearchBarInline onSelect={(card) => setSelectedCard(card)} resetTrigger={resetKey} />

            {selectedCard && (
              <View style={{ flexDirection: 'row', marginVertical: 12, backgroundColor: '#1C1C2E', borderRadius: 8, padding: 12 }}>
                <Image source={{ uri: selectedCard.image_url }} style={{ width: 100, height: 140, borderRadius: 8, marginRight: 12 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: 'white', fontWeight: 'bold' }}>{selectedCard.name}</Text>
                  <Text style={{ color: '#aaa' }}>{selectedCard.number}</Text>
                  <Text style={{ color: '#00B0FF' }}>{selectedCard.rarity}</Text>
                </View>
              </View>
            )}

            <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12 }}>
              <TextInput
                label="Precio"
                value={precio}
                onChangeText={setPrecio}
                keyboardType="decimal-pad"
                style={{ flex: 1 }}
              />
              <TextInput
                label="Cantidad"
                value={cantidad}
                onChangeText={setCantidad}
                keyboardType="numeric"
                style={{ width: 100 }}
              />
            </View>

            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={<Button onPress={() => setMenuVisible(true)} mode="outlined" style={{ marginBottom: 12 }}>Estado: {estado}</Button>}
            >
              {estados.map((e) => (
                <Menu.Item key={e} onPress={() => { setEstado(e); setMenuVisible(false) }} title={e} />
              ))}
            </Menu>

            <Button mode="outlined" onPress={pickImage} style={{ marginBottom: 12 }}>
              {image ? 'Cambiar foto' : 'Seleccionar foto'}
            </Button>

            {image && <Image source={{ uri: image.uri }} style={{ height: 160, borderRadius: 8, marginBottom: 12 }} />}

            <Button
              mode="contained"
              onPress={handleAddToList}
              buttonColor="#00B0FF"
              disabled={!selectedCard || !image || !precio}
              style={{ marginBottom: 24 }}
            >
              Agregar al lote
            </Button>

            <Subheading style={{ color: 'white', marginBottom: 8 }}>Cartas agregadas</Subheading>
          </>
        }

        data={cartas}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, index }) => (
          <Card style={{ marginBottom: 12, backgroundColor: '#1C1C2E' }}>
            <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</Text>
                <Text style={{ color: '#aaa' }}>{item.estado} - ${item.precio} - x{item.cantidad}</Text>
              </View>
              <IconButton icon="delete" onPress={() => setCartas((prev) => prev.filter((_, i) => i !== index))} />
            </Card.Content>
          </Card>
        )}

        ListFooterComponent={
          cartas.length > 0 ? (
            <Button
              mode="contained"
              onPress={handleUploadAll}
              loading={subiendo}
              disabled={subiendo}
              buttonColor="#00B0FF"
              style={{ marginTop: 16 }}
            >
              Subir todas
            </Button>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  )
}
