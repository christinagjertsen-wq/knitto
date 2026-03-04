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

function Counter({ value, onChange, max }: { value: number; onChange: (v: number) => void; max?: number }) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  return (
    <View style={styles.counter}>
      <Pressable
        style={[styles.counterBtn, { backgroundColor: colors.background }]}
        onPress={() => { onChange(Math.max(1, value - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      >
        <Ionicons name="remove" size={20} color={colors.text} />
      </Pressable>
      <Text style={[styles.counterValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{value}</Text>
      <Pressable
        style={[styles.counterBtn, { backgroundColor: colors.background }]}
        onPress={() => { if (max === undefined || value < max) { onChange(value + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } }}
      >
        <Ionicons name="add" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

function AddYarnModal({
  visible,
  onClose,
  onAdd,
  onAddNew,
  excludeIds,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (yarnStockId: string, skeins: number) => void;
  onAddNew: (qualityId: string, colorName: string, colorHex: string, skeinsTotal: number, skeinsForProject: number) => void;
  excludeIds: string[];
}) {
  const colorScheme = useColorScheme();
  const colors = colorScheme === 'dark' ? Colors.dark : Colors.light;
  const { yarnStock, qualities, brands, getQualityById, getQualitiesForBrand } = useKnitting();

  const [mode, setMode] = useState<'lager' | 'nytt'>('lager');

  const [selected, setSelected] = useState<string | null>(null);
  const [skeins, setSkeins] = useState(1);

  const [newBrandId, setNewBrandId] = useState<string | null>(null);
  const [newQualityId, setNewQualityId] = useState<string | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [newColorHex, setNewColorHex] = useState('#CCCCCC');
  const [newSkeinsTotal, setNewSkeinsTotal] = useState(1);
  const [newSkeinsProject, setNewSkeinsProject] = useState(1);

  const availableYarn = useMemo(() =>
    yarnStock.filter(y => !excludeIds.includes(y.id) && y.skeins > 0),
    [yarnStock, excludeIds]
  );

  const qualitiesForBrand = useMemo(() =>
    newBrandId ? getQualitiesForBrand(newBrandId) : [],
    [newBrandId, qualities]
  );

  const reset = () => {
    setSelected(null); setSkeins(1);
    setNewBrandId(null); setNewQualityId(null);
    setNewColorName(''); setNewColorHex('#CCCCCC');
    setNewSkeinsTotal(1); setNewSkeinsProject(1);
    setMode('lager');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleAddFromStock = () => {
    if (!selected) return;
    onAdd(selected, skeins);
    reset(); onClose();
  };

  const handleAddNew = () => {
    if (!newQualityId || !newColorName.trim()) return;
    onAddNew(newQualityId, newColorName.trim(), newColorHex, newSkeinsTotal, newSkeinsProject);
    reset(); onClose();
  };

  const getYarnLabel = (yarn: YarnStock) => {
    const quality = getQualityById(yarn.qualityId);
    const brand = quality ? brands.find(b => b.id === quality.brandId) : undefined;
    return `${brand?.name ?? ''} ${quality?.name ?? ''} — ${yarn.colorName}`;
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.editModalSheet, { backgroundColor: colors.surface }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.editModalContent, { gap: 12 }]}
          >
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Legg til garn</Text>

            <View style={[styles.modeToggle, { backgroundColor: colors.background }]}>
              {(['lager', 'nytt'] as const).map(m => (
                <Pressable
                  key={m}
                  style={[styles.modeBtn, mode === m && { backgroundColor: colors.primaryBtn }]}
                  onPress={() => setMode(m)}
                >
                  <Text style={[styles.modeBtnText, {
                    color: mode === m ? '#fff' : colors.textSecondary,
                    fontFamily: mode === m ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>
                    {m === 'lager' ? 'Fra lager' : 'Nytt garn'}
                  </Text>
                </Pressable>
              ))}
            </View>

            {mode === 'lager' ? (
              availableYarn.length === 0 ? (
                <View style={{ paddingVertical: 24, alignItems: 'center', gap: 8 }}>
                  <Ionicons name="archive-outline" size={32} color={colors.textTertiary} />
                  <Text style={[{ color: colors.textTertiary, fontFamily: 'Inter_400Regular', textAlign: 'center' }]}>
                    Ingen tilgjengelig garn på lager.{'\n'}Bruk «Nytt garn» for å legge til.
                  </Text>
                </View>
              ) : (
                <>
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
                      onPress={() => { setSelected(yarn.id); setSkeins(1); Haptics.selectionAsync(); }}
                    >
                      <View style={[styles.yarnOptionDot, { backgroundColor: yarn.colorHex, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.yarnOptionName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                          {getYarnLabel(yarn)}
                        </Text>
                        <Text style={[styles.yarnOptionSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                          {yarn.skeins} nøster tilgjengelig
                        </Text>
                      </View>
                      {selected === yarn.id && <Ionicons name="checkmark-circle" size={20} color={colors.primaryBtn} />}
                    </Pressable>
                  ))}
                  {selected && (
                    <View>
                      <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                        Antall nøster til prosjektet
                      </Text>
                      <Counter
                        value={skeins}
                        onChange={setSkeins}
                        max={yarnStock.find(y => y.id === selected)?.skeins}
                      />
                    </View>
                  )}
                  <Pressable
                    style={({ pressed }) => [styles.modalBtn, { backgroundColor: selected ? colors.primaryBtn : colors.border, opacity: pressed ? 0.85 : 1 }]}
                    onPress={handleAddFromStock}
                    disabled={!selected}
                  >
                    <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
                  </Pressable>
                </>
              )
            ) : (
              <>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Merke</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                    {brands.map(b => (
                      <Pressable
                        key={b.id}
                        onPress={() => { setNewBrandId(b.id); setNewQualityId(null); Haptics.selectionAsync(); }}
                        style={[styles.pill, {
                          backgroundColor: newBrandId === b.id ? colors.primaryBtn : colors.background,
                          borderColor: newBrandId === b.id ? colors.primaryBtn : colors.border,
                        }]}
                      >
                        <Text style={[styles.pillText, {
                          color: newBrandId === b.id ? '#fff' : colors.text,
                          fontFamily: newBrandId === b.id ? 'Inter_600SemiBold' : 'Inter_400Regular',
                        }]}>{b.name}</Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                {newBrandId && qualitiesForBrand.length > 0 && (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Kvalitet</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                        {qualitiesForBrand.map(q => (
                          <Pressable
                            key={q.id}
                            onPress={() => { setNewQualityId(q.id); Haptics.selectionAsync(); }}
                            style={[styles.pill, {
                              backgroundColor: newQualityId === q.id ? colors.primaryBtn : colors.background,
                              borderColor: newQualityId === q.id ? colors.primaryBtn : colors.border,
                            }]}
                          >
                            <Text style={[styles.pillText, {
                              color: newQualityId === q.id ? '#fff' : colors.text,
                              fontFamily: newQualityId === q.id ? 'Inter_600SemiBold' : 'Inter_400Regular',
                            }]}>{q.name}</Text>
                          </Pressable>
                        ))}
                      </View>
                    </ScrollView>
                  </>
                )}

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Fargenavn</Text>
                <TextInput
                  style={[styles.detailInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                  value={newColorName}
                  onChangeText={setNewColorName}
                  placeholder="f.eks. Natthimmel"
                  placeholderTextColor={colors.textTertiary}
                />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Fargekode (valgfritt)</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[styles.yarnOptionDot, { backgroundColor: newColorHex, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' }]} />
                  <TextInput
                    style={[styles.detailInput, { flex: 1, color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                    value={newColorHex}
                    onChangeText={setNewColorHex}
                    placeholder="#RRGGBB"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Kjøpte nøster totalt</Text>
                <Counter value={newSkeinsTotal} onChange={v => { setNewSkeinsTotal(v); setNewSkeinsProject(Math.min(newSkeinsProject, v)); }} />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Nøster til dette prosjektet</Text>
                <Counter value={newSkeinsProject} onChange={setNewSkeinsProject} max={newSkeinsTotal} />

                <Pressable
                  style={({ pressed }) => [styles.modalBtn, {
                    backgroundColor: (newQualityId && newColorName.trim()) ? colors.primaryBtn : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  }]}
                  onPress={handleAddNew}
                  disabled={!newQualityId || !newColorName.trim()}
                >
                  <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til og alloker</Text>
                </Pressable>
              </>
            )}

            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Avbryt</Text>
            </Pressable>
          </ScrollView>
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
        <View style={[styles.editModalSheet, { backgroundColor: colors.surface }]}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.editModalContent}
          >
            <View style={styles.modalHandle} />
            <View style={[styles.modalHeaderRow, { marginBottom: 16 }]}>
              <Pressable onPress={onClose} hitSlop={8}>
                <Ionicons name="chevron-back" size={22} color={colors.text} />
              </Pressable>
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', flex: 1, marginLeft: 4 }]}>Detaljer</Text>
            </View>
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
            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
              onPress={handleSave}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
            </Pressable>
          </ScrollView>
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
    addYarnStock, getQualityById,
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
        onAddNew={(qualityId, colorName, colorHex, skeinsTotal, skeinsForProject) => {
          const newYarn = addYarnStock({ qualityId, colorName, colorHex, skeins: skeinsTotal });
          allocateYarnToProject(id, newYarn.id, skeinsForProject);
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
  modeToggle: { flexDirection: 'row', borderRadius: 12, padding: 3, gap: 3 },
  modeBtn: { flex: 1, paddingVertical: 9, borderRadius: 10, alignItems: 'center' },
  modeBtnText: { fontSize: 14 },
  pill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  pillText: { fontSize: 13 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  editModalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '92%' },
  editModalContent: { padding: 24, paddingBottom: 40, gap: 14 },
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
