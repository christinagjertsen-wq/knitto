import React, { useState, useCallback, useMemo } from 'react';
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
import { ColorPickerModal } from '@/components/ColorPickerModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useColors } from '@/context/ThemeContext';
import { useT } from '@/context/LanguageContext';
import { useKnitting, YarnStock } from '@/context/KnittingContext';
import { PremiumModal } from '@/components/PremiumModal';
import { useSubscription } from '@/lib/revenuecat';

const PRESET_COLORS = [
  { name: 'Hvit', hex: '#FFFFFF' },
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

  { name: 'Svart', hex: '#000000' },
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

function SkeinCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colors = useColors();

  return (
    <View style={styles.counter}>
      <Pressable
        style={[styles.counterBtn, { backgroundColor: colors.background }]}
        onPress={() => { onChange(Math.max(0, value - 1)); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      >
        <Ionicons name="remove" size={20} color={colors.text} />
      </Pressable>
      <Text style={[styles.counterValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{value}</Text>
      <Pressable
        style={[styles.counterBtn, { backgroundColor: colors.background }]}
        onPress={() => { onChange(value + 1); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
      >
        <Ionicons name="add" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

function YarnCard({ yarn, onDelete, onSkeinChange }: { yarn: YarnStock; onDelete: () => void; onSkeinChange: (v: number) => void }) {
  const colors = useColors();

  const handleSkeinChange = (v: number) => {
    if (v <= 0) {
      Alert.alert('Slett farge', `Er du sikker på at du vil slette ${yarn.colorName}?`, [
        { text: 'Avbryt', style: 'cancel' },
        { text: 'Slett', style: 'destructive', onPress: onDelete },
      ]);
    } else {
      onSkeinChange(v);
    }
  };

  return (
    <View style={[styles.yarnCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.colorSwatch, { backgroundColor: yarn.colorHex }]} />
      <View style={styles.yarnCardContent}>
        <Text style={[styles.colorName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {yarn.colorName}
        </Text>
      </View>
      <View style={styles.yarnCardRight}>
        <SkeinCounter value={yarn.skeins} onChange={handleSkeinChange} />
      </View>
    </View>
  );
}

function AddYarnModal({ qualityId, visible, onClose, onPaywall }: { qualityId: string; visible: boolean; onClose: () => void; onPaywall: () => void }) {
  const colors = useColors();
  const t = useT();
  const [colorName, setColorName] = useState('');
  const [selectedHex, setSelectedHex] = useState('#C97B84');
  const [skeins, setSkeins] = useState(1);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const { addYarnStock, yarnStock } = useKnitting();
  const { isSubscribed } = useSubscription();

  const handleAdd = useCallback(() => {
    if (!colorName.trim()) return;
    if (!isSubscribed && yarnStock.length >= 50) {
      onClose();
      onPaywall();
      return;
    }
    addYarnStock({ qualityId, colorName: colorName.trim(), colorHex: selectedHex, skeins });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setColorName(''); setSkeins(1); setSelectedHex('#C97B84');
    onClose();
  }, [colorName, selectedHex, skeins, qualityId, addYarnStock, onClose, onPaywall, yarnStock, isSubscribed]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.quality.newColor}</Text>

            <View style={styles.colorPreviewRow}>
              <View style={[styles.bigColorSwatch, { backgroundColor: selectedHex }, selectedHex === '#FFFFFF' && { borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.15)' }]} />
              <TextInput
                style={[styles.input, { flex: 1, color: colors.text, backgroundColor: colors.background }]}
                placeholder={t.quality.colorNamePlaceholder}
                placeholderTextColor={colors.textTertiary}
                value={colorName}
                onChangeText={setColorName}
                autoFocus
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.quality.chooseColor}</Text>
            <View style={styles.colorGrid}>
              {Array.from({ length: 6 }, (_, rowIndex) => (
                <View key={rowIndex} style={styles.colorRow}>
                  {PRESET_COLORS.slice(rowIndex * 10, rowIndex * 10 + 10).map(c => (
                    <Pressable
                      key={c.hex}
                      onPress={() => { setSelectedHex(c.hex); Haptics.selectionAsync(); }}
                      style={[
                        styles.presetColor,
                        { backgroundColor: c.hex },
                        selectedHex === c.hex && styles.presetColorSelected,
                      ]}
                    />
                  ))}
                </View>
              ))}
            </View>

            <Pressable
              style={[styles.customColorBtn, { borderColor: colors.border, backgroundColor: colors.background }]}
              onPress={() => setShowColorPicker(true)}
            >
              <Ionicons name="color-palette-outline" size={16} color={colors.textSecondary} />
              <Text style={[styles.customColorBtnText, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                Legg til spesiell farge
              </Text>
            </Pressable>

            <ColorPickerModal
              visible={showColorPicker}
              initialHex={selectedHex}
              onClose={() => setShowColorPicker(false)}
              onSelect={(hex) => { setSelectedHex(hex); }}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.quality.skeinsLabel}</Text>
            <SkeinCounter value={skeins} onChange={setSkeins} />

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleAdd}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.common.add}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t.common.cancel}</Text>
            </Pressable>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function KvalitetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const { getQualityById, getYarnStockForQuality, getBrandById, deleteQuality, deleteYarnStock, updateYarnStock, updateQuality } = useKnitting();
  const [showAdd, setShowAdd] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showFiberEdit, setShowFiberEdit] = useState(false);
  const [fiberInput, setFiberInput] = useState('');

  const quality = getQualityById(id);
  const brand = quality ? getBrandById(quality.brandId) : undefined;
  const yarnStock = getYarnStockForQuality(id);
  const totalSkeins = yarnStock.reduce((s, y) => s + y.skeins, 0);
  const totalGrams = quality ? totalSkeins * quality.gramsPerSkein : 0;
  const totalMeters = quality ? totalSkeins * quality.metersPerSkein : 0;

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (!quality) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textTertiary }}>Kvalitet ikke funnet</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 20 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)/lager')}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.qualityTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {quality.name}
          </Text>
          <Text style={[styles.qualitySub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            {brand?.name}
          </Text>
        </View>
        <Pressable
          style={styles.deleteBtn}
          onPress={() => {
            Alert.alert(t.quality.deleteQuality, t.quality.confirmDeleteQuality.replace('%s', ''), [
              { text: t.common.cancel, style: 'cancel' },
              { text: t.common.delete, style: 'destructive', onPress: () => { deleteQuality(id); router.back(); } },
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
        {quality.fiberContent ? (
          <Text style={[styles.fiberLine, { color: colors.textSecondary, fontFamily: 'Inter_400Regular', textAlign: 'center' }]}>
            {quality.fiberContent}
          </Text>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.fiberAddBtn, { opacity: pressed ? 0.7 : 1 }]}
            onPress={() => { setFiberInput(''); setShowFiberEdit(true); }}
          >
            <Ionicons name="add-circle-outline" size={15} color={colors.primaryBtn} />
            <Text style={[styles.fiberAddBtnText, { color: colors.primaryBtn, fontFamily: 'Inter_500Medium' }]}>
              {t.quality.addFiber}
            </Text>
          </Pressable>
        )}
        {quality.gramsPerSkein ? (
          <Text style={[styles.fiberLineSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular', textAlign: 'center' }]}>
            {quality.gramsPerSkein}g · {quality.metersPerSkein}m {t.quality.skein}
          </Text>
        ) : null}

        <View style={styles.miniStatsRow}>
          <View style={[styles.miniStatCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalSkeins.toLocaleString('nb-NO')}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.quality.skeins}</Text>
          </View>
          <View style={[styles.miniStatCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalGrams.toLocaleString('nb-NO')}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.home.statGrams}</Text>
          </View>
          <View style={[styles.miniStatCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalMeters.toLocaleString('nb-NO')}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.home.statMeters}</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold', textAlign: 'center' }]}>
          {yarnStock.length} {yarnStock.length === 1 ? t.project.colorSingular : t.project.colorPlural}
        </Text>

        {yarnStock.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="color-palette-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {t.quality.noColors}
            </Text>
          </View>
        ) : (
          yarnStock.map(yarn => (
            <YarnCard
              key={yarn.id}
              yarn={yarn}
              onDelete={() => {
                deleteYarnStock(yarn.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
              onSkeinChange={(v) => updateYarnStock(yarn.id, { skeins: v })}
            />
          ))
        )}
      </ScrollView>

      <AddYarnModal qualityId={id} visible={showAdd} onClose={() => setShowAdd(false)} onPaywall={() => setShowPremium(true)} />
      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />

      <Modal visible={showFiberEdit} transparent animationType="fade" onRequestClose={() => setShowFiberEdit(false)}>
        <View style={styles.modalOverlay}>

          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Fiberinnhold</Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder="100% Merinoull"
              placeholderTextColor={colors.textTertiary}
              value={fiberInput}
              onChangeText={setFiberInput}
              autoFocus
              autoCapitalize="sentences"
              returnKeyType="done"
              onSubmitEditing={() => {
                if (fiberInput.trim()) {
                  updateQuality(id, { fiberContent: fiberInput.trim() });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setShowFiberEdit(false);
              }}
            />
            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                if (fiberInput.trim()) {
                  updateQuality(id, { fiberContent: fiberInput.trim() });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setShowFiberEdit(false);
              }}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setShowFiberEdit(false)}>
              <Text style={[{ color: colors.textSecondary, fontSize: 15, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
            </Pressable>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primaryBtn, bottom: (Platform.OS === 'web' ? 34 : insets.bottom) + 24 }]}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowAdd(true); }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
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
    gap: 8,
  },
  backBtn: { padding: 4, minWidth: 40 },
  qualityTitle: { fontSize: 22, textAlign: 'center' },
  qualitySub: { fontSize: 13, marginTop: 2, textAlign: 'center' },
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
  deleteBtn: { padding: 8, minWidth: 40, alignItems: 'flex-end' },
  listContent: { padding: 16, gap: 10 },
  qualityInfo: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  fiberLine: { fontSize: 13, marginBottom: 4 },
  fiberLineSub: { fontSize: 12, marginBottom: 12 },
  miniStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  miniStatCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniStatNum: { fontSize: 18 },
  miniStatLabel: { fontSize: 11, marginTop: 3 },
  sectionTitle: { fontSize: 16, marginTop: 4, marginBottom: 4 },
  yarnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  colorSwatch: { width: 56, alignSelf: 'stretch', minHeight: 72 },
  yarnCardContent: { flex: 1, padding: 14, justifyContent: 'center' },
  colorName: { fontSize: 15 },
  hexCode: { fontSize: 12 },
  yarnCardRight: { paddingRight: 14, alignItems: 'center', gap: 10 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  counterBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 18, minWidth: 28, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4, textAlign: 'center' },
  colorPreviewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bigColorSwatch: { width: 64, height: 64, borderRadius: 32 },
  fieldLabel: { fontSize: 13, marginBottom: 4, marginTop: 8, textAlign: 'center' },
  input: { borderRadius: 12, padding: 12, fontSize: 15 },
  colorGrid: { gap: 6 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  presetColor: { width: 27, height: 27, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  customColorBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 10, borderRadius: 12, borderWidth: 1, marginTop: 4 },
  customColorBtnText: { fontSize: 14 },
  presetColorSelected: { borderWidth: 2.5, borderColor: Colors.palette.navy },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 15 },
  modalInput: { borderRadius: 12, padding: 14, fontSize: 15, marginTop: 4 },
  modalCancel: { alignItems: 'center', padding: 10 },
  fiberAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    marginBottom: 4,
  },
  fiberAddBtnText: { fontSize: 14 },
});
