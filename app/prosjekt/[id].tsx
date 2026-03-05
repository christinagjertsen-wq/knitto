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
  Image,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { useT, useLanguage } from '@/context/LanguageContext';
import { useKnitting, ProjectStatus, YarnStock } from '@/context/KnittingContext';
import { PremiumModal } from '@/components/PremiumModal';

function ProgressRingLarge({ percent, size, strokeWidth, color }: { percent: number; size: number; strokeWidth: number; color: string }) {
  const colors = useColors();
  const r = (size - strokeWidth) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (Math.min(Math.max(percent, 0), 100) / 100) * circ;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.border} strokeWidth={strokeWidth} fill="none" />
        <Circle
          cx={size / 2} cy={size / 2} r={r}
          stroke={color} strokeWidth={strokeWidth} fill="none"
          strokeDasharray={`${circ} ${circ}`}
          strokeDashoffset={offset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={{ fontSize: 14, fontFamily: 'Inter_700Bold', color: color }}>{Math.round(percent)}%</Text>
    </View>
  );
}

const PRESET_COLORS = [
  { name: 'Lys grå', hex: '#E8E8E8' },
  { name: 'Lys rosa', hex: '#FCC8D0' },
  { name: 'Lys fersken', hex: '#FCD8B0' },
  { name: 'Lys gul', hex: '#FAF0A0' },
  { name: 'Lys lime', hex: '#D8ECC0' },
  { name: 'Lys grønn', hex: '#C0E8C0' },
  { name: 'Lys aqua', hex: '#B8ECEC' },
  { name: 'Lys blå', hex: '#C0D4F4' },
  { name: 'Lys lavendel', hex: '#D8C0F4' },
  { name: 'Lys rose', hex: '#F4C4E0' },
  { name: 'Sølv', hex: '#C8C8C8' },
  { name: 'Rosa', hex: '#F898B0' },
  { name: 'Fersken', hex: '#FAB880' },
  { name: 'Gul', hex: '#F8E068' },
  { name: 'Lime', hex: '#B4E090' },
  { name: 'Grønn', hex: '#90E090' },
  { name: 'Aqua', hex: '#80E0E0' },
  { name: 'Blå', hex: '#90B8F4' },
  { name: 'Lavendel', hex: '#B890E8' },
  { name: 'Syklamenpink', hex: '#F090CC' },
  { name: 'Grå', hex: '#A8A8A8' },
  { name: 'Laks', hex: '#F06888' },
  { name: 'Aprikos', hex: '#F09060' },
  { name: 'Gylden', hex: '#F0D040' },
  { name: 'Lysegrønn', hex: '#88CC60' },
  { name: 'Gressgrønn', hex: '#58C858' },
  { name: 'Turkis', hex: '#58C8C8' },
  { name: 'Kornblomst', hex: '#6898E8' },
  { name: 'Lilla', hex: '#9868D8' },
  { name: 'Fuksia', hex: '#E868A8' },
  { name: 'Mellomgrå', hex: '#888888' },
  { name: 'Rød', hex: '#D83060' },
  { name: 'Oransje', hex: '#D86820' },
  { name: 'Gull', hex: '#D8A810' },
  { name: 'Olivengrønn', hex: '#60B030' },
  { name: 'Skoggrønn', hex: '#20B020' },
  { name: 'Teal', hex: '#20A8A8' },
  { name: 'Kobolt', hex: '#3870C8' },
  { name: 'Dyp lilla', hex: '#7038B8' },
  { name: 'Karmin', hex: '#C82878' },
  { name: 'Mørk grå', hex: '#606060' },
  { name: 'Mørk rød', hex: '#A81040' },
  { name: 'Rust', hex: '#A84810' },
  { name: 'Oker', hex: '#A87808' },
  { name: 'Mørkegrønn', hex: '#387818' },
  { name: 'Dyp grønn', hex: '#087808' },
  { name: 'Mørk teal', hex: '#087878' },
  { name: 'Marineblå', hex: '#1850A0' },
  { name: 'Aubergine', hex: '#481888' },
  { name: 'Burgunder', hex: '#A01058' },
  { name: 'Koks', hex: '#383838' },
  { name: 'Mørk burgunder', hex: '#780830' },
  { name: 'Mørk rust', hex: '#783010' },
  { name: 'Mørk oker', hex: '#785808' },
  { name: 'Mørk skog', hex: '#205010' },
  { name: 'Dyp skog', hex: '#055005' },
  { name: 'Dyp teal', hex: '#055050' },
  { name: 'Mørk marine', hex: '#102868' },
  { name: 'Dyp violet', hex: '#300868' },
  { name: 'Mørk vin', hex: '#700828' },
  { name: 'Antrasitt', hex: '#1E1E1E' },
  { name: 'Dyp rød', hex: '#380010' },
  { name: 'Mahogni', hex: '#381808' },
  { name: 'Dyp brun', hex: '#302000' },
  { name: 'Nattskog', hex: '#101808' },
  { name: 'Nattgrønn', hex: '#022802' },
  { name: 'Natt teal', hex: '#022828' },
  { name: 'Nattblå', hex: '#071030' },
  { name: 'Natt violet', hex: '#180038' },
  { name: 'Svart', hex: '#0A0A0A' },
];

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
  const colors = useColors();
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
  const colors = useColors();
  const t = useT();
  const { yarnStock, qualities, brands, getQualityById, getQualitiesForBrand, updateQuality, addBrand, addQuality, getAvailableSkeins } = useKnitting();

  const [mode, setMode] = useState<'lager' | 'nytt'>('lager');

  const [selected, setSelected] = useState<string | null>(null);
  const [skeins, setSkeins] = useState(1);

  const [newBrandId, setNewBrandId] = useState<string | null>(null);
  const [newQualityId, setNewQualityId] = useState<string | null>(null);
  const [newColorName, setNewColorName] = useState('');
  const [selectedColorHex, setSelectedColorHex] = useState('#C0D4F4');

  const [newSkeinsTotal, setNewSkeinsTotal] = useState(1);
  const [newSkeinsProject, setNewSkeinsProject] = useState(1);
  const [newGramsPerSkein, setNewGramsPerSkein] = useState('');
  const [newMetersPerSkein, setNewMetersPerSkein] = useState('');
  const [showNewBrandInput, setShowNewBrandInput] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [showNewQualityInput, setShowNewQualityInput] = useState(false);
  const [newQualityName, setNewQualityName] = useState('');

  const availableYarn = useMemo(() =>
    yarnStock.filter(y => !excludeIds.includes(y.id) && getAvailableSkeins(y.id) > 0),
    [yarnStock, excludeIds, getAvailableSkeins]
  );

  const qualitiesForBrand = useMemo(() =>
    newBrandId ? getQualitiesForBrand(newBrandId) : [],
    [newBrandId, qualities]
  );

  const handleAddBrand = () => {
    const name = newBrandName.trim();
    if (!name) return;
    const created = addBrand(name);
    setNewBrandId(created.id);
    setNewQualityId(null);
    setNewBrandName('');
    setShowNewBrandInput(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleAddQuality = () => {
    if (!newQualityName.trim() || !newBrandId) return;
    const q = addQuality({ brandId: newBrandId, name: newQualityName.trim(), fiberContent: '', gramsPerSkein: 0, metersPerSkein: 0 });
    setNewQualityId(q.id);
    setNewQualityName('');
    setShowNewQualityInput(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const reset = () => {
    setSelected(null); setSkeins(1);
    setNewBrandId(null); setNewQualityId(null);
    setNewColorName(''); setSelectedColorHex('#C0D4F4');
    setNewSkeinsTotal(1); setNewSkeinsProject(1);
    setNewGramsPerSkein(''); setNewMetersPerSkein('');
    setShowNewBrandInput(false); setNewBrandName('');
    setShowNewQualityInput(false); setNewQualityName('');
    setMode('lager');
  };

  const handleClose = () => { reset(); onClose(); };

  const handleQualitySelect = (qId: string) => {
    setNewQualityId(qId);
    const q = qualities.find(q => q.id === qId);
    setNewGramsPerSkein(q && q.gramsPerSkein > 0 ? String(q.gramsPerSkein) : '');
    setNewMetersPerSkein(q && q.metersPerSkein > 0 ? String(q.metersPerSkein) : '');
    Haptics.selectionAsync();
  };

  const handleAddFromStock = () => {
    if (!selected) return;
    onAdd(selected, skeins);
    reset(); onClose();
  };


  const handleAddNew = () => {
    if (!newQualityId || !newColorName.trim()) return;
    const g = parseInt(newGramsPerSkein) || 0;
    const m = parseInt(newMetersPerSkein) || 0;
    if (g > 0 || m > 0) {
      updateQuality(newQualityId, { gramsPerSkein: g, metersPerSkein: m });
    }
    onAddNew(newQualityId, newColorName.trim(), selectedColorHex, newSkeinsTotal, newSkeinsProject);
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
                    {m === 'lager' ? t.project.fromStorage : t.project.newYarn}
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
                        max={selected ? getAvailableSkeins(selected) : undefined}
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
                        onPress={() => { setNewBrandId(b.id); setNewQualityId(null); setShowNewBrandInput(false); Haptics.selectionAsync(); }}
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
                    <Pressable
                      onPress={() => { setShowNewBrandInput(true); setNewBrandId(null); Haptics.selectionAsync(); }}
                      style={[styles.pill, {
                        backgroundColor: showNewBrandInput ? colors.primaryBtn : colors.background,
                        borderColor: showNewBrandInput ? colors.primaryBtn : colors.border,
                        borderStyle: 'dashed',
                      }]}
                    >
                      <Ionicons name="add" size={14} color={showNewBrandInput ? '#fff' : colors.textSecondary} />
                      <Text style={[styles.pillText, {
                        color: showNewBrandInput ? '#fff' : colors.textSecondary,
                        fontFamily: 'Inter_400Regular',
                      }]}>Nytt merke</Text>
                    </Pressable>
                  </View>
                </ScrollView>

                {showNewBrandInput && (
                  <View style={[styles.inlineInputRow, { backgroundColor: colors.background }]}>
                    <TextInput
                      style={[styles.inlineInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
                      placeholder="Navn på merke"
                      placeholderTextColor={colors.textTertiary}
                      value={newBrandName}
                      onChangeText={setNewBrandName}
                      autoFocus
                      autoCapitalize="words"
                      returnKeyType="done"
                      onSubmitEditing={handleAddBrand}
                    />
                    <Pressable
                      onPress={handleAddBrand}
                      style={[styles.inlineBtn, { backgroundColor: newBrandName.trim() ? colors.primaryBtn : colors.border }]}
                      disabled={!newBrandName.trim()}
                    >
                      <Text style={[styles.inlineBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
                    </Pressable>
                  </View>
                )}

                {newBrandId && (
                  <>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Kvalitet</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
                        {qualitiesForBrand.map(q => (
                          <Pressable
                            key={q.id}
                            onPress={() => { handleQualitySelect(q.id); setShowNewQualityInput(false); Haptics.selectionAsync(); }}
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
                        <Pressable
                          onPress={() => { setShowNewQualityInput(true); setNewQualityId(null); Haptics.selectionAsync(); }}
                          style={[styles.pill, {
                            backgroundColor: showNewQualityInput ? colors.primaryBtn : colors.background,
                            borderColor: showNewQualityInput ? colors.primaryBtn : colors.border,
                            borderStyle: 'dashed',
                          }]}
                        >
                          <Ionicons name="add" size={14} color={showNewQualityInput ? '#fff' : colors.textSecondary} />
                          <Text style={[styles.pillText, {
                            color: showNewQualityInput ? '#fff' : colors.textSecondary,
                            fontFamily: 'Inter_400Regular',
                          }]}>Ny kvalitet</Text>
                        </Pressable>
                      </View>
                    </ScrollView>
                    {showNewQualityInput && (
                      <View style={[styles.inlineInputRow, { backgroundColor: colors.background }]}>
                        <TextInput
                          style={[styles.inlineInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
                          placeholder="Navn på kvalitet"
                          placeholderTextColor={colors.textTertiary}
                          value={newQualityName}
                          onChangeText={setNewQualityName}
                          autoFocus
                          autoCapitalize="words"
                          returnKeyType="done"
                          onSubmitEditing={handleAddQuality}
                        />
                        <Pressable
                          onPress={handleAddQuality}
                          style={[styles.inlineBtn, { backgroundColor: newQualityName.trim() ? colors.primaryBtn : colors.border }]}
                          disabled={!newQualityName.trim()}
                        >
                          <Text style={[styles.inlineBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
                        </Pressable>
                      </View>
                    )}
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

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Velg farge</Text>
                <View style={[styles.colorPreviewSwatch, { backgroundColor: selectedColorHex, alignSelf: 'center' }]} />
                <View style={styles.colorGrid}>
                  {Array.from({ length: 7 }, (_, rowIndex) => (
                    <View key={rowIndex} style={styles.colorRow}>
                      {PRESET_COLORS.slice(rowIndex * 10, rowIndex * 10 + 10).map(c => (
                        <Pressable
                          key={c.hex}
                          onPress={() => {
                            setSelectedColorHex(c.hex);
                            Haptics.selectionAsync();
                          }}
                          style={[
                            styles.presetColor,
                            { backgroundColor: c.hex },
                            selectedColorHex === c.hex && styles.presetColorSelected,
                          ]}
                        />
                      ))}
                    </View>
                  ))}
                </View>

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Kjøpte nøster totalt</Text>
                <Counter value={newSkeinsTotal} onChange={v => { setNewSkeinsTotal(v); setNewSkeinsProject(Math.min(newSkeinsProject, v)); }} />

                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Nøster til dette prosjektet</Text>
                <Counter value={newSkeinsProject} onChange={setNewSkeinsProject} max={newSkeinsTotal} />

                <View style={{ flexDirection: 'row', gap: 12 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Gram per nøste</Text>
                    <TextInput
                      style={[styles.detailInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                      value={newGramsPerSkein}
                      onChangeText={setNewGramsPerSkein}
                      placeholder="f.eks. 50"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Meter per nøste</Text>
                    <TextInput
                      style={[styles.detailInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                      value={newMetersPerSkein}
                      onChangeText={setNewMetersPerSkein}
                      placeholder="f.eks. 200"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>

                <Pressable
                  style={({ pressed }) => [styles.modalBtn, {
                    backgroundColor: (newQualityId && newColorName.trim()) ? colors.primaryBtn : colors.border,
                    opacity: pressed ? 0.85 : 1,
                  }]}
                  onPress={handleAddNew}
                  disabled={!newQualityId || !newColorName.trim()}
                >
                  <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
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

function AddNeedleModal({
  visible,
  onClose,
  onAdd,
  defaultSize,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (needle: { size: string; type: import('@/context/KnittingContext').NeedleType; lengthCm: number; material: import('@/context/KnittingContext').NeedleMaterial; quantity: number }) => void;
  defaultSize?: string;
}) {
  const colors = useColors();
  const t = useT();
  const [size, setSize] = useState(defaultSize ?? '');
  const [type, setType] = useState<'rundpinne' | 'strømpepinner' | 'rett' | 'utskiftbar'>('rundpinne');
  const [lengthCm, setLengthCm] = useState('');
  const [material, setMaterial] = useState<'bambus' | 'metall' | 'plast' | 'tre'>('metall');
  const [quantity, setQuantity] = useState(1);

  const reset = () => { setSize(defaultSize ?? ''); setType('rundpinne'); setLengthCm(''); setMaterial('metall'); setQuantity(1); };
  const handleClose = () => { reset(); onClose(); };
  const handleAdd = () => {
    if (!size.trim() || !lengthCm.trim()) return;
    onAdd({ size: size.trim(), type, lengthCm: parseInt(lengthCm) || 0, material, quantity });
    reset(); onClose();
  };

  const TYPE_LABELS: Record<string, string> = { rundpinne: t.needleTypes.rundpinne, strømpepinner: t.needleTypes.strompepinner, rett: t.needleTypes.rett, utskiftbar: t.needleTypes.utskiftbar };
  const MAT_LABELS: Record<string, string> = { metall: t.needleMaterials.metall, bambus: t.needleMaterials.bambus, tre: t.needleMaterials.tre, plast: t.needleMaterials.plast };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.editModalSheet, { backgroundColor: colors.surface }]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={[styles.editModalContent, { gap: 12 }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.storage.newNeedle}</Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.sizeMm}</Text>
            <TextInput
              style={[styles.detailInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              value={size}
              onChangeText={setSize}
              placeholder={t.storage.sizePlaceholder}
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.type}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['rundpinne', 'strømpepinner', 'rett', 'utskiftbar'] as const).map(t => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  style={[styles.pill, {
                    backgroundColor: type === t ? colors.primaryBtn : colors.background,
                    borderColor: type === t ? colors.primaryBtn : colors.border,
                  }]}
                >
                  <Text style={[styles.pillText, { color: type === t ? '#fff' : colors.text, fontFamily: type === t ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                    {TYPE_LABELS[t]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.lengthCm}</Text>
            <TextInput
              style={[styles.detailInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              value={lengthCm}
              onChangeText={setLengthCm}
              placeholder={t.storage.lengthPlaceholder}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.material}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(['metall', 'bambus', 'tre', 'plast'] as const).map(m => (
                <Pressable
                  key={m}
                  onPress={() => setMaterial(m)}
                  style={[styles.pill, {
                    backgroundColor: material === m ? colors.primaryBtn : colors.background,
                    borderColor: material === m ? colors.primaryBtn : colors.border,
                  }]}
                >
                  <Text style={[styles.pillText, { color: material === m ? '#fff' : colors.text, fontFamily: material === m ? 'Inter_600SemiBold' : 'Inter_400Regular' }]}>
                    {MAT_LABELS[m]}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.quantity}</Text>
            <Counter value={quantity} onChange={setQuantity} />

            <Pressable
              style={({ pressed }) => [styles.modalBtn, {
                backgroundColor: (size.trim() && lengthCm.trim()) ? colors.primaryBtn : colors.border,
                opacity: pressed ? 0.85 : 1,
              }]}
              onPress={handleAdd}
              disabled={!size.trim() || !lengthCm.trim()}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.common.add}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t.common.cancel}</Text>
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
  status,
}: {
  visible: boolean;
  onClose: () => void;
  initial: { recipient?: string; size?: string; gauge?: string; patternNeedleSize?: string; startDate?: string; endDate?: string; notes: string };
  onSave: (data: { recipient: string; size: string; gauge: string; patternNeedleSize: string; startDate: string; endDate: string; notes: string }) => void;
  status: ProjectStatus;
}) {
  const colors = useColors();
  const t = useT();
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
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', flex: 1, marginLeft: 4 }]}>{t.project.details}</Text>
            </View>
            <Field label={t.project.to} value={recipient} onChangeText={setRecipient} placeholder={t.project.toPlaceholder} />
            <Field label={t.project.size} value={size} onChangeText={setSize} placeholder={t.project.sizePlaceholder} />
            <Field label={t.project.gauge} value={gauge} onChangeText={setGauge} placeholder={t.project.gaugePlaceholder} hint={t.project.gaugeHint} />
            <Field label={t.project.needleSize} value={patternNeedleSize} onChangeText={setPatternNeedleSize} placeholder={t.project.needleSizePlaceholder} hint={t.project.needleSizeHint} />
            <Field label={status === 'planlagt' ? t.project.expectedStart : t.project.started} value={startDate} onChangeText={setStartDate} placeholder={t.project.startDatePlaceholder} />
            <Field label={t.project.completed} value={endDate} onChangeText={setEndDate} placeholder={t.project.startDatePlaceholder} />
            <View style={{ gap: 4 }}>
              <Text style={[styles.detailFieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.project.notes}</Text>
              <TextInput
                style={[styles.detailInput, styles.notesInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                value={notes}
                onChangeText={setNotes}
                placeholder={t.project.notesPlaceholder}
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={4}
              />
            </View>
            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
              onPress={handleSave}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.common.save}</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function ProsjektScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const t = useT();
  const { language } = useLanguage();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const [showAddYarn, setShowAddYarn] = useState(false);
  const [showAddNeedle, setShowAddNeedle] = useState(false);
  const [showEditDetails, setShowEditDetails] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [showPremium, setShowPremium] = useState(false);

  const {
    getProjectById, updateProject, deleteProject,
    yarnStock, qualities, brands, needles,
    allocateYarnToProject, removeYarnFromProject,
    addYarnStock, addNeedle, getQualityById,
    addLogEntry, deleteLogEntry, getLogsForProject,
  } = useKnitting();

  const project = getProjectById(id);
  const projectLogs = useMemo(() => project ? getLogsForProject(project.id) : [], [project, getLogsForProject]);

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t.project.permissionNeeded, t.project.photoPermission);
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      updateProject(id, { coverImage: result.assets[0].uri });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  }, [id, updateProject]);


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

  const normalizeSize = (s: string) => s.replace(',', '.').replace(/[^0-9.]/g, '').trim();

  const patternSize = project?.patternNeedleSize?.trim() ?? '';
  const filteredNeedles = useMemo(() => {
    if (!patternSize) return needles;
    const target = normalizeSize(patternSize);
    return needles.filter(n => normalizeSize(n.size) === target);
  }, [needles, patternSize]);

  const defaultNeedleSize = patternSize ? normalizeSize(patternSize) : '';

  if (!project) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textTertiary }}>{t.project.notFound}</Text>
      </View>
    );
  }

  const StatusButton = ({ s }: { s: ProjectStatus }) => (
    <Pressable
      onPress={() => {
        const updates: Parameters<typeof updateProject>[1] = { status: s };
        if (s !== 'ferdig' && project.status === 'ferdig') updates.progressPercent = 0;
        updateProject(id, updates);
        Haptics.selectionAsync();
      }}
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
        {t.status[s]}
      </Text>
    </Pressable>
  );

  const DetailCell = ({ label, value, placeholder }: { label: string; value?: string; placeholder: string }) => (
    <View style={styles.detailCell}>
      <Text style={[styles.detailCellLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{label}</Text>
      <Text style={[styles.detailCellValue, { color: value ? colors.text : colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
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
          style={{ padding: 4 }}
          onPress={() => {
            Alert.alert(t.project.deleteProject, t.project.confirmDelete.replace('%s', project.name), [
              { text: t.common.cancel, style: 'cancel' },
              {
                text: t.common.delete, style: 'destructive', onPress: () => {
                  deleteProject(id);
                  router.replace('/(tabs)/prosjekter');
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
        <Pressable
          style={[styles.coverImageCard, { backgroundColor: colors.surface }]}
          onPress={pickImage}
          testID="cover-image-btn"
        >
          {project.coverImage ? (
            <>
              <Image
                source={{ uri: project.coverImage }}
                style={styles.coverImage}
                resizeMode="cover"
              />
              <Pressable
                style={[styles.coverImageFab, { backgroundColor: colors.primaryBtn }]}
                onPress={pickImage}
                hitSlop={8}
              >
                <Ionicons name="camera" size={16} color="#fff" />
              </Pressable>
              <Pressable
                style={[styles.coverImageDeleteBtn, { backgroundColor: 'rgba(0,0,0,0.45)' }]}
                onPress={() => {
                  Alert.alert(t.project.deleteImage, t.project.confirmDeleteImage, [
                    { text: t.common.cancel, style: 'cancel' },
                    { text: t.common.delete, style: 'destructive', onPress: () => updateProject(id, { coverImage: undefined }) },
                  ]);
                }}
                hitSlop={8}
              >
                <Ionicons name="trash-outline" size={15} color="#fff" />
              </Pressable>
            </>
          ) : (
            <View style={[styles.coverImagePlaceholder, { backgroundColor: colors.background }]}>
              <View style={[styles.coverImageIconWrap, { backgroundColor: colors.border }]}>
                <Ionicons name="image-outline" size={36} color={colors.textTertiary} />
              </View>
              <Text style={[styles.coverImageHint, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {t.project.addImage}
              </Text>
            </View>
          )}
        </Pressable>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.statusCardTop}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Status</Text>
              <View style={[styles.statusRow, { marginTop: 10 }]}>
                <StatusButton s="planlagt" />
                <StatusButton s="aktiv" />
                <StatusButton s="ferdig" />
              </View>
            </View>
            <View style={{ alignItems: 'center', gap: 8, marginLeft: 12 }}>
              <ProgressRingLarge
                percent={project.status === 'ferdig' ? 100 : (project.progressPercent ?? 0)}
                size={64}
                strokeWidth={5}
                color={STATUS_COLORS[project.status]}
              />
              {project.status !== 'ferdig' && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Pressable
                    style={[styles.progressStepBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      const next = Math.max(0, (project.progressPercent ?? 0) - 5);
                      updateProject(id, { progressPercent: next });
                      Haptics.selectionAsync();
                    }}
                    hitSlop={6}
                  >
                    <Ionicons name="remove" size={14} color={colors.textSecondary} />
                  </Pressable>
                  <Pressable
                    style={[styles.progressStepBtn, { backgroundColor: colors.background }]}
                    onPress={() => {
                      const next = Math.min(100, (project.progressPercent ?? 0) + 5);
                      updateProject(id, { progressPercent: next });
                      Haptics.selectionAsync();
                    }}
                    hitSlop={6}
                  >
                    <Ionicons name="add" size={14} color={colors.textSecondary} />
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.project.details}</Text>
            <Pressable
              style={[styles.editCircleBtn, { backgroundColor: colors.primaryBtn }]}
              onPress={() => { setShowEditDetails(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            >
              <Ionicons name="pencil" size={14} color="#fff" />
            </Pressable>
          </View>

          <View style={styles.detailGrid}>
            <DetailCell label={t.project.to} value={project.recipient} placeholder={t.project.namePlaceholder} />
            <DetailCell label={t.project.size} value={project.size} placeholder={t.project.size} />
            <DetailCell label={t.project.gauge} value={project.gauge} placeholder={t.project.gauge} />
            <DetailCell label={t.project.needleSize} value={project.patternNeedleSize} placeholder={t.project.needleSize} />
            <DetailCell label={t.project.started} value={project.startDate} placeholder={t.project.notSet} />
            <DetailCell
              label={t.project.completed}
              value={project.endDate}
              placeholder={project.status === 'ferdig' ? t.project.notSet : t.project.notYet}
            />
          </View>

          {project.notes ? (
            <View style={[styles.notesBox, { backgroundColor: colors.background }]}>
              <Text style={[styles.notesLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.project.notes}</Text>
              <Text style={[styles.notesText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{project.notes}</Text>
            </View>
          ) : null}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              {t.project.yarn} ({allocatedYarn.length})
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
                {t.project.addYarnFromStorage}
              </Text>
            </Pressable>
          ) : (
            allocatedYarn.map(({ alloc, yarn, quality, brand }) => (
              <View key={alloc.yarnStockId} style={[styles.allocRow, { borderBottomColor: colors.border }]}>
                <View style={[styles.allocDot, { backgroundColor: yarn?.colorHex ?? '#ccc' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.allocName, { color: colors.text, fontFamily: 'Inter_500Medium' }]} numberOfLines={1}>
                    {yarn?.colorName ?? t.project.unknown}
                  </Text>
                  <Text style={[styles.allocSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                    {brand?.name} {quality?.name} · {alloc.skeinsAllocated} {t.home.statSkeins}
                  </Text>
                </View>
                <Pressable
                  onPress={() => {
                    Alert.alert(t.project.removeYarn, t.project.returnToStorage, [
                      { text: t.common.cancel, style: 'cancel' },
                      {
                        text: t.project.remove, style: 'destructive', onPress: () => {
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
              {t.project.needles} ({projectNeedles.length})
            </Text>
            <Pressable
              style={[styles.addSmallBtn, { backgroundColor: colors.primaryBtn }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddNeedle(true); }}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </Pressable>
          </View>
          {filteredNeedles.length === 0 ? (
            patternSize ? (
              <View style={[styles.emptyYarnRow, { borderColor: colors.border }]}>
                <Ionicons name="information-circle-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.emptyYarnText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {t.project.noSizeNeedles.replace('%s', normalizeSize(patternSize) ?? '')}
                </Text>
              </View>
            ) : (
              <Pressable
                style={[styles.emptyYarnRow, { borderColor: colors.border }]}
                onPress={() => setShowAddNeedle(true)}
              >
                <Ionicons name="add-circle-outline" size={20} color={colors.textTertiary} />
                <Text style={[styles.emptyYarnText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {t.project.addNewNeedle}
                </Text>
              </Pressable>
            )
          ) : (
            filteredNeedles.map(needle => {
              const isLinked = project.needleIds.includes(needle.id);
              const TYPE_LABELS: Record<string, string> = { rundpinne: t.needleTypes.rundpinne, strømpepinner: t.needleTypes.strompepinner, rett: t.needleTypes.rett };
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
                  <View style={[styles.needleSize, { backgroundColor: isLinked ? colors.primaryBtn + '22' : colors.badgeBg }]}>
                    <Text style={[styles.needleSizeText, { color: isLinked ? colors.primaryBtn : colors.badgeText, fontFamily: 'Inter_700Bold' }]}>{needle.size}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.needleLabel, { color: colors.text, fontFamily: isLinked ? 'Inter_500Medium' : 'Inter_400Regular' }]}>
                      {TYPE_LABELS[needle.type]}, {needle.lengthCm} cm
                    </Text>
                    <Text style={[{ fontSize: 12, color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                      {t.needleMaterials[needle.material as keyof typeof t.needleMaterials] ?? needle.material}
                    </Text>
                  </View>
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

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Text style={[styles.cardLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
              {t.project.log} ({projectLogs.length})
            </Text>
            <Pressable
              style={[styles.addSmallBtn, { backgroundColor: colors.primaryBtn }]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAddLog(true); }}
            >
              <Ionicons name="add" size={16} color="#fff" />
            </Pressable>
          </View>
          {projectLogs.length === 0 ? (
            <Pressable
              style={[styles.emptyYarnRow, { borderColor: colors.border }]}
              onPress={() => setShowAddLog(true)}
            >
              <Ionicons name="journal-outline" size={20} color={colors.textTertiary} />
              <Text style={[styles.emptyYarnText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {t.project.noLogEntries}
              </Text>
            </Pressable>
          ) : (
            projectLogs.map((entry, idx) => (
              <Pressable
                key={entry.id}
                style={[styles.logRow, { borderBottomColor: colors.border, borderBottomWidth: idx < projectLogs.length - 1 ? StyleSheet.hairlineWidth : 0 }]}
                onLongPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  Alert.alert(t.project.deleteEntry, t.project.confirmDeleteEntry, [
                    { text: t.common.cancel, style: 'cancel' },
                    { text: t.common.delete, style: 'destructive', onPress: () => deleteLogEntry(entry.id) },
                  ]);
                }}
              >
                <View style={styles.logRowTop}>
                  <Text style={[styles.logDate, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>{entry.date}</Text>
                  {entry.radStrikket ? (
                    <View style={[styles.logBadge, { backgroundColor: STATUS_COLORS[project.status] + '22' }]}>
                      <Text style={[styles.logBadgeText, { color: STATUS_COLORS[project.status], fontFamily: 'Inter_600SemiBold' }]}>
                        {entry.radStrikket} {entry.enhet ?? 'omg'}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {entry.notes ? (
                  <Text style={[styles.logNotes, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                    {entry.notes}
                  </Text>
                ) : null}
              </Pressable>
            ))
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
                endDate: newStatus === 'ferdig' ? new Date().toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US') : undefined,
                ...(newStatus !== 'ferdig' && { progressPercent: 0 }),
              });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }}
          >
            <Ionicons name={project.status === 'ferdig' ? 'refresh-outline' : 'checkmark-circle-outline'} size={18} color="#fff" />
            <Text style={[styles.finishBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
              {project.status === 'ferdig' ? t.project.reopen : t.project.completeProject}
            </Text>
          </Pressable>
          {project.status !== 'planlagt' && (
            <Pressable
              style={({ pressed }) => [styles.planBtn, { borderColor: colors.primaryBtn, opacity: pressed ? 0.8 : 1 }]}
              onPress={() => { updateProject(id, { status: 'planlagt' }); Haptics.selectionAsync(); }}
            >
              <Text style={[styles.planBtnText, { color: colors.primaryBtn, fontFamily: 'Inter_500Medium' }]}>{t.project.moveToPlans}</Text>
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
          if (yarnStock.length >= 5) {
            setShowAddYarn(false);
            setShowPremium(true);
            return;
          }
          const newYarn = addYarnStock({ qualityId, colorName, colorHex, skeins: skeinsTotal });
          allocateYarnToProject(id, newYarn.id, skeinsForProject);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
        excludeIds={project.yarnAllocations.map(a => a.yarnStockId)}
      />

      <AddNeedleModal
        visible={showAddNeedle}
        onClose={() => setShowAddNeedle(false)}
        defaultSize={defaultNeedleSize}
        onAdd={(needle) => {
          const newNeedle = addNeedle(needle);
          updateProject(id, { needleIds: [...project.needleIds, newNeedle.id] });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />

      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />

      <EditDetailsModal
        visible={showEditDetails}
        onClose={() => setShowEditDetails(false)}
        status={project.status}
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

      <AddLogModal
        visible={showAddLog}
        onClose={() => setShowAddLog(false)}
        onSave={(date, notes, mengde, enhet) => {
          addLogEntry({ projectId: id, date, notes, radStrikket: mengde, enhet });
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }}
      />
    </View>
  );
}

function AddLogModal({ visible, onClose, onSave }: {
  visible: boolean;
  onClose: () => void;
  onSave: (date: string, notes: string, mengde?: number, enhet?: 'cm' | 'omg') => void;
}) {
  const colors = useColors();
  const t = useT();
  const { language } = useLanguage();
  const locale = language === 'no' ? 'nb-NO' : 'en-US';
  const today = new Date().toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  const [date, setDate] = useState(today);
  const [notes, setNotes] = useState('');
  const [mengde, setMengde] = useState('');
  const [enhet, setEnhet] = useState<'cm' | 'omg'>('omg');

  const handleSave = () => {
    if (!date.trim()) return;
    onSave(date.trim(), notes.trim(), mengde ? parseInt(mengde, 10) || undefined : undefined, enhet);
    setDate(today);
    setNotes('');
    setMengde('');
    setEnhet('omg');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold', flex: 1 }]}>{t.project.logEntry}</Text>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color={colors.textTertiary} />
            </Pressable>
          </View>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.project.logDate}</Text>
          <TextInput
            style={[styles.detailInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
            value={date}
            onChangeText={setDate}
            placeholder={t.project.startDatePlaceholder}
            placeholderTextColor={colors.textTertiary}
          />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.project.notes}</Text>
          <TextInput
            style={[styles.detailInput, styles.notesInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
            value={notes}
            onChangeText={setNotes}
            placeholder={t.project.logPlaceholder}
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={300}
          />
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.project.logAmountLabel}</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              style={[styles.detailInput, { flex: 1, color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              value={mengde}
              onChangeText={setMengde}
              placeholder={t.project.rowsPlaceholder}
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />
            <View style={[styles.logEnhetToggle, { backgroundColor: colors.background }]}>
              {(['cm', 'omg'] as const).map(e => (
                <Pressable
                  key={e}
                  onPress={() => { setEnhet(e); Haptics.selectionAsync(); }}
                  style={[styles.logEnhetBtn, enhet === e && { backgroundColor: colors.primaryBtn }]}
                >
                  <Text style={[styles.logEnhetText, {
                    color: enhet === e ? '#fff' : colors.textSecondary,
                    fontFamily: enhet === e ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  }]}>{e === 'omg' ? t.project.unitRounds : e}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1, marginTop: 8 }]}
            onPress={handleSave}
          >
            <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.common.save}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
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
  coverImageCard: {
    borderRadius: 18,
    overflow: 'hidden',
    height: 220,
    position: 'relative',
  },
  coverImage: {
    width: '100%',
    height: '100%',
  },
  coverImagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 18,
  },
  coverImageIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverImageHint: {
    fontSize: 14,
    marginTop: 2,
  },
  coverImageFab: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 4,
    elevation: 4,
  },
  coverImageDeleteBtn: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  statusCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
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
  pill: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  pillText: { fontSize: 13 },
  inlineInputRow: { flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 14, padding: 10 },
  inlineInput: { flex: 1, fontSize: 15 },
  inlineBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  inlineBtnText: { color: '#fff', fontSize: 14 },
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
  colorPreviewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  colorPreviewSwatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  colorGrid: { gap: 6 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  presetColor: { width: 27, height: 27, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  presetColorSelected: { borderWidth: 2.5, borderColor: Colors.palette.navy },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 20, justifyContent: 'center' },
  counterBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 24 },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 10 },
  cancelBtnText: { fontSize: 15 },
  progressStepBtn: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logRow: {
    paddingVertical: 10,
    gap: 4,
  },
  logRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logDate: { fontSize: 14 },
  logBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  logBadgeText: { fontSize: 11 },
  logNotes: { fontSize: 13, lineHeight: 19 },
  logEnhetToggle: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  logEnhetBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  logEnhetText: { fontSize: 14 },
});
