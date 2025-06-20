import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { Configuration, OpenAIApi } from 'openai'

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)

const openai = new OpenAIApi(
  new Configuration({ apiKey: process.env.OPENAI_API_KEY })
)

const data = [
  {
    category: 'cartas',
    title: 'Miscelaneosaurio',
    content: 'Miscelaneosaurio protege a tus dinosaurios del efecto de cartas del oponente durante la Main Phase y puede enviarse al cementerio para invocar otro dinosaurio desde el deck.'
  },
  {
    category: 'reglas',
    title: 'Cadena de efectos',
    content: 'En Yu-Gi-Oh!, los efectos se resuelven en cadena. El último efecto activado se resuelve primero. Esto permite respuestas rápidas y estratégicas a las jugadas del oponente.'
  },
  {
    category: 'banlist',
    title: 'Última banlist',
    content: 'La última banlist prohíbe cartas como Maxx "C" y limita a 1 cartas como Kashtira Unicorn y Runick Tip en el formato TCG.'
  }
  // Puedes agregar más aquí
]

async function generateAndStore() {
  for (const item of data) {
    const embeddingRes = await openai.createEmbedding({
      model: 'text-embedding-ada-002',
      input: item.content
    })

    const [{ embedding }] = embeddingRes.data.data

    await supabase.from('yugioh_knowledge_base').insert({
      category: item.category,
      title: item.title,
      content: item.content,
      embedding
    })

    console.log(`✅ Insertado: ${item.title}`)
  }
}

generateAndStore()
