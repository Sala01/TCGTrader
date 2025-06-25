import { supabase } from '@/lib/supabase'

export async function getUbicacion(estadoId: number, paisId: number) {
  const { data: estadoData } = await supabase
    .from('estado')
    .select('nombre')
    .eq('id', estadoId)
    .single()

  const { data: municipioData } = await supabase
    .from('pais')
    .select('nombre')
    .eq('id', paisId)
    .single()

  return {
    estado: estadoData?.nombre ?? 'Desconocido',
    municipio: municipioData?.nombre ?? 'Desconocido',
  }
}
