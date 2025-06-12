// app/week.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import WeekScheduleView from '../components/WeekScheduleView';
import { router } from 'expo-router';
import { TouchableOpacity } from 'react-native';

const moodOptions = [
  { mood: "Focused", color: "#dbeafe", icon: "📘" },
  { mood: "Energized", color: "#fef3c7", icon: "⚡" },
  { mood: "Calm", color: "#d1fae5", icon: "🌿" },
  { mood: "Creative", color: "#f3e8ff", icon: "✨" },
  { mood: "Tired", color: "#e5e7eb", icon: "😴" },
  { mood: "Stressed", color: "#fee2e2", icon: "😖" },
];

export default function WeekViewScreen() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to load tasks');
        return;
      }
      setTasks(data.tasks || []);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 100 }} />;

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>🗓️ Weekly Calendar</Text>
      <WeekScheduleView tasks={tasks} moodOptions={moodOptions} />
      <TouchableOpacity
        onPress={() => router.replace('/dashboard')}
        style={{
            backgroundColor: '#e5e7eb',
            padding: 10,
            borderRadius: 8,
            alignItems: 'center',
            marginTop: 20,
            borderWidth: 1,
            borderColor: '#9ca3af'
        }}
        >
        <Text style={{ color: '#1f2937', fontWeight: 'bold' }}>🔙 Back to Dashboard</Text>
      </TouchableOpacity>
    </View>
    
  );
}
