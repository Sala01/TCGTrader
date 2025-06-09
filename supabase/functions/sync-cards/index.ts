import { serve } from 'https://deno.land/std/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js'

serve(async () => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { data: sets, error: setsError } = await supabase
  .from('sets')
  .select('group_id, name')

  if (setsError || !sets) {
    return new Response('Error al obtener sets', { status: 500 })
  }

  let total = 0
  for (const { group_id } of sets) {
    try {
      const res = await fetch(`https://tcgcsv.com/tcgplayer/2/${group_id}/products`)
      const { results: cards } = await res.json()

      if (!Array.isArray(cards)) {
        console.log(`❌ No se encontraron cartas para set ${group_id}`)
        continue
      }

      const parsed = cards.map((card: any) => {
        const ext = (name: string) =>
          card.extendedData?.find((d: any) => d.name === name)?.value ?? null

        return {
          id: card.productId,
          name: card.name,
          clean_name: card.cleanName,
          image_url: card.imageUrl,
          category_id: card.categoryId,
          group_id: card.groupId,
          url: card.url,
          modified_on: card.modifiedOn,

          number: ext('Number'),
          rarity: ext('Rarity'),
          attribute: ext('Attribute'),
          monster_type: ext('MonsterType'),
          card_type: ext('Card Type'),
          attack: parseInt(ext('Attack')) || null,
          defense: parseInt(ext('Defense')) || null,
          description: ext('Description')
        }
      })

      const { error } = await supabase
        .from('cards')
        .upsert(parsed, { onConflict: 'id' })

      if (error) console.error('❌ Error:', error)
      else total += parsed.length
    } catch (e) {
      console.error('❌ Error en set:', group_id, e)
    }
  }

  return new Response(`✅ Sincronización completa: ${total} cartas`, { status: 200 })
})
