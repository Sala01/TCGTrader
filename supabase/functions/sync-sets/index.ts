import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const response = await fetch('https://tcgcsv.com/tcgplayer/2/groups')
  const { results: sets } = await response.json()

  console.log('Respuesta de sets:', sets)

  if (!Array.isArray(sets)) {
    return new Response(`❌ Error: respuesta inesperada de tcgcsv.com`, { status: 500 })
  }


  const parsed = sets.map((set: any) => ({
    group_id: set.groupId,
    name: set.name,
    abbreviation: set.abbreviation,
    is_supplemental: set.isSupplemental ?? false,
    published_on: set.publishedOn?.split('T')[0] ?? null,
    modified_on: set.modifiedOn ?? null,
    category_id: set.categoryId
  }))

  const { error } = await supabase
    .from('sets')
    .upsert(parsed, { onConflict: 'group_id' })

  if (error) {
    console.error('❌ Error al insertar sets:', error)
    return new Response('Error al sincronizar sets', { status: 500 })
  }

  return new Response(`✅ Sets sincronizados: ${parsed.length}`, { status: 200 })
})
