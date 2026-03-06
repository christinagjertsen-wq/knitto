import React, { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting } from '@/context/KnittingContext';
import { useUser } from '@/context/UserContext';
import { PremiumModal, getPremiumFeatures } from '@/components/PremiumModal';
import { useColors, useIsDark } from '@/context/ThemeContext';
import { useTheme } from '@/context/ThemeContext';
import { useLanguage, useT } from '@/context/LanguageContext';
import type { ThemePreference } from '@/context/ThemeContext';
import type { Language } from '@/i18n/translations';

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
  const colors = useColors();
  const t = useT();
  const [count, setCount] = useState(0);
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const animatePop = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 1.18, duration: 60, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, friction: 4 }),
    ]).start();
  };

  const increment = () => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); animatePop(); setCount(c => c + 1); };
  const decrement = () => { if (count === 0) return; Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setCount(c => c - 1); };
  const reset = () => { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning); setCount(0); };

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
    const remainder = curr % changes;

    const shortSections = changes - remainder;
    const longSections = remainder;
    const action = isØke ? t.tools.increase : t.tools.decrease;

    let lines: string[] = [];
    if (longSections === 0) {
      lines.push(`${action} ${t.tools.incOneStitch.replace('%s', String(spacing))}`);
      lines.push(t.tools.repeatXTimes.replace('%s', String(changes)));
    } else {
      lines.push(`${action} ${t.tools.incOneStitch.replace('%s', String(spacing))} — ${t.tools.xTimes.replace('%s', String(shortSections))}`);
      lines.push(`${action} ${t.tools.incOneStitch.replace('%s', String(spacing + 1))} — ${t.tools.xTimes.replace('%s', String(longSections))}`);
    }

    return { isØke, changes, lines, from: curr, to: want };
  }, [nåværende, ønsket, t]);

  return (
    <View style={[styles.calcCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.calcTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{t.tools.increaseDecreaseTitle}</Text>
      <Text style={[styles.calcSubtitle, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
        {t.tools.incDecSubtitle}
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
          <Text style={[styles.inputLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.tools.desiredStitches}</Text>
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
      <View style={[styles.resultBox, { backgroundColor: colors.primaryBtn + '18' }]}>
        <Text style={[styles.resultLine, { color: colors.primaryBtn, fontFamily: 'Inter_700Bold' }]}>
          {result ? (result.isØke ? t.tools.increase : t.tools.decrease) : t.tools.increaseDecrease} {t.tools.xStitchesTotal.replace('%s', String(result?.changes ?? 0))}
        </Text>
        {result && result.lines.map((line, i) => (
          <Text key={i} style={[styles.resultSub, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {line}
          </Text>
        ))}
        {result && (
          <Text style={[styles.resultSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular', marginTop: 4 }]}>
            {result.from} → {result.to} {t.tools.stitchesLabel}
          </Text>
        )}
      </View>
    </View>
  );
}

function YarnStats() {
  const colors = useColors();
  const t = useT();
  const { projects, yarnStock, qualities, brands, getQualityById } = useKnitting();

  const usedYarn = useMemo(() => {
    const allocMap: Record<string, number> = {};
    projects.forEach(p => {
      p.yarnAllocations.forEach(a => {
        allocMap[a.yarnStockId] = (allocMap[a.yarnStockId] || 0) + a.skeinsAllocated;
      });
    });
    return yarnStock
      .filter(y => allocMap[y.id] > 0)
      .map(y => {
        const q = getQualityById(y.qualityId);
        const b = q ? brands.find(b => b.id === q.brandId) : undefined;
        const allocated = allocMap[y.id] || 0;
        const total = y.skeins + allocated;
        const pct = total > 0 ? allocated / total : 0;
        return { yarn: y, quality: q, brand: b, allocated, total, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [projects, yarnStock, qualities, brands]);

  const totalAllocated = useMemo(() =>
    projects.reduce((s, p) => s + p.yarnAllocations.reduce((ss, a) => ss + a.skeinsAllocated, 0), 0),
    [projects]
  );

  if (usedYarn.length === 0) {
    return (
      <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
          <Ionicons name="stats-chart-outline" size={32} color={colors.textTertiary} />
          <Text style={{ color: colors.textTertiary, fontFamily: 'Inter_400Regular', textAlign: 'center' }}>
            {t.tools.noYarnLinked}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 10 }}>
      <View style={styles.summaryRow}>
        <View style={[styles.summaryChip, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryNum, { color: colors.primaryBtn, fontFamily: 'Inter_700Bold' }]}>{totalAllocated}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.tools.skeinsUsed}</Text>
        </View>
        <View style={[styles.summaryChip, { backgroundColor: colors.surface }]}>
          <Text style={[styles.summaryNum, { color: '#6A8EC8', fontFamily: 'Inter_700Bold' }]}>{usedYarn.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.tools.yarnTypes}</Text>
        </View>
      </View>
      <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
        {usedYarn.map((item, i) => (
          <View key={item.yarn.id}>
            <View style={styles.yarnStatRow}>
              <View style={[styles.colorDot, { backgroundColor: item.yarn.colorHex }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.yarnStatName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                  {item.brand?.name} {item.quality?.name} • {item.yarn.colorName}
                </Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.barFill, { backgroundColor: colors.primaryBtn, width: `${Math.round(item.pct * 100)}%` as any }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                    {item.allocated}/{item.total} {t.quality.skeins}
                  </Text>
                </View>
              </View>
            </View>
            {i < usedYarn.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
          </View>
        ))}
      </View>
    </View>
  );
}

const TOOL_SECTIONS = [
  { key: 'tellere', icon: 'add-circle-outline' as const },
  { key: 'kalkulator', icon: 'calculator-outline' as const },
  { key: 'oekefelle', icon: 'git-branch-outline' as const },
  { key: 'statistikk', icon: 'stats-chart-outline' as const },
  { key: 'naaler', icon: 'list-outline' as const },
] as const;

type ToolSection = typeof TOOL_SECTIONS[number]['key'];

export default function InnstillingerScreen() {
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const colors = useColors();
  const isDark = useIsDark();
  const t = useT();
  const { language, setLanguage } = useLanguage();
  const { themePreference, setThemePreference } = useTheme();
  const { firstName, setFirstName } = useUser();
  const { projects, yarnStock, needles } = useKnitting();
  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showPremium, setShowPremium] = useState(false);
  const [activeSection, setActiveSection] = useState<ToolSection>('tellere');
  const tabScrollRef = useRef<ScrollView>(null);
  const chipOffsets = useRef<Record<string, number>>({});

  const toolLabels: Record<ToolSection, string> = {
    tellere: t.tools.counters,
    kalkulator: t.tools.calculator,
    oekefelle: t.tools.increaseDecrease,
    statistikk: t.tools.yarnUsed,
    naaler: t.project.needles,
  };

  const scrollToActive = useCallback((animated = true) => {
    const x = chipOffsets.current[activeSection] ?? 0;
    tabScrollRef.current?.scrollTo({ x: Math.max(0, x - 20), animated });
  }, [activeSection]);

  useEffect(() => {
    scrollToActive(true);
  }, [activeSection]);

  useFocusEffect(useCallback(() => {
    const timer = setTimeout(() => scrollToActive(false), 80);
    return () => clearTimeout(timer);
  }, [scrollToActive]));

  const quote = useMemo(() => t.settings.quotes[new Date().getDay() % t.settings.quotes.length], [t]);

  const activeProjects = projects.filter(p => p.status === 'aktiv').length;
  const finishedProjects = projects.filter(p => p.status === 'ferdig').length;
  const totalSkeins = yarnStock.reduce((s, y) => s + y.skeins, 0);
  const skeinsUsed = projects.reduce((s, p) => s + p.yarnAllocations.reduce((a, al) => a + al.skeinsAllocated, 0), 0);

  const statRows = [
    { label: t.home.statActiveProjects, value: String(activeProjects), icon: 'play-circle-outline' as const },
    { label: t.home.statFinishedProjects, value: String(finishedProjects), icon: 'checkmark-circle-outline' as const },
    { label: t.home.statTotalSkeins, value: String(totalSkeins), icon: 'cube-outline' as const },
    { label: t.home.statSkeinsUsed, value: String(skeinsUsed), icon: 'git-merge-outline' as const },
    { label: t.home.statNeedlesRegistered, value: String(needles.length), icon: 'construct-outline' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        <LinearGradient
          colors={isDark ? ['#1A2340', '#0D1220'] : [Colors.palette.nordicBlue, Colors.palette.nordicIce]}
          style={[styles.header, { paddingTop: topInset + 24, marginHorizontal: -20, marginTop: -20 }]}
        >
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.title}</Text>
        </LinearGradient>
        <View style={[styles.profileCard, { backgroundColor: colors.primaryBtn }]}>
          <View style={styles.avatarCircle}>
            <Text style={[styles.avatarLetter, { fontFamily: 'Inter_700Bold' }]}>
              {firstName ? firstName[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.nameText, { fontFamily: 'Inter_700Bold' }]}>
              {firstName || t.settings.addName}
            </Text>
            <Text style={[styles.quoteText, { fontFamily: 'Inter_400Regular' }]}>
              {quote}
            </Text>
          </View>
          <Pressable
            onPress={() => { setNameInput(firstName || ''); setShowEditName(true); }}
            style={styles.gearBtn}
            hitSlop={12}
          >
            <Ionicons name="settings-outline" size={22} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.tools}</Text>

        <ScrollView
          ref={tabScrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabBar}
        >
          {TOOL_SECTIONS.map(s => (
            <Pressable
              key={s.key}
              style={[styles.tabChip, activeSection === s.key && { backgroundColor: colors.primaryBtn }]}
              onPress={() => { setActiveSection(s.key); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              onLayout={(e) => { chipOffsets.current[s.key] = e.nativeEvent.layout.x; }}
            >
              <Ionicons name={s.icon} size={15} color={activeSection === s.key ? '#fff' : colors.textSecondary} />
              <Text style={[styles.tabChipText, {
                color: activeSection === s.key ? '#fff' : colors.textSecondary,
                fontFamily: activeSection === s.key ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                {toolLabels[s.key]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {activeSection === 'tellere' && (
          <>
            <Counter label={t.tools.rowCounter} color={colors.primaryBtn} />
            <Counter label={t.tools.stitchCounter} color="#6A8EC8" />
          </>
        )}

        {activeSection === 'kalkulator' && <YarnCalculator />}

        {activeSection === 'oekefelle' && <OkeFelleKalkulator />}

        {activeSection === 'statistikk' && <YarnStats />}

        {activeSection === 'naaler' && (
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
        )}

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.stats}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {statRows.map((row, i) => (
            <View key={row.label}>
              <View style={styles.row}>
                <Ionicons name={row.icon} size={18} color={colors.primaryBtn} />
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{row.value}</Text>
              </View>
              {i < statRows.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.premium.sectionTitle}</Text>
        <View style={[styles.premiumCard, { backgroundColor: '#1A2340' }]}>
          <View style={styles.premiumTop}>
            <View style={styles.premiumIconCircle}>
              <Ionicons name="diamond-outline" size={20} color="#fff" />
            </View>
            <Text style={[styles.premiumTitle, { fontFamily: 'Inter_700Bold', textAlign: 'center' }]}>{t.premium.cardTitle}</Text>
            <Text style={[styles.premiumSub, { fontFamily: 'Inter_400Regular', textAlign: 'center' }]}>{t.premium.cardSub}</Text>
          </View>
          <View style={[styles.premiumDivider]} />
          <View style={styles.premiumFeatures}>
            {getPremiumFeatures(t).map(f => (
              <View key={f.label} style={styles.premiumFeatureRow}>
                <View style={styles.premiumFeatureIcon}>
                  <Ionicons name={f.icon} size={15} color="rgba(255,255,255,0.9)" />
                </View>
                <Text style={[styles.premiumFeatureText, { fontFamily: 'Inter_400Regular' }]}>{f.label}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.premiumBtn, { backgroundColor: '#fff', opacity: pressed ? 0.92 : 1 }]}
            onPress={() => setShowPremium(true)}
          >
            <Text style={[styles.premiumBtnText, { color: '#1A2340', fontFamily: 'Inter_700Bold' }]}>
              {t.premium.ctaButton}
            </Text>
            <Text style={[styles.premiumBtnSub, { fontFamily: 'Inter_400Regular' }]}>{t.premium.price}</Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.language}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { paddingVertical: 12, gap: 0 }]}>
            {([['no', t.settings.languageNorwegian], ['en', t.settings.languageEnglish]] as [Language, string][]).map(([code, label], i, arr) => (
              <Pressable
                key={code}
                onPress={() => { setLanguage(code); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.segPill,
                  language === code && { backgroundColor: colors.primaryBtn },
                  i === 0 && styles.segPillFirst,
                  i === arr.length - 1 && styles.segPillLast,
                  { borderColor: colors.border },
                ]}
              >
                <Text style={[styles.segPillText, {
                  color: language === code ? '#fff' : colors.textSecondary,
                  fontFamily: language === code ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.theme}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.row, { paddingVertical: 12, gap: 0 }]}>
            {([['light', t.settings.themeLight], ['dark', t.settings.themeDark], ['system', t.settings.themeSystem]] as [ThemePreference, string][]).map(([pref, label], i, arr) => (
              <Pressable
                key={pref}
                onPress={() => { setThemePreference(pref); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                style={[
                  styles.segPill,
                  themePreference === pref && { backgroundColor: colors.primaryBtn },
                  i === 0 && styles.segPillFirst,
                  i === arr.length - 1 && styles.segPillLast,
                  { borderColor: colors.border },
                ]}
              >
                <Text style={[styles.segPillText, {
                  color: themePreference === pref ? '#fff' : colors.textSecondary,
                  fontFamily: themePreference === pref ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.about}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {[{ label: t.settings.aboutApp, value: 'Knitto' }, { label: t.settings.aboutVersion, value: '1.0.0' }].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showEditName} transparent animationType="fade" onRequestClose={() => setShowEditName(false)}>
        <View style={styles.modalOverlay}>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.yourName}</Text>
            <TextInput
              style={[styles.nameInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Hva heter du?"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <Pressable
              style={[styles.saveBtn, { backgroundColor: nameInput.trim() ? colors.primaryBtn : colors.border }]}
              disabled={!nameInput.trim()}
              onPress={() => { setFirstName(nameInput.trim()); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); setShowEditName(false); }}
            >
              <Text style={[styles.saveBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.common.save}</Text>
            </Pressable>
            <Pressable onPress={() => setShowEditName(false)} style={styles.cancelBtn}>
              <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}>{t.common.cancel}</Text>
            </Pressable>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 24, paddingBottom: 20, borderBottomLeftRadius: 28, borderBottomRightRadius: 28 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 32, textAlign: 'center', alignSelf: 'center' },
  content: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 20, marginTop: 8, marginBottom: 4 },
  profileCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 24, color: '#fff' },
  nameText: { fontSize: 20, color: '#fff' },
  quoteText: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 4, lineHeight: 17 },
  editNameBtn: { padding: 8 },
  gearBtn: { padding: 6, alignSelf: 'center' },
  tabScroll: { flexGrow: 0, marginHorizontal: -20, marginBottom: 4 },
  tabBar: { paddingHorizontal: 20, paddingVertical: 4, gap: 8, flexDirection: 'row' },
  tabChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(74,104,152,0.08)',
  },
  tabChipText: { fontSize: 13 },
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
  statsCard: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryRow: { flexDirection: 'row', gap: 10 },
  summaryChip: { flex: 1, borderRadius: 16, padding: 16, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  summaryNum: { fontSize: 28 },
  summaryLabel: { fontSize: 12, marginTop: 2 },
  yarnStatRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  colorDot: { width: 12, height: 12, borderRadius: 6, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  yarnStatName: { fontSize: 13, marginBottom: 6 },
  barContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  barFill: { height: 6, borderRadius: 3 },
  barLabel: { fontSize: 11, minWidth: 60, textAlign: 'right' },
  tableCard: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  tableHead: { borderBottomWidth: 1 },
  tableRow: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 16 },
  tableHeaderCell: { flex: 1, fontSize: 12 },
  tableCell: { flex: 1, fontSize: 14 },
  card: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 15 },
  divider: { height: 1, marginHorizontal: 16 },
  premiumCard: { borderRadius: 20, padding: 20, gap: 14 },
  premiumTop: { flexDirection: 'column', alignItems: 'center', gap: 8 },
  premiumIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  premiumTitle: { fontSize: 15, color: '#fff', lineHeight: 20 },
  premiumSub: { fontSize: 12, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  premiumDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)' },
  premiumFeatures: { gap: 10 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  premiumFeatureIcon: { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' },
  premiumFeatureText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  premiumBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', gap: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  premiumBtnText: { fontSize: 15 },
  premiumBtnSub: { fontSize: 11, color: 'rgba(26,35,64,0.5)' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 22 },
  nameInput: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
  segPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
  },
  segPillFirst: { borderRadius: 0, borderTopLeftRadius: 12, borderBottomLeftRadius: 12 },
  segPillLast: { borderRadius: 0, borderTopRightRadius: 12, borderBottomRightRadius: 12 },
  segPillText: { fontSize: 14 },
});
