import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
);

const PAGE_SIZE = 1000;

(async () => {
  let allCards: any[] = [];
  let page = 0;

  while (true) {
    const from = page * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    const { data: cards, error } = await supabase
      .from('cards')
      .select(`
        id,
        name,
        description,
        card_type,
        monster_type,
        attribute,
        attack,
        defense
      `)
      .range(from, to);

    if (error) {
      console.error(`❌ Error en página ${page + 1}:`, error);
      break;
    }

    if (!cards || cards.length === 0) {
      break; // No más cartas
    }

    allCards.push(...cards);
    console.log(`✅ Página ${page + 1}: ${cards.length} cartas obtenidas`);
    page++;
  }

  const resultado = allCards.map((card) => ({
    id: card.id,
    name: card.name,
    description: card.description,
    type: card.card_type,
    monster_type: card.monster_type,
    attribute: card.attribute,
    attack: card.attack,
    defense: card.defense
  }));

  await fs.writeFile('cards_for_bot.json', JSON.stringify(resultado, null, 2), 'utf-8');
  console.log(`🎉 Exportadas ${resultado.length} cartas a cards_for_bot.json`);
})();
