// components/WeekScheduleView.tsx
import React from 'react';
import { View, Text, ScrollView } from 'react-native';

type Task = {
  id: number;
  task: string;
  mood: string[];
  timestamp: string;
  length: number;
};

type MoodOption = {
  mood: string;
  color: string;
  icon: string;
};

type Props = {
  tasks: Task[];
  moodOptions: MoodOption[];
};

const scheduleStartHour = 0;
const scheduleEndHour = 24;
const pixelsPerMinute =3;
const containerHeight = (scheduleEndHour - scheduleStartHour) * 60 * pixelsPerMinute;
const hours = Array.from({ length: scheduleEndHour - scheduleStartHour }, (_, i) => scheduleStartHour + i);


const WeekScheduleView: React.FC<Props> = ({ tasks, moodOptions }) => {
  // Generate today + next 6 days
  console.log('Tasks:', tasks);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const dayList: { date: string; label: string }[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    return {
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
    };
  });

  // Group tasks by day string (e.g., "2025-06-13")
  const tasksByDate: { [key: string]: Task[] } = {};
  for (const task of tasks) {
    const dateStr = task.timestamp.slice(0, 10);
    if (!tasksByDate[dateStr]) tasksByDate[dateStr] = [];
    tasksByDate[dateStr].push(task);
  }

  return (
    <View style={{ flex: 1 }}>
        <ScrollView horizontal contentContainerStyle={{ flexGrow: 1 }}>
            <ScrollView style={{ flexGrow: 1 }}>
                <View style={{ flexDirection: 'column', flexGrow: 1, minHeight: containerHeight  }}>
                    {/* Header Row */}
                    <View style={{ flexDirection: 'row' }}>
                    <View style={{ width: 50 }} />
                    {dayList.map(({ label }, i) => (
                        <View key={i} style={{ flex: 1, alignItems: 'center', paddingVertical: 4 }}>
                        <Text style={{ fontWeight: 'bold' }}>{label}</Text>
                        </View>
                    ))}
                    </View>

                    <View style={{ flexDirection: 'row' }}>
                    {/* Time column */}
                    <View style={{ width: 50 }}>
                        {hours.map(h => (
                        <Text key={h} style={{ height: containerHeight/24, fontSize: 12, color: '#6b7280' }}>{`${h}:00`}</Text>
                        ))}
                    </View>

                    {/* Each day column */}
                    {dayList.map(({ date }, dayIndex) => (
                        <View key={dayIndex} style={{ flex: 1,minWidth: 150, height: containerHeight, position: 'relative', borderLeftWidth: 1, borderColor: '#ddd' }}>
                        {(tasksByDate[date] || []).map(task => {
                            const start = new Date(task.timestamp);
                            const startHour = start.getHours() + start.getMinutes() / 60;
                            const offset = (startHour - scheduleStartHour) * 60 * pixelsPerMinute;
                            const height = Math.max(task.length * pixelsPerMinute, 20); // show even if length = 0

                            const mood = moodOptions.find(m => m.mood === task.mood[0]);
                            const color = mood?.color || '#ddd';
                            const icon = mood?.icon || '';

                            return (
                            <View
                                key={task.id}
                                style={{
                                position: 'absolute',
                                top: offset,
                                left: 4,
                                right: 4,
                                marginHorizontal: 4,
                                backgroundColor: color,
                                borderLeftColor: '#4f46e5',
                                borderLeftWidth: 3,
                                borderRadius: 6,
                                padding: 4,
                                height,
                                }}
                            >
                                <Text style={{ fontWeight: 'bold' }}>{task.task}</Text>
                                <Text style={{ fontSize: 10 }}>{icon} {task.mood.join(', ')}</Text>
                                <Text style={{ fontSize: 10, color: '#374151' }}>
                                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {task.length} min
                                </Text>
                            </View>
                            );
                        })}
                        </View>
                    ))}
                    </View>
                </View>
            </ScrollView>
        </ScrollView>
    </View>
);
  
};

export default WeekScheduleView;
