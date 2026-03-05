import React, { useState, useMemo, useCallback, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
  Alert,
  Animated,
  PanResponder,
  Image,
  Dimensions,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, Project, ProjectStatus } from '@/context/KnittingContext';

function ProgressRing({ percent, size, strokeWidth, color }: { percent: number; size: number; strokeWidth: number; color: string }) {
  const colors = Colors.light;
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(percent, 0), 100) / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={colors.border}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 9, fontFamily: 'Inter_600SemiBold', color: color }}>{Math.round(percent)}%</Text>
    </View>
  );
}

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

const STATUS_BG: Record<ProjectStatus, string> = {
  planlagt: 'rgba(154,173,200,0.15)',
  aktiv: 'rgba(106,142,200,0.15)',
  ferdig: 'rgba(74,104,152,0.15)',
};

const STATUS_ORDER: Record<ProjectStatus, number> = { aktiv: 0, planlagt: 1, ferdig: 2 };

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 80;


function SwipeableProjectCard({
  project,
  onDelete,
  onStatusToggle,
}: {
  project: Project;
  onDelete: () => void;
  onStatusToggle: () => void;
}) {
  const colors = Colors.light;
  const { yarnStock, needles } = useKnitting();
  const translateX = useRef(new Animated.Value(0)).current;
  const swiping = useRef(false);

  const yarnColors = useMemo(() =>
    project.yarnAllocations.slice(0, 5).map(alloc => {
      const yarn = yarnStock.find(y => y.id === alloc.yarnStockId);
      return { hex: yarn?.colorHex ?? '#ccc', name: yarn?.colorName ?? '' };
    }), [project.yarnAllocations, yarnStock]);

  const projectNeedles = useMemo(() =>
    project.needleIds.map(id => needles.find(n => n.id === id)).filter(Boolean),
    [project.needleIds, needles]);


  const nextStatus: ProjectStatus | null =
    project.status === 'planlagt' ? 'aktiv' :
    project.status === 'aktiv' ? 'ferdig' : null;

  const snapBack = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        Math.abs(g.dx) > 10 && Math.abs(g.dy) < 15,
      onPanResponderGrant: () => { swiping.current = true; },
      onPanResponderMove: (_, g) => {
        const limit = nextStatus ? 100 : 0;
        translateX.setValue(Math.max(Math.min(g.dx, limit), -100));
      },
      onPanResponderRelease: (_, g) => {
        swiping.current = false;
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            onDelete();
          });
        } else if (g.dx > SWIPE_THRESHOLD && nextStatus) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          snapBack();
          onStatusToggle();
        } else {
          snapBack();
        }
      },
      onPanResponderTerminate: () => {
        swiping.current = false;
        snapBack();
      },
    })
  ).current;

  return (
    <View style={styles.swipeContainer}>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <Pressable
          style={[styles.projectCard, { backgroundColor: colors.surface }]}
          onPress={() => {
            if (swiping.current) return;
            router.push({ pathname: '/prosjekt/[id]', params: { id: project.id } });
          }}
          delayLongPress={400}
          onLongPress={() => {
            snapBack();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert(project.name, 'Hva vil du gjøre?', [
              { text: 'Avbryt', style: 'cancel' },
              { text: 'Slett', style: 'destructive', onPress: onDelete },
            ]);
          }}
        >
          {project.coverImage && (
            <Image
              source={{ uri: project.coverImage }}
              style={styles.cardCoverImage}
              resizeMode="cover"
            />
          )}
          <View style={styles.cardBody}>
            <View style={[styles.colorCircle, { backgroundColor: yarnColors[0]?.hex ?? colors.border }]} />
            <View style={styles.cardLeft}>
              <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
                {project.name}
              </Text>
              <View style={styles.cardMeta}>
                <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[project.status] }]}>
                  <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[project.status], fontFamily: 'Inter_600SemiBold' }]}>
                    {STATUS_LABELS[project.status]}
                  </Text>
                </View>
                <Text style={[styles.footerText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {project.yarnAllocations.length} {project.yarnAllocations.length === 1 ? 'garnfarge' : 'garnfarger'}
                  {projectNeedles.length > 0 ? ` · ${projectNeedles.map(n => `${n!.size}mm`).join(', ')}` : ''}
                </Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <ProgressRing
                percent={project.status === 'ferdig' ? 100 : (project.progressPercent ?? 0)}
                size={42}
                strokeWidth={3.5}
                color={STATUS_COLORS[project.status]}
              />
            </View>
          </View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

function AddProjectModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = Colors.light;
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('aktiv');
  const { addProject } = useKnitting();

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), status, notes: '', progressPercent: 0, yarnAllocations: [], needleIds: [], startDate: new Date().toLocaleDateString('nb-NO') });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(''); setStatus('aktiv');
    onClose();
  }, [name, status, addProject, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Nytt prosjekt</Text>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Prosjektnavn</Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
            placeholder="Prosjektnavn"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Status</Text>
          <View style={styles.pillRow}>
            {(['planlagt', 'aktiv'] as ProjectStatus[]).map(s => (
              <Pressable
                key={s}
                onPress={() => setStatus(s)}
                style={[styles.optionPill, {
                  backgroundColor: status === s ? STATUS_COLORS[s] : colors.background,
                  borderColor: status === s ? STATUS_COLORS[s] : colors.border,
                }]}
              >
                <Text style={[styles.optionPillText, {
                  color: status === s ? '#fff' : colors.textSecondary,
                  fontFamily: status === s ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {STATUS_LABELS[s]}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.modalBtn, { backgroundColor: name.trim() ? colors.primaryBtn : colors.border, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleAdd}
            disabled={!name.trim()}
          >
            <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Opprett</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProsjekterScreen() {
  const colors = Colors.light;
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | 'alle'>('alle');
  const [showAdd, setShowAdd] = useState(false);
  const [search, setSearch] = useState('');
  const { projects, deleteProject, updateProject } = useKnitting();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = useMemo(() => {
    let list = activeFilter === 'alle' ? projects : projects.filter(p => p.status === activeFilter);
    if (search.trim()) {
      list = list.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    }
    return [...list].sort((a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]);
  }, [projects, activeFilter, search]);

  const counts = useMemo(() => ({
    alle: projects.length,
    planlagt: projects.filter(p => p.status === 'planlagt').length,
    aktiv: projects.filter(p => p.status === 'aktiv').length,
    ferdig: projects.filter(p => p.status === 'ferdig').length,
  }), [projects]);

  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={[Colors.palette.nordicBlue, Colors.palette.nordicIce]}
        style={[styles.topBar, { paddingTop: topInset + 24 }]}
      >
        <Text style={[styles.screenTitle, { color: Colors.palette.navy, fontFamily: 'Inter_700Bold' }]}>Prosjekter</Text>
      </LinearGradient>

      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
          placeholder="Søk prosjekter..."
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {(['alle', 'planlagt', 'aktiv', 'ferdig'] as (ProjectStatus | 'alle')[]).map(f => {
          const label = f === 'alle' ? 'Alle' : STATUS_LABELS[f as ProjectStatus];
          const color = f === 'alle' ? colors.primaryBtn : STATUS_COLORS[f as ProjectStatus];
          const isActive = activeFilter === f;
          return (
            <Pressable
              key={f}
              style={[styles.filterChip, { backgroundColor: isActive ? color : colors.surface, borderColor: isActive ? color : colors.border }]}
              onPress={() => { setActiveFilter(f); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.filterChipText, { color: isActive ? '#fff' : colors.textSecondary, fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                {label}
              </Text>
              <View style={[styles.filterCount, { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : colors.background }]}>
                <Text style={[styles.filterCountText, { color: isActive ? '#fff' : colors.textTertiary, fontFamily: 'Inter_500Medium' }]}>
                  {counts[f]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: bottomInset + 130 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {search ? 'Ingen treff' : activeFilter === 'alle' ? 'Ingen prosjekter ennå' : `Ingen ${STATUS_LABELS[activeFilter as ProjectStatus].toLowerCase()} prosjekter`}
            </Text>
            {activeFilter === 'alle' && !search && (
              <Pressable style={[styles.emptyBtn, { backgroundColor: colors.primaryBtn }]} onPress={() => setShowAdd(true)}>
                <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Opprett prosjekt</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filtered.map(p => (
            <SwipeableProjectCard
              key={p.id}
              project={p}
              onDelete={() => {
                Alert.alert(p.name, 'Slett dette prosjektet?', [
                  { text: 'Avbryt', style: 'cancel' },
                  { text: 'Slett', style: 'destructive', onPress: () => { deleteProject(p.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
                ]);
              }}
              onStatusToggle={() => {
                const next: ProjectStatus = p.status === 'planlagt' ? 'aktiv' : p.status === 'aktiv' ? 'ferdig' : 'planlagt';
                updateProject(p.id, { status: next });
                Haptics.selectionAsync();
              }}
            />
          ))
        )}
      </ScrollView>

      <AddProjectModal visible={showAdd} onClose={() => setShowAdd(false)} />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primaryBtn, bottom: bottomInset + 66 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBarRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 32 },
  addBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 8,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15 },
  filterScroll: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 20, gap: 8, paddingVertical: 6 },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  filterChipText: { fontSize: 14 },
  filterCount: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  filterCountText: { fontSize: 11 },
  listContent: { padding: 20, paddingTop: 12, gap: 12 },
  swipeContainer: { borderRadius: 20, overflow: 'hidden' },
  projectCard: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  cardCoverImage: {
    width: '100%',
    height: 140,
  },
  cardBody: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 14,
  },
  colorCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    flexShrink: 0,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  cardLeft: {
    flex: 1,
    gap: 6,
  },
  cardRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  projectCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  yarnSwatches: { flexDirection: 'row' },
  swatch: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: '#fff' },
  statusBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  statusBadgeText: { fontSize: 11 },
  projectName: { fontSize: 17 },
  projectNotes: { fontSize: 13, lineHeight: 18 },
  projectFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 16 },
  footerLeft: { flex: 1, gap: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4 },
  fieldLabel: { fontSize: 13, marginBottom: 2, marginTop: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  optionPillText: { fontSize: 14 },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 15 },
});
