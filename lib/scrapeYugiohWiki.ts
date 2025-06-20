// scrapeYugiohWiki.ts
import axios from 'axios'
import cheerio from 'cheerio'
import fs from 'fs'
import slugify from 'slugify'

const baseUrl = 'https://yugioh.fandom.com'
const entries = [
  '/wiki/Chain',
  '/wiki/Card_Effect_Timing',
  '/wiki/Floodgate',
  '/wiki/Skill_Drain',
  '/wiki/Continuous_Effect',
  '/wiki/Spell_Speed',
  '/wiki/Banlist',
  '/wiki/Spell_Speed_2',
  '/wiki/Red-Eyes_Dark_Dragoon',
  '/wiki/Ash_Blossom_%26_Joyous_Spring',
  '/wiki/Maxx_%22C%22',
  '/wiki/Nibiru,_the_Primal_Being'
]

const scrapePage = async (path: string) => {
  const url = `${baseUrl}${path}`
  try {
    const { data } = await axios.get(url)
    const $ = cheerio.load(data)

    const title = $('h1').first().text().trim()
    const paragraphs = $('#mw-content-text > .mw-parser-output > p')
    const content: string[] = []

    paragraphs.each((i, el) => {
      const text = $(el).text().trim()
      if (text.length > 60) content.push(text)
    })

    return {
      category: 'wiki',
      title,
      content: content.join('\n\n'),
    }
  } catch (err) {
    console.error(`Error scraping ${url}:`, err)
    return null
  }
}

const run = async () => {
  const results = []

  for (const path of entries) {
    const data = await scrapePage(path)
    if (data) results.push(data)
  }

  fs.writeFileSync('yugioh_knowledge.json', JSON.stringify(results, null, 2), 'utf-8')
  console.log('✅ Archivo generado: yugioh_knowledge.json')
}

run()
