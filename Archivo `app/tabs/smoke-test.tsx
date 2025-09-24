import { View, Text } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';

export default function SmokeTestScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Smoke Test Screen</Text>
    </View>
  );
}
