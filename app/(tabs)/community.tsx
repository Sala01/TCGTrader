import { View, FlatList, ImageBackground, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { SafeAreaView } from 'react-native-safe-area-context'

const communityItems = [
    {
        id: 'banlist',
        category: 'BAN LIST',
        title: 'Lista de Cartas Prohibidas y Limitadas',
        description: 'Consulta la última actualización oficial del formato.',
        image: 'https://wsrv.nl/?url=https://s3.duellinksmeta.com/mdm_img/front-page/banlist.webp&w=1000&output=webp&we&n=-1&maxage=7d',
        path: '/community/banlist',
    },
    {
        id: 'metagame',
        category: 'META GAME',
        title: 'Análisis del Meta Actual',
        description: 'Decks más competitivos y sus porcentajes en torneos.',
        image: 'https://s3.duellinksmeta.com/mdm_img/ygo-meta/sets/alin-banner.webp',
        path: '/community/metagame',
    },
    {
        id: 'torneos',
        category: 'TORNEOS',
        title: 'Últimos Torneos y Resultados',
        description: 'Top 8, Top 16 y decks campeones recientes.',
        image: 'https://wsrv.nl/?url=https://s3.duellinksmeta.com/mdm_img/ygo-meta/content/tcg-events/2023/YGOM_YCS_Generic.webp&w=1000&output=webp&we&n=-1&maxage=7d',
        path: '/community/torneos',
    },
    {
        id: 'foro',
        category: 'FORO',
        title: 'Discusión y Comunidad',
        description: 'Comparte estrategias, dudas y habla con otros duelistas.',
        image: 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/b2dbc396-8f44-41e5-bf2d-215302247782/di9qisr-a51f6c52-9415-4ea9-af5d-e8b301773ef3.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7InBhdGgiOiJcL2ZcL2IyZGJjMzk2LThmNDQtNDFlNS1iZjJkLTIxNTMwMjI0Nzc4MlwvZGk5cWlzci1hNTFmNmM1Mi05NDE1LTRlYTktYWY1ZC1lOGIzMDE3NzNlZjMuanBnIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmZpbGUuZG93bmxvYWQiXX0.3a70ZEDZpAm5wd242DY8K3H9JK_591Y39h1y7Z03nAk',
        path: '/community/foro',
    },
    {
        id: 'news',
        category: 'NOTICIAS',
        title: 'Noticias y Actualizaciones',
        description: 'Lo más nuevo del mundo de Yu-Gi-Oh! y TCG en general.',
        image: 'https://img.yugioh-card.com/eu/wp-content/uploads/2024/11/CRBR_News_Banner.webp',
        path: '/community/news',
    },
]

export default function CommunityScreen() {
    const router = useRouter();

    const renderItem = ({ item }: { item: typeof communityItems[0] }) => (
        <TouchableOpacity
            style={{
                height: 200,
                borderRadius: 16,
                overflow: 'hidden',
                marginBottom: 16,
            }}
            onPress={() => router.push(item.path)}
        >
            <ImageBackground
                source={{ uri: item.image }}
                resizeMode="cover"
                style={{
                    flex: 1,
                    justifyContent: 'flex-end',
                }}
            >
                {/* Blur sobre el fondo */}
                <BlurView
                    intensity={40}
                    tint="dark"
                    style={{
                        padding: 12,
                    }}
                >
                    <View
                        style={{
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            paddingVertical: 4,
                            paddingHorizontal: 8,
                            borderRadius: 12,
                            alignSelf: 'flex-start',
                            marginBottom: 8,
                        }}
                    >
                        <Text style={{ color: 'white', fontSize: 12 }}>{item.category}</Text>
                    </View>

                    <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
                        {item.title}
                    </Text>
                    <Text style={{ color: '#ccc', fontSize: 14, marginTop: 4 }}>
                        {item.description}
                    </Text>

                </BlurView>
            </ImageBackground>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: '#0A0F1C', padding: 16 }}>
            <FlatList
                data={communityItems}
                keyExtractor={(item) => item.id}
                renderItem={renderItem}
                contentContainerStyle={{ paddingBottom: 80 }}
            />
        </SafeAreaView>
    );
}
