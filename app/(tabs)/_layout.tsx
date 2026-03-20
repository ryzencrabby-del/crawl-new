import { Tabs } from 'expo-router'
import { View, Text, StyleSheet } from 'react-native'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#E8572A',
      tabBarInactiveTintColor: '#8e8e93',
      tabBarStyle: {
        backgroundColor: '#ffffff',
        borderTopWidth: 0.5,
        borderTopColor: 'rgba(0,0,0,0.1)',
        paddingBottom: 20,
        paddingTop: 8,
        height: 80,
      },
      headerShown: false,
    }}>
      <Tabs.Screen name="discover" options={{ title: 'Discover', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>🔍</Text> }} />
      <Tabs.Screen name="outing" options={{ title: 'Outing', tabBarIcon: ({ color }) => (
        <View>
          <Text style={{ fontSize: 24 }}>🗺</Text>
          <View style={s.badge}><Text style={s.badgeText}>1</Text></View>
        </View>
      )}} />
      <Tabs.Screen name="recap" options={{ title: 'Recap', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>📸</Text> }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <Text style={{ fontSize: 24 }}>👤</Text> }} />
    </Tabs>
  )
}

const s = StyleSheet.create({
  badge: { position: 'absolute', top: -4, right: -8, backgroundColor: '#FF3B30', width: 16, height: 16, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '700' },
})
