// hooks/useDailyPopup.ts
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'last-popup-date';

export function useDailyPopup(): boolean {
  const [shouldShowPopup, setShouldShowPopup] = useState(false);

  useEffect(() => {
    const checkIfNewDay = async () => {
      const today = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
      const lastDate = await AsyncStorage.getItem(STORAGE_KEY);

      if (lastDate !== today) {
        setShouldShowPopup(true);
        await AsyncStorage.setItem(STORAGE_KEY, today);
      }
    };

    checkIfNewDay();
  }, []);

  return shouldShowPopup;
}
