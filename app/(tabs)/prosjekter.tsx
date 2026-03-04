import React, { useState, useMemo, useCallback } from 'react';
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
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, Project, ProjectStatus } from '@/context/KnittingContext';

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

function ProjectCard({ project, onDelete }: { project: Project; onDelete: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { yarnStock, qualities, needles } = useKnitting();

  const yarnColors = useMemo(() =>
    project.yarnAllocations.slice(0, 5).map(alloc => {
      const yarn = yarnStock.find(y => y.id === alloc.yarnStockId);
      return { hex: yarn?.colorHex ?? '#ccc', name: yarn?.colorName ?? '' };
    }), [project.yarnAllocations, yarnStock]);

  const projectNeedles = useMemo(() =>
    project.needleIds.map(id => needles.find(n => n.id === id)).filter(Boolean),
    [project.needleIds, needles]);

  return (
    <Pressable
      style={({ pressed }) => [styles.projectCard, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
      onPress={() => router.push({ pathname: '/prosjekt/[id]', params: { id: project.id } })}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(project.name, 'Hva vil du gjøre?', [
          { text: 'Avbryt', style: 'cancel' },
          { text: 'Slett', style: 'destructive', onPress: onDelete },
        ]);
      }}
    >
      <View style={styles.projectCardTop}>
        <View style={styles.yarnSwatches}>
          {yarnColors.length > 0 ? (
            yarnColors.map((c, i) => (
              <View
                key={i}
                style={[
                  styles.swatch,
                  { backgroundColor: c.hex, marginLeft: i > 0 ? -8 : 0, zIndex: 5 - i },
                ]}
              />
            ))
          ) : (
            <View style={[styles.swatch, { backgroundColor: colors.border }]} />
          )}
        </View>
        <View style={[styles.statusBadge, { backgroundColor: STATUS_BG[project.status] }]}>
          <Text style={[styles.statusBadgeText, { color: STATUS_COLORS[project.status], fontFamily: 'Inter_600SemiBold' }]}>
            {STATUS_LABELS[project.status]}
          </Text>
        </View>
      </View>
      <Text style={[styles.projectName, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
        {project.name}
      </Text>
      {project.notes ? (
        <Text style={[styles.projectNotes, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]} numberOfLines={2}>
          {project.notes}
        </Text>
      ) : null}
      <View style={styles.projectFooter}>
        <View style={styles.footerItem}>
          <Ionicons name="color-palette-outline" size={13} color={colors.textTertiary} />
          <Text style={[styles.footerText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            {project.yarnAllocations.length} {project.yarnAllocations.length === 1 ? 'garnfarge' : 'garnfarger'}
          </Text>
        </View>
        {projectNeedles.length > 0 && (
          <View style={styles.footerItem}>
            <Ionicons name="construct-outline" size={13} color={colors.textTertiary} />
            <Text style={[styles.footerText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {projectNeedles.map(n => `${n!.size}mm`).join(', ')}
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

function AddProjectModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const [name, setName] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('aktiv');
  const { addProject } = useKnitting();

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    addProject({ name: name.trim(), status, notes: '', yarnAllocations: [], needleIds: [], startDate: new Date().toLocaleDateString('nb-NO') });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(''); setStatus('aktiv');
    onClose();
  }, [name, status, addProject, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Nytt prosjekt
          </Text>
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
                style={[
                  styles.optionPill,
                  {
                    backgroundColor: status === s ? STATUS_COLORS[s] : colors.background,
                    borderColor: status === s ? STATUS_COLORS[s] : colors.border,
                  },
                ]}
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
            style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleAdd}
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | 'alle'>('alle');
  const [showAdd, setShowAdd] = useState(false);
  const { projects, deleteProject } = useKnitting();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const filtered = useMemo(() =>
    activeFilter === 'alle' ? projects : projects.filter(p => p.status === activeFilter),
    [projects, activeFilter]
  );

  const counts = useMemo(() => ({
    alle: projects.length,
    planlagt: projects.filter(p => p.status === 'planlagt').length,
    aktiv: projects.filter(p => p.status === 'aktiv').length,
    ferdig: projects.filter(p => p.status === 'ferdig').length,
  }), [projects]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.screenTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Prosjekter</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primaryBtn }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAdd(true);
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
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
              style={[
                styles.filterChip,
                {
                  backgroundColor: isActive ? color : colors.surface,
                  borderColor: isActive ? color : colors.border,
                },
              ]}
              onPress={() => {
                setActiveFilter(f);
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.filterChipText, {
                color: isActive ? '#fff' : colors.textSecondary,
                fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
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
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 34 : 20 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        {filtered.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="list-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {activeFilter === 'alle' ? 'Ingen prosjekter ennå' : `Ingen ${STATUS_LABELS[activeFilter as ProjectStatus].toLowerCase()} prosjekter`}
            </Text>
            {activeFilter === 'alle' && (
              <Pressable
                style={[styles.emptyBtn, { backgroundColor: colors.primaryBtn }]}
                onPress={() => setShowAdd(true)}
              >
                <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Opprett prosjekt</Text>
              </Pressable>
            )}
          </View>
        ) : (
          filtered.map(p => (
            <ProjectCard
              key={p.id}
              project={p}
              onDelete={() => {
                deleteProject(p.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            />
          ))
        )}
      </ScrollView>

      <AddProjectModal visible={showAdd} onClose={() => setShowAdd(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  screenTitle: { fontSize: 32 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  filterCount: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterCountText: { fontSize: 11 },
  listContent: { padding: 20, paddingTop: 12, gap: 12 },
  projectCard: {
    borderRadius: 20,
    padding: 18,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 3,
  },
  projectCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  yarnSwatches: { flexDirection: 'row' },
  swatch: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: '#fff' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusBadgeText: { fontSize: 12 },
  projectName: { fontSize: 18 },
  projectNotes: { fontSize: 13, lineHeight: 18 },
  projectFooter: { flexDirection: 'row', gap: 16, marginTop: 4 },
  footerItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText: { fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 10,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4 },
  fieldLabel: { fontSize: 13, marginBottom: 2, marginTop: 8 },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  optionPillText: { fontSize: 14 },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 15 },
});
