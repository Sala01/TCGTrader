// lib/iap/useIAP.ts
import * as RNIap from 'react-native-iap'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { subscriptionSkus } from './products'
import { supabase } from '@/lib/supabase'

export function useIAP() {
  const [products, setProducts] = useState<
    { productId: string; title: string; description: string; localizedPrice: string; price: number }[]
  >([])
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    const initIAP = async () => {
      try {
        await RNIap.initConnection()

        const availableSubs = await RNIap.getSubscriptions({
          skus:
            Platform.select({
              ios: subscriptionSkus.ios,
              android: subscriptionSkus.android,
            }) || [],
        })

        setProducts(
          availableSubs.map((sub: any) => ({
            productId: sub.productId,
            title: sub.title,
            description: sub.description,
            localizedPrice: sub.localizedPrice ?? '$',
            price: sub.price ?? 0,
          }))
        )

        setInitialized(true)

        // Verificar suscripción activa al iniciar
        await checkActiveSubscription()
      } catch (e) {
        console.error('❌ Error al inicializar IAP', e)
      }
    }

    initIAP()
    return () => {
      RNIap.endConnection()
    }
  }, [])

  const purchase = async (sku: string) => {
    try {
      const result = await RNIap.requestSubscription({ sku })
      // Verificar inmediatamente después de la compra
      await checkActiveSubscription()
      return result
    } catch (e) {
      console.error('❌ Error al comprar', e)
    }
  }

  const checkActiveSubscription = async () => {
    try {
      const purchases = await RNIap.getAvailablePurchases()
      const active = purchases.find((p) =>
        subscriptionSkus.android.includes(p.productId) ||
        subscriptionSkus.ios.includes(p.productId)
      )

      if (active) {
        await updateUserPlanInSupabase(active.productId)
      }
    } catch (e) {
      console.error('❌ Error al verificar suscripción activa', e)
    }
  }

  const updateUserPlanInSupabase = async (productId: string) => {
    const planMap: Record<string, { limit: number | null; planName: string }> = {
      'basic_plan': { limit: 100, planName: 'Básico' },
      'intermediate_plan': { limit: 250, planName: 'Intermedio' },
      'premium_plan': { limit: 600, planName: 'Premium' },
      'pro_plan': { limit: null, planName: 'Pro' },
    }

    const match = planMap[productId]
    if (!match) return

    const user = await supabase.auth.getUser()
    if (!user.data.user) return

    const { error } = await supabase
      .from('user_question_quota')
      .update({
        questions_left: match.limit,
        current_plan: match.planName,
        plan_updated_at: new Date().toISOString(),
      })
      .eq('id', user.data.user.id)

    if (error) {
      console.error('❌ Error al actualizar plan en Supabase:', error)
    }
  }

  return { products, purchase, initialized }
}
