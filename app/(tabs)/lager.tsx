import React, { useState, useRef, useMemo, useCallback } from 'react';
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
import { useKnitting, Brand, Needle, NeedleType, NeedleMaterial } from '@/context/KnittingContext';

type Tab = 'garn' | 'pinner';

const NEEDLE_TYPE_LABELS: Record<NeedleType, string> = {
  rundpinne: 'Rundpinne',
  strømpepinner: 'Strømpepinner',
  rett: 'Rett',
};

const NEEDLE_MATERIAL_LABELS: Record<NeedleMaterial, string> = {
  bambus: 'Bambus',
  metall: 'Metall',
  plast: 'Plast',
  tre: 'Tre',
};

const NEEDLE_MATERIAL_ICONS: Record<NeedleMaterial, string> = {
  bambus: '🌿',
  metall: '⚡',
  plast: '💎',
  tre: '🌲',
};

function BrandCard({ brand }: { brand: Brand }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const { getQualitiesForBrand, getYarnStockForQuality } = useKnitting();
  const qualities = getQualitiesForBrand(brand.id);
  const allYarn = qualities.flatMap(q => getYarnStockForQuality(q.id));
  const totalSkeins = allYarn.reduce((sum, y) => sum + y.skeins, 0);
  const sampleColors = allYarn.slice(0, 5).map(y => y.colorHex);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.brandCard,
        { backgroundColor: colors.surface, opacity: pressed ? 0.85 : 1 },
      ]}
      onPress={() => router.push({ pathname: '/merke/[id]', params: { id: brand.id } })}
    >
      <View style={styles.brandCardLeft}>
        <View style={[styles.brandInitial, { backgroundColor: colors.badgeBg }]}>
          <Text style={[styles.brandInitialText, { color: colors.badgeText, fontFamily: 'Inter_700Bold' }]}>
            {brand.name.charAt(0)}
          </Text>
        </View>
        <View>
          <Text style={[styles.brandName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            {brand.name}
          </Text>
          <Text style={[styles.brandMeta, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            {qualities.length} {qualities.length === 1 ? 'kvalitet' : 'kvaliteter'}
            {totalSkeins > 0 ? ` · ${totalSkeins} nøster` : ''}
          </Text>
          {sampleColors.length > 0 && (
            <View style={styles.colorStrip}>
              {sampleColors.map((hex, i) => (
                <View key={i} style={[styles.colorDot, { backgroundColor: hex }]} />
              ))}
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

function NeedleCard({ needle, onDelete }: { needle: Needle; onDelete: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;

  return (
    <View style={[styles.needleCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.needleSize, { backgroundColor: colors.badgeBg }]}>
        <Text style={[styles.needleSizeText, { color: colors.badgeText, fontFamily: 'Inter_700Bold' }]}>{needle.size}</Text>
        <Text style={[styles.needleSizeUnit, { color: colors.badgeText, fontFamily: 'Inter_400Regular' }]}>mm</Text>
      </View>
      <View style={styles.needleInfo}>
        <Text style={[styles.needleType, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
          {NEEDLE_TYPE_LABELS[needle.type]}
        </Text>
        <Text style={[styles.needleMeta, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
          {needle.lengthCm} cm · {NEEDLE_MATERIAL_LABELS[needle.material]}
        </Text>
      </View>
      <View style={styles.needleRight}>
        <View style={[styles.quantityBadge, { backgroundColor: isDark ? Colors.palette.navyLight : Colors.palette.surfaceSecondary }]}>
          <Text style={[styles.quantityText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            {needle.quantity}
          </Text>
        </View>
        <Pressable
          onPress={() => {
            Alert.alert('Slett pinne', 'Er du sikker?', [
              { text: 'Avbryt', style: 'cancel' },
              { text: 'Slett', style: 'destructive', onPress: onDelete },
            ]);
          }}
          hitSlop={8}
        >
          <Ionicons name="trash-outline" size={16} color={colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

function AddBrandModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const [name, setName] = useState('');
  const { addBrand } = useKnitting();

  const handleAdd = useCallback(() => {
    if (!name.trim()) return;
    addBrand(name.trim());
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setName('');
    onClose();
  }, [name, addBrand, onClose]);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
          <View style={styles.modalHandle} />
          <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Nytt garnmerke
          </Text>
          <TextInput
            style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
            placeholder="Navn på merke (f.eks. Sandnes Garn)"
            placeholderTextColor={colors.textTertiary}
            value={name}
            onChangeText={setName}
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleAdd}
          />
          <Pressable
            style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
            onPress={handleAdd}
          >
            <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function AddNeedleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const [size, setSize] = useState('');
  const [type, setType] = useState<NeedleType>('rundpinne');
  const [length, setLength] = useState('');
  const [material, setMaterial] = useState<NeedleMaterial>('metall');
  const [quantity, setQuantity] = useState('1');
  const { addNeedle } = useKnitting();

  const handleAdd = useCallback(() => {
    if (!size.trim() || !length.trim()) return;
    addNeedle({
      size: size.trim(),
      type,
      lengthCm: parseFloat(length) || 60,
      material,
      quantity: parseInt(quantity) || 1,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSize(''); setLength(''); setQuantity('1');
    onClose();
  }, [size, type, length, material, quantity, addNeedle, onClose]);

  const OptionPill = ({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) => (
    <Pressable
      onPress={onPress}
      style={[
        styles.optionPill,
        {
          backgroundColor: selected ? colors.primaryBtn : colors.background,
          borderColor: selected ? colors.primaryBtn : colors.border,
        },
      ]}
    >
      <Text style={[styles.optionPillText, {
        color: selected ? '#fff' : colors.textSecondary,
        fontFamily: selected ? 'Inter_600SemiBold' : 'Inter_400Regular',
      }]}>
        {label}
      </Text>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalOverlay}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              Ny pinne
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Størrelse (mm)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder="f.eks. 3.5"
              placeholderTextColor={colors.textTertiary}
              value={size}
              onChangeText={setSize}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Type</Text>
            <View style={styles.pillRow}>
              {(['rundpinne', 'strømpepinner', 'rett'] as NeedleType[]).map(t => (
                <OptionPill key={t} label={NEEDLE_TYPE_LABELS[t]} selected={type === t} onPress={() => setType(t)} />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Lengde (cm)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder="f.eks. 80"
              placeholderTextColor={colors.textTertiary}
              value={length}
              onChangeText={setLength}
              keyboardType="numeric"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Materiale</Text>
            <View style={styles.pillRow}>
              {(['bambus', 'metall', 'plast', 'tre'] as NeedleMaterial[]).map(m => (
                <OptionPill key={m} label={NEEDLE_MATERIAL_LABELS[m]} selected={material === m} onPress={() => setMaterial(m)} />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Antall</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder="1"
              placeholderTextColor={colors.textTertiary}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
              onPress={handleAdd}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function LagerScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? Colors.dark : Colors.light;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('garn');
  const [search, setSearch] = useState('');
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddNeedle, setShowAddNeedle] = useState(false);
  const { brands, needles, deleteNeedle, getQualitiesForBrand, getYarnStockForQuality, getTotalStats } = useKnitting();

  const stats = getTotalStats();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  const filteredBrands = useMemo(() =>
    brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [brands, search]
  );

  const sortedNeedles = useMemo(() =>
    [...needles].sort((a, b) => parseFloat(a.size) - parseFloat(b.size)),
    [needles]
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.screenTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Lager</Text>
        <Pressable
          style={[styles.addBtn, { backgroundColor: colors.primaryBtn }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            activeTab === 'garn' ? setShowAddBrand(true) : setShowAddNeedle(true);
          }}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      <View style={styles.segmentContainer}>
        <View style={[styles.segment, { backgroundColor: isDark ? colors.surface : '#E1E8F0' }]}>
          {(['garn', 'pinner'] as Tab[]).map(tab => (
            <Pressable
              key={tab}
              style={[styles.segmentTab, activeTab === tab && { backgroundColor: isDark ? Colors.palette.navyLight : '#fff' }]}
              onPress={() => {
                setActiveTab(tab);
                setSearch('');
                Haptics.selectionAsync();
              }}
            >
              <Text style={[styles.segmentText, {
                color: activeTab === tab ? colors.text : colors.textTertiary,
                fontFamily: activeTab === tab ? 'Inter_600SemiBold' : 'Inter_400Regular',
              }]}>
                {tab === 'garn' ? 'Garn' : 'Pinner'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {activeTab === 'garn' && (
        <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
          <Ionicons name="search" size={16} color={colors.textTertiary} />
          <TextInput
            style={[styles.searchInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
            placeholder="Søk merke..."
            placeholderTextColor={colors.textTertiary}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: Platform.OS === 'web' ? 34 : 20 },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'garn' && (
          <>
            <View style={styles.miniStatsRow}>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{stats.totalSkeins}</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>nøster</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{stats.totalGrams}g</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>gram</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{stats.totalMeters}m</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>meter</Text>
              </View>
            </View>

            {filteredBrands.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="archive-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {search ? 'Ingen merker funnet' : 'Ingen garnmerker ennå'}
                </Text>
                {!search && (
                  <Pressable
                    style={[styles.emptyBtn, { backgroundColor: colors.primaryBtn }]}
                    onPress={() => setShowAddBrand(true)}
                  >
                    <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til merke</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              filteredBrands.map(brand => <BrandCard key={brand.id} brand={brand} />)
            )}
          </>
        )}

        {activeTab === 'pinner' && (
          <>
            {sortedNeedles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="construct-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  Ingen pinner registrert
                </Text>
                <Pressable
                  style={[styles.emptyBtn, { backgroundColor: colors.primaryBtn }]}
                  onPress={() => setShowAddNeedle(true)}
                >
                  <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Legg til pinne</Text>
                </Pressable>
              </View>
            ) : (
              sortedNeedles.map(needle => (
                <NeedleCard
                  key={needle.id}
                  needle={needle}
                  onDelete={() => {
                    deleteNeedle(needle.id);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      <AddBrandModal visible={showAddBrand} onClose={() => setShowAddBrand(false)} />
      <AddNeedleModal visible={showAddNeedle} onClose={() => setShowAddNeedle(false)} />
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
  segmentContainer: { paddingHorizontal: 20, marginBottom: 12 },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
  },
  segmentTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  },
  segmentText: { fontSize: 14 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 20,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  searchInput: { flex: 1, fontSize: 15 },
  listContent: { padding: 20, paddingTop: 0, gap: 10 },
  miniStatsRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  miniStat: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  miniStatNum: { fontSize: 18 },
  miniStatLabel: { fontSize: 11, marginTop: 2 },
  brandCard: {
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
  brandCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 14 },
  brandInitial: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandInitialText: { fontSize: 20, color: '#fff' },
  brandName: { fontSize: 16, marginBottom: 3 },
  brandMeta: { fontSize: 13, marginBottom: 4 },
  colorStrip: { flexDirection: 'row', gap: 4 },
  colorDot: { width: 10, height: 10, borderRadius: 5 },
  needleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  needleSize: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needleSizeText: { fontSize: 16, color: '#fff' },
  needleSizeUnit: { fontSize: 10, color: 'rgba(255,255,255,0.7)' },
  needleInfo: { flex: 1 },
  needleType: { fontSize: 15, marginBottom: 3 },
  needleMeta: { fontSize: 13 },
  needleRight: { alignItems: 'center', gap: 8 },
  quantityBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: 15 },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 12,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4 },
  fieldLabel: { fontSize: 13, marginBottom: 4, marginTop: 8 },
  input: {
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
  },
  pillRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  optionPillText: { fontSize: 14 },
  modalBtn: {
    padding: 16,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  modalBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', padding: 12 },
  cancelBtnText: { fontSize: 15 },
});
