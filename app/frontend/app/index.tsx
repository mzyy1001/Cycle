import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('authToken');
      setIsLoggedIn(!!token);
      setIsChecking(false);
    };
    checkLogin();
  }, []);


  useEffect(() => {
    const checkLogin = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        setIsLoggedIn(true);
      } else {
        setIsLoggedIn(false);
      }
    };
    checkLogin();
  }, []);

  useEffect(() => {
    const checkFirstTime = async () => {
      const seen = await AsyncStorage.getItem('hasSeenTutorial');
      if (!seen) {
        setShowTutorial(true);
        await AsyncStorage.setItem('hasSeenTutorial', 'true');
      }
    };
    checkFirstTime();
  }, []);

  const handleLogout = async () => {
    await AsyncStorage.removeItem('authToken');
    setIsLoggedIn(false);
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image
        source={require('@/assets/images/mood.jpg')} 
        style={styles.image}
        resizeMode="contain"
      />
      <Text style={styles.title}>Welcome to Cycle</Text>
      <Text style={styles.subtitle}>Mood Management</Text>
    { isChecking ? null : (
        !isLoggedIn ? (
          <>
            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={() => router.push('/reg_login')}
            >
              <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => router.push('/dashboard')}
            >
              <Text style={styles.buttonText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonSecondary}
              onPress={handleLogout}
            >
              <Text style={styles.buttonText}>Logout</Text>
            </TouchableOpacity>
          </>
        )
      )}
      {/* Tutorial Modal */}
      <Modal visible={showTutorial} transparent={true} animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Welcome to Cycle!</Text>
            <Text style={styles.modalText}>
              Cycle helps you manage your tasks based on how you feel.
              Tap one or more moods, add your tasks, and let us build a schedule that works for your mental health.
            </Text>
            <Text style={styles.modalText}>
              You can enter your mood multiple times per day and update your schedule anytime.
            </Text>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => setShowTutorial(false)}
            >
              <Text style={styles.buttonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 20,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 25,
    borderRadius: 10,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  modalText: {
    fontSize: 16,
    marginBottom: 10,
    lineHeight: 22,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 220,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#64748b',
    marginBottom: 24,
    textAlign: 'center',
  },
  buttonPrimary: {
    width: '100%',
    backgroundColor: '#3b82f6',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonSecondary: {
    width: '100%',
    backgroundColor: '#1e40af',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 16,
  },
});
