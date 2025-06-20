import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

(async () => {
  const { data: sets, error: setsError } = await supabase.from('sets').select('group_id');
  if (setsError || !sets) {
    console.error('❌ Error al obtener sets:', setsError);
    return;
  }

  let total = 0;

  for (const { group_id } of sets) {
    try {
      // 🔍 Obtener solo las cartas del set actual
      const { data: existentes, error: errorExistentes } = await supabase
        .from('cards')
        .select('id')
        .eq('group_id', group_id);

      if (errorExistentes || !existentes) {
        console.error(`❌ Error al obtener cartas del set ${group_id}:`, errorExistentes);
        continue;
      }

      const idsExistentes = new Set(existentes.map((c) => c.id));

      const res = await fetch(`https://tcgcsv.com/tcgplayer/2/${group_id}/products`);
      const { results: cards } = await res.json();

      if (!Array.isArray(cards)) {
        console.log(`❌ No se encontraron cartas para set ${group_id}`);
        continue;
      }

      const parsed = cards.map((card: any) => {
        const ext = (name: string) =>
          card.extendedData?.find((d: any) => d.name === name)?.value ?? null;

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
        };
      });

      // Filtrar cartas nuevas del set
      const nuevas = parsed.filter((card) => !idsExistentes.has(card.id));

      // Eliminar duplicados locales por ID
      const unicas = Array.from(new Map(nuevas.map((c) => [c.id, c])).values());

      if (unicas.length === 0) {
        console.log(`ℹ️ No hay cartas nuevas para set ${group_id}`);
        continue;
      }

      const { error } = await supabase.from('cards').insert(unicas);

      if (error) {
        console.error(`❌ Error al insertar cartas del set ${group_id}:`, error);
      } else {
        total += unicas.length;
        console.log(`✅ ${unicas.length} cartas insertadas para set ${group_id}`);
      }
    } catch (e) {
      console.error('❌ Error procesando set', group_id, e);
    }
  }

  console.log(`🎉 Sincronización completa: ${total} cartas nuevas insertadas`);
})();
