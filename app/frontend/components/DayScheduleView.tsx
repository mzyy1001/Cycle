// app/frontend/components/DayScheduleView.tsx
import React from 'react';
import { View, Text } from 'react-native';

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

const hours = Array.from({ length: 10 }, (_, i) => 9 + i); // 9:00 to 18:00
const pixelsPerMinute = 2; // 30min -> 60px height

const DayScheduleView: React.FC<Props> = ({ tasks, moodOptions }) => {
  return (
    <View style={{ flexDirection: 'row' }}>
      <View style={{ width: 50, paddingTop: 20 }}>
        {hours.map(h => (
          <Text key={h} style={{ height: 60, color: '#6b7280', fontSize: 12 }}>
            {`${h}:00`}
          </Text>
        ))}
      </View>

      <View style={{ flex: 1, position: 'relative', height: 600 }}>
        {tasks.map(task => {
          const start = new Date(task.timestamp);
          const startHour = start.getHours() + start.getMinutes() / 60;
          const offset = (startHour - 9) * 60 * pixelsPerMinute;
          const height = task.length * pixelsPerMinute;

          const mood = moodOptions.find(m => m.mood === task.mood[0]);
          const color = mood?.color || '#ddd';
          const icon = mood?.icon || '';

          return (
            <View
              key={task.id}
              style={{
                position: 'absolute',
                top: offset,
                left: 0,
                right: 0,
                backgroundColor: color,
                borderLeftWidth: 4,
                borderLeftColor: '#4f46e5',
                borderRadius: 6,
                marginVertical: 2,
                padding: 6,
                height,
              }}
            >
              <Text style={{ fontWeight: 'bold' }}>{task.task}</Text>
              <Text style={{ fontSize: 12 }}>{icon} {task.mood.join(', ')}</Text>
              <Text style={{ fontSize: 11, color: '#4b5563' }}>
                {start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {task.length} min
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

export default DayScheduleView;
