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
import { useKnitting, Quality } from '@/context/KnittingContext';

const WEIGHT_CATEGORIES = ['Lace', 'Fingering', 'Sport', 'DK', 'Worsted', 'Bulky', 'Super Bulky'];

function QualityCard({ quality, onPress, onDelete }: { quality: Quality; onPress: () => void; onDelete: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { getYarnStockForQuality } = useKnitting();
  const stock = getYarnStockForQuality(quality.id);
  const totalSkeins = stock.reduce((s, y) => s + y.skeins, 0);

  return (
    <Pressable
      style={({ pressed }) => [styles.qualityCard, { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 }]}
      onPress={onPress}
      onLongPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        Alert.alert(quality.name, 'Hva vil du gjøre?', [
          { text: 'Avbryt', style: 'cancel' },
          { text: 'Slett', style: 'destructive', onPress: onDelete },
        ]);
      }}
    >
      <View style={styles.qualityCardLeft}>
        <View style={[styles.weightBadge, { backgroundColor: isDark ? Colors.palette.navyLight : Colors.palette.navy }]}>
          <Text style={[styles.weightBadgeText, { fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
            {quality.weightCategory}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.qualityName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]} numberOfLines={1}>
            {quality.name}
          </Text>
          <Text style={[styles.qualityFiber, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]} numberOfLines={1}>
            {quality.fiberContent}
          </Text>
          <Text style={[styles.qualityMeta, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
            {quality.gramsPerSkein}g / {quality.metersPerSkein}m per nøste
          </Text>
        </View>
      </View>
      <View style={styles.qualityRight}>
        <View style={styles.colorPreview}>
          {stock.slice(0, 4).map((y, i) => (
            <View key={i} style={[styles.colorDot, { backgroundColor: y.colorHex, marginLeft: i > 0 ? -4 : 0 }]} />
          ))}
        </View>
        <Text style={[styles.skeinCount, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
          {totalSkeins} nøster
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

function AddQualityModal({ brandId, visible, onClose }: { brandId: string; visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const [name, setName] = useState('');
  const [weight, setWeight] = useState('DK');
  const [fiber, setFiber] = useState('');
  const [grams, setGrams] = useState('50');
  const [meters, setMeters] = useState('');
  const { addQuality } = useKnitting();

  const handleAdd = useCallback(() => {
    if (!name.trim() || !meters.trim()) return;
    addQuality({
      brandId,
      name: name.trim(),
      weightCategory: weight,
      fiberContent: fiber.trim(),
      gramsPerSkein: parseFloat(grams) || 50,
      metersPerSkein: parseFloat(meters) || 100,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName(''); setFiber(''); setGrams('50'); setMeters('');
    onClose();
  }, [name, weight, fiber, grams, meters, brandId, addQuality, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Ny kvalitet</Text>

            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Kvalitetsnavn (f.eks. Tynn Merinoull)"
              placeholderTextColor={colors.textTertiary}
              value={name}
              onChangeText={setName}
              autoFocus
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Garntykkelse</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ maxHeight: 44 }}>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                {WEIGHT_CATEGORIES.map(w => (
                  <Pressable
                    key={w}
                    onPress={() => setWeight(w)}
                    style={[styles.optionPill, {
                      backgroundColor: weight === w ? Colors.palette.navy : colors.background,
                      borderColor: weight === w ? Colors.palette.navy : colors.border,
                    }]}
                  >
                    <Text style={[styles.optionPillText, {
                      color: weight === w ? '#fff' : colors.textSecondary,
                      fontFamily: weight === w ? 'Inter_600SemiBold' : 'Inter_400Regular',
                    }]}>{w}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
              placeholder="Fiber (f.eks. 100% Merinoull)"
              placeholderTextColor={colors.textTertiary}
              value={fiber}
              onChangeText={setFiber}
            />

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Gram/nøste</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                  placeholder="50"
                  placeholderTextColor={colors.textTertiary}
                  value={grams}
                  onChangeText={setGrams}
                  keyboardType="decimal-pad"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Meter/nøste</Text>
                <TextInput
                  style={[styles.input, { color: colors.text, backgroundColor: colors.background }]}
                  placeholder="200"
                  placeholderTextColor={colors.textTertiary}
                  value={meters}
                  onChangeText={setMeters}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

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

export default function MerkeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const { getBrandById, getQualitiesForBrand, deleteBrand, deleteQuality } = useKnitting();
  const [showAdd, setShowAdd] = useState(false);

  const brand = getBrandById(id);
  const qualities = getQualitiesForBrand(id);

  if (!brand) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textTertiary }}>Merke ikke funnet</Text>
      </View>
    );
  }

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 4 }]}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.brandTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]} numberOfLines={1}>
            {brand.name}
          </Text>
          <Text style={[styles.brandSub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            {qualities.length} {qualities.length === 1 ? 'kvalitet' : 'kvaliteter'}
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
            Alert.alert(`Slett ${brand.name}`, 'Dette sletter merket og alle tilknyttede kvaliteter og farger.', [
              { text: 'Avbryt', style: 'cancel' },
              { text: 'Slett', style: 'destructive', onPress: () => { deleteBrand(id); router.back(); } },
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
        {qualities.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="layers-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              Ingen kvaliteter ennå
            </Text>
            <Pressable
              style={[styles.emptyBtn, { backgroundColor: Colors.palette.navy }]}
              onPress={() => setShowAdd(true)}
            >
              <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til kvalitet</Text>
            </Pressable>
          </View>
        ) : (
          qualities.map(q => (
            <QualityCard
              key={q.id}
              quality={q}
              onPress={() => router.push({ pathname: '/kvalitet/[id]', params: { id: q.id } })}
              onDelete={() => {
                deleteQuality(q.id);
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              }}
            />
          ))
        )}
      </ScrollView>

      <AddQualityModal brandId={id} visible={showAdd} onClose={() => setShowAdd(false)} />
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
  brandTitle: { fontSize: 22 },
  brandSub: { fontSize: 13, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: { padding: 8 },
  listContent: { padding: 20, gap: 10 },
  qualityCard: {
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
  qualityCardLeft: { flex: 1, flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  weightBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 2,
  },
  weightBadgeText: { fontSize: 11, color: '#fff' },
  qualityName: { fontSize: 15, marginBottom: 3 },
  qualityFiber: { fontSize: 12, marginBottom: 3 },
  qualityMeta: { fontSize: 12 },
  qualityRight: { alignItems: 'flex-end', gap: 4 },
  colorPreview: { flexDirection: 'row' },
  colorDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: '#fff' },
  skeinCount: { fontSize: 12 },
  emptyState: { alignItems: 'center', paddingVertical: 80, gap: 12 },
  emptyText: { fontSize: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4 },
  fieldLabel: { fontSize: 13, marginBottom: 2, marginTop: 6 },
  input: { borderRadius: 12, padding: 14, fontSize: 16 },
  row: { flexDirection: 'row', gap: 10 },
  optionPill: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5 },
  optionPillText: { fontSize: 13 },
  modalBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 15 },
});
