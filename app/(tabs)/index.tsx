import React, { useMemo, useState, useEffect, useRef } from 'react';
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
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, Project, ProjectStatus } from '@/context/KnittingContext';
import { PremiumModal } from '@/components/PremiumModal';
import { useUser, getGreeting } from '@/context/UserContext';
import { useColors, useIsDark } from '@/context/ThemeContext';
import { useT } from '@/context/LanguageContext';


const STATUS_COLORS: Record<ProjectStatus, string> = {
  planlagt: '#9AADC8',
  aktiv: '#6A8EC8',
  ferdig: '#4A6898',
};

function useCountUp(target: number, duration = 800) {
  const [value, setValue] = useState(0);
  const startRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const animate = (timestamp: number) => {
    if (startRef.current === null) startRef.current = timestamp;
    const elapsed = timestamp - startRef.current;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    setValue(Math.round(eased * target));
    if (progress < 1) {
      rafRef.current = requestAnimationFrame(animate);
    }
  };

  const start = () => {
    setValue(0);
    startRef.current = null;
    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(animate);
  };

  return { value, start };
}

function AnimatedStatCard({ label, target }: { label: string; target: number }) {
  const colors = useColors();
  const { value, start } = useCountUp(target, 700);

  useFocusEffect(
    React.useCallback(() => {
      start();
    }, [target])
  );

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        {value.toLocaleString('nb-NO')}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
        {label}
      </Text>
    </View>
  );
}

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 2, duration: 700, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 700, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.delay(400),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: color,
        transform: [{ scale }],
        opacity,
      }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const colors = useColors();
  const t = useT();
  const { yarnStock } = useKnitting();

  const yarnColors = useMemo(() =>
    project.yarnAllocations.slice(0, 3).map(alloc => {
      const yarn = yarnStock.find(y => y.id === alloc.yarnStockId);
      return yarn?.colorHex ?? '#ccc';
    }),
    [project.yarnAllocations, yarnStock]
  );

  return (
    <Pressable
      style={({ pressed }) => [styles.projectRow, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => router.push({ pathname: '/prosjekt/[id]', params: { id: project.id } })}
    >
      {project.coverImage ? (
        <Image source={{ uri: project.coverImage }} style={styles.projectRowThumb} resizeMode="cover" />
      ) : (
        <View style={styles.yarnDots}>
          {yarnColors.map((hex, i) => (
            <View key={i} style={[styles.yarnDot, { backgroundColor: hex, marginLeft: i > 0 ? -6 : 0, zIndex: 3 - i }]} />
          ))}
          {yarnColors.length === 0 && <View style={[styles.yarnDot, { backgroundColor: colors.border }]} />}
        </View>
      )}
      <View style={styles.projectRowText}>
        <Text style={[styles.projectRowName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
          {project.name}
        </Text>
        <View style={styles.statusPill}>
          {project.status === 'aktiv'
            ? <PulsingDot color={STATUS_COLORS.aktiv} />
            : <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[project.status] }]} />
          }
          <Text style={[styles.statusText, { color: STATUS_COLORS[project.status], fontFamily: 'Inter_500Medium' }]}>
            {t.status[project.status]}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}


const SCREEN_W = Dimensions.get('window').width;

const ONBOARDING_SLIDES = [
  {
    icon: 'sparkles' as const,
    iconBg: '#E8EFF8',
    title: 'Velkommen til Knitto',
    body: 'Din personlige strikkedagbok — hold styr på prosjekter, garn og pinner på ett sted.',
  },
  {
    icon: 'layers-outline' as const,
    iconBg: '#E8EFF8',
    title: 'Prosjekter',
    body: 'Opprett prosjekter, sett status og følg fremgangen fra plan til ferdig plagg.',
  },
  {
    icon: 'cube-outline' as const,
    iconBg: '#E8EFF8',
    title: 'Garnlager',
    body: 'Registrer garnet ditt etter merke, kvalitet og farge — vet alltid hva du har hjemme.',
  },
  {
    icon: 'journal-outline' as const,
    iconBg: '#E8EFF8',
    title: 'Logg & fremdrift',
    body: 'Skriv strikkedagbok per prosjekt og se prosentvis fremgang på alle kortene dine.',
  },
];

function NameOnboardingModal({ visible, onDone }: { visible: boolean; onDone: (name: string) => void }) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const slides = [
    { icon: 'sparkles' as const, iconBg: '#E8EFF8', title: t.onboarding.slide1Title, body: t.onboarding.slide1Body },
    { icon: 'layers-outline' as const, iconBg: '#E8EFF8', title: t.onboarding.slide2Title, body: t.onboarding.slide2Body },
    { icon: 'cube-outline' as const, iconBg: '#E8EFF8', title: t.onboarding.slide3Title, body: t.onboarding.slide3Body },
    { icon: 'journal-outline' as const, iconBg: '#E8EFF8', title: t.onboarding.slide4Title, body: t.onboarding.slide4Body },
  ];

  const total = slides.length + 1;
  const isLast = step === slides.length;

  const goNext = () => {
    Animated.timing(slideAnim, { toValue: -SCREEN_W, duration: 220, useNativeDriver: true }).start(() => {
      setStep(s => s + 1);
      slideAnim.setValue(SCREEN_W);
      Animated.timing(slideAnim, { toValue: 0, duration: 220, useNativeDriver: true }).start();
    });
    Haptics.selectionAsync();
  };

  const handleDone = () => {
    if (!name.trim()) return;
    setStep(0);
    onDone(name.trim());
  };

  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const bottomInset = Math.max(Platform.OS === 'web' ? 34 : insets.bottom, 28);

  const currentSlide = slides[step];

  return (
    <Modal visible={visible} animationType="fade" statusBarTranslucent>
      <LinearGradient
        colors={[Colors.palette.nordicBlue, Colors.palette.nordicIce]}
        style={[styles.onboardingScreen, { paddingTop: topInset + 20, paddingBottom: bottomInset }]}
      >
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <Animated.View style={[styles.onboardingSlide, { transform: [{ translateX: slideAnim }] }]}>
            {!isLast ? (
              <>
                <View style={[styles.onboardingIconWrap, { backgroundColor: currentSlide.iconBg }]}>
                  {step === 0 ? (
                    <Image
                      source={require('@/assets/images/yarn-logo.png')}
                      style={{ width: 70, height: 70 }}
                      resizeMode="contain"
                    />
                  ) : (
                    <Ionicons name={currentSlide.icon} size={44} color={Colors.palette.navy} />
                  )}
                </View>
                <Text style={[styles.onboardingTitle, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
                  {currentSlide.title}
                </Text>
                <Text style={[styles.onboardingBody, { color: Colors.palette.navy + 'CC', fontFamily: 'Inter_400Regular' }]}>
                  {currentSlide.body}
                </Text>
              </>
            ) : (
              <>
                <View style={[styles.onboardingIconWrap, { backgroundColor: '#E8EFF8' }]}>
                  <Ionicons name="person-outline" size={44} color={Colors.palette.navy} />
                </View>
                <Text style={[styles.onboardingTitle, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
                  Hva heter du?
                </Text>
                <Text style={[styles.onboardingBody, { color: Colors.palette.navy + 'CC', fontFamily: 'Inter_400Regular' }]}>
                  Legg inn fornavn så er du i gang
                </Text>
                <TextInput
                  style={[styles.onboardingInput, { color: Colors.palette.navy, backgroundColor: 'rgba(255,255,255,0.6)', fontFamily: 'Inter_400Regular' }]}
                  placeholder="Fornavn"
                  placeholderTextColor={Colors.palette.navy + '70'}
                  value={name}
                  onChangeText={setName}
                  autoFocus
                  autoCapitalize="words"
                  returnKeyType="done"
                  onSubmitEditing={handleDone}
                />
              </>
            )}
          </Animated.View>

          <View style={styles.onboardingDots}>
            {Array.from({ length: total }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.onboardingDot,
                  { backgroundColor: i === step ? Colors.palette.navy : Colors.palette.navy + '40' },
                  i === step && { width: 20 },
                ]}
              />
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.onboardingBtn,
              { backgroundColor: Colors.palette.navy, opacity: pressed ? 0.85 : 1 },
              isLast && !name.trim() && { backgroundColor: Colors.palette.navy + '60' },
            ]}
            onPress={isLast ? handleDone : goNext}
            disabled={isLast && !name.trim()}
          >
            <Text style={[styles.onboardingBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
              {isLast ? t.onboarding.letsGo : t.onboarding.next}
            </Text>
            {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </Pressable>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}

function AddProjectModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const t = useT();
  const { addProject } = useKnitting();
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('planlagt');
  const insets = useSafeAreaInsets();

  const save = () => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), status, yarnAllocations: [], notes: '', progressPercent: 0, needleIds: [] });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName('');
    setStatus('planlagt');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.projects.newTitle}</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
            placeholder={t.project.namePlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="sentences"
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
            {(['planlagt', 'aktiv', 'ferdig'] as ProjectStatus[]).map(s => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={({ pressed }) => ({
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 12,
                  alignItems: 'center',
                  backgroundColor: status === s ? colors.primaryBtn : colors.background,
                  opacity: pressed ? 0.8 : 1,
                })}
              >
                <Text style={{
                  fontSize: 13,
                  fontFamily: status === s ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  color: status === s ? '#fff' : colors.textSecondary,
                }}>
                  {t.status[s]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
            onPress={save}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
          </Pressable>
        </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { yarnStock, needles, projects, getTotalStats } = useKnitting();
  const { firstName, setFirstName, isLoading } = useUser();
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showAddProject, setShowAddProject] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  useEffect(() => {
    if (!isLoading && firstName === '') setShowOnboarding(true);
  }, [isLoading, firstName]);

  const stats = getTotalStats();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const featuredProjects = useMemo(() => {
    const active = projects.filter(p => p.status === 'aktiv').slice(0, 3);
    const remaining = 3 - active.length;
    const planned = remaining > 0
      ? projects.filter(p => p.status === 'planlagt').slice(0, remaining)
      : [];
    return [...active, ...planned];
  }, [projects]);

  const greetingBase = getGreeting('', t);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NameOnboardingModal
        visible={showOnboarding}
        onDone={(name) => { if (name) setFirstName(name); setShowOnboarding(false); }}
      />
      <AddProjectModal visible={showAddProject} onClose={() => setShowAddProject(false)} />
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 100 }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        <LinearGradient
          colors={isDark ? ['#1A2340', '#0D1220'] : [Colors.palette.nordicBlue, Colors.palette.nordicIce]}
          style={[styles.header, { paddingTop: topInset + 16 }]}
        >
          <View style={styles.headerBadgeRow}>
            <Pressable
              style={[styles.basicBadge, { backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(26,35,64,0.08)' }]}
              onPress={() => setShowPremium(true)}
              hitSlop={8}
            >
              <Ionicons name="leaf-outline" size={12} color={colors.text} />
              <Text style={[styles.basicBadgeText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Basic</Text>
            </Pressable>
          </View>

          <View style={styles.headerTopRow}>
            <Text style={[styles.greetingSmall, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              {greetingBase}
            </Text>
            <Text
              style={[styles.greetingLarge, { color: colors.text, fontFamily: 'Inter_700Bold' }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {firstName || ''}
            </Text>
            <Text style={[styles.greetingTagline, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {t.home.tagline}
            </Text>
          </View>

          <View style={[styles.headerStats, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(26,35,64,0.05)' }]}>
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                {projects.length}
              </Text>
              <Text style={[styles.headerStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {t.home.statProjects}
              </Text>
            </View>
            <View style={[styles.headerStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,35,64,0.1)' }]} />
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                {stats.totalSkeins}
              </Text>
              <Text style={[styles.headerStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {t.home.statSkeins}
              </Text>
            </View>
            <View style={[styles.headerStatDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(26,35,64,0.1)' }]} />
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                {needles.reduce((sum, n) => sum + (n.quantity || 1), 0)}
              </Text>
              <Text style={[styles.headerStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {t.home.statNeedles}
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {t.home.sectionProjects}
            </Text>
          </View>

          {featuredProjects.length > 0 ? (
            <>
              <View style={styles.projectsList}>
                {featuredProjects.map(p => <ProjectRow key={p.id} project={p} />)}
              </View>
              <Pressable
                style={({ pressed }) => [styles.seeAllBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
                onPress={() => router.navigate('/(tabs)/prosjekter')}
              >
                <Text style={[styles.seeAllText, { color: colors.primaryBtn, fontFamily: 'Inter_600SemiBold' }]}>
                  {t.home.seeAllProjects}
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primaryBtn} />
              </Pressable>
            </>
          ) : (
            <View style={[styles.emptyProjects, { backgroundColor: colors.surface }]}>
              <Ionicons name="layers-outline" size={28} color={colors.textTertiary} />
              <Text style={[styles.emptyProjectsText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {t.home.noProjects}
              </Text>
            </View>
          )}

          <View style={{ marginTop: 24 }} />

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {t.home.sectionYarnStorage}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <AnimatedStatCard label={t.home.statSkeins} target={stats.totalSkeins} />
            <AnimatedStatCard label={t.home.statGrams} target={stats.totalGrams} />
            <AnimatedStatCard label={t.home.statMeters} target={stats.totalMeters} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.seeAllBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1, marginTop: 10 }]}
            onPress={() => router.push('/(tabs)/lager')}
          >
            <Text style={[styles.seeAllText, { color: colors.primaryBtn, fontFamily: 'Inter_600SemiBold' }]}>
              {t.home.seeYarnStorage}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={colors.primaryBtn} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 12,
  },
  basicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  basicBadgeText: {
    fontSize: 12,
    letterSpacing: 0.3,
  },
  headerTopRow: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 4,
  },
  gearBtn: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  greetingSmall: {
    fontSize: 14,
    lineHeight: 18,
    marginBottom: 2,
  },
  greetingLarge: {
    fontSize: 28,
    lineHeight: 34,
  },
  greetingTagline: {
    fontSize: 14,
    marginTop: 4,
  },
  headerStats: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatNumber: { fontSize: 26 },
  headerStatLabel: { fontSize: 12, marginTop: 2 },
  headerStatDivider: { width: 1, marginHorizontal: 8 },
  content: { padding: 20, paddingTop: 4, gap: 0 },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 0,
  },
  sectionTitle: { fontSize: 22, textAlign: 'center' },
  projectsList: { gap: 10 },
  projectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  projectRowThumb: { width: 44, height: 44, borderRadius: 22 },
  yarnDots: { flexDirection: 'row', alignItems: 'center' },
  yarnDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  projectRowText: { flex: 1 },
  projectRowName: { fontSize: 15, marginBottom: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12 },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    borderRadius: 14,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  seeAllText: { fontSize: 15 },
  addProjectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    marginTop: 8,
  },
  addProjectText: { fontSize: 15 },
  emptyProjects: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyProjectsText: { fontSize: 15 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 10, marginTop: 4, textAlign: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    gap: 12,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
    marginBottom: 8,
  },
  modalTitle: { fontSize: 24, textAlign: 'center' },
  modalSubtitle: { fontSize: 15, marginBottom: 4, textAlign: 'center' },
  premiumOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  premiumSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, backgroundColor: '#2C3E6B' },
  premiumTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumTitle: { fontSize: 18, color: '#fff' },
  premiumSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  premiumBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.15)' },
  premiumBadgeText: { color: '#fff', fontSize: 11, letterSpacing: 0.5 },
  premiumFeatures: { gap: 8 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  premiumFeatureText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  premiumBtn: { borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#fff', gap: 2 },
  premiumBtnText: { color: '#2C3E6B', fontSize: 15 },
  premiumBtnSub: { color: 'rgba(44,62,107,0.6)', fontSize: 12 },
  premiumDismiss: { textAlign: 'center', fontSize: 14, paddingVertical: 4, color: 'rgba(255,255,255,0.5)' },
  fieldLabel: { fontSize: 13, marginBottom: 4 },
  input: { borderRadius: 14, padding: 16, fontSize: 16 },
  primaryBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 8 },
  cancelBtnText: { fontSize: 15 },
  onboardingScreen: { flex: 1, paddingHorizontal: 32 },
  onboardingSlide: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  onboardingIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  onboardingTitle: { fontSize: 28, textAlign: 'center', lineHeight: 34 },
  onboardingBody: { fontSize: 16, textAlign: 'center', lineHeight: 24 },
  onboardingInput: {
    width: '100%',
    borderRadius: 16,
    padding: 16,
    fontSize: 18,
    marginTop: 8,
    textAlign: 'center',
  },
  onboardingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 20,
  },
  onboardingDot: {
    height: 6,
    width: 6,
    borderRadius: 3,
  },
  onboardingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 16,
    paddingVertical: 16,
  },
  onboardingBtnText: { color: '#fff', fontSize: 17 },
});
