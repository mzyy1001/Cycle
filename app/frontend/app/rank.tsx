import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type RankEntry = {
  rank: number;
  username: string;
  streak: number;
  isMe: boolean;
};

export default function RankPage() {
  const [rankList, setRankList] = useState<RankEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRank = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token || !API_BASE_URL) return;

      try {
        const res = await fetch(`${API_BASE_URL}/api/rank`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await res.json();
        setRankList(data.rank);
      } catch (err) {
        console.error('Failed to fetch rank:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRank();
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.loadingText}>Loading Rankings...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>🏆 Global Streak Ranking</Text>
      {rankList.map((entry) => (
        <View
          key={entry.rank}
          style={[
            styles.row,
            entry.isMe ? styles.highlight : null
          ]}
        >
          <Text style={styles.rank}>{entry.rank}.</Text>
          <Text style={styles.username}>{entry.username}</Text>
          <Text style={styles.streak}>{entry.streak} day{entry.streak !== 1 ? 's' : ''}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 20,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  rank: {
    fontWeight: 'bold',
    width: 40,
    color: '#334155',
  },
  username: {
    flex: 1,
    color: '#1e293b',
  },
  streak: {
    fontWeight: '600',
    color: '#10b981',
  },
  highlight: {
    backgroundColor: '#f0f9ff',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
});
