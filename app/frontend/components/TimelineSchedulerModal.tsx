// components/TimelineSchedulerModal.tsx
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  PanResponder,
  Animated,
  Dimensions,
} from 'react-native';
import { Task } from '../lib/types';
import { moodOptions } from '../lib/constants';

// --- Constants for better styling and control ---
const PIXELS_PER_MINUTE = 2.5;
const SNAP_INTERVAL_MINUTES = 15;
const HOURS_IN_DAY = 24;
const TIMELINE_WIDTH = HOURS_IN_DAY * 60 * PIXELS_PER_MINUTE;
const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const BORDER_COLOR_DEFAULT = '#4f46e5';
const BORDER_COLOR_COLLIDING = '#ef4444'; // Red for collision

// --- Helper Functions ---
const getMinutesFromMidnight = (timestamp: string): number => {
  const date = new Date(timestamp);
  return date.getHours() * 60 + date.getMinutes();
};

const formatTime = (date: Date): string => {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

type AnimatedValues = {
  pan: Animated.ValueXY;
  scale: Animated.Value;
};

type TimelineSchedulerModalProps = {
  visible: boolean;
  onClose: () => void;
  onSave: (updatedTasks: Task[]) => void;
  tasks: Task[];
  day: string;
};

const TimelineSchedulerModal = ({ visible, onClose, onSave, tasks, day }: TimelineSchedulerModalProps) => {
  const [localTasks, setLocalTasks] = useState<Task[]>([]);
  const [collidingTaskId, setCollidingTaskId] = useState<number | null>(null);
  
  const animatedValues = useRef<{ [key: number]: AnimatedValues }>({}).current;
  const panResponders = useRef<{ [key: number]: any }>({}).current;

  useEffect(() => {
    if (visible) {
      const tasksCopy = JSON.parse(JSON.stringify(tasks));
      setLocalTasks(tasksCopy);

      tasksCopy.forEach((task: Task) => {
        if (!animatedValues[task.id]) {
          animatedValues[task.id] = {
            pan: new Animated.ValueXY(),
            scale: new Animated.Value(1),
          };
        }
        const initialMinutes = getMinutesFromMidnight(task.timestamp);
        animatedValues[task.id].pan.setValue({ x: initialMinutes * PIXELS_PER_MINUTE, y: 0 });

        panResponders[task.id] = PanResponder.create({
          onStartShouldSetPanResponder: () => true,
          onPanResponderGrant: () => {
            animatedValues[task.id].pan.setOffset({
              x: (animatedValues[task.id].pan.x as any)._value,
              y: 0,
            });
            animatedValues[task.id].pan.setValue({ x: 0, y: 0 });
            Animated.spring(animatedValues[task.id].scale, { toValue: 1.05, useNativeDriver: false }).start();
          },
          onPanResponderMove: (e, gestureState) => {
            const originalX = (animatedValues[task.id].pan.x as any) as number;
            const newX = originalX + gestureState.dx;
            const currentMinutes = newX / PIXELS_PER_MINUTE;

            let isColliding = false;
            for (const otherTask of localTasks) {
              if (otherTask.id === task.id) continue;
              const otherTaskStart = getMinutesFromMidnight(otherTask.timestamp);
              const otherTaskEnd = otherTaskStart + otherTask.length;
              const taskEnd = currentMinutes + task.length;
              if (currentMinutes < otherTaskEnd && taskEnd > otherTaskStart) {
                isColliding = true;
                break;
              }
            }
            setCollidingTaskId(isColliding ? task.id : null);
            return Animated.event([null, { dx: animatedValues[task.id].pan.x }], { useNativeDriver: false })(e, gestureState);
          },
          onPanResponderRelease: () => {
            animatedValues[task.id].pan.flattenOffset();
            Animated.spring(animatedValues[task.id].scale, { toValue: 1, useNativeDriver: false }).start();

            if (collidingTaskId) {
              const originalMinutes = getMinutesFromMidnight(task.timestamp);
              Animated.spring(animatedValues[task.id].pan, {
                toValue: { x: originalMinutes * PIXELS_PER_MINUTE, y: 0 },
                useNativeDriver: false,
              }).start();
            } else {
              const finalX = (animatedValues[task.id].pan.x as any)._value;
              const newMinutes = Math.max(0, Math.round(finalX / (PIXELS_PER_MINUTE * SNAP_INTERVAL_MINUTES)) * SNAP_INTERVAL_MINUTES);
              
              const newTimestamp = new Date(day);
              newTimestamp.setHours(Math.floor(newMinutes / 60), newMinutes % 60, 0, 0);

              setLocalTasks(prev => prev.map(t => t.id === task.id ? { ...t, timestamp: newTimestamp.toISOString() } : t));
              
              Animated.spring(animatedValues[task.id].pan, {
                toValue: { x: newMinutes * PIXELS_PER_MINUTE, y: 0 },
                useNativeDriver: false,
              }).start();
            }
            setCollidingTaskId(null);
          },
        });
      });
    }
  }, [visible, tasks]);

  const renderTimelineBackground = useMemo(() => (
    <View style={styles.timelineBackgroundContainer}>
      {Array.from({ length: HOURS_IN_DAY }).map((_, hour) => (
        <View key={hour} style={[styles.hourBlock, { left: hour * 60 * PIXELS_PER_MINUTE }]}>
          <Text style={styles.hourText}>{`${String(hour).padStart(2, '0')}:00`}</Text>
        </View>
      ))}
    </View>
  ), []);

  const currentTimeIndicatorPosition = useMemo(() => {
    const now = new Date();
    if (now.toISOString().slice(0, 10) !== day) return -1; // Don't show if not today
    const minutes = now.getHours() * 60 + now.getMinutes();
    return minutes * PIXELS_PER_MINUTE;
  }, [day]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.title}>Drag to Schedule</Text>
            <Text style={styles.subtitle}>{new Date(day + 'T00:00:00').toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</Text>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollViewContent}>
            <View style={{ width: TIMELINE_WIDTH, height: 200 }}>
              {renderTimelineBackground}
              {currentTimeIndicatorPosition > -1 && (
                <View style={[styles.currentTimeIndicator, { left: currentTimeIndicatorPosition }]}>
                  <View style={styles.currentTimeDot} />
                </View>
              )}
              {localTasks.map(task => {
                const moodObj = moodOptions.find(m => m.mood === task.mood[0]);
                const taskWidth = task.length * PIXELS_PER_MINUTE;
                const isColliding = collidingTaskId === task.id;
                
                const startDate = new Date(task.timestamp);
                const endDate = new Date(startDate.getTime() + task.length * 60000);

                return (
                  <Animated.View
                    key={task.id}
                    style={[
                      styles.taskBlock,
                      {
                        width: taskWidth,
                        backgroundColor: moodObj?.color || '#e5e7eb',
                        borderLeftColor: isColliding ? BORDER_COLOR_COLLIDING : moodObj?.color || BORDER_COLOR_DEFAULT,
                        transform: [
                          { translateX: animatedValues[task.id]?.pan.x },
                          { scale: animatedValues[task.id]?.scale },
                        ],
                      },
                    ]}
                    {...(panResponders[task.id] ? panResponders[task.id].panHandlers : {})}
                  >
                    <Text style={styles.taskText} numberOfLines={1}>{task.task}</Text>
                    <Text style={styles.taskTimeText}>{`${formatTime(startDate)} - ${formatTime(endDate)}`}</Text>
                  </Animated.View>
                );
              })}
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
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  modalContent: {
    width: '95%',
    maxHeight: SCREEN_HEIGHT * 0.7,
    backgroundColor: 'white',
    borderRadius: 20,
    paddingTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  scrollViewContent: {
    paddingVertical: 20,
  },
  timelineBackgroundContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
  },
  hourBlock: {
    width: 60 * PIXELS_PER_MINUTE,
    height: '100%',
    borderRightWidth: 1,
    borderRightColor: '#e5e7eb',
  },
  hourText: {
    position: 'absolute',
    top: -20,
    left: -18,
    fontSize: 12,
    color: '#9ca3af',
  },
  currentTimeIndicator: {
    position: 'absolute',
    top: -5,
    bottom: 0,
    width: 2,
    backgroundColor: '#ef4444',
    zIndex: 10,
  },
  currentTimeDot: {
    position: 'absolute',
    top: -4,
    left: -3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ef4444',
  },
  taskBlock: {
    position: 'absolute',
    height: 60,
    top: 20,
    borderRadius: 8,
    borderLeftWidth: 5,
    paddingVertical: 6,
    paddingHorizontal: 10,
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
  taskText: {
    fontWeight: '600',
    fontSize: 14,
    color: '#1f2937',
  },
  taskTimeText: {
    fontSize: 12,
    color: '#4b5563',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    backgroundColor: '#f9fafb',
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#4f46e5',
  },
  cancelButton: {
    backgroundColor: '#e5e7eb',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default TimelineSchedulerModal;