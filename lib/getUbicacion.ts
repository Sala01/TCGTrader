import { supabase } from '@/lib/supabase'

export async function getUbicacion(estadoId: number, municipioId: number) {
  const { data: estadoData } = await supabase
    .from('estados')
    .select('nombre')
    .eq('id', estadoId)
    .single()

  const { data: municipioData } = await supabase
    .from('municipios')
    .select('nombre')
    .eq('id', municipioId)
    .single()

  return {
    estado: estadoData?.nombre ?? 'Desconocido',
    municipio: municipioData?.nombre ?? 'Desconocido',
  }
}
