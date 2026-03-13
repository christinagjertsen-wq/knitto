import React, { useState, useRef, useMemo, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
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
  Animated,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting, Brand, Needle, NeedleType, NeedleMaterial } from '@/context/KnittingContext';
import { useColors, useIsDark } from '@/context/ThemeContext';
import { useT } from '@/context/LanguageContext';

type Tab = 'garn' | 'pinner';

function BrandCard({ brand }: { brand: Brand }) {
  const colors = useColors();
  const t = useT();
  const { getQualitiesForBrand, getYarnStockForQuality } = useKnitting();
  const qualities = getQualitiesForBrand(brand.id);
  const allYarn = qualities.flatMap(q => getYarnStockForQuality(q.id));
  const totalGrams = Math.round(qualities.reduce((sum, q) => sum + getYarnStockForQuality(q.id).reduce((s, y) => s + y.skeins * (q.gramsPerSkein || 0), 0), 0));
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
            {qualities.length} {qualities.length === 1 ? t.brand.qualitySingular : t.brand.qualityPlural}
            {totalGrams > 0 ? ` · ${totalGrams.toLocaleString('nb-NO').replace(',', '.')} g` : ''}
          </Text>
          {sampleColors.length > 0 && (
            <View style={styles.colorStrip}>
              {sampleColors.map((hex, i) => (
                <View key={i} style={[styles.colorDot, { backgroundColor: hex, marginLeft: i > 0 ? -5 : 0, zIndex: sampleColors.length - i }]} />
              ))}
            </View>
          )}
        </View>
      </View>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </Pressable>
  );
}

const SWIPE_THRESHOLD = 80;

function NeedleCard({ needle, onDelete, onQuantityChange }: { needle: Needle; onDelete: () => void; onQuantityChange: (q: number) => void }) {
  const colors = useColors();
  const t = useT();
  const translateX = useRef(new Animated.Value(0)).current;
  const swiping = useRef(false);
  const [editing, setEditing] = useState(false);
  const [qInput, setQInput] = useState(String(needle.quantity));

  const snapBack = () => {
    Animated.spring(translateX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dy) < 15,
      onPanResponderGrant: () => { swiping.current = true; },
      onPanResponderMove: (_, g) => {
        translateX.setValue(Math.min(0, g.dx));
      },
      onPanResponderRelease: (_, g) => {
        swiping.current = false;
        if (g.dx < -SWIPE_THRESHOLD) {
          Animated.timing(translateX, { toValue: -400, duration: 200, useNativeDriver: true }).start(() => {
            translateX.setValue(0);
            onDelete();
          });
        } else {
          snapBack();
        }
      },
      onPanResponderTerminate: () => { swiping.current = false; snapBack(); },
    })
  ).current;

  const commitEdit = () => {
    const v = parseInt(qInput, 10);
    if (!isNaN(v) && v >= 0) {
      if (v === 0) {
        Alert.alert(t.alerts.deleteNeedle, 'Sett antall til 0 sletter pinnen. Fortsette?', [
          { text: t.common.cancel, style: 'cancel', onPress: () => { setQInput(String(needle.quantity)); setEditing(false); } },
          { text: t.common.delete, style: 'destructive', onPress: () => { setEditing(false); onDelete(); } },
        ]);
      } else {
        onQuantityChange(v);
        setEditing(false);
      }
    } else {
      setQInput(String(needle.quantity));
      setEditing(false);
    }
  };

  return (
    <View style={styles.swipeNeedleContainer}>
      <View style={[styles.needleDeleteBg, { backgroundColor: '#C97B84' }]}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </View>
      <Animated.View style={{ transform: [{ translateX }] }} {...panResponder.panHandlers}>
        <View style={[styles.needleCard, { backgroundColor: colors.surface }]}>
          <View style={[styles.needleSize, { backgroundColor: colors.badgeBg }]}>
            <Text style={[styles.needleSizeText, { color: colors.badgeText, fontFamily: 'Inter_700Bold' }]}>{needle.size.replace(',', '.')}</Text>
            <Text style={[styles.needleSizeUnit, { color: colors.badgeText, fontFamily: 'Inter_400Regular' }]}>mm</Text>
          </View>
          <View style={styles.needleInfo}>
            <Text style={[styles.needleType, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
              {t.needleTypes[needle.type]}
            </Text>
            <Text style={[styles.needleMeta, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {[needle.brand, `${needle.lengthCm} cm`, t.needleMaterials[needle.material]].filter(Boolean).join(' · ')}
            </Text>
          </View>
          <Pressable
            style={[styles.quantityBadge, { backgroundColor: colors.surface }]}
            onPress={() => { setQInput(String(needle.quantity)); setEditing(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            {editing ? (
              <TextInput
                style={[styles.quantityInput, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}
                value={qInput}
                onChangeText={setQInput}
                keyboardType="number-pad"
                autoFocus
                selectTextOnFocus
                onBlur={commitEdit}
                onSubmitEditing={commitEdit}
                returnKeyType="done"
              />
            ) : (
              <Text style={[styles.quantityText, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {needle.quantity}
              </Text>
            )}
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

function AddBrandModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const t = useT();
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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {t.storage.newBrand}
            </Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder={t.storage.brandNamePlaceholder}
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
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.common.add}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{t.common.cancel}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function AddNeedleModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const colors = useColors();
  const t = useT();
  const [size, setSize] = useState('');
  const [type, setType] = useState<NeedleType>('rundpinne');
  const [length, setLength] = useState('');
  const [material, setMaterial] = useState<NeedleMaterial>('metall');
  const [quantity, setQuantity] = useState('1');
  const [brand, setBrand] = useState('');
  const { addNeedle } = useKnitting();

  const NEEDLE_BRANDS = ['Addi', 'KnitPro', 'Chiaogoo', 'Drops', 'Pony'];

  const handleAdd = useCallback(() => {
    if (!size.trim() || !length.trim()) return;
    addNeedle({
      size: size.trim().replace(',', '.'),
      type,
      lengthCm: parseFloat(length) || 60,
      material,
      quantity: parseInt(quantity) || 1,
      brand: brand.trim() || undefined,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSize(''); setLength(''); setQuantity('1'); setBrand('');
    onClose();
  }, [size, type, length, material, quantity, brand, addNeedle, onClose]);

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
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {t.storage.newNeedle}
            </Text>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.sizeMm}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder={t.storage.sizePlaceholder}
              placeholderTextColor={colors.textTertiary}
              value={size}
              onChangeText={setSize}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.type}</Text>
            <View style={styles.pillRow}>
              {(['rundpinne', 'strømpepinner', 'utskiftbar'] as NeedleType[]).map(ntype => (
                <OptionPill key={ntype} label={t.needleTypes[ntype]} selected={type === ntype} onPress={() => setType(ntype)} />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.lengthCm}</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder={t.storage.lengthPlaceholder}
              placeholderTextColor={colors.textTertiary}
              value={length}
              onChangeText={setLength}
              keyboardType="numeric"
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.material}</Text>
            <View style={styles.pillRow}>
              {(['metall', 'tre', 'plast', 'bambus'] as NeedleMaterial[]).map(nmat => (
                <OptionPill key={nmat} label={t.needleMaterials[nmat]} selected={material === nmat} onPress={() => setMaterial(nmat)} />
              ))}
            </View>

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>Merke (valgfritt)</Text>
            <TextInput
              style={[styles.input, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
              placeholder="ChiaoGoo, KnitPro, Addi..."
              placeholderTextColor={colors.textTertiary}
              value={brand}
              onChangeText={setBrand}
              autoCorrect={false}
            />

            <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>{t.storage.quantity}</Text>
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
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.common.add}</Text>
            </Pressable>
            <Pressable style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>{t.common.cancel}</Text>
            </Pressable>
          </View>
        </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

export default function LagerScreen() {
  const colors = useColors();
  const isDark = useIsDark();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<Tab>('garn');
  const [search, setSearch] = useState('');
  const [showAddBrand, setShowAddBrand] = useState(false);
  const [showAddNeedle, setShowAddNeedle] = useState(false);
  const { brands, needles, deleteNeedle, updateNeedle, getQualitiesForBrand, getYarnStockForQuality, getTotalStats, yarnStock, qualities, deleteYarnStock } = useKnitting();

  const stats = getTotalStats();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const glassAvailable = isLiquidGlassAvailable();

  const filteredBrands = useMemo(() =>
    brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase())),
    [brands, search]
  );

  const groupedNeedles = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = [...needles]
      .filter(n => !q || n.size.includes(q) || t.needleTypes[n.type].toLowerCase().includes(q) || t.needleMaterials[n.material].toLowerCase().includes(q) || (n.brand ?? '').toLowerCase().includes(q))
      .sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
    const brandMap = new Map<string, Needle[]>();
    for (const needle of filtered) {
      const key = needle.brand?.trim() || '';
      if (!brandMap.has(key)) brandMap.set(key, []);
      brandMap.get(key)!.push(needle);
    }
    const sortedKeys = [...brandMap.keys()].sort((a, b) => {
      if (!a) return 1;
      if (!b) return -1;
      return a.localeCompare(b, 'nb');
    });
    return sortedKeys.map(brand => ({ brand, items: brandMap.get(brand)! }));
  }, [needles, search, t]);

  const orphanedYarn = useMemo(() => {
    const qualityIds = new Set(qualities.map(q => q.id));
    return yarnStock.filter(y => !qualityIds.has(y.qualityId));
  }, [yarnStock, qualities]);

  const bottomInset = Platform.OS === 'web' ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={isDark ? ['#1A2340', '#0D1220'] : [Colors.palette.nordicBlue, Colors.palette.nordicIce]}
        style={[styles.topBar, { paddingTop: topInset + 24 }]}
      >
        <Text style={[styles.screenTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.storage.title}</Text>
      </LinearGradient>

      <View style={styles.segmentContainer}>
        {glassAvailable ? (
          <GlassView glassEffectStyle="regular" style={styles.segment}>
            {(['garn', 'pinner'] as Tab[]).map(tab => (
              <Pressable
                key={tab}
                style={styles.segmentTab}
                onPress={() => { setActiveTab(tab); setSearch(''); Haptics.selectionAsync(); }}
              >
                {activeTab === tab && (
                  <GlassView
                    glassEffectStyle="clear"
                    style={[StyleSheet.absoluteFill, { borderRadius: 10 }]}
                  />
                )}
                <Text style={[styles.segmentText, {
                  color: activeTab === tab ? colors.text : colors.textTertiary,
                  fontFamily: activeTab === tab ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {tab === 'garn' ? t.storage.yarn : t.storage.needles}
                </Text>
              </Pressable>
            ))}
          </GlassView>
        ) : (
          <BlurView
            intensity={Platform.OS === 'ios' ? 60 : 0}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.segment, { backgroundColor: isDark ? (Platform.OS === 'ios' ? 'rgba(0,0,0,0.25)' : '#1A2340') : (Platform.OS === 'ios' ? 'rgba(255,255,255,0.45)' : '#E1E8F0') }]}
          >
            {(['garn', 'pinner'] as Tab[]).map(tab => (
              <Pressable
                key={tab}
                style={[
                  styles.segmentTab,
                  activeTab === tab && {
                    backgroundColor: isDark ? '#2A3A5A' : '#fff',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 6,
                    elevation: 3,
                  },
                ]}
                onPress={() => { setActiveTab(tab); setSearch(''); Haptics.selectionAsync(); }}
              >
                <Text style={[styles.segmentText, {
                  color: activeTab === tab ? colors.text : colors.textTertiary,
                  fontFamily: activeTab === tab ? 'Inter_600SemiBold' : 'Inter_400Regular',
                }]}>
                  {tab === 'garn' ? t.storage.yarn : t.storage.needles}
                </Text>
              </Pressable>
            ))}
          </BlurView>
        )}
      </View>

      <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
        <Ionicons name="search" size={16} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text, fontFamily: 'Inter_400Regular' }]}
          placeholder={activeTab === 'garn' ? `${t.common.search} ${t.storage.yarn.toLowerCase()}...` : `${t.common.search} ${t.storage.needles.toLowerCase()}...`}
          placeholderTextColor={colors.textTertiary}
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch('')} hitSlop={8}>
            <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.listContent,
          { paddingBottom: bottomInset + 130 },
        ]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        keyboardShouldPersistTaps="handled"
      >
        {activeTab === 'garn' && (
          <>
            <View style={styles.miniStatsRow}>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{stats.totalSkeins.toLocaleString('nb-NO').replace(',', '.')}</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.home.statSkeins}</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{stats.totalGrams.toLocaleString('nb-NO').replace(',', '.')}</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.home.statGrams}</Text>
              </View>
              <View style={[styles.miniStat, { backgroundColor: colors.surface }]}>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{stats.totalMeters.toLocaleString('nb-NO').replace(',', '.')}</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.home.statMeters}</Text>
              </View>
            </View>

            {filteredBrands.length === 0 && orphanedYarn.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="archive-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {search ? t.common.noResults : t.storage.noBrands}
                </Text>
                {!search && (
                  <Pressable
                    style={[styles.emptyBtn, { backgroundColor: colors.primaryBtn }]}
                    onPress={() => setShowAddBrand(true)}
                  >
                    <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.storage.addFirst}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <>
                {filteredBrands.map(brand => <BrandCard key={brand.id} brand={brand} />)}
                {orphanedYarn.length > 0 && !search && (
                  <View style={[styles.brandCard, { backgroundColor: colors.surface }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <View style={[styles.brandInitial, { backgroundColor: colors.badgeBg }]}>
                        <Text style={[styles.brandInitialText, { color: colors.badgeText, fontFamily: 'Inter_700Bold' }]}>?</Text>
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={[styles.brandName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Uten merke</Text>
                        <Text style={[styles.brandMeta, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                          {orphanedYarn.length} {orphanedYarn.length === 1 ? 'farge' : 'farger'}
                        </Text>
                      </View>
                    </View>
                    {orphanedYarn.map(yarn => (
                      <View
                        key={yarn.id}
                        style={[{
                          flexDirection: 'row',
                          alignItems: 'center',
                          paddingVertical: 10,
                          borderTopWidth: 0.5,
                          borderTopColor: colors.border,
                          gap: 10,
                        }]}
                      >
                        <View style={[styles.colorDot, { backgroundColor: yarn.colorHex, width: 28, height: 28, borderRadius: 6 }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[{ color: colors.text, fontFamily: 'Inter_500Medium', fontSize: 15 }]}>{yarn.colorName}</Text>
                          <Text style={[{ color: colors.textTertiary, fontFamily: 'Inter_400Regular', fontSize: 13 }]}>{yarn.skeins} nøster</Text>
                        </View>
                        <Pressable
                          onPress={() => Alert.alert(
                            'Slett garn',
                            `Slette «${yarn.colorName}»?`,
                            [
                              { text: 'Avbryt', style: 'cancel' },
                              { text: 'Slett', style: 'destructive', onPress: () => { deleteYarnStock(yarn.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } },
                            ]
                          )}
                          hitSlop={10}
                        >
                          <Ionicons name="trash-outline" size={18} color={colors.textTertiary} />
                        </Pressable>
                      </View>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'pinner' && (
          <>
            {groupedNeedles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="construct-outline" size={40} color={colors.textTertiary} />
                <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {search ? t.storage.noNeedlesFound : t.storage.noNeedlesRegistered}
                </Text>
                {!search && (
                  <Pressable
                    style={[styles.emptyBtn, { backgroundColor: colors.primaryBtn }]}
                    onPress={() => setShowAddNeedle(true)}
                  >
                    <Text style={[styles.emptyBtnText, { fontFamily: 'Inter_600SemiBold' }]}>{t.storage.newNeedle}</Text>
                  </Pressable>
                )}
              </View>
            ) : (
              groupedNeedles.map(({ brand, items }) => (
                <View key={brand || '__ingen__'}>
                  <Text style={[styles.sectionHeader, { color: colors.textTertiary, fontFamily: 'Inter_600SemiBold' }]}>
                    {brand || 'Uten merke'}
                  </Text>
                  {items.map(needle => (
                    <NeedleCard
                      key={needle.id}
                      needle={needle}
                      onDelete={() => {
                        deleteNeedle(needle.id);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                      }}
                      onQuantityChange={(q) => {
                        updateNeedle(needle.id, { quantity: q });
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      <AddBrandModal visible={showAddBrand} onClose={() => setShowAddBrand(false)} />
      <AddNeedleModal visible={showAddNeedle} onClose={() => setShowAddNeedle(false)} />

      <Pressable
        style={[styles.fab, { backgroundColor: colors.primaryBtn, bottom: bottomInset + 66 }]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          activeTab === 'garn' ? setShowAddBrand(true) : setShowAddNeedle(true);
        }}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  topBarRow: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  homeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  screenTitle: { fontSize: 32 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  segmentContainer: { paddingHorizontal: 20, marginBottom: 12 },
  segment: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
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
  colorStrip: { flexDirection: 'row' },
  colorDot: { width: 14, height: 14, borderRadius: 7, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)' },
  sectionHeader: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 6,
    marginHorizontal: 4,
  },
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
  swipeNeedleContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  needleDeleteBg: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 80,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: { fontSize: 16 },
  quantityInput: { fontSize: 16, textAlign: 'center', minWidth: 30 },
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
    gap: 6,
  },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4, textAlign: 'center' },
  fieldLabel: { fontSize: 13, marginTop: 6 },
  input: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 11,
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
