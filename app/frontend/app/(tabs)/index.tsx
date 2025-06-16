import { View, Text, TouchableOpacity, StyleSheet, Image, ScrollView, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

  const [streakInfo, setStreakInfo] = useState('You have stayed consistent for 3 days — that’s better than 87% of users!');
  useEffect(() => {
    const fetchStreakAndPercentile = async () => {
      const token = await AsyncStorage.getItem('authToken');
      if (!token || !API_BASE_URL) return;

      try {
        const streakRes = await fetch(`${API_BASE_URL}/api/rank/streak`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const streakData = await streakRes.json();

        const rankRes = await fetch(`${API_BASE_URL}/api/rank`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const rankData = await rankRes.json();

        const allUsers = rankData.rank;
        const me = allUsers.find((u: any) => u.isMe);
        const total = allUsers.length;

        if (me) {
          const myRank = me.rank;
          const percentile = Math.floor(((total - myRank) / total) * 100);

          setStreakInfo(
            `You have stayed consistent for ${me.streak} day${me.streak > 1 ? 's' : ''} — that’s better than ${percentile}% of users!`
          );
        } else {
          setStreakInfo(`You have stayed consistent for ${streakData.streak ?? 0} day(s).`);
        }
      } catch (err) {
        console.error('Failed to load streak info:', err);
      }
    };

    fetchStreakAndPercentile();
  }, []);


  //console.log("streakinfo: ",streakInfo);

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
            <View style={styles.streakRow}>
              <Text style={styles.streakText}>{streakInfo}</Text>
              <TouchableOpacity onPress={() => router.push('/rank')}>
                <Text style={styles.rankLink}>View rank</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => router.push('/dashboard')}
            >
              <Text style={styles.buttonText}>Dashboard</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.buttonPrimary}
              onPress={() => router.push('/calendar')}
            >
              <Text style={styles.buttonText}>Calendar</Text>
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
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: 10,
  },

  rankLink: {
    fontSize: 14,
    color: '#2563eb', // blue-600
    marginLeft: 8,
    textDecorationLine: 'underline',
    fontWeight: '500',
  },

  streakText: {
    fontSize: 14,
    color: '#10b981', // green-500
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: '500',
  },

});
