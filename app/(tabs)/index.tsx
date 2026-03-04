import React, { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  useColorScheme,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';
import { useKnitting, Project, ProjectStatus } from '@/context/KnittingContext';

const STATUS_LABELS: Record<ProjectStatus, string> = {
  planlagt: 'Planlagt',
  aktiv: 'Aktiv',
  ferdig: 'Ferdig',
};

const STATUS_COLORS: Record<ProjectStatus, string> = {
  planlagt: '#8A9BB5',
  aktiv: '#5C9E8A',
  ferdig: '#C97B84',
};

function StatCard({ label, value, unit }: { label: string; value: number; unit: string }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.statCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
        {value.toLocaleString('nb-NO')}
      </Text>
      <Text style={[styles.statUnit, { color: colors.accent, fontFamily: 'Inter_600SemiBold' }]}>
        {unit}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
        {label}
      </Text>
    </View>
  );
}

function ProjectRow({ project }: { project: Project }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { yarnStock, qualities } = useKnitting();

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
      <View style={styles.projectRowLeft}>
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
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { brands, yarnStock, needles, projects, qualities, getTotalStats } = useKnitting();

  const stats = getTotalStats();
  const activeProjects = projects.filter(p => p.status === 'aktiv');
  const plannedProjects = projects.filter(p => p.status === 'planlagt');

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: Platform.OS === 'web' ? 34 : 0 }}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <LinearGradient
          colors={isDark ? ['#1A2340', '#0D1220'] : ['#1A2340', '#243058']}
          style={[styles.header, { paddingTop: topInset + 20 }]}
        >
          <Text style={[styles.greeting, { fontFamily: 'Inter_400Regular' }]}>God dag</Text>
          <Text style={[styles.headerTitle, { fontFamily: 'Inter_700Bold' }]}>Ditt strikkelager</Text>
          <View style={styles.headerStats}>
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { fontFamily: 'Inter_700Bold' }]}>{brands.length}</Text>
              <Text style={[styles.headerStatLabel, { fontFamily: 'Inter_400Regular' }]}>merker</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { fontFamily: 'Inter_700Bold' }]}>{yarnStock.length}</Text>
              <Text style={[styles.headerStatLabel, { fontFamily: 'Inter_400Regular' }]}>farger</Text>
            </View>
            <View style={styles.headerStatDivider} />
            <View style={styles.headerStat}>
              <Text style={[styles.headerStatNumber, { fontFamily: 'Inter_700Bold' }]}>{projects.length}</Text>
              <Text style={[styles.headerStatLabel, { fontFamily: 'Inter_400Regular' }]}>prosjekter</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.content}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Garnlager
          </Text>
          <View style={styles.statsRow}>
            <StatCard label="nøster på lager" value={stats.totalSkeins} unit="nøster" />
            <StatCard label="gram på lager" value={stats.totalGrams} unit="g" />
            <StatCard label="meter på lager" value={stats.totalMeters} unit="m" />
          </View>

          <Pressable
            style={({ pressed }) => [
              styles.lagerButton,
              { backgroundColor: isDark ? Colors.palette.navyLight : Colors.palette.navy, opacity: pressed ? 0.85 : 1 },
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
  greeting: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 4,
  },
  headerTitle: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 24,
  },
  headerStats: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    padding: 16,
  },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatNumber: { fontSize: 24, color: '#fff' },
  headerStatLabel: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  headerStatDivider: { width: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 8 },
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
  statUnit: { fontSize: 11, marginTop: 2 },
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
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
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
});
