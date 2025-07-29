import { useEffect, useState } from 'react';
import { View, FlatList, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ActivityIndicator } from 'react-native-paper';
import * as Linking from 'expo-linking';

type Tournament = {
  id: number;
  name: string;
  slug: string;
  event_date: string;
  country: string;
  player_count: number;
  winner: string | null;
  format: string;
};

export default function TournamentsScreen() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getCurrentMonthParam = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  };

  const fetchTournaments = async () => {
    try {
      setLoading(true);
      setError(null);

      const currentMonth = getCurrentMonthParam();
      const url = `https://ygoprodeck.com/api/tournament/getTournaments.php?date=${currentMonth}&format=TCG`;

      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0',
          'Accept': 'application/json',
          'Referer': 'https://ygoprodeck.com/tournaments/',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });

      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText || 'al obtener los torneos'}`);

      const json = await res.json();
      const allTournaments = json.data || [];

      const latestTen = allTournaments
        .sort((a, b) => new Date(b.event_date).getTime() - new Date(a.event_date).getTime())
        .slice(0, 10);

      setTournaments(latestTen);
    } catch (err: any) {
      console.error('Error al obtener torneos:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const renderItem = ({ item }: { item: Tournament }) => {
    const formattedDate = new Date(item.event_date).toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    return (
      <TouchableOpacity onPress={() => Linking.openURL(`https://ygoprodeck.com/tournament/${item.slug}`)}>
        <View style={styles.card}>
          <Text style={styles.title}>{item.name}</Text>
          <Text style={styles.meta}>📅 {formattedDate}</Text>
          <Text style={styles.meta}>🌍 {item.country}</Text>
          <Text style={styles.meta}>👥 {item.player_count} jugadores</Text>
          <Text style={styles.meta}>📄 Formato: {item.format}</Text>
          <Text style={styles.meta}>🥇 Ganador: {item.winner ?? 'Desconocido'}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator animating={true} color="#00B0FF" />
      ) : error ? (
        <Text style={styles.error}>❌ {error}</Text>
      ) : tournaments.length === 0 ? (
        <Text style={styles.empty}>No hay torneos disponibles este mes.</Text>
      ) : (
        <FlatList
          data={tournaments}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 80 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
    padding: 16,
  },
  card: {
    backgroundColor: '#1C1C2E',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
    color: '#FFF',
    marginBottom: 6,
  },
  meta: {
    fontSize: 13,
    color: '#BFCED6',
  },
  empty: {
    color: '#BFCED6',
    textAlign: 'center',
    marginTop: 20,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
});
