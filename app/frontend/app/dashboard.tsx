// app/dashboard.tsx

import React, { useEffect, useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Button } from 'react-native';
import { Animated, LayoutAnimation, UIManager, Platform } from 'react-native';
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import { ScrollView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';


import TaskItem from '../components/TaskItem';
import TaskModal from '../components/TaskModal';
import TimelineSchedulerModal from '../components/TimelineSchedulerModal';
import { Task } from '../lib/types';
import { moodOptions } from '../lib/constants';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function DashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [isSchedulerVisible, setSchedulerVisible] = useState(false);
  const [isAnimatingShuffle, setIsAnimatingShuffle] = useState(false);
  

  // --- API Functions ---
  const getAuthToken = () => AsyncStorage.getItem('authToken');

  const fetchTasks = async () => {
    setIsLoading(true);
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch tasks');
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Fetching tasks failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckin = async () => {
    try {
      const todayStr = new Date().toISOString().slice(0, 10);
      const lastCheckin = await AsyncStorage.getItem('lastCheckinDate');

      if (lastCheckin === todayStr) {
        return; 
      }

      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/rank/checkin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check-in failed');

      await AsyncStorage.setItem('lastCheckinDate', todayStr);

      console.log('✅ Check-in successful. Streak:', data.streak);
      alert(`You have already checked ${data.streak} days!`);

    } catch (error) {
      console.error('❌ Check-in error:', error);
    }
  };



  const handleAddTask = async (taskData: Omit<Task, 'id' | 'isCompleted'>) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create task');
      setTasks(prev => [...prev, data.task]);
      setModalVisible(false);
    } catch (error) {
      console.error('Create failed:', error);
    }
  };

  const handleUpdateTask = async (taskId: number, taskData: Omit<Task, 'id' | 'isCompleted'>) => {
    if (editingTask?.id === taskId) {
      setModalVisible(false);
      setEditingTask(null);
    }
    // Optimistic update
    const originalTask = tasks.find(t => t.id === taskId);
    const optimisticTask = { ...originalTask!, ...taskData, id: taskId };
    setTasks(prev => prev.map(t => (t.id === taskId ? optimisticTask : t)));

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(taskData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update task');
      setTasks(prev => prev.map(t => (t.id === taskId ? data.task : t)));
    } catch (error) {
      console.error('Update failed:', error);
      if (originalTask) setTasks(prev => prev.map(t => (t.id === taskId ? originalTask : t)));
    }
  };

  const handleBatchUpdateTasks = (updatedTasks: Task[]) => {
    // 1. Optimistically update the UI for a snappy feel
    const updatedIds = new Set(updatedTasks.map(t => t.id));
    const unchangedTasks = tasks.filter(t => !updatedIds.has(t.id));
    setTasks([...unchangedTasks, ...updatedTasks]);

    // 2. Find which tasks actually changed and send updates to the API
    updatedTasks.forEach(updatedTask => {
      const originalTask = filteredTasks.find(t => t.id === updatedTask.id);
      // If the timestamp is different, call the update function
      if (originalTask && originalTask.timestamp !== updatedTask.timestamp) {
        const { id, isCompleted, ...taskData } = updatedTask; // Extract data for the API
        handleUpdateTask(id, taskData);
      }
    });

    setSchedulerVisible(false);
  };

  const handleDeleteTask = async (id: number) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete task');
      setTasks(prev => prev.filter(t => t.id !== id));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };
  
  const handleCompleteTask = async (id: number) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: true } : t));
    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/tasks/${id}/complete`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) {
        setTasks(prev => prev.map(t => t.id === id ? { ...t, isCompleted: false } : t));
        throw new Error('Failed to mark task as complete');
      }
    } catch (error) {
      console.error('Complete failed:', error);
    }
  };

  const animateTaskShuffle = (): Promise<void> => {
    return new Promise((resolve) => {
      const iterations = 30; 
      const delayBeforeStart = 5000; // 5s delay before starting
      const intervalDuration = 30; 

      setTimeout(() => {
        let remaining = iterations;
        const interval = setInterval(() => {
          LayoutAnimation.configureNext({
            duration: intervalDuration,
            update: {
              type: LayoutAnimation.Types.easeInEaseOut,
              property: LayoutAnimation.Properties.scaleXY,
            },
          });

          setTasks((prev) => {
            const shuffled = [...prev];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled;
          });

          remaining--;
          if (remaining <= 0) {
            clearInterval(interval);
            resolve();
          }
        }, intervalDuration);
      }, delayBeforeStart);
    });
  };


  const handleReschedule = async () => {
    if (!selectedMood) return alert("Please select your current mood to reschedule.");
    setIsRescheduling(true);
    setIsAnimatingShuffle(true);
    const shufflePromise = animateTaskShuffle();

    try {
      const token = await getAuthToken();
      const res = await fetch(`${API_BASE_URL}/api/tasks/reschedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ date: selectedDate, currentMood: selectedMood }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Reschedule failed');
    } catch (error) {
      console.error('Reschedule error:', error);
    } finally {
      await shufflePromise;
      await fetchTasks();
      alert('Tasks rescheduled!');
      setIsRescheduling(false);
      setIsAnimatingShuffle(false);
    }
  };


  useEffect(() => {
    const checkAuthAndFetch = async () => {
      const token = await getAuthToken();
      if (!token) {
        router.replace('/reg_login');
      } else {
        fetchTasks();
      }
    };
    checkAuthAndFetch();
  }, []);

  const { filteredTasks, futureTasks } = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);
    const sortedTasks = [...tasks].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    return {
      filteredTasks: sortedTasks.filter(t => t.timestamp.startsWith(selectedDate)),
      futureTasks: sortedTasks.filter(t => t.timestamp.slice(0, 10) > todayStr),
    };
  }, [tasks, selectedDate]);

  const last7Days = useMemo(() => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  }, []);

  const openAddModal = () => {
    setEditingTask(null);
    setModalVisible(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setModalVisible(true);
  };

  const handleSelectMood = async (mood: string) => {
    setSelectedMood(prev => {
      const newMood = prev === mood ? null : mood;
      if (newMood) {
        handleCheckin();
      }
      return newMood;
    });
  };

  if (isLoading) {
    return <View style={styles.centered}><ActivityIndicator size="large" color="#4f46e5" /></View>;
  }

  return (
    <>
      <TaskModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSubmit={(taskData) => {
          if (editingTask) {
            handleUpdateTask(editingTask.id, taskData);
          } else {
            handleAddTask(taskData);
          }
        }}
        editingTask={editingTask}
      />

      <TimelineSchedulerModal
        visible={isSchedulerVisible}
        onClose={() => setSchedulerVisible(false)}
        onSave={handleBatchUpdateTasks}
        tasks={filteredTasks}
        day={selectedDate}
      />

      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Your Timetable</Text>
          <TouchableOpacity onPress={() => router.push('/calendar')} style={styles.calendarButton}>
            <Text style={styles.calendarButtonText}>📅 Calendar</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.subtitle}>How are you feeling now?</Text>
        <View style={styles.moodSelectorContainer}>
          {moodOptions.map(({ mood, color, icon }) => (
            <TouchableOpacity
              key={mood}
              onPress={() => handleSelectMood(mood)}
              style={[ styles.moodButton, { backgroundColor: color }, selectedMood === mood && styles.selectedMoodButton, ]}
            >
              <Text>{icon}</Text>
              <Text>{mood}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity onPress={openAddModal} style={styles.addTaskButton}>
          <Text style={styles.addTaskButtonText}>＋ Add Task</Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>
          Tasks for {new Date(selectedDate + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateSelector}>
          {last7Days.map(date => (
            <TouchableOpacity
              key={date}
              onPress={() => setSelectedDate(date)}
              style={[styles.dateButton, selectedDate === date && styles.selectedDateButton]}
            >
              <Text style={[styles.dateButtonText, selectedDate === date && styles.selectedDateButtonText]}>
                {new Date(date + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.tasksHeader}>
          <Text style={styles.sectionTitle}>Today's Tasks</Text>
          <View style={styles.tasksHeaderActions}>
            {/* --- NEW: Manual Schedule Button --- */}
            <TouchableOpacity
              onPress={() => setSchedulerVisible(true)}
              disabled={filteredTasks.length === 0}
              style={[
                styles.rescheduleButton,
                styles.manualScheduleButton,
                filteredTasks.length === 0 && styles.disabledButton,
              ]}
            >
              <Text style={styles.rescheduleButtonText}>Manual</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleReschedule}
              disabled={isRescheduling}
              style={[styles.rescheduleButton, isRescheduling && styles.disabledButton]}
            >
              {isRescheduling ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.rescheduleButtonText}>AI Reschedule</Text>}
            </TouchableOpacity>
          </View>
        </View>
        {filteredTasks.length > 0 ? (
          filteredTasks.map(task => <TaskItem key={task.id} item={task} onEdit={openEditModal} onDelete={handleDeleteTask} onComplete={handleCompleteTask} />)
        ) : (
          <Text style={styles.emptyText}>No tasks for this day.</Text>
        )}

        <Text style={[styles.sectionTitle, { marginTop: 20 }]}>Future Tasks</Text>
        {futureTasks.length > 0 ? (
          futureTasks.map(task => <TaskItem key={task.id} item={task} onEdit={openEditModal} onDelete={handleDeleteTask} onComplete={handleCompleteTask} />)
        ) : (
          <Text style={styles.emptyText}>No future tasks scheduled.</Text>
        )}
      </ScrollView>
    </>
  );
}

// --- Styles for DashboardScreen (with additions) ---
const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingBottom: 80 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold' },
  calendarButton: { backgroundColor: '#4f46e5', padding: 10, borderRadius: 8 },
  calendarButtonText: { color: 'white', fontWeight: 'bold' },
  subtitle: { marginVertical: 10, fontSize: 16 },
  moodSelectorContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', marginBottom: 10 },
  moodButton: { padding: 10, borderRadius: 10, margin: 5, minWidth: '30%', alignItems: 'center' },
  selectedMoodButton: { borderWidth: 2, borderColor: '#4f46e5' },
  addTaskButton: { backgroundColor: '#4f46e5', padding: 12, borderRadius: 10, marginVertical: 10, alignSelf: 'flex-start' },
  addTaskButtonText: { color: 'white', fontWeight: 'bold' },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginTop: 15 },
  dateSelector: { marginVertical: 10 },
  dateButton: { padding: 10, borderRadius: 8, backgroundColor: '#e5e7eb', marginRight: 8 },
  selectedDateButton: { backgroundColor: '#4f46e5' },
  dateButtonText: { color: 'black', fontWeight: 'bold' },
  selectedDateButtonText: { color: 'white' },
  tasksHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginTop: 10 
  },
  tasksHeaderActions: {
    flexDirection: 'row',
    gap: 8, // Adds space between the buttons
  },
  rescheduleButton: { 
    backgroundColor: '#4f46e5', 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8, 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  manualScheduleButton: {
    backgroundColor: '#10b981', // A different color to distinguish it
  },
  disabledButton: { 
    backgroundColor: '#a5b4fc' 
  },
  rescheduleButtonText: { 
    color: 'white', 
    fontWeight: 'bold' 
  },
  emptyText: { fontStyle: 'italic', color: 'gray', marginTop: 10, textAlign: 'center' },
});