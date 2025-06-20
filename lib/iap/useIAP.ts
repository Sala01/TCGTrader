// lib/iap/useIAP.ts
import * as RNIap from 'react-native-iap'
import { useEffect, useState } from 'react'
import { Platform } from 'react-native'
import { subscriptionSkus } from './products'

export function useIAP() {
  const [products, setProducts] = useState<
  { productId: string; title: string; description: string; localizedPrice: string; price: number }[]>([])
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
      return result
    } catch (e) {
      console.error('❌ Error al comprar', e)
    }
  }

  return { products, purchase, initialized }
}
