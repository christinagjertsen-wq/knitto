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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Hva heter du?</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            Vi vil gjerne hilse deg med navn
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
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
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
            onPress={() => onDone(name.trim())}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: 'Inter_600SemiBold' }]}>La oss starte</Text>
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Innstillinger</Text>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Ditt fornavn</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
            placeholder="Fornavn"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="done"
            onSubmitEditing={save}
          />
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
            onPress={save}
          >
            <Text style={[styles.primaryBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
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

  useEffect(() => {
    if (!isLoading && firstName === '') setShowOnboarding(true);
  }, [isLoading, firstName]);

  const stats = getTotalStats();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const featuredProjects = useMemo(() => {
    const active = projects.filter(p => p.status === 'aktiv');
    if (active.length > 0) return active.slice(0, 3);
    return projects.filter(p => p.status === 'planlagt').slice(0, 3);
  }, [projects]);

  const greeting = getGreeting(firstName);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <NameOnboardingModal
        visible={showOnboarding}
        onDone={(name) => { if (name) setFirstName(name); setShowOnboarding(false); }}
      />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 16 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={[Colors.palette.nordicBlue, Colors.palette.nordicIce]}
          style={[styles.header, { paddingTop: topInset + 16 }]}
        >
          <View style={styles.headerTopRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.greetingLarge, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>
                {greeting}
              </Text>
              <Text style={[styles.greetingTagline, { color: Colors.palette.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                På tide å strikke litt?
              </Text>
            </View>
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
                onPress={() => router.push('/(tabs)/prosjekter')}
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
              onPress={() => router.push('/(tabs)/prosjekter')}
            >
              <Ionicons name="add-circle-outline" size={28} color={colors.primaryBtn} />
              <Text style={[styles.emptyProjectsText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Start ditt første prosjekt
              </Text>
            </Pressable>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

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
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 24,
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
  content: { padding: 20, gap: 0 },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 4,
  },
  sectionTitle: { fontSize: 22 },
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
  projectRowThumb: { width: 44, height: 44, borderRadius: 10 },
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
  divider: {
    height: 1,
    marginVertical: 24,
    marginHorizontal: 4,
  },
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
  modalTitle: { fontSize: 24 },
  modalSubtitle: { fontSize: 15, marginBottom: 4 },
  fieldLabel: { fontSize: 13, marginBottom: 4 },
  input: { borderRadius: 14, padding: 16, fontSize: 16 },
  primaryBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  primaryBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 8 },
  cancelBtnText: { fontSize: 15 },
});
