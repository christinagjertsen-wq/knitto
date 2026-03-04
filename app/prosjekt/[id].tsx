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
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, ProjectStatus, YarnStock } from '@/context/KnittingContext';

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

function AddYarnModal({
  visible,
  onClose,
  onAdd,
  excludeIds,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (yarnStockId: string, skeins: number) => void;
  excludeIds: string[];
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { yarnStock, qualities, brands, getQualityById } = useKnitting();
  const [selected, setSelected] = useState<string | null>(null);
  const [skeins, setSkeins] = useState(1);

  const availableYarn = useMemo(() =>
    yarnStock.filter(y => !excludeIds.includes(y.id) && y.skeins > 0),
    [yarnStock, excludeIds]
  );

  const handleAdd = useCallback(() => {
    if (!selected) return;
    onAdd(selected, skeins);
    setSelected(null);
    setSkeins(1);
    onClose();
  }, [selected, skeins, onAdd, onClose]);

  const getYarnLabel = (yarn: YarnStock) => {
    const quality = getQualityById(yarn.qualityId);
    const brand = quality ? brands.find(b => b.id === quality.brandId) : undefined;
    return `${brand?.name ?? ''} ${quality?.name ?? ''} — ${yarn.colorName}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, maxHeight: '85%' }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Legg til garn</Text>

          {availableYarn.length === 0 ? (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <Ionicons name="archive-outline" size={32} color={colors.textTertiary} />
              <Text style={[{ color: colors.textTertiary, marginTop: 8, fontFamily: 'Inter_400Regular', textAlign: 'center' }]}>
                Ingen tilgjengelig garn på lager.{'\n'}Legg til garn i Lager-fanen først.
              </Text>
            </View>
          ) : (
            <>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {availableYarn.map(yarn => (
                  <Pressable
                    key={yarn.id}
                    style={[
                      styles.yarnOption,
                      {
                        backgroundColor: selected === yarn.id ? colors.badgeBg : colors.background,
                        borderColor: selected === yarn.id ? colors.primaryBtn : colors.border,
                      },
                    ]}
                    onPress={() => { setSelected(yarn.id); Haptics.selectionAsync(); }}
                  >
                    <View style={[styles.yarnOptionDot, { backgroundColor: yarn.colorHex }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.yarnOptionName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                        {getYarnLabel(yarn)}
                      </Text>
                      <Text style={[styles.yarnOptionSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                        {yarn.skeins} nøster tilgjengelig
                      </Text>
                    </View>
                    {selected === yarn.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primaryBtn} />
                    )}
                  </Pressable>
                ))}
              </ScrollView>

              {selected && (
                <>
                  <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                    Antall nøster til prosjektet
                  </Text>
                  <View style={styles.counter}>
                    <Pressable
                      style={[styles.counterBtn, { backgroundColor: colors.background }]}
                      onPress={() => { setSkeins(Math.max(1, skeins - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                    >
                      <Ionicons name="remove" size={20} color={colors.text} />
                    </Pressable>
                    <Text style={[styles.counterValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{skeins}</Text>
                    <Pressable
                      style={[styles.counterBtn, { backgroundColor: colors.background }]}
                      onPress={() => {
                        const yarn = yarnStock.find(y => y.id === selected);
                        if (yarn && skeins < yarn.skeins) {
                          setSkeins(skeins + 1);
                          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }
                      }}
                    >
                      <Ionicons name="add" size={20} color={colors.text} />
                    </Pressable>
                  </View>
                </>
              )}
            </>
          )}

          {availableYarn.length > 0 && (
            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: selected ? colors.primaryBtn : colors.border, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleAdd}
              disabled={!selected}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
            </Pressable>
          )}
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Avbryt</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProsjektScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const [showAddYarn, setShowAddYarn] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');

  const {
    getProjectById, updateProject, deleteProject,
    yarnStock, qualities, brands, needles,
    allocateYarnToProject, removeYarnFromProject,
    getQualityById,
  } = useKnitting();

  const project = getProjectById(id);

  const allocatedYarn = useMemo(() => {
    if (!project) return [];
    return project.yarnAllocations.map(alloc => {
      const yarn = yarnStock.find(y => y.id === alloc.yarnStockId);
      const quality = yarn ? getQualityById(yarn.qualityId) : undefined;
      const brand = quality ? brands.find(b => b.id === quality.brandId) : undefined;
      return { alloc, yarn, quality, brand };
    });
  }, [project, yarnStock, qualities, brands]);

  const projectNeedles = useMemo(() => {
    if (!project) return [];
    return project.needleIds.map(nid => needles.find(n => n.id === nid)).filter(Boolean);
  }, [project, needles]);

  if (!project) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textTertiary }}>Prosjekt ikke funnet</Text>
      </View>
    );
  }

  const StatusButton = ({ s }: { s: ProjectStatus }) => (
    <Pressable
      onPress={() => { updateProject(id, { status: s }); Haptics.selectionAsync(); }}
      style={[
        styles.statusBtn,
        {
          backgroundColor: project.status === s ? STATUS_COLORS[s] : colors.background,
          borderColor: project.status === s ? STATUS_COLORS[s] : colors.border,
        },
      ]}
    >
      <Text style={[styles.statusBtnText, {
        color: project.status === s ? '#fff' : colors.textSecondary,
        fontFamily: project.status === s ? 'Inter_600SemiBold' : 'Inter_400Regular',
      }]}>
        {STATUS_LABELS[s]}
      </Text>
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 4 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
          {project.name}
        </Text>
        <Pressable
          onPress={() => {
            Alert.alert('Slett prosjekt', `Slett "${project.name}"?`, [
              { text: 'Avbryt', style: 'cancel' },
              {
                text: 'Slett', style: 'destructive', onPress: () => {
                  deleteProject(id);
                  router.back();
                }
              },
            ]);
          }}
        >
          <Ionicons name="trash-outline" size={20} color="#C97B84" />
        </Pressable>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 34 : 20 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Status</Text>
          <View style={styles.statusRow}>
            <StatusButton s="planlagt" />
            <StatusButton s="aktiv" />
            <StatusButton s="ferdig" />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Notater</Text>
            {!editingNotes && (
              <Pressable onPress={() => { setNotesText(project.notes); setEditingNotes(true); }}>
                <Ionicons name="pencil-outline" size={16} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
          {editingNotes ? (
            <View style={{ gap: 8 }}>
              <TextInput
                style={[styles.notesInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
                value={notesText}
                onChangeText={setNotesText}
                multiline
                autoFocus
                placeholder="Skriv notater her..."
                placeholderTextColor={colors.textTertiary}
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Pressable
                  style={[styles.smallBtn, { backgroundColor: colors.primaryBtn }]}
                  onPress={() => { updateProject(id, { notes: notesText }); setEditingNotes(false); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
                >
                  <Text style={[styles.smallBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
                </Pressable>
                <Pressable
                  style={[styles.smallBtn, { backgroundColor: colors.background }]}
                  onPress={() => setEditingNotes(false)}
                >
                  <Text style={[styles.smallBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Text style={[styles.notes, { color: project.notes ? colors.text : colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {project.notes || 'Ingen notater...'}
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              Garn ({allocatedYarn.length})
            </Text>
            <Pressable
              style={[styles.addSmallBtn, { backgroundColor: colors.primaryBtn }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddYarn(true); }}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </Pressable>
          </View>

          {allocatedYarn.length === 0 ? (
            <Pressable
              style={[styles.emptyYarnRow, { borderColor: colors.border }]}
              onPress={() => setShowAddYarn(true)}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.textTertiary} />
              <Text style={[styles.emptyYarnText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                Legg til garn fra lager
              </Text>
            </Pressable>
          ) : (
            allocatedYarn.map(({ alloc, yarn, quality, brand }) => (
              <View key={alloc.yarnStockId} style={[styles.allocRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.allocDot, { backgroundColor: yarn?.colorHex ?? '#ccc' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.allocName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                    {yarn?.colorName ?? 'Ukjent'}
                  </Text>
                  <Text style={[styles.allocSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                    {brand?.name} {quality?.name} · {alloc.skeinsAllocated} nøster
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert('Fjern garn', 'Legge nøstene tilbake på lager?', [
                      { text: 'Avbryt', style: 'cancel' },
                      {
                        text: 'Fjern', style: 'destructive', onPress: () => {
                          removeYarnFromProject(id, alloc.yarnStockId);
                          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        }
                      },
                    ]);
                  }}
                  hitSlop={8}
                >
                  <Ionicons name="close-circle-outline" size={20} color={colors.textTertiary} />
                </Pressable>
              </View>
            ))
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              Pinner ({projectNeedles.length})
            </Text>
          </View>
          {needles.length === 0 ? (
            <Text style={[styles.notes, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              Legg til pinner i Lager-fanen
            </Text>
          ) : (
            needles.map(needle => {
              const isLinked = project.needleIds.includes(needle.id);
              return (
                <Pressable
                  key={needle.id}
                  style={[styles.needleRow, { borderBottomColor: colors.border }]}
                  onPress={() => {
                    const newIds = isLinked
                      ? project.needleIds.filter(nid => nid !== needle.id)
                      : [...project.needleIds, needle.id];
                    updateProject(id, { needleIds: newIds });
                    Haptics.selectionAsync();
                  }}
                >
                  <View style={[styles.needleSize, { backgroundColor: colors.badgeBg }]}>
                    <Text style={[styles.needleSizeText, { color: colors.badgeText, fontFamily: 'Inter_700Bold' }]}>{needle.size}</Text>
                  </View>
                  <Text style={[styles.needleLabel, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
                    {needle.size}mm {needle.type === 'rundpinne' ? 'rundpinne' : needle.type === 'strømpepinner' ? 'strømpepinner' : 'rett'}, {needle.lengthCm}cm
                  </Text>
                  <View style={[
                    styles.checkbox,
                    { borderColor: isLinked ? colors.primaryBtn : colors.border },
                    isLinked && { backgroundColor: colors.primaryBtn },
                  ]}>
                    {isLinked && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>

      <AddYarnModal
        visible={showAddYarn}
        onClose={() => setShowAddYarn(false)}
        onAdd={(yarnStockId, skeins) => {
          allocateYarnToProject(id, yarnStockId, skeins);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        excludeIds={project.yarnAllocations.map(a => a.yarnStockId)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 22 },
  listContent: { padding: 16, gap: 12 },
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 },
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 10, borderRadius: 12, borderWidth: 1.5, alignItems: 'center' },
  statusBtnText: { fontSize: 13 },
  notes: { fontSize: 15, lineHeight: 22 },
  notesInput: { borderRadius: 12, padding: 12, fontSize: 15, minHeight: 80, textAlignVertical: 'top' },
  smallBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  smallBtnText: { color: '#fff', fontSize: 14 },
  addSmallBtn: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  emptyYarnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyYarnText: { fontSize: 14 },
  allocRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  allocDot: { width: 32, height: 32, borderRadius: 16 },
  allocName: { fontSize: 14 },
  allocSub: { fontSize: 12, marginTop: 2 },
  needleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  needleSize: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleSizeText: { fontSize: 13, color: '#fff' },
  needleLabel: { flex: 1, fontSize: 14 },
  checkbox: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4 },
  fieldLabel: { fontSize: 13, marginBottom: 4, marginTop: 8 },
  yarnOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    marginBottom: 8,
  },
  yarnOptionDot: { width: 32, height: 32, borderRadius: 16 },
  yarnOptionName: { fontSize: 14 },
  yarnOptionSub: { fontSize: 12, marginTop: 2 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 20, justifyContent: 'center' },
  counterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 24 },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelBtnText: { fontSize: 15 },
});
