import { IconButton, Menu } from 'react-native-paper'
import { useState } from 'react'
import { View } from 'react-native'
import { router } from 'expo-router'

export default function AddInventoryButton() {
  const [visible, setVisible] = useState(false)

  return (
    <View style={{ alignItems: 'flex-end', paddingRight: 16 }}>
      <Menu
        visible={visible}
        onDismiss={() => setVisible(false)}
        anchor={
          <IconButton
            icon="plus-circle"
            size={32}
            iconColor="#00B0FF"
            onPress={() => setVisible(true)}
          />
        }
      >
        {/* <Menu.Item
          onPress={() => {
            setVisible(false)
            router.push('/inventory/add') // Agregar individual
          }}
          title="Agregar individual"
          leadingIcon="card-plus"
        /> */}
        <Menu.Item
          onPress={() => {
            setVisible(false)
            router.push('/inventory/massive') // Agregar masivo
          }}
          title="Venta"
          leadingIcon="cash"
        />
        <Menu.Item
          onPress={() => {
            setVisible(false)
            router.push('/inventory/auction') // Nueva pantalla de subastas
          }}
          title="Subasta"
          leadingIcon="gavel"
        />
      </Menu>
    </View>
  )
}
