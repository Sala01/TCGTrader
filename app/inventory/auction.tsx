// Pantalla para subastar cartas basada en AddBulkInventoryScreen
// Cambios clave: Validación de precio inicial, puja mínima, fecha límite y valor actual

import { useEffect, useState } from 'react'
import { View, Image, Alert, FlatList, KeyboardAvoidingView, Platform } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import { TextInput, Button, Text, Menu, Card, Subheading, IconButton } from 'react-native-paper'
import { supabase } from '@/lib/supabase'
import useUser from '@/hooks/useUser'
import SearchBarInline from '@/components/SearchBarInline'
import * as FileSystem from 'expo-file-system'
import DateTimePicker from '@react-native-community/datetimepicker'
import { decode as atob } from 'base-64'
import { useSnackbar } from '@/providers/SnackbarProvider'
import * as ImageManipulator from 'expo-image-manipulator'

const estados = ['NM', 'LP', 'MP', 'HP', 'D']

export default function AddAuctionScreen() {
  const { user } = useUser()
  const [selectedCard, setSelectedCard] = useState<any>(null)
  const [estado, setEstado] = useState('NM')
  const [precioInicial, setPrecioInicial] = useState('')
  const [pujaMinima, setPujaMinima] = useState('10')
  const [fechaLimite, setFechaLimite] = useState(new Date(Date.now() + 86400000))
  const [showDatePicker, setShowDatePicker] = useState(false)
  const [image, setImage] = useState<any>(null)
  const [menuVisible, setMenuVisible] = useState(false)
  const [cartas, setCartas] = useState<any[]>([])
  const [subiendo, setSubiendo] = useState(false)
  const [resetKey, setResetKey] = useState(0)
  const { showSnackbar } = useSnackbar()

  const pickImage = async () => {
  const result = await ImagePicker.launchImageLibraryAsync({
    allowsEditing: false,
    quality: 1,
  })

  if (!result.canceled) {
    const original = result.assets[0]

    const manipulated = await ImageManipulator.manipulateAsync(
      original.uri,
      [{ resize: { width: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    )

    setImage({
      ...original,
      uri: manipulated.uri,
    })
  }
}

  const validarMultiplo10 = (val: string) => val && parseInt(val) % 10 === 0

  const handleAddToList = () => {
    if (!selectedCard || !precioInicial || !image || !validarMultiplo10(precioInicial) || !validarMultiplo10(pujaMinima)) {
      return showSnackbar('Verifica los campos', 'El precio inicial y la puja mínima deben ser múltiplos de 10.')
    }
    setCartas((prev) => [
      ...prev,
      {
        ...selectedCard,
        estado,
        precioInicial,
        pujaMinima,
        fechaLimite,
        image,
      },
    ])
    setSelectedCard(null)
    setPrecioInicial('')
    setPujaMinima('10')
    setImage(null)
    setResetKey((prev) => prev + 1)
  }

  const handleUploadAll = async () => {
    if (!cartas.length) return
    setSubiendo(true)
    try {
      for (const carta of cartas) {
        const fileUri = carta.image.uri
        const fileExt = fileUri.split('.').pop() || 'jpg'
        const fileName = `${user.id}/${carta.number}_${Math.random()}.${fileExt}`

        const base64 = await FileSystem.readAsStringAsync(fileUri, { encoding: FileSystem.EncodingType.Base64 })
        const binary = atob(base64)
        const byteArray = new Uint8Array(binary.length)
        for (let i = 0; i < binary.length; i++) byteArray[i] = binary.charCodeAt(i)

        const { error: uploadError } = await supabase.storage.from('inventory-photos').upload(fileName, byteArray, { contentType: `image/${fileExt}` })
        if (uploadError) throw uploadError

        const { data: urlData } = supabase.storage.from('inventory-photos').getPublicUrl(fileName)
        const foto_url = urlData.publicUrl

        const { error } = await supabase.from('inventory').insert({
          user_id: user.id,
          card_id: carta.id,
          precio: parseInt(carta.precioInicial),
          valor_actual: parseInt(carta.precioInicial),
          estado: carta.estado,
          tipo: 'subasta',
          intercambiable: false,
          puja_minima: parseInt(carta.pujaMinima),
          fecha_limite: carta.fechaLimite.toISOString(),
          estatus: 'activa',
          foto_url,
        })

        if (error) throw error
      }

      showSnackbar('Subastas creadas exitosamente')
      setCartas([])
    } catch (e) {
      console.error('Upload Error', e)
      showSnackbar('Error al subir subastas')
    } finally {
      setSubiendo(false)
    }
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 16 }}>
      <FlatList
        ListHeaderComponent={<>
          <SearchBarInline onSelect={setSelectedCard} resetTrigger={resetKey} />
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
              label="Valor inicial (múltiplo de 10)"
              value={precioInicial}
              onChangeText={setPrecioInicial}
              keyboardType="numeric"
              style={{ flex: 1 }}
            />
            <TextInput
              label="Puja mínima"
              value={pujaMinima}
              onChangeText={setPujaMinima}
              keyboardType="numeric"
              style={{ width: 130 }}
            />
          </View>

          <Button mode="outlined" onPress={() => setShowDatePicker(true)} style={{ marginBottom: 12 }}>
            Fecha límite: {fechaLimite.toLocaleDateString()} {fechaLimite.toLocaleTimeString()}
          </Button>
          {showDatePicker && (
            <DateTimePicker
              value={fechaLimite}
              mode="datetime"
              display="default"
              minimumDate={new Date()}
              onChange={(event, selectedDate) => {
                setShowDatePicker(false)
                if (selectedDate) setFechaLimite(selectedDate)
              }}
            />
          )}

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
            disabled={!selectedCard || !image || !precioInicial || !validarMultiplo10(precioInicial) || !validarMultiplo10(pujaMinima)}
            style={{ marginBottom: 24 }}
          >
            Agregar a subasta
          </Button>

          <Subheading style={{ color: 'white', marginBottom: 8 }}>Cartas en subasta</Subheading>
        </>}

        data={cartas}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item, index }) => (
          <Card style={{ marginBottom: 12, backgroundColor: '#1C1C2E' }}>
            <Card.Content style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: 'white', fontWeight: 'bold' }}>{item.name}</Text>
                <Text style={{ color: '#aaa' }}>
                  {item.estado} - Valor inicial: ${item.precioInicial} - Puja: ${item.pujaMinima}
                </Text>
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
              Subir subastas
            </Button>
          ) : null
        }
      />
    </KeyboardAvoidingView>
  )
}
