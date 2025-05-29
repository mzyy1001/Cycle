import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type Entry = {
  mood: string;
  task: string;
  timestamp: string;
  length: number;
};

export default function IndexScreen() {
  const [mood, setMood] = useState('');
  const [task, setTask] = useState('');
  const [length, setLength] = useState('30');
  const [entries, setEntries] = useState<Entry[]>([]);

  const fetchEntries = async () => {
    const res = await fetch(`${API_URL}/api/mood`);
    const data = await res.json();
    setEntries(data);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const submitMood = async () => {
    await fetch(`${API_URL}/api/mood`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mood,
        task,
        length: parseInt(length),
        timestamp: new Date().toISOString()
      })
    });
    setMood('');
    setTask('');
    setLength('30');
    fetchEntries();
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <TextInput
        placeholder="How are you feeling?"
        value={mood}
        onChangeText={setMood}
      />
      <TextInput
        placeholder="What task are you doing?"
        value={task}
        onChangeText={setTask}
      />
      <TextInput
        placeholder="How many minutes you need to use?"
        value={length}
        onChangeText={setLength}
        keyboardType="numeric"
      />
      <Button title="Submit Task + Mood" onPress={submitMood} />
      <FlatList
        data={entries}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }) => (
          <Text>
            {item.timestamp.slice(0, 19)} - {item.task} ({item.mood}) - {item.length}min
          </Text>
        )}
      />
    </View>
  );
}
