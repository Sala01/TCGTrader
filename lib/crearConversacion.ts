
import { supabase } from '@/lib/supabase'

export const crearConversacion = async (usuario1: string, usuario2: string, inventoryId: string) => {
  try {
    const orderedUsers = [usuario1, usuario2].sort() // ordena alfabéticamente

    const key = [orderedUsers[0], orderedUsers[1], inventoryId].join('-')

    console.log(key);
    const { data: existente, error: errorBusqueda } = await supabase
      .from('conversations')
      .select('id')
      .eq('conversation_key', key)
      .single()

    if (errorBusqueda && errorBusqueda.code !== 'PGRST116') {
      console.error('Error al buscar conversación:', errorBusqueda.message)
      return
    }

    if (!existente) {
      const { error: errorInsert } = await supabase.from('conversations').insert({
        user1: usuario1 < usuario2 ? usuario1 : usuario2,
        user2: usuario1 > usuario2 ? usuario1 : usuario2,
        inventory_id: inventoryId,
      })

      if (errorInsert) {
        console.error('Error al crear conversación:', errorInsert.message)
      }
    }
  } catch (err) {
    console.error('crearConversacion error:', err)
  }
}
