// components/ConfirmDialog.tsx
import React from 'react'
import { Portal, Dialog, Button, Paragraph } from 'react-native-paper'
import { COLORS } from '../constants/GlobalStyles';


interface ConfirmDialogProps {
  visible: boolean
  title?: string
  message?: string
  onCancel: () => void
  onConfirm: () => void
}

export default function ConfirmDialog({
  visible,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onCancel}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Paragraph>{message}</Paragraph>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onCancel}>Cancelar</Button>
          <Button onPress={onConfirm} textColor={COLORS.colorD32F2F}>Eliminar</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
