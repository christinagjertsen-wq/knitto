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
  planlagt: '#9AADC8',
  aktiv: '#6A8EC8',
  ferdig: '#4A6898',
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

function EditDetailsModal({
  visible,
  onClose,
  initial,
  onSave,
}: {
  visible: boolean;
  onClose: () => void;
  initial: { recipient?: string; size?: string; gauge?: string; patternNeedleSize?: string; startDate?: string; endDate?: string; notes: string };
  onSave: (data: { recipient: string; size: string; gauge: string; patternNeedleSize: string; startDate: string; endDate: string; notes: string }) => void;
}) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const [recipient, setRecipient] = useState(initial.recipient ?? '');
  const [size, setSize] = useState(initial.size ?? '');
  const [gauge, setGauge] = useState(initial.gauge ?? '');
  const [patternNeedleSize, setPatternNeedleSize] = useState(initial.patternNeedleSize ?? '');
  const [startDate, setStartDate] = useState(initial.startDate ?? '');
  const [endDate, setEndDate] = useState(initial.endDate ?? '');
  const [notes, setNotes] = useState(initial.notes ?? '');

  const handleSave = () => {
    onSave({ recipient, size, gauge, patternNeedleSize, startDate, endDate, notes });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const Field = ({ label, value, onChangeText, placeholder, hint }: {
    label: string; value: string; onChangeText: (v: string) => void; placeholder: string; hint?: string;
  }) => (
    <View style={{ gap: 4 }}>
      <Text style={[styles.detailFieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
      {hint && <Text style={[{ fontSize: 11, color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{hint}</Text>}
      <TextInput
        style={[styles.detailInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        returnKeyType="next"
      />
    </View>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface, maxHeight: '90%' }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Pressable onPress={onClose}>
              <Ionicons name="chevron-back" size={22} color={colors.text} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', flex: 1, marginLeft: 4 }]}>Detaljer</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
            <View style={{ gap: 14 }}>
              <Field label="Til" value={recipient} onChangeText={setRecipient} placeholder="Hvem strikker du til?" />
              <Field label="Størrelse" value={size} onChangeText={setSize} placeholder="f.eks. M, 38, Barn 4 år" />
              <Field label="Strikkefasthet" value={gauge} onChangeText={setGauge} placeholder="f.eks. 22 m / 10 cm" hint="Masker per 10 cm" />
              <Field label="Pinnestørrelse" value={patternNeedleSize} onChangeText={setPatternNeedleSize} placeholder="f.eks. 3,5 mm" hint="Fra oppskriften" />
              <Field label="Startet" value={startDate} onChangeText={setStartDate} placeholder="DD.MM.ÅÅÅÅ" />
              <Field label="Fullført" value={endDate} onChangeText={setEndDate} placeholder="DD.MM.ÅÅÅÅ" />
              <View style={{ gap: 4 }}>
                <Text style={[styles.detailFieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Notater</Text>
                <TextInput
                  style={[styles.detailInput, styles.notesInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Notater, tanker, tilpasninger..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </View>
          </ScrollView>
          <Pressable
            style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1, marginTop: 16 }]}
            onPress={handleSave}
          >
            <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
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
  const [showEditDetails, setShowEditDetails] = useState(false);

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

  const DetailCell = ({ label, value, placeholder }: { label: string; value?: string; placeholder: string }) => (
    <View style={styles.detailCell}>
      <Text style={[styles.detailCellLabel, { color: colors.primaryBtn, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
      <Text style={[styles.detailCellValue, { color: value ? colors.text : colors.textTertiary, fontFamily: value ? 'Inter_400Regular' : 'Inter_400Regular' }]}>
        {value || placeholder}
      </Text>
    </View>
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
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Detaljer</Text>
            <Pressable
              style={[styles.editCircleBtn, { backgroundColor: colors.badgeBg }]}
              onPress={() => { setShowEditDetails(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Ionicons name="pencil" size={14} color={colors.primaryBtn} />
            </Pressable>
          </View>

          <View style={styles.detailGrid}>
            <DetailCell label="Til" value={project.recipient} placeholder="Navn" />
            <DetailCell label="Størrelse" value={project.size} placeholder="Størrelse" />
            <DetailCell label="Strikkefasthet" value={project.gauge} placeholder="Strikkefasthet" />
            <DetailCell label="Pinnestørrelse" value={project.patternNeedleSize} placeholder="Pinnestørrelse" />
            <DetailCell label="Startet" value={project.startDate} placeholder="Ikke satt" />
            <DetailCell
              label="Fullført"
              value={project.endDate}
              placeholder={project.status === 'ferdig' ? 'Ikke satt' : 'Ikke ennå'}
            />
          </View>

          {project.notes ? (
            <View style={[styles.notesBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.notesLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Notater</Text>
              <Text style={[styles.notesText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{project.notes}</Text>
            </View>
          ) : null}
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
            <Text style={[styles.notesText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
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

        <View style={styles.bottomBtnRow}>
          <Pressable
            style={({ pressed }) => [
              styles.finishBtn,
              { backgroundColor: project.status === 'ferdig' ? '#5C9E8A' : colors.primaryBtn, opacity: pressed ? 0.85 : 1 },
            ]}
            onPress={() => {
              const newStatus: ProjectStatus = project.status === 'ferdig' ? 'aktiv' : 'ferdig';
              updateProject(id, {
                status: newStatus,
                endDate: newStatus === 'ferdig' ? new Date().toLocaleDateString('nb-NO') : undefined,
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Ionicons name={project.status === 'ferdig' ? 'refresh-outline' : 'checkmark-circle-outline'} size={18} color="#fff" />
            <Text style={[styles.finishBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
              {project.status === 'ferdig' ? 'Gjenåpne' : 'Fullfør prosjekt'}
            </Text>
          </Pressable>
          {project.status !== 'planlagt' && (
            <Pressable
              style={({ pressed }) => [styles.planBtn, { borderColor: colors.primaryBtn, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { updateProject(id, { status: 'planlagt' }); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.planBtnText, { color: colors.primaryBtn, fontFamily: 'Inter_500Medium' }]}>Flytt til planer</Text>
            </Pressable>
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

      <EditDetailsModal
        visible={showEditDetails}
        onClose={() => setShowEditDetails(false)}
        initial={{
          recipient: project.recipient,
          size: project.size,
          gauge: project.gauge,
          patternNeedleSize: project.patternNeedleSize,
          startDate: project.startDate,
          endDate: project.endDate,
          notes: project.notes,
        }}
        onSave={(data) => {
          updateProject(id, {
            recipient: data.recipient || undefined,
            size: data.size || undefined,
            gauge: data.gauge || undefined,
            patternNeedleSize: data.patternNeedleSize || undefined,
            startDate: data.startDate || undefined,
            endDate: data.endDate || undefined,
            notes: data.notes,
          });
        }}
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
  editCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailCell: {
    width: '50%',
    paddingVertical: 10,
    paddingRight: 8,
    gap: 3,
  },
  detailCellLabel: { fontSize: 12 },
  detailCellValue: { fontSize: 14 },
  notesBox: {
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  notesLabel: { fontSize: 12, textTransform: 'uppercase', letterSpacing: 0.4 },
  notesText: { fontSize: 14, lineHeight: 21 },
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
  bottomBtnRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  finishBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  finishBtnText: { color: '#fff', fontSize: 15 },
  planBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planBtnText: { fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 22 },
  fieldLabel: { fontSize: 13, marginBottom: 4, marginTop: 8 },
  detailFieldLabel: { fontSize: 13 },
  detailInput: {
    borderRadius: 12,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
  },
  notesInput: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
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
