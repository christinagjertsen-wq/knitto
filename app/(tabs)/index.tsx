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
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, Project, ProjectStatus } from '@/context/KnittingContext';
import { useUser, getGreeting } from '@/context/UserContext';

const ADD_STATUS_LABELS: Record<ProjectStatus, string> = {
  planlagt: 'Planlagt',
  aktiv: 'Aktiv',
  ferdig: 'Ferdig',
};

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planlagt: 'Planlagt',
  aktiv: 'Aktiv',
  ferdig: 'Ferdig',
};

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
  const colors = Colors.light;
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
  const colors = Colors.light;
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
            {STATUS_LABELS[project.status]}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function PremiumModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();

  const features = [
    { icon: 'infinite-outline' as const, text: 'Ubegrenset antall prosjekter' },
    { icon: 'cube-outline' as const, text: 'Ubegrenset garnlager' },
    { icon: 'construct-outline' as const, text: 'Ubegrenset pinnelager' },
    { icon: 'journal-outline' as const, text: 'Prosjektlogg og fremdrift' },
    { icon: 'stats-chart-outline' as const, text: 'Avansert statistikk' },
    { icon: 'cloud-outline' as const, text: 'Sikkerhetskopiering' },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.premiumOverlay} onPress={onClose}>
        <Pressable style={[styles.premiumSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 28) }]} onPress={() => {}}>
          <View style={styles.modalHandle} />
          <View style={[styles.premiumIconWrap, { backgroundColor: Colors.palette.nordicBlue + '18' }]}>
            <Ionicons name="star" size={28} color={Colors.palette.navy} />
          </View>
          <Text style={[styles.premiumTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Knitty Premium</Text>
          <Text style={[styles.premiumSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Få tilgang til alle funksjoner og strikk uten grenser
          </Text>
          <View style={styles.premiumFeatures}>
            {features.map((f, i) => (
              <View key={i} style={styles.premiumFeatureRow}>
                <Ionicons name={f.icon} size={18} color={Colors.palette.navy} />
                <Text style={[styles.premiumFeatureText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{f.text}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.premiumBtn, { backgroundColor: Colors.palette.navy, opacity: pressed ? 0.85 : 1 }]}
            onPress={onClose}
          >
            <Text style={[styles.premiumBtnPrice, { fontFamily: 'Inter_700Bold' }]}>69 kr / mnd</Text>
            <Text style={[styles.premiumBtnSub, { fontFamily: 'Inter_400Regular' }]}>Start med 7 dager gratis</Text>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.premiumDismiss, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>Ikke nå</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const SCREEN_W = Dimensions.get('window').width;

const ONBOARDING_SLIDES = [
  {
    icon: 'sparkles' as const,
    iconBg: '#E8EFF8',
    title: 'Velkommen til Knitty',
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
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const slideAnim = useRef(new Animated.Value(0)).current;
  const total = ONBOARDING_SLIDES.length + 1;
  const isLast = step === ONBOARDING_SLIDES.length;

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

  const currentSlide = ONBOARDING_SLIDES[step];

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
                  <Ionicons name={currentSlide.icon} size={44} color={Colors.palette.navy} />
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
                  Vi hilser deg med navn hver gang du åpner Knitty
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
              {isLast ? 'La oss starte' : 'Neste'}
            </Text>
            {!isLast && <Ionicons name="arrow-forward" size={18} color="#fff" />}
          </Pressable>
        </KeyboardAvoidingView>
      </LinearGradient>
    </Modal>
  );
}

function AddProjectModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = Colors.light;
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Nytt prosjekt</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
            placeholder="Prosjektnavn"
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
                  {ADD_STATUS_LABELS[s]}
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
    </Modal>
  );
}

export default function HomeScreen() {
  const colors = Colors.light;
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

  const greeting = getGreeting(firstName);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NameOnboardingModal
        visible={showOnboarding}
        onDone={(name) => { if (name) setFirstName(name); setShowOnboarding(false); }}
      />
      <AddProjectModal visible={showAddProject} onClose={() => setShowAddProject(false)} />
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />

      <LinearGradient
        colors={[Colors.palette.nordicBlue, Colors.palette.nordicIce]}
        style={[styles.header, { paddingTop: topInset + 16 }]}
      >
        <View style={styles.headerBadgeRow}>
          <Pressable
            style={[styles.basicBadge, { backgroundColor: 'rgba(26,35,64,0.08)' }]}
            onPress={() => setShowPremium(true)}
            hitSlop={8}
          >
            <Ionicons name="leaf-outline" size={12} color={Colors.palette.navy} />
            <Text style={[styles.basicBadgeText, { color: Colors.palette.navy, fontFamily: 'Inter_600SemiBold' }]}>Basic</Text>
          </Pressable>
        </View>

        <View style={styles.headerTopRow}>
          <Text style={[styles.greetingLarge, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
            {greeting}
          </Text>
          <Text style={[styles.greetingTagline, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            På tide å strikke litt? Eller legge til garn?
          </Text>
        </View>

        <View style={[styles.headerStats, { backgroundColor: 'rgba(26,35,64,0.05)' }]}>
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatNumber, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
              {projects.length}
            </Text>
            <Text style={[styles.headerStatLabel, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              prosjekter
            </Text>
          </View>
          <View style={[styles.headerStatDivider, { backgroundColor: 'rgba(26,35,64,0.1)' }]} />
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatNumber, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
              {stats.totalSkeins}
            </Text>
            <Text style={[styles.headerStatLabel, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              nøster
            </Text>
          </View>
          <View style={[styles.headerStatDivider, { backgroundColor: 'rgba(26,35,64,0.1)' }]} />
          <View style={styles.headerStat}>
            <Text style={[styles.headerStatNumber, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
              {needles.length}
            </Text>
            <Text style={[styles.headerStatLabel, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              pinner
            </Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Prosjekter
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
                  Se alle prosjekter
                </Text>
                <Ionicons name="chevron-forward" size={16} color={colors.primaryBtn} />
              </Pressable>
            </>
          ) : (
            <Pressable
              style={({ pressed }) => [styles.emptyProjects, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => setShowAddProject(true)}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.primaryBtn} />
              <Text style={[styles.emptyProjectsText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Start ditt første prosjekt
              </Text>
            </Pressable>
          )}

          <View style={{ marginTop: 24 }} />

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Garnlager
            </Text>
          </View>

          <View style={styles.statsRow}>
            <AnimatedStatCard label="nøster" target={stats.totalSkeins} />
            <AnimatedStatCard label="gram" target={stats.totalGrams} />
            <AnimatedStatCard label="meter" target={stats.totalMeters} />
          </View>

          <Pressable
            style={({ pressed }) => [styles.seeAllBtn, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1, marginTop: 10 }]}
            onPress={() => router.push('/(tabs)/lager')}
          >
            <Text style={[styles.seeAllText, { color: colors.primaryBtn, fontFamily: 'Inter_600SemiBold' }]}>
              Se garnlager
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
    justifyContent: 'flex-start',
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
    alignItems: 'flex-start',
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
  greetingLarge: {
    fontSize: 32,
    lineHeight: 38,
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
  premiumOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  premiumSheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 12 },
  premiumIconWrap: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' },
  premiumTitle: { fontSize: 24, textAlign: 'center' },
  premiumSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  premiumFeatures: { gap: 10, marginVertical: 4 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  premiumFeatureText: { fontSize: 15 },
  premiumBtn: { borderRadius: 16, padding: 16, alignItems: 'center', gap: 2, marginTop: 4 },
  premiumBtnPrice: { color: '#fff', fontSize: 18 },
  premiumBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
  premiumDismiss: { textAlign: 'center', fontSize: 14, paddingVertical: 4 },
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
