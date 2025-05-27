import React, { useState, useEffect } from 'react';
import { View, TextInput, Button, FlatList, Text } from 'react-native';
const API_URL = process.env.API_BASE_URL;

export default function IndexScreen() {
  const [mood, setMood] = useState('');
  const [entries, setEntries] = useState([]);

  const fetchEntries = async () => {
    const res = await fetch('${API_URL}/api/mood');
    const data = await res.json();
    setEntries(data);
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  const submitMood = async () => {
    await fetch('${API_URL}/api/mood', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mood, timestamp: new Date().toISOString() })
    });
    setMood('');
    fetchEntries();
  };

  return (
    <View style={{ padding: 20, marginTop: 50 }}>
      <TextInput
        placeholder="How are you feeling?"
        value={mood}
        onChangeText={setMood}
        style={{ borderWidth: 1, marginBottom: 10, padding: 10 }}
      />
      <Button title="Submit Mood" onPress={submitMood} />
      <FlatList
        data={entries}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item }: { item: { mood: string; timestamp: string } }) => (
          <Text>{item.timestamp.slice(0, 19)}: {item.mood}</Text>
        )}
      />
    </View>
  );
}
