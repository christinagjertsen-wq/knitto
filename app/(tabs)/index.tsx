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
  Animated,
  Image,
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
  const colorScheme = useColorScheme();
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

function ProjectRow({ project }: { project: Project }) {
  const colors = Colors.light;
  const { yarnStock } = useKnitting();

  const yarnColors = useMemo(() => {
    return project.yarnAllocations.slice(0, 3).map(alloc => {
      const yarn = yarnStock.find(y => y.id === alloc.yarnStockId);
      return yarn?.colorHex ?? '#ccc';
    });
  }, [project.yarnAllocations, yarnStock]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.projectRow,
        { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => router.push({ pathname: '/prosjekt/[id]', params: { id: project.id } })}
    >
      {project.coverImage ? (
        <Image
          source={{ uri: project.coverImage }}
          style={styles.projectRowThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={styles.yarnDots}>
          {yarnColors.map((hex, i) => (
            <View
              key={i}
              style={[styles.yarnDot, { backgroundColor: hex, marginLeft: i > 0 ? -6 : 0, zIndex: 3 - i }]}
            />
          ))}
          {yarnColors.length === 0 && (
            <View style={[styles.yarnDot, { backgroundColor: colors.border }]} />
          )}
        </View>
      )}
      <View style={styles.projectRowText}>
        <Text style={[styles.projectRowName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
          {project.name}
        </Text>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[project.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[project.status], fontFamily: 'Inter_500Medium' }]}>
            {STATUS_LABELS[project.status]}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function NameOnboardingModal({ visible, onDone }: { visible: boolean; onDone: (name: string) => void }) {
  const colors = Colors.light;
  const [name, setName] = useState('');
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.onboardingOverlay}>
        <View style={[styles.onboardingSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.onboardingTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Hva heter du?
          </Text>
          <Text style={[styles.onboardingSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Vi vil gjerne hilse deg med navn
          </Text>
          <TextInput
            style={[styles.onboardingInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
            placeholder="Fornavn"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={() => onDone(name.trim())}
          />
          <Pressable
            style={({ pressed }) => [styles.onboardingBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => onDone(name.trim())}
          >
            <Text style={[styles.onboardingBtnText, { fontFamily: 'Inter_600SemiBold' }]}>La oss starte</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function SettingsModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = Colors.light;
  const { firstName, setFirstName } = useUser();
  const [name, setName] = useState(firstName);
  const insets = useSafeAreaInsets();

  useEffect(() => { setName(firstName); }, [firstName, visible]);

  const save = () => {
    setFirstName(name.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.onboardingOverlay}>
        <View style={[styles.onboardingSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.onboardingTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Innstillinger</Text>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Ditt fornavn</Text>
          <TextInput
            style={[styles.onboardingInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
            placeholder="Fornavn"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <Pressable
            style={({ pressed }) => [styles.onboardingBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
            onPress={save}
          >
            <Text style={[styles.onboardingBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
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
  const { brands, yarnStock, needles, projects, qualities, getTotalStats } = useKnitting();
  const { firstName, setFirstName, isLoading } = useUser();
  const [showSettings, setShowSettings] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!isLoading && firstName === '') {
      setShowOnboarding(true);
    }
  }, [isLoading, firstName]);

  const stats = getTotalStats();
  const activeProjects = projects.filter(p => p.status === 'aktiv');
  const plannedProjects = projects.filter(p => p.status === 'planlagt');
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const greeting = getGreeting(firstName);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NameOnboardingModal
        visible={showOnboarding}
        onDone={(name) => {
          if (name) setFirstName(name);
          setShowOnboarding(false);
        }}
      />
      <SettingsModal visible={showSettings} onClose={() => setShowSettings(false)} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 0 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={[Colors.palette.nordicBlue, Colors.palette.nordicIce]}
          style={[styles.header, { paddingTop: topInset + 16 }]}
        >
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greeting, { color: Colors.palette.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {greeting}
              </Text>
              <Text style={[styles.headerTitle, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
                Garnlager
              </Text>
            </View>
            <Pressable
              style={[styles.settingsBtn, { backgroundColor: 'rgba(26,35,64,0.08)' }]}
              onPress={() => setShowSettings(true)}
              hitSlop={8}
            >
              <Ionicons name="settings-outline" size={20} color={Colors.palette.navy} />
            </Pressable>
          </View>
          <View style={[styles.headerStats, { backgroundColor: 'rgba(26,35,64,0.05)' }]}>
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>{brands.length}</Text>
              <Text style={[styles.headerStatLabel, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>merker</Text>
            </View>
            <View style={[styles.headerStatDivider, { backgroundColor: 'rgba(26,35,64,0.1)' }]} />
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>{yarnStock.length}</Text>
              <Text style={[styles.headerStatLabel, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>farger</Text>
            </View>
            <View style={[styles.headerStatDivider, { backgroundColor: 'rgba(26,35,64,0.1)' }]} />
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>{projects.length}</Text>
              <Text style={[styles.headerStatLabel, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>prosjekter</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Garnlager
          </Text>
          <View style={styles.statsRow}>
            <AnimatedStatCard label="nøster" target={stats.totalSkeins} />
            <AnimatedStatCard label="gram" target={stats.totalGrams} />
            <AnimatedStatCard label="meter" target={stats.totalMeters} />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.lagerButton,
              { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => router.push('/(tabs)/lager')}
          >
            <Ionicons name="archive-outline" size={18} color="#fff" />
            <Text style={[styles.lagerButtonText, { fontFamily: 'Inter_600SemiBold' }]}>Se garnlager</Text>
            <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.6)" />
          </Pressable>

          {activeProjects.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold', marginTop: 28 }]}>
                Aktive prosjekter
              </Text>
              <View style={styles.projectsList}>
                {activeProjects.map(p => <ProjectRow key={p.id} project={p} />)}
              </View>
            </>
          )}

          {plannedProjects.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold', marginTop: 28 }]}>
                Planlagte prosjekter
              </Text>
              <View style={styles.projectsList}>
                {plannedProjects.slice(0, 2).map(p => <ProjectRow key={p.id} project={p} />)}
              </View>
            </>
          )}

          {projects.length === 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.emptyProjects,
                { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
              ]}
              onPress={() => router.push('/(tabs)/prosjekter')}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.accent} />
              <Text style={[styles.emptyProjectsText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Start ditt første prosjekt
              </Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  greeting: {
    fontSize: 15,
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 30,
  },
  headerStats: {
    flexDirection: 'row',
    borderRadius: 16,
    padding: 16,
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatNumber: { fontSize: 24 },
  headerStatLabel: { fontSize: 12, marginTop: 2 },
  headerStatDivider: { width: 1, marginHorizontal: 8 },
  content: { padding: 20 },
  sectionTitle: { fontSize: 20, marginBottom: 12 },
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
  lagerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 14,
    marginTop: 12,
  },
  lagerButtonText: { flex: 1, color: '#fff', fontSize: 15 },
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
  projectRowThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
  },
  projectRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  yarnDots: { flexDirection: 'row', alignItems: 'center' },
  yarnDot: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  projectRowText: { flex: 1 },
  projectRowName: { fontSize: 15, marginBottom: 4 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 12 },
  emptyProjects: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 20,
    borderRadius: 16,
    marginTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyProjectsText: { fontSize: 15 },
  onboardingOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  onboardingSheet: {
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
  onboardingTitle: {
    fontSize: 24,
    textAlign: 'center',
  },
  onboardingSubtitle: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 4,
  },
  onboardingInput: {
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
  },
  onboardingBtn: {
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  onboardingBtnText: {
    color: '#fff',
    fontSize: 16,
  },
  fieldLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  cancelBtn: {
    alignItems: 'center',
    padding: 8,
  },
  cancelBtnText: {
    fontSize: 15,
  },
});
