import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ScrollView } from 'react-native';
import { Modal, TextInput, Button } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';



const moodOptions = [
  { mood: "Focused", color: "#dbeafe", icon: "📘" },
  { mood: "Energized", color: "#fef3c7", icon: "⚡" },
  { mood: "Calm", color: "#d1fae5", icon: "🌿" },
  { mood: "Creative", color: "#f3e8ff", icon: "✨" },
  { mood: "Tired", color: "#e5e7eb", icon: "😴" },
  { mood: "Stressed", color: "#fee2e2", icon: "😖" },
];

type Task = {
  id: number;
  task: string;
  mood: string;
  timestamp: string;
  length: number;
  isScheduled: boolean;
};

export default function DashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskMood, setNewTaskMood] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token) {
        router.replace('/reg_login');
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`);
      const data = await res.json();
      setTasks(data.tasks);
    };
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!newTaskTitle || !newTaskMood) return alert('Please enter title and mood');
    const timestamp = new Date().toISOString();
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        task: newTaskTitle,
        mood: newTaskMood,
        timestamp,
        length: 30,
      }),
    });
    const data = await res.json();
    setTasks(prev => [...prev, data.task]);
    setModalVisible(false);
    setNewTaskTitle('');
    setNewTaskMood(null);
  };

  const filteredTasks = selectedMood ? tasks.filter(t => t.mood === selectedMood) : tasks;

  const renderTaskItem = (item: Task) => {
    const moodObj = moodOptions.find(m => m.mood === item.mood);
    const startTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return (
      <View style={{
        backgroundColor: moodObj?.color || '#fff',
        padding: 10,
        marginVertical: 5,
        borderRadius: 10
      }}>
        <Text style={{ fontWeight: 'bold' }}>{item.task}</Text>
        <Text>{moodObj?.icon} {item.mood} · {startTime} · {item.length} min</Text>
      </View>
    );
  };

  return (
    <>
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={{
          flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)'
        }}>
          <View style={{
            backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%'
          }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold' }}>Add New Task</Text>
            <TextInput
              placeholder="e.g., Biology Project Research"
              value={newTaskTitle}
              onChangeText={setNewTaskTitle}
              style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 5 }}
            />
            <Text style={{ marginBottom: 5 }}>Best Suited Mood</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {moodOptions.map(({ mood, color, icon }) => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => setNewTaskMood(mood)}
                  style={{
                    backgroundColor: color,
                    padding: 10,
                    margin: 5,
                    borderRadius: 10,
                    borderWidth: newTaskMood === mood ? 2 : 0,
                  }}
                >
                  <Text>{icon} {mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button title="Add Task" onPress={addTask} />
            <Button title="Cancel" onPress={() => setModalVisible(false)} color="gray" />
          </View>
        </View>
      </Modal>
      
      <ScrollView contentContainerStyle={{ padding: 20 }}>

        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Your Student Timetable</Text>
        <Text style={{ marginVertical: 10 }}>How are you feeling now?</Text>
        
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
          {moodOptions.map(({ mood, color, icon }) => (
            <TouchableOpacity
              key={mood}
              onPress={() => setSelectedMood(mood === selectedMood ? null : mood)}
              style={{
                backgroundColor: color,
                padding: 10,
                borderRadius: 10,
                margin: 5,
                minWidth: '30%',
                alignItems: 'center'
              }}
            >
              <Text>{icon}</Text>
              <Text>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
            onPress={() => setModalVisible(true)}
            style={{
              backgroundColor: '#4f46e5',
              padding: 12,
              borderRadius: 10,
              marginVertical: 10,
              alignSelf: 'flex-start'
            }}
          >
          <Text style={{ color: 'white', fontWeight: 'bold' }}>＋ Add Task</Text>
        </TouchableOpacity>

        {/* Task List */}
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 10 }}>Today's Schedule</Text>
        {filteredTasks
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
          .map(renderTaskItem)}
      </ScrollView>
      <TouchableOpacity onPress={async () => {
        await AsyncStorage.removeItem('authToken');
        router.replace('/reg_login');
      }}>
        <Text>Logout</Text>
      </TouchableOpacity>
    </>
  );
}
