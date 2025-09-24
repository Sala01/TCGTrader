import React from 'react'
import { View, Image, ScrollView, Text, StyleSheet } from 'react-native'
import SearchDropdown from '@/components/SearchBar'
import LastSetBanner from '@/components/LastSetBanner'
import { SafeAreaView } from 'react-native-safe-area-context'
import SectionHeader from '@/components/SectionHeader'
import MostSoldSection from '@/components/MostSoldSection'
import ActiveAuctionsSection from '@/components/ActiveAuctions'
import { COLORS } from '../../constants/GlobalStyles';


export default function HomeScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* 🔥 MiniBanner tipo insignia */}
        <View style={styles.headerRow}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
          />
          <Text style={styles.slogan}>Compra, Intercambia y Busca</Text>
        </View>

        <SearchDropdown />

        <SectionHeader title="Último Set" />
        <LastSetBanner />

        <SectionHeader title="Lo Más Vendido" />
        <MostSoldSection />

        <SectionHeader title="Subastas Activas" />
        <ActiveAuctionsSection />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.color0A0F1C,
  },
  scrollContainer: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 8,
  },
  logo: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
    marginRight: 12,
  },
  slogan: {
    color: COLORS.color00B0FF,
    fontSize: 14,
    fontWeight: '600',
  },
})
