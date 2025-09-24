import React, { createContext, useContext, useState } from 'react'
import { Snackbar, Text } from 'react-native-paper'
import { COLORS } from '../constants/GlobalStyles';


type SnackbarContextType = {
  showSnackbar: (text: string, color?: string) => void
}

const SnackbarContext = createContext<SnackbarContextType | null>(null)

export const useSnackbar = () => {
  const context = useContext(SnackbarContext)
  if (!context) {
    throw new Error('useSnackbar debe usarse dentro de <SnackbarProvider>')
  }
  return context
}

export const SnackbarProvider = ({ children }: { children: React.ReactNode }) => {
  const [visible, setVisible] = useState(false)
  const [text, setText] = useState('')
  const [color, setColor] = useState(COLORS.colorD32F2F)

  const showSnackbar = (msg: string, color: string = COLORS.colorD32F2F) => {
    setText(msg)
    setColor(color)
    setVisible(true)
  }

  return (
    <SnackbarContext.Provider value={{ showSnackbar }}>
      {children}
      <Snackbar
        visible={visible}
        onDismiss={() => setVisible(false)}
        duration={3000}
        style={{
          backgroundColor: color,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: 8,
        }}
      >
        <Text style={{ color: COLORS.white, textAlign: 'center' }}>{text}</Text>
      </Snackbar>
    </SnackbarContext.Provider>
  )
}
