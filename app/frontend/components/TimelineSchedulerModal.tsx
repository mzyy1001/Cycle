// components/TimelineSchedulerModal.tsx
import React, { useState, useMemo, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Gesture, GestureDetector, ScrollView, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  SharedValue,
} from 'react-native-reanimated';
import { Task } from '../lib/types';
import { moodOptions } from '../lib/constants';

// Type Definitions
type TimelineSchedulerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedTasks: Task[]) => void;
  tasks: Task[];
  day: string;
};

// Constants
const PIXELS_PER_MINUTE = 2.5;
const SNAP_INTERVAL_MINUTES = 15;
const HOURS_IN_DAY = 24;
const TIMELINE_WIDTH = HOURS_IN_DAY * 60 * PIXELS_PER_MINUTE;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const BORDER_COLOR_DEFAULT = '#4f46e5';
const BORDER_COLOR_COLLIDING = '#ef4444';

// 1. A plain JS function for initialization during React's render cycle.
const getMinutesFromMidnightJS = (timestamp: string): number => {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
};

// 2. A worklet version for use on the UI thread (inside gesture handlers).
const getMinutesFromMidnight = (timestamp: string): number => {
  'worklet';
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const checkCollisionWorklet = (
  currentMinutes: number,
  taskLength: number,
  taskId: number,
  allTasks: Task[]
): boolean => {
  'worklet';
  const taskEnd = currentMinutes + taskLength;
  for (const otherTask of allTasks) {
    if (otherTask.id === taskId) continue;
    const otherStart = getMinutesFromMidnight(otherTask.timestamp);
    const otherEnd = otherStart + otherTask.length;
    if (currentMinutes < otherEnd && taskEnd > otherStart) {
      return true;
    }
  }
  return false;
};

// DraggableTask Component
type DraggableTaskProps = {
  task: Task;
  allTasksShared: SharedValue<Task[]>;
  onUpdateTimestamp: (id: number, newTimestamp: string) => void;
  onDragStateChange: (isDragging: boolean) => void;
};

const DraggableTask: React.FC<DraggableTaskProps> = ({
  task,
  allTasksShared,
  onUpdateTimestamp,
  onDragStateChange,
}) => {
  const isColliding = useSharedValue(false);
  const translateX = useSharedValue(getMinutesFromMidnightJS(task.timestamp) * PIXELS_PER_MINUTE);
  const scale = useSharedValue(1);
  const initialX = useSharedValue(0);

  const moodObj = moodOptions.find((m) => m.mood === task.mood[0]);

  const longPressGesture = Gesture.LongPress().minDuration(250);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(onDragStateChange)(true);
      initialX.value = translateX.value;
      scale.value = withSpring(1.05);
    })
    .onChange((event) => {
      translateX.value = initialX.value + event.translationX;
      const currentMinutes = translateX.value / PIXELS_PER_MINUTE;
      isColliding.value = checkCollisionWorklet(currentMinutes, task.length, task.id, allTasksShared.value);
    })
    .onEnd(() => {
      const currentMinutes = translateX.value / PIXELS_PER_MINUTE;
      const isCurrentlyColliding = checkCollisionWorklet(currentMinutes, task.length, task.id, allTasksShared.value);

      if (isCurrentlyColliding) {
        translateX.value = withSpring(initialX.value);
      } else {
        const snappedMinutes = Math.max(
          0,
          Math.min(
            HOURS_IN_DAY * 60 - task.length,
            Math.round(currentMinutes / SNAP_INTERVAL_MINUTES) * SNAP_INTERVAL_MINUTES
          )
        );
        translateX.value = withSpring(snappedMinutes * PIXELS_PER_MINUTE);
        const newTimestamp = new Date(task.timestamp);
        newTimestamp.setHours(Math.floor(snappedMinutes / 60), snappedMinutes % 60, 0, 0);
        runOnJS(onUpdateTimestamp)(task.id, newTimestamp.toISOString());
      }
      
      isColliding.value = false;
      scale.value = withSpring(1);
    })
    .onFinalize(() => {
      runOnJS(onDragStateChange)(false);
    })
    .shouldCancelWhenOutside(false);

  const composedGesture = Gesture.Simultaneous(longPressGesture, panGesture);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    borderLeftColor: isColliding.value ? BORDER_COLOR_COLLIDING : (moodObj?.color || BORDER_COLOR_DEFAULT),
  }));

  const taskWidth = task.length * PIXELS_PER_MINUTE;
  const startDate = new Date(task.timestamp);
  const endDate = new Date(startDate.getTime() + task.length * 60000);

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View
        style={[
          styles.taskBlock,
          {
            width: taskWidth,
            backgroundColor: moodObj?.color || '#e5e7eb',
          },
          animatedStyle,
        ]}
      >
        <Text style={styles.taskText} numberOfLines={1}>{task.task}</Text>
        <Text style={styles.taskTimeText}>{`${formatTime(startDate)} - ${formatTime(endDate)}`}</Text>
      </Animated.View>
    </GestureDetector>
  );
};


// Main TimelineSchedulerModal Component
const TimelineSchedulerModal: React.FC<TimelineSchedulerModalProps> = ({
  visible,
  onClose,
  onSave,
  tasks,
  day,
}) => {
  const [localTasks, setLocalTasks] = useState<Task[]>(tasks);
  const allTasksShared = useSharedValue<Task[]>(tasks);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (visible) {
      const tasksCopy = JSON.parse(JSON.stringify(tasks));
      setLocalTasks(tasksCopy);
      allTasksShared.value = tasksCopy;
      setIsDragging(false);
    }
  }, [visible, tasks]);

  const updateTaskTimestamp = (id: number, newTimestamp: string) => {
    const newTasks = localTasks.map((t) =>
      t.id === id ? { ...t, timestamp: newTimestamp } : t
    );
    setLocalTasks(newTasks);
    allTasksShared.value = newTasks;
  };

  const renderTimelineBackground = useMemo(() => (
    <View style={styles.timelineBackgroundContainer}>
      {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
        <View key={hour} style={[styles.hourBlock, { width: 60 * PIXELS_PER_MINUTE }]}>
          <Text style={styles.hourText}>{`${String(hour).padStart(2, '0')}:00`}</Text>
        </View>
      ))}
    </View>
  ), []);

  const currentTimeIndicatorPosition = useMemo(() => {
    const now = new Date();
    if (now.toISOString().split('T')[0] !== day) return -1;
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes * PIXELS_PER_MINUTE;
  }, [day]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>Drag to Schedule</Text>
              <Text style={styles.subtitle}>
                {new Date(day + 'T00:00:00').toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.scrollViewContent}
              scrollEnabled={!isDragging}
            >
              <View style={{ width: TIMELINE_WIDTH, height: 200 }}>
                {renderTimelineBackground}
                {currentTimeIndicatorPosition > -1 && (
                  <View style={[styles.currentTimeIndicator, { left: currentTimeIndicatorPosition }]} >
                    <View style={styles.currentTimeDot} />
                  </View>
                )}
                {localTasks.map((task) => (
                  <DraggableTask
                    key={task.id}
                    task={task}
                    allTasksShared={allTasksShared}
                    onUpdateTimestamp={updateTaskTimestamp}
                    onDragStateChange={setIsDragging}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity onPress={onClose} style={[styles.button, styles.cancelButton]}>
                <Text style={[styles.buttonText, { color: '#374151' }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onSave(localTasks)} style={[styles.button, styles.saveButton]}>
                <Text style={styles.buttonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </GestureHandlerRootView>
    </Modal>
  );
};

// Styles
const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)' },
  modalContent: { width: '95%', maxHeight: SCREEN_HEIGHT * 0.7, backgroundColor: 'white', borderRadius: 20, paddingTop: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.3, shadowRadius: 15, elevation: 10 },
  header: { paddingHorizontal: 20, paddingBottom: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: 'bold', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 2 },
  scrollViewContent: { paddingVertical: 20 },
  timelineBackgroundContainer: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row' },
  hourBlock: { height: '100%', borderRightWidth: 1, borderRightColor: '#e5e7eb' },
  hourText: { position: 'absolute', top: -20, left: -18, fontSize: 12, color: '#9ca3af' },
  currentTimeIndicator: { position: 'absolute', top: -5, bottom: 0, width: 2, backgroundColor: '#ef4444', zIndex: 10 },
  currentTimeDot: { position: 'absolute', top: -4, left: -3, width: 8, height: 8, borderRadius: 4, backgroundColor: '#ef4444' },
  taskBlock: { position: 'absolute', height: 60, top: 20, borderRadius: 8, borderLeftWidth: 5, paddingVertical: 6, paddingHorizontal: 10, justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4, elevation: 4 },
  taskText: { fontWeight: '600', fontSize: 14, color: '#1f2937' },
  taskTimeText: { fontSize: 12, color: '#4b5563' },
  footer: { flexDirection: 'row', justifyContent: 'flex-end', padding: 15, borderTopWidth: 1, borderTopColor: '#f3f4f6', backgroundColor: '#f9fafb', borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  button: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: 8, marginLeft: 10 },
  saveButton: { backgroundColor: '#4f46e5' },
  cancelButton: { backgroundColor: '#e5e7eb' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});

export default TimelineSchedulerModal;