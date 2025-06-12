// components/TaskItem.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Task } from '../lib/types';
import { moodOptions } from '../lib/constants';

type TaskItemProps = {
  item: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: number) => void;
  onComplete: (id: number) => void;
};

const TaskItem = ({ item, onEdit, onDelete, onComplete }: TaskItemProps) => {
  const moodObj = moodOptions.find(m => m.mood === item.mood[0]);
  const startDate = new Date(item.timestamp);
  const endDate = new Date(startDate.getTime() + item.length * 60000);
  const startTime = startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const endTime = endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <TouchableOpacity onLongPress={() => onEdit(item)} delayLongPress={200}>
      <View style={[styles.container, { backgroundColor: moodObj?.color || '#fff' }]}>
        <Text style={styles.taskTitle}>{item.task}</Text>
        <Text style={styles.taskTime}>{`${startTime} - ${endTime}`}</Text>
        <Text style={[styles.statusText, { color: item.isCompleted ? 'green' : '#f59e0b' }]}>
          {item.isCompleted ? '✅ Completed' : '⏳ Not Completed'}
        </Text>
        <View style={styles.moodsContainer}>
          {item.mood.map((m, i) => {
            const mo = moodOptions.find(opt => opt.mood === m);
            return (
              <View key={i} style={[styles.moodBadge, { backgroundColor: mo?.color || '#eee' }]}>
                <Text>{mo?.icon} {m}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.actionsContainer}>
          {!item.isCompleted ? (
            <TouchableOpacity onPress={() => onComplete(item.id)} style={styles.actionButton}>
              <Text style={styles.completeText}>✅ Mark as Completed</Text>
            </TouchableOpacity>
          ) : <View style={{flex: 1}}/>}
          <TouchableOpacity onPress={() => onDelete(item.id)} style={styles.actionButton}>
            <Text style={styles.deleteText}>Delete</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 15,
    marginVertical: 8,
    borderRadius: 12,
  },
  taskTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  taskTime: {
    color: '#4b5563',
    marginVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  moodsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  moodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 5,
    marginBottom: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    padding: 4,
  },
  completeText: {
    color: 'green',
  },
  deleteText: {
    color: 'red',
  },
});

export default TaskItem;