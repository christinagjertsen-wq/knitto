import React, { useState, useMemo, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  TextInput,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/colors';
import { useColors, useIsDark } from '@/context/ThemeContext';
import { useT } from '@/context/LanguageContext';

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

function Counter({ label, color, storageKey }: { label: string; color: string; storageKey: string }) {
  const colors = useColors();
  const t = useT();
  const [count, setCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem(storageKey).then(val => {
      if (val !== null) setCount(parseInt(val, 10) || 0);
    });
  }, [storageKey]);

  const save = (val: number) => AsyncStorage.setItem(storageKey, String(val));

  const animatePop = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.18, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const increment = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animatePop(); setCount(c => { save(c + 1); return c + 1; }); };
  const decrement = () => { if (count === 0) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCount(c => { save(c - 1); return c - 1; }); };
  const reset = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); save(0); setCount(0); };

  return (
    <View style={[styles.counterCard, { backgroundColor: colors.surface }]}>
      <View style={styles.counterHeader}>
        <Text style={[styles.counterLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
        <Pressable onPress={reset} hitSlop={10}>
          <Ionicons name="refresh" size={18} color={colors.textTertiary} />
        </Pressable>
      </View>
      <Pressable onPress={increment} style={styles.counterTapArea}>
        <Animated.Text style={[styles.counterNumber, { color, fontFamily: 'Inter_700Bold', transform: [{ scale: scaleAnim }] }]}>
          {count}
        </Animated.Text>
        <Text style={[styles.counterHint, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.tools.tapToCount}</Text>
      </Pressable>
      <View style={styles.counterRow}>
        <Pressable style={[styles.counterBtn, { backgroundColor: colors.background }]} onPress={decrement}>
          <Ionicons name="remove" size={22} color={count === 0 ? colors.textTertiary : colors.text} />
        </Pressable>
        <Pressable style={[styles.counterBtn, { backgroundColor: color }]} onPress={increment}>
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>
    </View>
  );
}

function YarnCalculator() {
  const colors = useColors();
  const t = useT();
  const [metersPerSkein, setMetersPerSkein] = useState('');
  const [skeins, setSkeins] = useState('');
  const [stitchGauge, setStitchGauge] = useState('');
  const [rowGauge, setRowGauge] = useState('');

  const result = useMemo(() => {
    const totalM = (parseFloat(metersPerSkein) || 0) * (parseFloat(skeins) || 0);
    const sg = parseFloat(stitchGauge) || 0;
    const rg = parseFloat(rowGauge) || 0;
    if (totalM <= 0 || sg <= 0 || rg <= 0) return null;
    const stitchesPerMeter = (sg / 10) * (rg / 10);
    const areaCm2 = totalM * 100 / stitchesPerMeter;
    const widthCm = Math.sqrt(areaCm2);
    return { totalMeters: Math.round(totalM), areaCm2: Math.round(areaCm2), widthCm: Math.round(widthCm) };
  }, [metersPerSkein, skeins, stitchGauge, rowGauge]);

  return (
    <View style={[styles.calcCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.calcTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{t.tools.calcTitle}</Text>
      <Text style={[styles.calcSubtitle, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
        {t.tools.calcSubtitle}
      </Text>
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.tools.metersPerSkein}</Text>
          <TextInput
            style={[styles.calcInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={metersPerSkein}
            onChangeText={setMetersPerSkein}
            placeholder="200"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.tools.skeinsCount}</Text>
          <TextInput
            style={[styles.calcInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={skeins}
            onChangeText={setSkeins}
            placeholder="5"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
      </View>
      <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium', marginTop: 4 }]}>
        {t.tools.gaugeLabel}
      </Text>
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.calcInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={stitchGauge}
            onChangeText={setStitchGauge}
            placeholder="22 masker/10cm"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <TextInput
            style={[styles.calcInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={rowGauge}
            onChangeText={setRowGauge}
            placeholder="28 rader/10cm"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
      </View>
      {result && (
        <View style={[styles.resultBox, { backgroundColor: colors.primaryBtn + '18' }]}>
          <Text style={[styles.resultLine, { color: colors.primaryBtn, fontFamily: 'Inter_700Bold' }]}>
            {result.totalMeters} {t.tools.metersOfYarn}
          </Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            ≈ {result.areaCm2} {t.tools.knitArea}
          </Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {t.tools.forExample} {result.widthCm} × {result.widthCm} cm
          </Text>
        </View>
      )}
    </View>
  );
}

function OkeFelleKalkulator() {
  const colors = useColors();
  const t = useT();
  const [nåværende, setNåværende] = useState('');
  const [ønsket, setØnsket] = useState('');

  const result = useMemo(() => {
    const curr = parseInt(nåværende, 10);
    const want = parseInt(ønsket, 10);
    if (!curr || !want || curr <= 0 || want <= 0 || curr === want) return null;

    const isØke = want > curr;
    const changes = Math.abs(want - curr);
    const spacing = Math.floor(curr / changes);
    const extra = curr % changes;

    return { isØke, changes, spacing, extra, want };
  }, [nåværende, ønsket]);

  return (
    <View style={[styles.calcCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.calcTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{t.tools.increaseDecrease}</Text>
      <Text style={[styles.calcSubtitle, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
        {t.tools.increaseDecreaseSubtitle}
      </Text>
      <View style={styles.inputRow}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.tools.currentStitches}</Text>
          <TextInput
            style={[styles.calcInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={nåværende}
            onChangeText={setNåværende}
            placeholder="80"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.tools.targetStitches}</Text>
          <TextInput
            style={[styles.calcInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border }]}
            value={ønsket}
            onChangeText={setØnsket}
            placeholder="96"
            placeholderTextColor={colors.textTertiary}
            keyboardType="number-pad"
          />
        </View>
      </View>
      {result && (
        <View style={[styles.resultBox, { backgroundColor: (result.isØke ? colors.primaryBtn : '#C97B84') + '18' }]}>
          <Text style={[styles.resultLine, { color: result.isØke ? colors.primaryBtn : '#C97B84', fontFamily: 'Inter_700Bold' }]}>
            {result.isØke ? t.tools.increase : t.tools.decrease} {result.changes}×
          </Text>
          <Text style={[styles.resultSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {t.tools.everyNStitches.replace('{n}', String(result.spacing))}
          </Text>
          {result.extra > 0 && (
            <Text style={[styles.resultSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {t.tools.extraStitches.replace('{n}', String(result.extra))}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

export default function VerktoyScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const colors = useColors();
  const isDark = useIsDark();
  const t = useT();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient
          colors={isDark ? ['#1A2340', '#0D1220'] : [Colors.palette.nordicBlue, Colors.palette.nordicIce]}
          style={[styles.header, { paddingTop: topInset + 24, marginHorizontal: -20, marginTop: -20 }]}
        >
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.nav.settings}</Text>
        </LinearGradient>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.tools.counters}</Text>
        <Counter label={t.tools.rowCounter} color={colors.primaryBtn} storageKey="counter_rows" />
        <Counter label={t.tools.stitchCounter} color="#6A8EC8" storageKey="counter_stitches" />

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.tools.calculator}</Text>
        <YarnCalculator />

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.tools.increaseDecrease}</Text>
        <OkeFelleKalkulator />

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.project.needles}</Text>
        <View style={[styles.tableCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.tableRow, styles.tableHead, { borderBottomColor: colors.border }]}>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>mm</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>US</Text>
            <Text style={[styles.tableHeaderCell, { color: colors.textSecondary, fontFamily: 'Inter_600SemiBold' }]}>UK</Text>
          </View>
          {NEEDLE_SIZES.map((row, i) => (
            <View key={row.metric} style={[styles.tableRow, { backgroundColor: i % 2 === 0 ? 'transparent' : 'rgba(74,104,152,0.04)' }]}>
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
  header: { paddingHorizontal: 24, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  title: { fontSize: 32, textAlign: 'center', alignSelf: 'center' },
  content: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 20, marginTop: 8, marginBottom: 4 },
  counterCard: { borderRadius: 20, padding: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  counterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  counterLabel: { fontSize: 14 },
  counterTapArea: { alignItems: 'center', paddingVertical: 16 },
  counterNumber: { fontSize: 64, lineHeight: 72 },
  counterHint: { fontSize: 12, marginTop: 2 },
  counterRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  counterBtn: { flex: 1, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  calcCard: { borderRadius: 20, padding: 20, gap: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  calcTitle: { fontSize: 17 },
  calcSubtitle: { fontSize: 13, marginTop: -6 },
  inputRow: { flexDirection: 'row', gap: 10 },
  inputLabel: { fontSize: 12, marginBottom: 6 },
  calcInput: { borderRadius: 12, padding: 12, fontSize: 15, borderWidth: 1, fontFamily: 'Inter_400Regular' },
  resultBox: { borderRadius: 14, padding: 16, gap: 4, marginTop: 4 },
  resultLine: { fontSize: 20 },
  resultSub: { fontSize: 13 },
  tableCard: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  tableHead: { borderBottomWidth: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16 },
  tableHeaderCell: { flex: 1, fontSize: 12 },
  tableCell: { flex: 1, fontSize: 14 },
});
