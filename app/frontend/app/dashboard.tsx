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
  mood: string[];
  timestamp: string;
  length: number;
};

export default function DashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskLength, setNewTaskLength] = useState('');
  const [newTaskMood, setNewTaskMood] = useState<string[]>([]);

  useEffect(() => {
  const checkAuth = async () => {
    const token = await AsyncStorage.getItem('authToken');
    console.log('token:', token);
    if (!token) {
      router.replace('/reg_login');
    }
  };
  checkAuth();
}, []);

  useEffect(() => {
    const fetchTasks = async () => {
      const token = await AsyncStorage.getItem('authToken');
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (!res.ok || !data.tasks) {
        console.error('Fetching tasks failed:', data);
        return;
      }

      setTasks(data.tasks);
    };
    fetchTasks();
  }, []);

  const addTask = async () => {
    if (!newTaskTitle || !newTaskMood || !newTaskDate || !newTaskTime || !newTaskLength) {
      return alert('Please fill all fields: title, mood, date, time, and length.');
    }
    const token = await AsyncStorage.getItem('authToken');
    console.log('token:', token);

    let timestamp;
    try {
      const localDateTime = new Date(`${newTaskDate}T${newTaskTime}:00`);
      if (isNaN(localDateTime.getTime())) {
        throw new Error('Invalid date or time format');
      }
      timestamp = localDateTime.toISOString();
    } catch (error) {
      console.error("Error parsing date/time:", error);
      alert("Invalid date or time format. Please use YYYY-MM-DD for date and HH:MM for time.");
      return;
    }

    const taskLength = parseInt(newTaskLength, 10);
    if (isNaN(taskLength) || taskLength <= 0) {
      alert('Please enter a valid positive number for task length (in minutes).');
      return;
    }

    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        task: newTaskTitle,
        mood: newTaskMood,
        timestamp: timestamp,
        length: taskLength,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.task) {
      console.error('Create failed:', data);
      alert(data.error || 'Failed to create task');
      return;
    }
    console.log('server returned:', data);

    setTasks(prev => [...prev, data.task]);
    setModalVisible(false);
    setNewTaskTitle('');
    // Reset new fields
    setNewTaskDate('');
    setNewTaskTime('');
    setNewTaskLength('');
    setNewTaskMood([]);
  };

  const filteredTasks = selectedMood
  ? tasks.filter(t => t.mood.includes(selectedMood))
  : tasks;



  const renderTaskItem = (item: Task) => {
    const firstMood = item.mood[0]; 
    const moodObj = moodOptions.find(m => m.mood === firstMood);
    const startTime = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const handleDelete = async () => {
      const token = await AsyncStorage.getItem('authToken');
      console.log('token:', token);
      const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks/${item.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (res.ok) {
        setTasks(prev => prev.filter(t => t.id !== item.id));
      } else {
        alert('Failed to delete task');
      }
    };

    return (
      <View style={{
        backgroundColor: moodObj?.color || '#fff',
        padding: 10,
        marginVertical: 5,
        borderRadius: 10
      }} key={item.id}>
        <Text style={{ fontWeight: 'bold' }}>{item.task}</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 4 }}>
          {item.mood.map((m, i) => {
            const mo = moodOptions.find(opt => opt.mood === m);
            return (
              <View key={i} style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: mo?.color || '#eee',
                paddingHorizontal: 8,
                paddingVertical: 4,
                borderRadius: 12,
                marginRight: 5,
                marginBottom: 5
              }}>
                <Text>{mo?.icon} {m}</Text>
              </View>
            );
          })}
        </View>
        <TouchableOpacity onPress={handleDelete} style={{ marginTop: 6 }}>
        <Text style={{ color: 'red' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleOpenModal = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const day = now.getDate().toString().padStart(2, '0');
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');

    setNewTaskDate(`${year}-${month}-${day}`);
    setNewTaskTime(`${hours}:${minutes}`);
    setNewTaskLength('30');
    setNewTaskTitle('');
    setNewTaskMood([]);
    setModalVisible(true);
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 }}>
              {moodOptions.map(({ mood, color, icon }) => (
                <TouchableOpacity
                  key={mood}
                  onPress={() => {
                    if (newTaskMood.includes(mood)) {
                      setNewTaskMood(prev => prev.filter(m => m !== mood));
                    } else {
                      setNewTaskMood(prev => [...prev, mood]);
                    }
                  }}
                  style={{
                    backgroundColor: color,
                    padding: 10,
                    margin: 5,
                    borderRadius: 10,
                    borderWidth: newTaskMood.includes(mood) ? 2 : 0,
                    borderColor: newTaskMood.includes(mood) ? '#4f46e5' : 'transparent', // Highlight selected mood
                  }}
                >
                  <Text>{icon} {mood}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TextInput
              placeholder="Date (YYYY-MM-DD)"
              value={newTaskDate}
              onChangeText={setNewTaskDate}
              style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 5 }}
            />
            <TextInput
              placeholder="Time (HH:MM, 24-hour)"
              value={newTaskTime}
              onChangeText={setNewTaskTime}
              style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 5 }}
            />
            <TextInput
              placeholder="Length (minutes)"
              value={newTaskLength}
              onChangeText={setNewTaskLength}
              keyboardType="numeric"
              style={{ borderWidth: 1, marginVertical: 10, padding: 8, borderRadius: 5 }}
            />
            <View style={{ marginTop: 10 }}>
              <Button title="Add Task" onPress={addTask} />
            </View>
            <View style={{ marginTop: 8 }}>
              <Button title="Cancel" onPress={() => {
                setModalVisible(false);
                // Reset all form fields on cancel
                setNewTaskTitle('');
                setNewTaskMood([]);
                setNewTaskDate('');
                setNewTaskTime('');
                setNewTaskLength('');
              }} color="gray" />
            </View>
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
                alignItems: 'center',
                borderWidth: selectedMood === mood ? 2 : 0,
                borderColor: selectedMood === mood ? '#4f46e5' : 'transparent',
              }}
            >
              <Text>{icon}</Text>
              <Text>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <TouchableOpacity
            onPress={handleOpenModal} // Use handleOpenModal to prefill and show
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
        {(filteredTasks ?? []).length > 0 ? (
          (filteredTasks ?? []).sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          ).map(renderTaskItem)
        ) : (
          <Text style={{ fontStyle: 'italic', color: 'gray', textAlign: 'center', marginTop: 20 }}>
            No tasks scheduled{selectedMood ? ` for ${selectedMood} mood` : ''}. Add some!
          </Text>
        )}
      </ScrollView>
      <TouchableOpacity onPress={async () => {
        await AsyncStorage.removeItem('authToken');
        router.replace('/reg_login');
      }} style={{ padding: 10, alignItems: 'center', backgroundColor: '#f3f4f6', borderTopWidth: 1, borderColor: '#e5e7eb' }}>
        <Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Logout</Text>
      </TouchableOpacity>
    </>
  );
}