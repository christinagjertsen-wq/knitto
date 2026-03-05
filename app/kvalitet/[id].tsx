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
import { useColorScheme } from '@/hooks/useColorScheme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, YarnStock } from '@/context/KnittingContext';

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

function SkeinCounter({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

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
        <Text style={[styles.hexCode, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
          {yarn.colorHex}
        </Text>
      </View>
      <View style={styles.yarnCardRight}>
        <SkeinCounter value={yarn.skeins} onChange={handleSkeinChange} />
      </View>
    </View>
  );
}

function AddYarnModal({ qualityId, visible, onClose }: { qualityId: string; visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const [colorName, setColorName] = useState('');
  const [selectedHex, setSelectedHex] = useState('#C97B84');
  const [skeins, setSkeins] = useState(1);
  const { addYarnStock } = useKnitting();

  const handleAdd = useCallback(() => {
    if (!colorName.trim()) return;
    addYarnStock({ qualityId, colorName: colorName.trim(), colorHex: selectedHex, skeins });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setColorName(''); setSkeins(1); setSelectedHex('#C97B84');
    onClose();
  }, [colorName, selectedHex, skeins, qualityId, addYarnStock, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Ny farge</Text>

            <View style={styles.colorPreviewRow}>
              <View style={[styles.bigColorSwatch, { backgroundColor: selectedHex }]} />
              <TextInput
                style={[styles.input, { flex: 1, color: colors.text, backgroundColor: colors.background }]}
                placeholder="Fargenavn"
                placeholderTextColor={colors.textTertiary}
                value={colorName}
                onChangeText={setColorName}
                autoFocus
              />
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Velg farge</Text>
            <View style={styles.colorGrid}>
              {Array.from({ length: 7 }, (_, rowIndex) => (
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

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Antall nøster</Text>
            <SkeinCounter value={skeins} onChange={setSkeins} />

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleAdd}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>Avbryt</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function KvalitetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { getQualityById, getYarnStockForQuality, getBrandById, deleteQuality, deleteYarnStock, updateYarnStock } = useKnitting();
  const [showAdd, setShowAdd] = useState(false);

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
      <View style={[styles.header, { paddingTop: topInset + 4 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
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
            Alert.alert('Slett kvalitet', 'Sletter denne kvaliteten og alle farger.', [
              { text: 'Avbryt', style: 'cancel' },
              { text: 'Slett', style: 'destructive', onPress: () => { deleteQuality(id); router.back(); } },
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
        <View style={[styles.qualityInfo, { backgroundColor: colors.surface }]}>
          <Text style={[styles.infoRow, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {quality.fiberContent || 'Fiber ikke angitt'}
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalSkeins}</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>nøster</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalGrams}g</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>gram</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalMeters}m</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>meter</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={[styles.statNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{quality.gramsPerSkein}g</Text>
              <Text style={[styles.statLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>per nøste</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          Farger ({yarnStock.length})
        </Text>

        {yarnStock.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="color-palette-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              Ingen farger ennå
            </Text>
            <Pressable
              style={[styles.emptyBtn, { backgroundColor: colors.primaryBtn }]}
              onPress={() => setShowAdd(true)}
            >
              <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til farge</Text>
            </Pressable>
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

      <AddYarnModal qualityId={id} visible={showAdd} onClose={() => setShowAdd(false)} />

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
  backBtn: { padding: 4 },
  qualityTitle: { fontSize: 22 },
  qualitySub: { fontSize: 13, marginTop: 2 },
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
  deleteBtn: { padding: 8 },
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
  infoRow: { fontSize: 14, marginBottom: 12 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  stat: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18 },
  statLabel: { fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: '#E5EAF2' },
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
  yarnCardContent: { flex: 1, padding: 14, gap: 3 },
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
  modalTitle: { fontSize: 22, marginBottom: 4 },
  colorPreviewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bigColorSwatch: { width: 64, height: 64, borderRadius: 32 },
  fieldLabel: { fontSize: 13, marginBottom: 4, marginTop: 8 },
  input: { borderRadius: 12, padding: 12, fontSize: 15 },
  colorGrid: { gap: 6 },
  colorRow: { flexDirection: 'row', justifyContent: 'space-between' },
  presetColor: { width: 27, height: 27, borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.1)' },
  presetColorSelected: { borderWidth: 2.5, borderColor: Colors.palette.navy },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 15 },
});
