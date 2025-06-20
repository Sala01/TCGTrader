
import { supabase } from '@/lib/supabase'

export const crearConversacion = async (usuario1: string, usuario2: string) => {
  try {
    const key = [usuario1, usuario2].sort().join('-')

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
        conversation_key: key,
      })

      if (errorInsert) {
        console.error('Error al crear conversación:', errorInsert.message)
      }
    }
  } catch (err) {
    console.error('crearConversacion error:', err)
  }
}
