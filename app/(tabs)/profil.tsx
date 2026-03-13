import React, { useState, useMemo } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather as FeatherIcon } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting } from '@/context/KnittingContext';
import { useUser, getGreeting } from '@/context/UserContext';
import { PremiumModal, FREE_FEATURES, LOCKED_FEATURES, MONTHLY_PRICE, YEARLY_MONTHLY_PRICE, YEARLY_SAVINGS, YEARLY_TOTAL } from '@/components/PremiumModal';
import { useColors, useIsDark, useTheme } from '@/context/ThemeContext';
import { useLanguage, useT } from '@/context/LanguageContext';
import { useSubscription } from '@/lib/revenuecat';
import type { ThemePreference } from '@/context/ThemeContext';
import type { Language } from '@/i18n/translations';

function YarnStats() {
  const colors = useColors();
  const t = useT();
  const { yarnStock, projects, qualities, brands } = useKnitting();

  const usedYarn = useMemo(() => {
    const totals = new Map<string, { allocated: number; total: number }>();
    for (const y of yarnStock) {
      totals.set(y.id, { allocated: 0, total: y.skeins });
    }
    for (const p of projects) {
      for (const al of p.yarnAllocations) {
        const prev = totals.get(al.yarnStockId) ?? { allocated: 0, total: 0 };
        totals.set(al.yarnStockId, { ...prev, allocated: prev.allocated + al.skeinsAllocated });
      }
    }
    return [...totals.entries()]
      .map(([id, { allocated, total }]) => {
        const yarn = yarnStock.find(y => y.id === id);
        const quality = yarn ? qualities.find(q => q.id === yarn.qualityId) : undefined;
        const brand = quality ? brands.find(b => b.id === quality.brandId) : undefined;
        const pct = total > 0 ? Math.min(allocated / total, 1) : 0;
        return { yarn, quality, brand, allocated, total, pct };
      })
      .filter(x => x.yarn)
      .sort((a, b) => b.allocated - a.allocated)
      .slice(0, 10);
  }, [yarnStock, projects, qualities, brands]);

  const totalAllocated = Math.round(usedYarn.reduce((s, x) => s + x.allocated, 0));

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
          <View key={item.yarn!.id}>
            <View style={styles.yarnStatRow}>
              <View style={[styles.colorDot, { backgroundColor: item.yarn!.colorHex }]} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.yarnStatName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                  {item.brand?.name} {item.quality?.name} • {item.yarn!.colorName}
                </Text>
                <View style={styles.barContainer}>
                  <View style={[styles.barBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.barFill, { backgroundColor: colors.primaryBtn, width: `${Math.round(item.pct * 100)}%` as any }]} />
                  </View>
                  <Text style={[styles.barLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                    {Math.round(item.allocated)}/{Math.round(item.total)} {t.quality.skeins}
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

export default function InnstillingerScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const t = useT();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { language, setLanguage } = useLanguage();
  const { themePreference, setThemePreference } = useTheme();
  const { firstName, setFirstName } = useUser();
  const { projects, yarnStock, needles } = useKnitting();
  const { isSubscribed } = useSubscription();
  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [showPremium, setShowPremium] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'yearly' | 'monthly'>('monthly');

  const greeting = getGreeting(firstName, t);

  const activeProjects = projects.filter(p => p.status === 'aktiv').length;
  const finishedProjects = projects.filter(p => p.status === 'ferdig').length;
  const totalSkeins = yarnStock.reduce((s, y) => s + y.skeins, 0);
  const skeinsUsed = projects.reduce((s, p) => s + p.yarnAllocations.reduce((a, al) => a + al.skeinsAllocated, 0), 0);

  const statRows = [
    { label: t.home.statActiveProjects, value: String(activeProjects), icon: 'play-circle-outline' as const },
    { label: t.home.statFinishedProjects, value: String(finishedProjects), icon: 'checkmark-circle-outline' as const },
    { label: t.home.statTotalSkeins, value: String(Math.round(totalSkeins)), icon: 'cube-outline' as const },
    { label: t.home.statSkeinsUsed, value: String(Math.round(skeinsUsed)), icon: 'git-merge-outline' as const },
    { label: t.home.statNeedlesRegistered, value: String(needles.length), icon: 'construct-outline' as const },
  ];

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
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.title}</Text>
        </LinearGradient>

        <View style={[styles.profileCard, { backgroundColor: colors.primaryBtn }]}>
          <View style={styles.avatarCircle}>
            <Text style={[styles.avatarLetter, { fontFamily: 'Inter_700Bold' }]}>
              {firstName ? firstName[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greetingText, { fontFamily: 'Inter_400Regular' }]}>{greeting}</Text>
            <Text style={[styles.nameText, { fontFamily: 'Inter_700Bold' }]}>
              {firstName || t.settings.addName}
            </Text>
          </View>
          <Pressable
            onPress={() => { setNameInput(firstName || ''); setShowEditName(true); }}
            style={styles.editBtn}
            hitSlop={12}
          >
            <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </View>

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

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.tools.yarnUsed}</Text>
        <YarnStats />

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.premium.sectionTitle}</Text>
        <View style={[styles.premiumCard, { backgroundColor: colors.surface }]}>
          <Text style={[styles.premiumTitle, { color: colors.text, fontFamily: 'Inter_700Bold', textAlign: 'center' }]}>Prøv Knitto+ gratis</Text>
          <Text style={[styles.premiumSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular', textAlign: 'center' }]}>Lås opp alt og strikk uten grenser</Text>

          <View style={styles.premiumFeatures}>
            <View style={styles.premiumFeatureRow}>
              <View style={[styles.premiumFeatureIcon, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="leaf-outline" size={14} color="#4CAF50" style={{ alignSelf: 'center' }} />
              </View>
              <Text style={[styles.premiumFeatureText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
                {FREE_FEATURES.join('  ·  ')}
              </Text>
            </View>
            <View style={[styles.premiumDivider, { backgroundColor: colors.border }]} />
            {LOCKED_FEATURES.map((label, i) => (
              <View key={`locked-${i}`} style={styles.premiumFeatureRow}>
                <View style={[styles.premiumFeatureIcon, { backgroundColor: 'rgba(91,127,191,0.12)' }]}>
                  <Ionicons name="add" size={18} color="#5B7FBF" style={{ alignSelf: 'center' }} />
                </View>
                <Text style={[styles.premiumFeatureText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.premiumDivider, { backgroundColor: colors.border }]} />

          <View style={styles.premiumPlanRow}>
            <Pressable
              style={[styles.premiumPlanCard, { borderColor: selectedPlan === 'monthly' ? '#5B7FBF' : colors.border, backgroundColor: colors.background }, selectedPlan === 'monthly' && { borderWidth: 2 }]}
              onPress={() => { setSelectedPlan('monthly'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Text style={[{ fontSize: 14, color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Månedlig</Text>
              <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Inter_400Regular' }}>{MONTHLY_PRICE} kr / mnd</Text>
            </Pressable>
            <Pressable
              style={[styles.premiumPlanCard, { borderColor: selectedPlan === 'yearly' ? '#5B7FBF' : colors.border, backgroundColor: colors.background }, selectedPlan === 'yearly' && { borderWidth: 2 }]}
              onPress={() => { setSelectedPlan('yearly'); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <Text style={[{ fontSize: 14, color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Årlig</Text>
                <View style={{ backgroundColor: '#5B7FBF', borderRadius: 5, paddingHorizontal: 6, paddingVertical: 2 }}>
                  <Text style={{ color: '#fff', fontSize: 10, fontFamily: 'Inter_600SemiBold' }}>Spar {YEARLY_SAVINGS} kr</Text>
                </View>
              </View>
              <Text style={{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Inter_400Regular' }}>{YEARLY_TOTAL} kr / år</Text>
            </Pressable>
          </View>

          <Pressable
            style={({ pressed }) => [styles.premiumBtn, { backgroundColor: '#5B7FBF', opacity: pressed ? 0.88 : 1 }]}
            onPress={() => setShowPremium(true)}
          >
            <Text style={[styles.premiumBtnText, { color: '#fff', fontFamily: 'Inter_700Bold' }]}>Start gratis prøveperiode</Text>
            <Text style={[styles.premiumBtnSub, { color: 'rgba(255,255,255,0.65)', fontFamily: 'Inter_400Regular' }]}>
              {selectedPlan === 'yearly'
                ? `14 dager gratis, deretter ${YEARLY_TOTAL} kr / år`
                : `14 dager gratis, deretter ${MONTHLY_PRICE} kr / mnd`}
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.language}</Text>
        <View style={[styles.segContainer, { backgroundColor: isDark ? Colors.dark.surface : '#E5EBF5' }]}>
          {([['no', t.settings.languageNorwegian], ['en', t.settings.languageEnglish]] as [Language, string][]).map(([code, label]) => (
            <Pressable
              key={code}
              onPress={() => { setLanguage(code); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.segPill, language === code && { backgroundColor: isDark ? colors.primaryBtn : Colors.palette.navy }]}
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

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.theme}</Text>
        <View style={[styles.segContainer, { backgroundColor: isDark ? Colors.dark.surface : '#E5EBF5' }]}>
          {([['light', t.settings.themeLight], ['dark', t.settings.themeDark], ['system', t.settings.themeSystem]] as [ThemePreference, string][]).map(([pref, label]) => (
            <Pressable
              key={pref}
              onPress={() => { setThemePreference(pref); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              style={[styles.segPill, themePreference === pref && { backgroundColor: isDark ? colors.primaryBtn : Colors.palette.navy }]}
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

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.about}</Text>
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          {[
            { label: t.settings.aboutApp, value: 'Knitto' },
            { label: t.settings.aboutVersion, value: '1.0.0' },
            { label: t.settings.aboutDeveloper, value: 'Sisu Knitwear AS' },
          ].map((row, i, arr) => (
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
  title: { fontSize: 32, textAlign: 'center', alignSelf: 'center' },
  content: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 20, marginTop: 8, marginBottom: 4 },
  profileCard: { borderRadius: 20, padding: 20, flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatarCircle: { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { fontSize: 24, color: '#fff' },
  greetingText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  nameText: { fontSize: 20, color: '#fff' },
  editBtn: { padding: 6 },
  card: { borderRadius: 16, overflow: 'hidden', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { flex: 1, fontSize: 15 },
  rowValue: { fontSize: 15 },
  divider: { height: 1, marginHorizontal: 16 },
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
  premiumCard: { borderRadius: 20, padding: 20, gap: 12 },
  premiumPlanRow: { flexDirection: 'row', gap: 10 },
  premiumPlanCard: { flex: 1, borderWidth: 1.5, borderRadius: 14, padding: 12, gap: 4, alignItems: 'center' },
  premiumTop: { flexDirection: 'column', alignItems: 'center', gap: 8 },
  premiumIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)' },
  premiumTitle: { fontSize: 18 },
  premiumSub: { fontSize: 13, marginTop: -4 },
  premiumDivider: { height: 1, marginVertical: 8 },
  premiumFeatures: { gap: 10 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, width: '100%' },
  premiumFeatureIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  premiumFeatureText: { fontSize: 14 },
  premiumBtn: { borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16, alignItems: 'center', gap: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  premiumBtnText: { fontSize: 15 },
  premiumBtnSub: { fontSize: 11 },
  segContainer: { flexDirection: 'row', borderRadius: 20, padding: 4, gap: 4 },
  segPill: { flex: 1, paddingVertical: 11, alignItems: 'center', borderRadius: 16 },
  segPillText: { fontSize: 14 },
  byline: { textAlign: 'center', fontSize: 13, marginTop: 16, marginBottom: 8 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 22 },
  nameInput: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
});
