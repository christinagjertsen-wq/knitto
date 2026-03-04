import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';

const colors = Colors.light;

const NEEDLE_SIZES = [
  { metric: '2.0', us: '0', uk: '14' },
  { metric: '2.25', us: '1', uk: '13' },
  { metric: '2.5', us: '1.5', uk: '12' },
  { metric: '2.75', us: '2', uk: '12' },
  { metric: '3.0', us: '2.5', uk: '11' },
  { metric: '3.25', us: '3', uk: '10' },
  { metric: '3.5', us: '4', uk: '–' },
  { metric: '3.75', us: '5', uk: '9' },
  { metric: '4.0', us: '6', uk: '8' },
  { metric: '4.5', us: '7', uk: '7' },
  { metric: '5.0', us: '8', uk: '6' },
  { metric: '5.5', us: '9', uk: '5' },
  { metric: '6.0', us: '10', uk: '4' },
  { metric: '6.5', us: '10.5', uk: '3' },
  { metric: '7.0', us: '–', uk: '2' },
  { metric: '8.0', us: '11', uk: '0' },
  { metric: '9.0', us: '13', uk: '00' },
  { metric: '10.0', us: '15', uk: '000' },
  { metric: '12.0', us: '17', uk: '–' },
  { metric: '15.0', us: '19', uk: '–' },
];

function Counter({ label, color }: { label: string; color: string }) {
  const [count, setCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePop = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.18, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const increment = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    animatePop();
    setCount(c => c + 1);
  };

  const decrement = () => {
    if (count === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCount(c => c - 1);
  };

  const reset = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setCount(0);
  };

  return (
    <View style={[styles.counterCard, { backgroundColor: colors.surface }]}>
      <View style={styles.counterHeader}>
        <Text style={[styles.counterLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
          {label}
        </Text>
        <Pressable onPress={reset} hitSlop={10}>
          <Ionicons name="refresh" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>

      <Pressable onPress={increment} style={styles.counterTapArea}>
        <Animated.Text
          style={[styles.counterNumber, { color, fontFamily: 'Inter_700Bold', transform: [{ scale: scaleAnim }] }]}
        >
          {count}
        </Animated.Text>
        <Text style={[styles.counterHint, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
          trykk for å telle
        </Text>
      </Pressable>

      <View style={styles.counterRow}>
        <Pressable
          style={[styles.counterBtn, { backgroundColor: colors.background }]}
          onPress={decrement}
        >
          <Ionicons name="remove" size={22} color={count === 0 ? colors.textTertiary : colors.text} />
        </Pressable>
        <Pressable
          style={[styles.counterBtn, { backgroundColor: color }]}
          onPress={increment}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

export default function VerktoyScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Verktøy</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Tellere</Text>

        <Counter label="Radteller" color={colors.primaryBtn} />
        <Counter label="Masketeller" color="#7B9E87" />

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold', marginTop: 8 }]}>
          Nålestørrelser
        </Text>

        <View style={[styles.tableCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.tableRow, styles.tableHead, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>mm</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>US</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>UK</Text>
          </View>
          {NEEDLE_SIZES.map((row, i) => (
            <View
              key={row.metric}
              style={[
                styles.tableRow,
                { backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(74,104,152,0.04)' },
              ]}
            >
              <Text style={[styles.tableCell, { color: colors.text, fontFamily: 'Inter_500Medium' }]}>{row.metric}</Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{row.us}</Text>
              <Text style={[styles.tableCell, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{row.uk}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 34 },
  content: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 20, marginBottom: 4 },
  counterCard: {
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  counterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  counterLabel: { fontSize: 14 },
  counterTapArea: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  counterNumber: { fontSize: 64, lineHeight: 72 },
  counterHint: { fontSize: 12, marginTop: 2 },
  counterRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  counterBtn: {
    flex: 1,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tableCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHead: {
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableHeaderCell: { flex: 1, fontSize: 12 },
  tableCell: { flex: 1, fontSize: 14 },
});
