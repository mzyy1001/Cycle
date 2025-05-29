import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import { router } from 'expo-router';

const API_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

export default function RegisterLoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  const handleSubmit = async () => {
    const endpoint = isRegistering ? 'register' : 'login';

    const res = await fetch(`${API_URL}/api/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      Alert.alert(data.error || 'Something went wrong');
      return;
    }

    Alert.alert(isRegistering ? 'Registered ✅' : 'Logged in ✅');
    router.push('/'); 
    setUsername('');
    setPassword('');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 20, marginBottom: 20 }}>
        {isRegistering ? 'Register' : 'Login'}
      </Text>

      <TextInput
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />

      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        style={{ marginBottom: 10, borderBottomWidth: 1 }}
      />

      <Button title={isRegistering ? 'Register' : 'Login'} onPress={handleSubmit} />
      <View style={{ height: 10 }} />
      <Button
        title={isRegistering ? 'Switch to Login' : 'Switch to Register'}
        onPress={() => setIsRegistering(!isRegistering)}
      />
    </View>
  );
}
