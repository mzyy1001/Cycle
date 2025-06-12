// components/TaskModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../lib/types';
import { moodOptions } from '../lib/constants';

type TaskModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'isCompleted'>) => void;
  editingTask: Task | null;
};

const getInitialFormData = (task: Task | null) => {
  if (task) {
    const taskDate = new Date(task.timestamp);
    return {
      task: task.task,
      mood: task.mood,
      date: taskDate.toISOString().slice(0, 10),
      time: taskDate.toTimeString().slice(0, 5),
      length: String(task.length),
      isLocked: task.isLocked ?? false,
    };
  }
  const now = new Date();
  return {
    task: '',
    mood: [],
    date: now.toISOString().slice(0, 10),
    time: now.toTimeString().slice(0, 5),
    length: '30',
    isLocked: false,
  };
};

const TaskModal = ({ visible, onClose, onSubmit, editingTask }: TaskModalProps) => {
  const [formData, setFormData] = useState(getInitialFormData(editingTask));

  useEffect(() => {
    setFormData(getInitialFormData(editingTask));
  }, [editingTask, visible]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMoodToggle = (mood: string) => {
    const newMoods = formData.mood.includes(mood)
      ? formData.mood.filter(m => m !== mood)
      : [...formData.mood, mood];
    handleInputChange('mood', newMoods);
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.task || !formData.date || !formData.time || !formData.length) {
      return alert('Please fill all fields.');
    }
    if (formData.mood.length === 0) {
      return alert('Please select at least one mood.');
    }
    const taskLength = parseInt(formData.length, 10);
    if (isNaN(taskLength) || taskLength <= 0) {
      return alert('Please enter a valid positive number for task length.');
    }
    
    let timestamp;
    try {
      timestamp = new Date(`${formData.date}T${formData.time}:00`).toISOString();
    } catch (e) {
      return alert('Invalid date or time format.');
    }

    onSubmit({
      task: formData.task,
      mood: formData.mood,
      timestamp,
      length: taskLength,
      isLocked: formData.isLocked,
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Add New Task'}</Text>
          
          <TextInput
            placeholder="e.g., Biology Project Research"
            value={formData.task}
            onChangeText={val => handleInputChange('task', val)}
            style={styles.input}
          />

          <Text style={styles.label}>Best Suited Mood(s)</Text>
          <View style={styles.moodsContainer}>
            {moodOptions.map(({ mood, color, icon }) => (
              <TouchableOpacity
                key={mood}
                onPress={() => handleMoodToggle(mood)}
                style={[
                  styles.moodOption,
                  { backgroundColor: color },
                  formData.mood.includes(mood) && styles.selectedMood,
                ]}
              >
                <Text>{icon} {mood}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            placeholder="Date (YYYY-MM-DD)"
            value={formData.date}
            onChangeText={val => handleInputChange('date', val)}
            style={styles.input}
          />
          <TextInput
            placeholder="Time (HH:MM, 24-hour)"
            value={formData.time}
            onChangeText={val => handleInputChange('time', val)}
            style={styles.input}
          />
          <TextInput
            placeholder="Length (minutes)"
            value={formData.length}
            onChangeText={val => handleInputChange('length', val)}
            keyboardType="numeric"
            style={styles.input}
          />

          <View style={styles.lockContainer}>
            <TouchableOpacity
              onPress={() => handleInputChange('isLocked', !formData.isLocked)}
              style={[styles.lockButton, { backgroundColor: formData.isLocked ? '#f87171' : '#d1d5db' }]}
            >
              <Text style={styles.lockButtonText}>{formData.isLocked ? '🔒 Locked' : '🔓 Unlocked'}</Text>
            </TouchableOpacity>
            <Text style={styles.lockDescription}>
              {formData.isLocked ? 'Task will NOT be rescheduled' : 'Task is flexible for reschedule'}
            </Text>
          </View>

          <View style={styles.buttonContainer}>
            <Button title={editingTask ? 'Save Changes' : 'Add Task'} onPress={handleSubmit} />
            <View style={{ marginTop: 8 }}>
              <Button title="Cancel" onPress={onClose} color="gray" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Styles for TaskModal...
const styles = StyleSheet.create({
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    input: { borderWidth: 1, borderColor: '#ccc', marginVertical: 8, padding: 10, borderRadius: 5 },
    label: { marginBottom: 5, fontWeight: '500' },
    moodsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    moodOption: { padding: 10, margin: 5, borderRadius: 10 },
    selectedMood: { borderWidth: 2, borderColor: '#4f46e5' },
    lockContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    lockButton: { padding: 10, borderRadius: 8, marginRight: 10 },
    lockButtonText: { color: 'white', fontWeight: 'bold' },
    lockDescription: { flex: 1 },
    buttonContainer: { marginTop: 10 },
});

export default TaskModal;