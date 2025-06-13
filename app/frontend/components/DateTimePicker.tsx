// components/DateTimePicker.tsx
import React, { useState, useMemo, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { ScrollView } from 'react-native-gesture-handler';
import { View, Text, TouchableOpacity, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';

// --- Constants and Helpers (Unchanged) ---
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;
const isSameDay = (d1: Date, d2: Date) =>
  d1.getFullYear() === d2.getFullYear() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getDate() === d2.getDate();

// --- TimePickerWheel Component (Now uses Gesture Handler's ScrollView) ---
interface TimePickerWheelProps {
  data: string[];
  initialIndex: number;
  onIndexChange: (index: number) => void;
}
export interface TimePickerWheelRef {
  scrollToIndex: (index: number, animated?: boolean) => void;
}
const TimePickerWheel = forwardRef<TimePickerWheelRef, TimePickerWheelProps>(
  ({ data, initialIndex, onIndexChange }, ref) => {
    const scrollViewRef = useRef<ScrollView>(null);
    const isScrolling = useRef(false);

    useImperativeHandle(ref, () => ({
      scrollToIndex: (index, animated = false) => {
        scrollViewRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated });
      },
    }));

    useEffect(() => {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ y: initialIndex * ITEM_HEIGHT, animated: false });
      }, 50);
    }, [initialIndex]);

    const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (isScrolling.current) return;
      const { contentOffset } = event.nativeEvent;
      const index = Math.round(contentOffset.y / ITEM_HEIGHT);
      const clampedIndex = Math.max(0, Math.min(data.length - 1, index));
      onIndexChange(clampedIndex);
    };
    
    const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      handleScroll(e);
    };
    
    const onScrollEndDrag = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      isScrolling.current = false;
      handleScroll(e);
    };

    const padding = { height: (PICKER_HEIGHT - ITEM_HEIGHT) / 2 };

    return (
      <ScrollView
        ref={scrollViewRef}
        style={styles.timeScrollView}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        onMomentumScrollBegin={() => { isScrolling.current = true; }}
        onMomentumScrollEnd={onMomentumScrollEnd}
        onScrollEndDrag={onScrollEndDrag}
      >
        <View style={padding} />
        {data.map((item, index) => (
          <View key={index} style={styles.timeItem}><Text style={styles.timeText}>{item}</Text></View>
        ))}
        <View style={padding} />
      </ScrollView>
    );
  }
);

const DateTimePicker = ({ currentDate, onConfirm, onCancel }: {
  currentDate: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
}) => {
  // Internal state is reset by the parent re-mounting this with a `key`
  const [selectedDate, setSelectedDate] = useState(new Date(currentDate));
  const [displayDate, setDisplayDate] = useState(new Date(currentDate));
  const [mode, setMode] = useState<'date' | 'time'>('date');
  
  const hourWheelRef = useRef<TimePickerWheelRef>(null);
  const minuteWheelRef = useRef<TimePickerWheelRef>(null);

  // Effect to scroll time wheels into position when switching to time mode
  useEffect(() => {
    if (mode === 'time') {
      const hours = selectedDate.getHours();
      const minutes = Math.floor(selectedDate.getMinutes() / 5);
      hourWheelRef.current?.scrollToIndex(hours, false);
      minuteWheelRef.current?.scrollToIndex(minutes, false);
    }
  }, [mode]);

  // --- All handlers and render logic remain the same, just without the Modal wrapper ---
  const hoursData = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
  const minutesData = useMemo(() => Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0')), []);

  const handleMonthChange = (amount: number) => { /* ... same ... */ setDisplayDate(prev => { const d = new Date(prev); d.setMonth(d.getMonth() + amount); return d; }); };
  const handleSelectDate = (day: number) => { /* ... same ... */ setSelectedDate(prev => { const d = new Date(displayDate); d.setDate(day); d.setHours(prev.getHours()); d.setMinutes(prev.getMinutes()); return d; }); };
  const handleHourChange = (index: number) => { /* ... same ... */ setSelectedDate(prev => { const d = new Date(prev); d.setHours(index); return d; }); };
  const handleMinuteChange = (index: number) => { /* ... same ... */ setSelectedDate(prev => { const d = new Date(prev); d.setMinutes(index * 5); return d; }); };

  const calendarGrid = useMemo(() => { const y = displayDate.getFullYear(); const m = displayDate.getMonth(); const f = new Date(y, m, 1).getDay(); const d = new Date(y, m + 1, 0).getDate(); const g: (number | null)[] = []; for (let i = 0; i < f; i++) g.push(null); for (let i = 1; i <= d; i++) g.push(i); return g; }, [displayDate]);

  const renderCalendar = () => ( <View>
      <View style={styles.header}><TouchableOpacity onPress={() => handleMonthChange(-1)} style={styles.navButton}><Text style={styles.navButtonText}>‹</Text></TouchableOpacity><Text style={styles.headerText}>{displayDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</Text><TouchableOpacity onPress={() => handleMonthChange(1)} style={styles.navButton}><Text style={styles.navButtonText}>›</Text></TouchableOpacity></View>
      <View style={styles.dayLabels}>{['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <Text key={i} style={styles.dayLabel}>{d}</Text>)}</View>
      <View style={styles.calendarGrid}>{calendarGrid.map((day, index) => { const date = day ? new Date(displayDate.getFullYear(), displayDate.getMonth(), day) : null; const isSelected = date && isSameDay(date, selectedDate); const isToday = date && isSameDay(date, new Date()); return (<TouchableOpacity key={index} style={[styles.dayCell, isSelected && styles.selectedDay, isToday && !isSelected && styles.today,]} onPress={() => day && handleSelectDate(day)} disabled={!day}><Text style={[styles.dayText, isSelected && styles.selectedDayText]}>{day}</Text></TouchableOpacity>); })}</View>
    </View>);

  const renderTimePicker = () => ( <View style={styles.timePickerContainer}>
      <View style={styles.selectionIndicator} /><View style={styles.wheelsContainer}><TimePickerWheel ref={hourWheelRef} data={hoursData} initialIndex={selectedDate.getHours()} onIndexChange={handleHourChange} /><Text style={styles.timeSeparator}>:</Text><TimePickerWheel ref={minuteWheelRef} data={minutesData} initialIndex={Math.floor(selectedDate.getMinutes() / 5)} onIndexChange={handleMinuteChange} /></View>
    </View>);

  return (
    <View>
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
        <Button title="Cancel" onPress={onCancel} color="gray" />
        <Button title="Confirm" onPress={() => onConfirm(selectedDate)} />
      </View>
    </View>
  );
};

// --- Styles and Button component (Unchanged) ---
const styles = StyleSheet.create({ /* ... all styles are the same ... */ modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' , zIndex: 1000,elevation: 10}, modalContent: { backgroundColor: 'white', padding: 15, borderRadius: 15, width: '90%', maxWidth: 350, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84, elevation: 5 }, modeSelector: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#f3f4f6', borderRadius: 8, marginBottom: 15 }, modeButton: { flex: 1, padding: 10, alignItems: 'center' }, activeMode: { backgroundColor: '#4f46e5', borderRadius: 8 }, modeText: { fontWeight: 'bold', color: '#4f46e5' }, activeModeText: { color: 'white' }, header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10 }, navButton: { padding: 10 }, navButtonText: { fontSize: 20, color: '#4f46e5' }, headerText: { fontSize: 16, fontWeight: 'bold' }, dayLabels: { flexDirection: 'row' }, dayLabel: { flex: 1, textAlign: 'center', color: 'gray', fontSize: 12 }, calendarGrid: { flexDirection: 'row', flexWrap: 'wrap' }, dayCell: { width: `${100/7}%`, aspectRatio: 1, justifyContent: 'center', alignItems: 'center', borderRadius: 99 }, today: { borderWidth: 1, borderColor: '#a5b4fc' }, selectedDay: { backgroundColor: '#4f46e5' }, dayText: { fontSize: 14 }, selectedDayText: { color: 'white', fontWeight: 'bold' }, timePickerContainer: { height: PICKER_HEIGHT, width: '100%', justifyContent: 'center', alignItems: 'center', }, selectionIndicator: { height: ITEM_HEIGHT, width: '75%', backgroundColor: '#eef2ff', borderRadius: 10, position: 'absolute', zIndex: -1, }, wheelsContainer: { height: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', }, timeScrollView: { height: PICKER_HEIGHT, width: 80, }, timeItem: { height: ITEM_HEIGHT, justifyContent: 'center', alignItems: 'center', }, timeText: { fontSize: 24, color: '#374151', fontWeight: '500', }, timeSeparator: { fontSize: 24, fontWeight: 'bold', color: '#9ca3af', marginHorizontal: 5, }, footer: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 15, borderTopWidth: 1, borderColor: '#eee' }, });
const Button = ({ title, onPress, color }: { title: string, onPress: () => void, color?: string }) => ( <TouchableOpacity onPress={onPress} style={{ padding: 8 }}><Text style={{ color: color || '#4f46e5', fontWeight: 'bold', fontSize: 16 }}>{title}</Text></TouchableOpacity>);

export default DateTimePicker;