import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  TextInput,
  Platform,
  useColorScheme,
  Modal,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, YarnStock } from '@/context/KnittingContext';

const PRESET_COLORS = [
  { name: 'Natthimmel', hex: '#2E3D6E' },
  { name: 'Havregrå', hex: '#B0A8A0' },
  { name: 'Dusty Rose', hex: '#C97B84' },
  { name: 'Skoggrønn', hex: '#5C9E8A' },
  { name: 'Elfenben', hex: '#F5EDE8' },
  { name: 'Solhvit', hex: '#F9F4E8' },
  { name: 'Mørkeblå', hex: '#1A2340' },
  { name: 'Rust', hex: '#C4603A' },
  { name: 'Burgunder', hex: '#7D2E3A' },
  { name: 'Sennep', hex: '#C4903A' },
  { name: 'Lavendel', hex: '#8B7CB8' },
  { name: 'Koks', hex: '#3D3D3D' },
  { name: 'Offwhite', hex: '#FAF8F4' },
  { name: 'Terrakotta', hex: '#C1734A' },
  { name: 'Lyseblå', hex: '#8AAEE8' },
  { name: 'Mosegrønn', hex: '#6B7C56' },
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
        <SkeinCounter value={yarn.skeins} onChange={onSkeinChange} />
        <Pressable
          onPress={() => {
            Alert.alert('Slett farge', `Slett ${yarn.colorName}?`, [
              { text: 'Avbryt', style: 'cancel' },
              { text: 'Slett', style: 'destructive', onPress: onDelete },
            ]);
          }}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={15} color={colors.textTertiary} />
        </Pressable>
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
  const [customHex, setCustomHex] = useState('');
  const [skeins, setSkeins] = useState(1);
  const { addYarnStock } = useKnitting();

  const finalHex = customHex.startsWith('#') && customHex.length >= 4 ? customHex : selectedHex;

  const handleAdd = useCallback(() => {
    if (!colorName.trim()) return;
    addYarnStock({ qualityId, colorName: colorName.trim(), colorHex: finalHex, skeins });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setColorName(''); setSkeins(1); setCustomHex('');
    onClose();
  }, [colorName, finalHex, skeins, qualityId, addYarnStock, onClose]);

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
              <View style={[styles.bigColorSwatch, { backgroundColor: finalHex }]} />
              <View style={{ flex: 1, gap: 8 }}>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                  placeholder="Fargenavn"
                  placeholderTextColor={colors.textTertiary}
                  value={colorName}
                  onChangeText={setColorName}
                  autoFocus
                />
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                  placeholder="#hex (valgfritt)"
                  placeholderTextColor={colors.textTertiary}
                  value={customHex}
                  onChangeText={setCustomHex}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Velg farge</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map(c => (
                <Pressable
                  key={c.hex}
                  onPress={() => { setSelectedHex(c.hex); setColorName(prev => prev || c.name); }}
                  style={[
                    styles.presetColor,
                    { backgroundColor: c.hex },
                    selectedHex === c.hex && !customHex && styles.presetColorSelected,
                  ]}
                />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Antall nøster</Text>
            <SkeinCounter value={skeins} onChange={setSkeins} />

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: Colors.palette.navy, opacity: pressed ? 0.85 : 1 }]}
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
            {brand?.name} · {quality.weightCategory}
          </Text>
        </View>
        <Pressable
          style={[styles.addBtn, { backgroundColor: Colors.palette.navy }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowAdd(true);
          }}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
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
              style={[styles.emptyBtn, { backgroundColor: Colors.palette.navy }]}
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
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
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
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  presetColor: { width: 36, height: 36, borderRadius: 18 },
  presetColorSelected: { borderWidth: 3, borderColor: Colors.palette.navy },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 15 },
});
