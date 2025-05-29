import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { router } from 'expo-router';

type Task = {
  id: number;
  task: string;
  mood: string;
  timestamp: string;
  length: number;
  isScheduled: boolean;
};

export default function DashboardScreen() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchTasks = async (pageNum = 1) => {
    const res = await fetch(`${process.env.EXPO_PUBLIC_API_BASE_URL}/api/tasks?page=${pageNum}`);
    const data = await res.json();
    setTasks(data.tasks);
    setTotalPages(data.totalPages);
  };

  useEffect(() => {
    fetchTasks(page);
  }, [page]);

  return (
    <View style={{ padding: 20 }}>
      <Text>Dashboard - Page {page}</Text>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomWidth: 1 }}>
            <Text> {item.task}</Text>
            <Text> Mood: {item.mood}</Text>
            <Text> Time: {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            <Text> Duration: {item.length} minutes</Text>
            <Text>{item.isScheduled ? "Scheduled" : "Unscheduled"}</Text>
          </View>
        )}
      />
      <Button title="Previous" disabled={page === 1} onPress={() => setPage(page - 1)} />
      <Button title="Next" disabled={page === totalPages} onPress={() => setPage(page + 1)} />
      <Button title="Go to Register" onPress={() => router.push("/register")} />
    </View>
  );

}
