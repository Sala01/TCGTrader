import React from 'react'
import { View, Image, ScrollView, Text } from 'react-native'
import SearchDropdown from '@/components/SearchBar'
import LastSetBanner from '@/components/LastSetBanner'
import { SafeAreaView } from 'react-native-safe-area-context'
import SectionHeader from '@/components/SectionHeader'
import MostSoldSection from '@/components/MostSoldSection'
import ActiveAuctionsSection from '@/components/ActiveAuctions'


export default function HomeScreen() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C' }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
        {/* 🔥 MiniBanner flotante tipo insignia */}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, marginTop: 16 }}>
          <Image
            source={require('@/assets/images/logo.png')} // 👈 asegúrate que el logo esté en assets/logo.png
            style={{ width: 48, height: 48, resizeMode: 'contain', marginRight: 12 }}
          />
          {/* Puedes agregar un nombre o subtítulo aquí si gustas */}
          <Text style={{ color: 'white', fontWeight: 'bold', fontSize: 12 }}>Compra, Intercambia y Busca</Text>
        </View>
        <SearchDropdown />
        <SectionHeader title="Ultimo Set" />
        <LastSetBanner />
        <SectionHeader title="Lo Mas Vendido" />
        <MostSoldSection />
        <SectionHeader title="Subastas Activas" />
        <ActiveAuctionsSection />
      </ScrollView>
    </SafeAreaView>
  )
}
