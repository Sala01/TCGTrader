// api/finalizar-subastas.ts
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // ⚠️ clave secreta
)

export default async function handler(req: any, res: any) {
  const ahora = new Date().toISOString()

  const { data: vencidas, error } = await supabase
    .from('inventory')
    .select('id, user_id')
    .lt('fecha_limite', ahora)
    .eq('tipo', 'subasta')
    .neq('estatus', 'finalizada')

  if (error) return res.status(500).json({ error })

  for (const subasta of vencidas) {
    const { data: mayor } = await supabase
      .from('pujas')
      .select('user_id, monto')
      .eq('inventario_id', subasta.id)
      .order('monto', { ascending: false })
      .limit(1)
      .single()

    if (mayor) {
      await supabase.from('inventory')
        .update({ estatus: 'finalizada', usuario_ganador: mayor.user_id, valor_actual: mayor.monto })
        .eq('id', subasta.id)

      const { data: token } = await supabase
        .from('notification_tokens')
        .select('expo_token')
        .eq('user_id', mayor.user_id)
        .single()

      if (token?.expo_token) {
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: token.expo_token,
            sound: 'default',
            title: '¡Ganaste una subasta!',
            body: 'Has ganado una carta. Revísala en tu perfil.',
          })
        })
      }
    }
  }

  return res.status(200).json({ finalizadas: vencidas.length })
}
