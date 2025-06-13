// components/TaskModal.tsx
import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, Button, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../lib/types';
import { moodOptions } from '../lib/constants';
import DateTimePicker from './DateTimePicker'; // <-- Import the new component

type TaskModalProps = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (taskData: Omit<Task, 'id' | 'isCompleted'>) => void;
  editingTask: Task | null;
};

// Helper to round the initial date to the nearest 15 minutes for a cleaner start
const getRoundedInitialDate = () => {
  const now = new Date();
  const minutes = now.getMinutes();
  const roundedMinutes = Math.round(minutes / 15) * 15;
  now.setMinutes(roundedMinutes);
  now.setSeconds(0);
  now.setMilliseconds(0);
  return now;
};

const getInitialFormData = (task: Task | null) => {
  if (task) {
    return {
      task: task.task,
      mood: task.mood,
      timestampDate: new Date(task.timestamp),
      length: String(task.length),
      isLocked: task.isLocked,
    };
  }
  return {
    task: '',
    mood: [],
    timestampDate: getRoundedInitialDate(),
    length: '30',
    isLocked: false,
  };
};

const TaskModal = ({ visible, onClose, onSubmit, editingTask }: TaskModalProps) => {
  const [formData, setFormData] = useState(getInitialFormData(editingTask));
  const [viewMode, setViewMode] = useState<'form' | 'picker'>('form');
  const [isPickerVisible, setPickerVisible] = useState(false); // <-- State for our new picker

  useEffect(() => {
    if (visible) {
      setFormData(getInitialFormData(editingTask));
      // Reset to form view whenever the modal becomes visible
      setViewMode('form');
    }
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
    if (!formData.task || formData.mood.length === 0 || !formData.length) {
      return alert('Please fill all fields and select a mood.');
    }
    const taskLength = parseInt(formData.length, 10);
    if (isNaN(taskLength) || taskLength <= 0) {
      return alert('Please enter a valid positive number for task length.');
    }

    onSubmit({
      task: formData.task,
      mood: formData.mood,
      timestamp: formData.timestampDate.toISOString(),
      length: taskLength,
      isLocked: formData.isLocked,
    });
  };

  const renderForm = () => (
    <>
      <Text style={styles.modalTitle}>{editingTask ? 'Edit Task' : 'Add New Task'}</Text>
      <TextInput placeholder="e.g., Biology Project Research" value={formData.task} onChangeText={val => handleInputChange('task', val)} style={styles.input} />
      <Text style={styles.label}>Best Suited Mood(s)</Text>
      <View style={styles.moodsContainer}>{moodOptions.map(({ mood, color, icon }) => (<TouchableOpacity key={mood} onPress={() => handleMoodToggle(mood)} style={[styles.moodOption, { backgroundColor: color }, formData.mood.includes(mood) && styles.selectedMood,]}><Text>{icon} {mood}</Text></TouchableOpacity>))}
      </View>
      <Text style={styles.label}>Date & Time</Text>
      <TouchableOpacity onPress={() => setViewMode('picker')} style={styles.dateTimePickerButton}>
        <Text style={styles.dateTimePickerText}>{formData.timestampDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
        <Text style={styles.dateTimePickerText}>{formData.timestampDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
      </TouchableOpacity>
      <Text style={styles.label}>Length (minutes)</Text>
      <TextInput value={formData.length} onChangeText={val => handleInputChange('length', val)} keyboardType="numeric" style={styles.input} />
      <View style={styles.lockContainer}><TouchableOpacity onPress={() => handleInputChange('isLocked', !formData.isLocked)} style={[styles.lockButton, { backgroundColor: formData.isLocked ? '#f87171' : '#d1d5db' }]}><Text style={styles.lockButtonText}>{formData.isLocked ? '🔒 Locked' : '🔓 Unlocked'}</Text></TouchableOpacity><Text style={styles.lockDescription}>{formData.isLocked ? 'Task will NOT be rescheduled' : 'Task is flexible for reschedule'}</Text></View>
      <View style={styles.buttonContainer}><Button title={editingTask ? 'Save Changes' : 'Add Task'} onPress={handleSubmit} /><View style={{ marginTop: 8 }}><Button title="Cancel" onPress={onClose} color="gray" /></View></View>
    </>
  );

  const renderPicker = () => (
    <DateTimePicker
      // --- CHANGE 3: Use a key to force re-mount and state reset ---
      key={formData.timestampDate.toISOString()}
      currentDate={formData.timestampDate}
      onConfirm={(newDate) => {
        handleInputChange('timestampDate', newDate);
        setViewMode('form'); // Go back to the form view
      }}
      onCancel={() => {
        setViewMode('form'); // Go back to the form view
      }}
    />
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {viewMode === 'form' ? renderForm() : renderPicker()}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
    modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: 'white', padding: 20, borderRadius: 10, width: '90%', maxHeight: '90%' },
    modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
    input: { borderWidth: 1, borderColor: '#ccc', marginVertical: 8, padding: 10, borderRadius: 5 },
    label: { marginTop: 10, marginBottom: 5, fontWeight: '500' },
    moodsContainer: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 10 },
    moodOption: { padding: 10, margin: 5, borderRadius: 10 },
    selectedMood: { borderWidth: 2, borderColor: '#4f46e5' },
    
    dateTimePickerButton: {
      borderWidth: 1,
      borderColor: '#ccc',
      padding: 10,
      borderRadius: 5,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    dateTimePickerText: {
      fontSize: 16,
      color: '#333',
    },

    lockContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 10 },
    lockButton: { padding: 10, borderRadius: 8, marginRight: 10 },
    lockButtonText: { color: 'white', fontWeight: 'bold' },
    lockDescription: { flex: 1 },
    buttonContainer: { marginTop: 10 },
});

export default TaskModal;