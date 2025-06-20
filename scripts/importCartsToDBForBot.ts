import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY! // 🔒 Necesita Service Role Key
);

(async () => {
  const file = await fs.readFile('cards_with_bot_descriptions.json', 'utf-8');
  const cards = JSON.parse(file);

  const registros = cards.map((card) => ({
    id: uuidv4(),
    category: 'carta',
    title: card.name,
    content: card.description,
    embedding: null,
    created_at: new Date().toISOString()
  }));

  const CHUNK_SIZE = 1000;
  for (let i = 0; i < registros.length; i += CHUNK_SIZE) {
    const chunk = registros.slice(i, i + CHUNK_SIZE);
    const { error } = await supabase.from('yugioh_knowledge_base').insert(chunk);
    if (error) {
      console.error(`❌ Error al insertar lote ${i / CHUNK_SIZE + 1}:`, error);
    } else {
      console.log(`✅ Insertado lote ${i / CHUNK_SIZE + 1} (${chunk.length} registros)`);
    }
  }

  console.log('🎉 Importación completa');
})();
