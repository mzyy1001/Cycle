// components/DateTimePicker.tsx
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

// --- Constants for the Time Picker Wheel ---
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

// --- Helper Functions ---
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// A simple debounce utility
function debounce<T extends (...args: any[]) => any>(func: T, waitFor: number) {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
}

const DateTimePicker = ({ visible, onClose, onConfirm, currentDate }: {
  visible: boolean;
  onClose: () => void;
  onConfirm: (date: Date) => void;
  currentDate: Date;
}) => {
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));
  const [mode, setMode] = useState<'date' | 'time'>('date');
  
  const hourScrollViewRef = useRef<ScrollView>(null);
  const minuteScrollViewRef = useRef<ScrollView>(null);

  // When the modal becomes visible, reset the internal state to the current prop
  useEffect(() => {
    if (visible) {
      const newDate = new Date(currentDate);
      setSelectedDate(newDate);
      setDisplayDate(newDate);
      setMode('date'); // Default to date view
    }
  }, [visible, currentDate]);

  // Effect to scroll the time wheels to the selected time when switching to time mode
  useEffect(() => {
    if (visible && mode === 'time') {
      // Use a brief timeout to allow the UI to render before scrolling
      setTimeout(() => {
        hourScrollViewRef.current?.scrollTo({ y: selectedDate.getHours() * ITEM_HEIGHT, animated: false });
        minuteScrollViewRef.current?.scrollTo({ y: (selectedDate.getMinutes() / 5) * ITEM_HEIGHT, animated: false });
      }, 50);
    }
  }, [mode, visible]); // Reruns when mode changes

  const handleMonthChange = (amount: number) => {
    const newDisplayDate = new Date(displayDate);
    newDisplayDate.setMonth(newDisplayDate.getMonth() + amount);
    setDisplayDate(newDisplayDate);
  };

  const handleSelectDate = (day: number) => {
    const newSelectedDate = new Date(displayDate);
    newSelectedDate.setDate(day);
    // Preserve the time from the currently selected date
    newSelectedDate.setHours(selectedDate.getHours());
    newSelectedDate.setMinutes(selectedDate.getMinutes());
    setSelectedDate(newSelectedDate);
  };

  // Debounced scroll handler to update time state only when scrolling stops
  const handleTimeScroll = useCallback(
    debounce((type: 'hour' | 'minute', event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const { contentOffset } = event.nativeEvent;
        const index = Math.round(contentOffset.y / ITEM_HEIGHT);
        
        setSelectedDate(prevDate => {
            const newSelectedDate = new Date(prevDate);
            if (type === 'hour') {
                newSelectedDate.setHours(index);
            } else if (type === 'minute') {
                newSelectedDate.setMinutes(index * 5);
            }
            return newSelectedDate;
        });
    }, 150), // Debounce for 150ms
    [] // Empty dependency array ensures the function is created only once
  );

  const calendarGrid = useMemo(() => {
    const year = displayDate.getFullYear();
    const month = displayDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const grid: (number | null)[] = [];

    for (let i = 0; i < firstDayOfMonth; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(i);
    
    return grid;
  }, [displayDate]);

  const renderCalendar = () => (
    <View>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.navButton}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity>
        <Text style={styles.headerText}>
          {displayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity onPress={() => handleMonthChange(1)} style={styles.navButton}><Text style={styles.navButtonText}>›</Text></TouchableOpacity>
      </View>
      <View style={styles.dayLabels}>
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={styles.dayLabel}>{d}</Text>)}
      </View>
      <View style={styles.calendarGrid}>
        {calendarGrid.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.dayCell,
              (day && isSameDay(new Date(displayDate.getFullYear(), displayDate.getMonth(), day), selectedDate)) ? styles.selectedDay : null,
              (day && isSameDay(new Date(displayDate.getFullYear(), displayDate.getMonth(), day), new Date()) && !isSameDay(selectedDate, new Date())) ? styles.today : null,
            ]}
            onPress={() => day && handleSelectDate(day)}
            disabled={!day}
          >
            <Text style={[
              styles.dayText,
              (day && isSameDay(new Date(displayDate.getFullYear(), displayDate.getMonth(), day), selectedDate)) ? styles.selectedDayText : null,
            ]}>
              {day}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTimePicker = () => {
    const padding = { height: (PICKER_HEIGHT - ITEM_HEIGHT) / 2 };
    return (
      <View style={styles.timePickerContainer}>
        <View style={styles.selectionIndicator} />
        <View style={styles.wheelsContainer}>
          <ScrollView
            ref={hourScrollViewRef}
            style={styles.timeScrollView}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={(e) => handleTimeScroll('hour', e)}
            scrollEventThrottle={16} // Required for onScroll to work on iOS
          >
            <View style={padding} />
            {Array.from({ length: 24 }).map((_, i) => (
              <View key={i} style={styles.timeItem}>
                <Text style={styles.timeText}>{String(i).padStart(2, '0')}</Text>
              </View>
            ))}
            <View style={padding} />
          </ScrollView>
          <Text style={styles.timeSeparator}>:</Text>
          <ScrollView
            ref={minuteScrollViewRef}
            style={styles.timeScrollView}
            showsVerticalScrollIndicator={false}
            snapToInterval={ITEM_HEIGHT}
            decelerationRate="fast"
            onScroll={(e) => handleTimeScroll('minute', e)}
            scrollEventThrottle={16}
          >
            <View style={padding} />
            {Array.from({ length: 12 }).map((_, i) => (
              <View key={i * 5} style={styles.timeItem}>
                <Text style={styles.timeText}>{String(i * 5).padStart(2, '0')}</Text>
              </View>
            ))}
            <View style={padding} />
          </ScrollView>
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalContent}>
          <View style={styles.modeSelector}>
            <TouchableOpacity onPress={() => setMode('date')} style={[styles.modeButton, mode === 'date' && styles.activeMode]}>
              <Text style={[styles.modeText, mode === 'date' && styles.activeModeText]}>Select Date</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setMode('time')} style={[styles.modeButton, mode === 'time' && styles.activeMode]}>
              <Text style={[styles.modeText, mode === 'time' && styles.activeModeText]}>Select Time</Text>
            </TouchableOpacity>
          </View>
          
          {mode === 'date' ? renderCalendar() : renderTimePicker()}

          <View style={styles.footer}>
            <Button title="Cancel" onPress={onClose} color="gray" />
            <Button title="Confirm" onPress={() => onConfirm(selectedDate)} />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalContent: { backgroundColor: 'white', padding: 15, borderRadius: 15, width: '90%', maxWidth: 350, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 },
  modeSelector: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 15 },
  modeButton: { flex: 1, padding: 10, alignItems: 'center' },
  activeMode: { backgroundColor: '#4f46e5', borderRadius: 8 },
  modeText: { fontWeight: 'bold', color: '#4f46e5' },
  activeModeText: { color: 'white' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 },
  navButton: { padding: 10 },
  navButtonText: { fontSize: 20, color: '#4f46e5' },
  headerText: { fontSize: 16, fontWeight: 'bold' },
  dayLabels: { flexDirection: 'row' },
  dayLabel: { flex: 1, textAlign: 'center', color: 'gray', fontSize: 12 },
  calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100/7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 99 },
  today: { borderWidth: 1, borderColor: '#a5b4fc' },
  selectedDay: { backgroundColor: '#4f46e5' },
  dayText: { fontSize: 14 },
  selectedDayText: { color: 'white', fontWeight: 'bold' },
  
  timePickerContainer: {
    height: PICKER_HEIGHT,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectionIndicator: {
    height: ITEM_HEIGHT,
    width: '75%',
    backgroundColor: '#eef2ff',
    borderRadius: 10,
    position: 'absolute',
    zIndex: -1,
  },
  wheelsContainer: {
    height: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timeScrollView: {
    height: PICKER_HEIGHT,
    width: 80,
  },
  timeItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 24,
    color: '#374151',
    fontWeight: '500',
  },
  timeSeparator: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#9ca3af',
    marginHorizontal: 5,
  },

  footer: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 1, borderColor: '#eee' },
});

const Button = ({ title, onPress, color }: { title: string, onPress: () => void, color?: string }) => (
  <TouchableOpacity onPress={onPress} style={{ padding: 8 }}>
    <Text style={{ color: color || '#4f46e5', fontWeight: 'bold', fontSize: 16 }}>{title}</Text>
  </TouchableOpacity>
);

export default DateTimePicker;