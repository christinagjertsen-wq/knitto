import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  PanResponder,
  Animated,
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

function ColorDetailModal({
  yarn,
  gramsPerSkein,
  visible,
  onClose,
  onAdd,
  onDelete,
}: {
  yarn: YarnStock;
  gramsPerSkein: number;
  visible: boolean;
  onClose: () => void;
  onAdd: (extra: number) => void;
  onDelete: () => void;
}) {
  const colors = useColors();
  const t = useT();
  const [skeinCount, setSkeinCount] = useState(0);
  const [gramInput, setGramInput] = useState('');

  useEffect(() => {
    if (visible) {
      if (gramsPerSkein > 0) {
        const whole = Math.floor(yarn.skeins);
        const remainder = Math.round((yarn.skeins - whole) * gramsPerSkein);
        setSkeinCount(whole);
        setGramInput(remainder > 0 ? String(remainder) : '');
      } else {
        setSkeinCount(Math.round(yarn.skeins));
        setGramInput('');
      }
    }
  }, [visible, yarn]);

  const reset = () => { setSkeinCount(1); setGramInput(''); };
  const handleClose = () => { reset(); onClose(); };

  const extraGrams = parseFloat(gramInput.replace(',', '.')) || 0;
  const totalToAdd = skeinCount * gramsPerSkein + extraGrams;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView keyboardShouldPersistTaps="always" showsVerticalScrollIndicator={false}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: 32, gap: 0 }]}>
              <View style={styles.modalHandle} />

              <View style={{ alignItems: 'center', marginBottom: 20 }}>
                <View style={[styles.bigColorSwatch, { backgroundColor: yarn.colorHex, width: 56, height: 56, borderRadius: 28, marginBottom: 12 }, yarn.colorHex === '#FFFFFF' && { borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.12)' }]} />
                <Text style={[styles.colorName, { color: colors.text, fontFamily: 'Inter_700Bold', fontSize: 20, textAlign: 'center' }]}>{yarn.colorName}</Text>
                {gramsPerSkein > 0 && (
                  <Text style={{ color: colors.textTertiary, fontFamily: 'Inter_400Regular', fontSize: 13, marginTop: 4 }}>
                    {gramsPerSkein} g per nøste
                  </Text>
                )}
              </View>

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium', marginBottom: 10 }]}>
                Antall nøster
              </Text>
              <SkeinCounter value={skeinCount} onChange={setSkeinCount} />

              <Text style={[styles.fieldLabel, { color: colors.textSecondary, fontFamily: 'Inter_500Medium', marginBottom: 8, marginTop: 14 }]}>
                Gram (rest)
              </Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular', textAlign: 'center', fontSize: 20 }]}
                value={gramInput}
                onChangeText={setGramInput}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                selectTextOnFocus
              />

              <Pressable
                style={({ pressed }) => [styles.modalBtn, { backgroundColor: totalToAdd > 0 ? colors.primaryBtn : colors.border, opacity: pressed ? 0.85 : 1, marginTop: 16 }]}
                onPress={() => {
                  if (totalToAdd <= 0) return;
                  onAdd(totalToAdd);
                  reset();
                  onClose();
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }}
                disabled={totalToAdd <= 0}
              >
                <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>
                  Lagre {totalToAdd > 0 ? `${Math.round(totalToAdd * 10) / 10} g` : ''}
                </Text>
              </Pressable>

              <Pressable
                style={({ pressed }) => [{ alignItems: 'center', paddingVertical: 12, marginTop: 4, opacity: pressed ? 0.7 : 1 }]}
                onPress={() => {
                  handleClose();
                  Alert.alert('Slett farge', `Er du sikker på at du vil slette ${yarn.colorName}?`, [
                    { text: t.common.cancel, style: 'cancel' },
                    { text: t.common.delete, style: 'destructive', onPress: onDelete },
                  ]);
                }}
              >
                <Text style={{ color: '#C97B84', fontSize: 15, fontFamily: 'Inter_500Medium' }}>{t.common.delete}</Text>
              </Pressable>

              <Pressable style={styles.cancelBtn} onPress={handleClose}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary }]}>{t.common.cancel}</Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

type YarnCardProps = {
  yarn: YarnStock;
  gramsPerSkein: number;
  onPress: () => void;
  onRename: () => void;
  onDelete: () => void;
  isDragging: boolean;
  isDropTarget: boolean;
  isDimmed: boolean;
  cardRef: (ref: View | null) => void;
  onDragStart: (yarnId: string, pageY: number) => void;
  onDragMove: (pageY: number) => void;
  onDragEnd: (pageY: number) => void;
};

const SWIPE_DELETE_THRESHOLD = -80;

function YarnCard({ yarn, gramsPerSkein, onPress, onRename, onDelete, isDragging, isDropTarget, isDimmed, cardRef, onDragStart, onDragMove, onDragEnd }: YarnCardProps) {
  const colors = useColors();
  const totalGrams = yarn.skeins * gramsPerSkein;
  const isDraggingRef = useRef(false);
  const isSwipingRef = useRef(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const swipeX = useRef(new Animated.Value(0)).current;
  const onDeleteRef = useRef(onDelete);
  const onPressRef = useRef(onPress);
  useEffect(() => { onDeleteRef.current = onDelete; }, [onDelete]);
  useEffect(() => { onPressRef.current = onPress; }, [onPress]);

  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: (_, g) =>
      isDraggingRef.current ||
      (Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3),
    onPanResponderGrant: (evt) => {
      const pageY = evt.nativeEvent.pageY;
      isSwipingRef.current = false;
      longPressTimer.current = setTimeout(() => {
        isDraggingRef.current = true;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        onDragStart(yarn.id, pageY);
      }, 420);
    },
    onPanResponderMove: (evt, g) => {
      if (isDraggingRef.current) {
        onDragMove(evt.nativeEvent.pageY);
        return;
      }
      if (!isSwipingRef.current && Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy) * 1.3) {
        isSwipingRef.current = true;
        if (longPressTimer.current) clearTimeout(longPressTimer.current);
      }
      if (isSwipingRef.current && g.dx < 0) {
        swipeX.setValue(Math.max(g.dx, -120));
      }
    },
    onPanResponderRelease: (evt, g) => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      const wasDragging = isDraggingRef.current;
      const wasSwiping = isSwipingRef.current;
      isDraggingRef.current = false;
      isSwipingRef.current = false;
      if (wasDragging) {
        onDragEnd(evt.nativeEvent.pageY);
      } else if (wasSwiping) {
        if (g.dx < SWIPE_DELETE_THRESHOLD) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          Animated.timing(swipeX, { toValue: -500, duration: 220, useNativeDriver: true }).start(() => {
            onDeleteRef.current();
          });
        } else {
          Animated.spring(swipeX, { toValue: 0, useNativeDriver: true, tension: 120, friction: 8 }).start();
        }
      } else {
        onPressRef.current();
      }
    },
    onPanResponderTerminate: () => {
      if (longPressTimer.current) clearTimeout(longPressTimer.current);
      isDraggingRef.current = false;
      isSwipingRef.current = false;
      Animated.spring(swipeX, { toValue: 0, useNativeDriver: true }).start();
      onDragEnd(-1);
    },
  })).current;

  return (
    <View
      ref={cardRef}
      style={[styles.yarnCardWrapper, isDragging && { opacity: 0.25 }, isDimmed && !isDragging && !isDropTarget && { opacity: 0.45 }]}
    >
      <View style={[styles.yarnCardDeleteBg, { borderRadius: styles.yarnCard.borderRadius }]}>
        <Ionicons name="trash-outline" size={22} color="#fff" />
      </View>
      <Animated.View
        style={[
          styles.yarnCard,
          { backgroundColor: colors.surface, transform: [{ translateX: swipeX }] },
          isDropTarget && { borderColor: colors.primaryBtn, borderWidth: 2 },
        ]}
        {...panResponder.panHandlers}
      >
        <View style={[styles.colorSwatch, { backgroundColor: yarn.colorHex }]} />
        <Pressable
          style={styles.yarnCardContent}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onRename(); }}
          hitSlop={4}
        >
          <Text style={[styles.colorName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
            {yarn.colorName}
          </Text>
        </Pressable>
        <View style={styles.yarnCardRight}>
          <View style={[styles.gramBadge, { backgroundColor: isDropTarget ? colors.primaryBtn : colors.badgeBg }]}>
            <Text style={[styles.gramBadgeText, { color: isDropTarget ? '#fff' : colors.badgeText, fontFamily: 'Inter_600SemiBold' }]}>
              {totalGrams > 0 ? `${totalGrams} g` : `${yarn.skeins} stk`}
            </Text>
          </View>
        </View>
      </Animated.View>
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
  const { addYarnStock, yarnStock, updateYarnStock } = useKnitting();
  const { isSubscribed } = useSubscription();

  const handleAdd = useCallback(() => {
    if (!colorName.trim()) return;
    const duplicate = yarnStock.find(
      y => y.qualityId === qualityId && y.colorName.trim().toLowerCase() === colorName.trim().toLowerCase()
    );
    if (!duplicate && !isSubscribed && yarnStock.reduce((s, y) => s + y.skeins, 0) >= 50) {
      onClose();
      onPaywall();
      return;
    }
    if (duplicate) {
      Alert.alert(
        'Fargen finnes allerede',
        `«${duplicate.colorName}» er allerede lagt til. Vil du legge til ${skeins} ${skeins === 1 ? 'nøste' : 'nøster'} på den?`,
        [
          { text: 'Avbryt', style: 'cancel' },
          {
            text: 'Slå sammen',
            onPress: () => {
              updateYarnStock(duplicate.id, { skeins: duplicate.skeins + skeins });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setColorName(''); setSkeins(1); setSelectedHex('#C97B84');
              onClose();
            },
          },
          {
            text: 'Legg til separat',
            onPress: () => {
              addYarnStock({ qualityId, colorName: colorName.trim(), colorHex: selectedHex, skeins });
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              setColorName(''); setSkeins(1); setSelectedHex('#C97B84');
              onClose();
            },
          },
        ]
      );
      return;
    }
    addYarnStock({ qualityId, colorName: colorName.trim(), colorHex: selectedHex, skeins });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setColorName(''); setSkeins(1); setSelectedHex('#C97B84');
    onClose();
  }, [colorName, selectedHex, skeins, qualityId, addYarnStock, updateYarnStock, onClose, onPaywall, yarnStock, isSubscribed]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>

        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView
            keyboardShouldPersistTaps="always"
            showsVerticalScrollIndicator={false}
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
  const [selectedYarn, setSelectedYarn] = useState<YarnStock | null>(null);
  const [renameYarn, setRenameYarn] = useState<YarnStock | null>(null);
  const [renameInput, setRenameInput] = useState('');
  const [showRenameQuality, setShowRenameQuality] = useState(false);
  const [qualityNameInput, setQualityNameInput] = useState('');
  const [sortBy, setSortBy] = useState<'navn' | 'gram'>('navn');
  const [skeinEditField, setSkeinEditField] = useState<'grams' | 'meters' | null>(null);
  const [skeinEditInput, setSkeinEditInput] = useState('');
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragY, setDragY] = useState(0);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const draggingIdRef = useRef<string | null>(null);
  const dropTargetIdRef = useRef<string | null>(null);
  const cardRefs = useRef<Map<string, View | null>>(new Map());
  const cardMeasures = useRef<Map<string, { pageY: number; height: number }>>(new Map());
  const containerRef = useRef<View | null>(null);
  const containerPageY = useRef(0);

  const quality = getQualityById(id);
  const brand = quality ? getBrandById(quality.brandId) : undefined;
  const yarnStock = getYarnStockForQuality(id);
  const totalSkeins = yarnStock.reduce((s, y) => s + y.skeins, 0);

  const handleDragStart = useCallback((yarnId: string, pageY: number) => {
    draggingIdRef.current = yarnId;
    dropTargetIdRef.current = null;
    setDraggingId(yarnId);
    setDragY(pageY);
    setDropTargetId(null);
    cardRefs.current.forEach((ref, id) => {
      ref?.measure((_x, _y, _w, h, _px, py) => {
        cardMeasures.current.set(id, { pageY: py, height: h });
      });
    });
  }, []);

  const handleDragMove = useCallback((pageY: number) => {
    setDragY(pageY);
    const dId = draggingIdRef.current;
    if (!dId) return;
    const draggingYarn = yarnStock.find(y => y.id === dId);
    if (!draggingYarn) return;
    let newTarget: string | null = null;
    cardMeasures.current.forEach(({ pageY: cardTop, height }, id) => {
      if (id !== dId && pageY >= cardTop && pageY <= cardTop + height) {
        const hoveredYarn = yarnStock.find(y => y.id === id);
        if (hoveredYarn && hoveredYarn.colorName.trim().toLowerCase() === draggingYarn.colorName.trim().toLowerCase()) {
          newTarget = id;
        }
      }
    });
    if (newTarget !== dropTargetIdRef.current) {
      dropTargetIdRef.current = newTarget;
      setDropTargetId(newTarget);
      if (newTarget) Haptics.selectionAsync();
    }
  }, [yarnStock]);

  const handleDragEnd = useCallback((pageY: number) => {
    const dId = draggingIdRef.current;
    const tId = dropTargetIdRef.current;
    draggingIdRef.current = null;
    dropTargetIdRef.current = null;
    setDraggingId(null);
    setDropTargetId(null);
    if (!dId || !tId || pageY < 0) return;
    const draggingYarn = yarnStock.find(y => y.id === dId);
    const targetYarn = yarnStock.find(y => y.id === tId);
    if (!draggingYarn || !targetYarn) return;
    const gpsk = quality?.gramsPerSkein ?? 0;
    const gA = Math.round(draggingYarn.skeins * gpsk);
    const gB = Math.round(targetYarn.skeins * gpsk);
    Alert.alert(
      'Slå sammen farger',
      gpsk > 0
        ? `Slå sammen «${targetYarn.colorName}»?\n${gA} g + ${gB} g = ${gA + gB} g`
        : `Slå sammen «${targetYarn.colorName}»?\n${draggingYarn.skeins + targetYarn.skeins} nøster totalt`,
      [
        { text: 'Avbryt', style: 'cancel' },
        {
          text: 'Slå sammen',
          onPress: () => {
            updateYarnStock(targetYarn.id, { skeins: targetYarn.skeins + draggingYarn.skeins });
            deleteYarnStock(draggingYarn.id);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  }, [yarnStock, quality, updateYarnStock, deleteYarnStock]);

  const promptedPairs = useRef<Set<string>>(new Set());
  useEffect(() => {
    const seen = new Map<string, typeof yarnStock[0]>();
    for (const yarn of yarnStock) {
      const key = yarn.colorName.trim().toLowerCase();
      const existing = seen.get(key);
      if (existing) {
        const pairKey = [existing.id, yarn.id].sort().join('|');
        if (!promptedPairs.current.has(pairKey)) {
          promptedPairs.current.add(pairKey);
          const gpsk = quality?.gramsPerSkein ?? 0;
          const gA = Math.round(existing.skeins * gpsk);
          const gB = Math.round(yarn.skeins * gpsk);
          const gTotal = gA + gB;
          Alert.alert(
            'Duplikat oppdaget',
            `Du har to oppføringer av farge «${yarn.colorName}»${gpsk > 0 ? ` (${gA} g + ${gB} g = ${gTotal} g)` : ''}. Vil du slå dem sammen?`,
            [
              { text: 'Avbryt', style: 'cancel' },
              {
                text: 'Slå sammen',
                onPress: () => {
                  updateYarnStock(existing.id, { skeins: existing.skeins + yarn.skeins });
                  deleteYarnStock(yarn.id);
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                },
              },
            ]
          );
          break;
        }
      } else {
        seen.set(key, yarn);
      }
    }
  }, [yarnStock, quality, updateYarnStock, deleteYarnStock]);
  const totalGrams = quality ? totalSkeins * quality.gramsPerSkein : 0;
  const totalMeters = quality ? totalSkeins * quality.metersPerSkein : 0;

  const sortedYarnStock = useMemo(() => {
    const gpsk = quality?.gramsPerSkein ?? 0;
    return [...yarnStock].sort((a, b) =>
      sortBy === 'navn'
        ? a.colorName.localeCompare(b.colorName, 'nb', { numeric: true, sensitivity: 'base' })
        : b.skeins * gpsk - a.skeins * gpsk
    );
  }, [yarnStock, sortBy, quality]);

  const topInset = Platform.OS === 'web' ? 67 : insets.top;

  if (!quality) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: colors.textTertiary }}>Kvalitet ikke funnet</Text>
      </View>
    );
  }

  const draggingYarn = draggingId ? yarnStock.find(y => y.id === draggingId) : null;

  return (
    <View
      ref={containerRef}
      style={[styles.container, { backgroundColor: colors.background }]}
      onLayout={() => {
        containerRef.current?.measure((_x, _y, _w, _h, _px, py) => { containerPageY.current = py; });
      }}
    >
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pressable
            onPress={() => { setQualityNameInput(quality.name); setShowRenameQuality(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
            hitSlop={8}
          >
            <Ionicons name="pencil-outline" size={18} color={colors.textTertiary} />
          </Pressable>
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
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.listContent, { paddingBottom: Platform.OS === 'web' ? 34 : 20 }]}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        scrollEnabled={!draggingId}
      >
        {(quality.gramsPerSkein || quality.metersPerSkein) ? (
          <View style={styles.miniStatsRow}>
            {quality.gramsPerSkein ? (
              <Pressable
                style={[styles.miniStatCard, { backgroundColor: colors.surface }]}
                onPress={() => { setSkeinEditField('grams'); setSkeinEditInput(String(quality.gramsPerSkein)); Haptics.selectionAsync(); }}
              >
                <View style={{ position: 'absolute', top: 9, right: 9, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="pencil" size={10} color={colors.textTertiary} />
                </View>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{quality.gramsPerSkein} g</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>per nøste</Text>
              </Pressable>
            ) : null}
            {quality.metersPerSkein ? (
              <Pressable
                style={[styles.miniStatCard, { backgroundColor: colors.surface }]}
                onPress={() => { setSkeinEditField('meters'); setSkeinEditInput(String(quality.metersPerSkein)); Haptics.selectionAsync(); }}
              >
                <View style={{ position: 'absolute', top: 9, right: 9, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                  <Ionicons name="pencil" size={10} color={colors.textTertiary} />
                </View>
                <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{quality.metersPerSkein} m</Text>
                <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>per nøste</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <View style={styles.miniStatsRow}>
          <View style={[styles.miniStatCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalSkeins.toLocaleString('nb-NO').replace(',', '.')}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.quality.skeins}</Text>
          </View>
          <View style={[styles.miniStatCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalGrams.toLocaleString('nb-NO').replace(',', '.')}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.home.statGrams}</Text>
          </View>
          <View style={[styles.miniStatCard, { backgroundColor: colors.surface }]}>
            <Text style={[styles.miniStatNum, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{totalMeters.toLocaleString('nb-NO').replace(',', '.')}</Text>
            <Text style={[styles.miniStatLabel, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.home.statMeters}</Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4, marginBottom: 4 }}>
          <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold', marginTop: 0, marginBottom: 0 }]}>
            {yarnStock.length} {yarnStock.length === 1 ? t.project.colorSingular : t.project.colorPlural}
          </Text>
          {yarnStock.length > 1 && (
            <View style={{ flexDirection: 'row', gap: 6 }}>
              {(['navn', 'gram'] as const).map(s => (
                <Pressable
                  key={s}
                  onPress={() => { setSortBy(s); Haptics.selectionAsync(); }}
                  style={[styles.sortPill, { backgroundColor: sortBy === s ? colors.primaryBtn : colors.surface, borderColor: sortBy === s ? colors.primaryBtn : colors.border }]}
                >
                  <Text style={{ fontSize: 12, color: sortBy === s ? '#fff' : colors.textSecondary, fontFamily: sortBy === s ? 'Inter_600SemiBold' : 'Inter_400Regular' }}>
                    {s === 'navn' ? 'A - Z' : 'gram'}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {yarnStock.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="color-palette-outline" size={40} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
              {t.quality.noColors}
            </Text>
          </View>
        ) : (
          sortedYarnStock.map(yarn => (
            <YarnCard
              key={yarn.id}
              yarn={yarn}
              gramsPerSkein={quality.gramsPerSkein}
              onPress={() => { setSelectedYarn(yarn); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              onRename={() => { setRenameYarn(yarn); setRenameInput(yarn.colorName); }}
              onDelete={() => { deleteYarnStock(yarn.id); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
              isDragging={draggingId === yarn.id}
              isDropTarget={dropTargetId === yarn.id}
              isDimmed={!!draggingId && draggingId !== yarn.id && dropTargetId !== yarn.id}
              cardRef={(ref) => { cardRefs.current.set(yarn.id, ref); }}
              onDragStart={handleDragStart}
              onDragMove={handleDragMove}
              onDragEnd={handleDragEnd}
            />
          ))
        )}
      </ScrollView>

      <AddYarnModal qualityId={id} visible={showAdd} onClose={() => setShowAdd(false)} onPaywall={() => setShowPremium(true)} />
      <Modal visible={showRenameQuality} transparent animationType="fade" onRequestClose={() => setShowRenameQuality(false)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.renameQualitySheet, { backgroundColor: colors.surface }]}>
              <View style={styles.modalHandle} />
              <Text style={[styles.renameQualityTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.project.renameProject}</Text>
              <TextInput
                style={[styles.renameQualityInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
                value={qualityNameInput}
                onChangeText={setQualityNameInput}
                placeholder={t.storage.newQuality}
                placeholderTextColor={colors.textTertiary}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => {
                  if (qualityNameInput.trim()) {
                    updateQuality(id, { name: qualityNameInput.trim() });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    setShowRenameQuality(false);
                  }
                }}
              />
              <Pressable
                style={[styles.renameQualitySaveBtn, { backgroundColor: qualityNameInput.trim() ? colors.primaryBtn : colors.border }]}
                disabled={!qualityNameInput.trim()}
                onPress={() => {
                  updateQuality(id, { name: qualityNameInput.trim() });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  setShowRenameQuality(false);
                }}
              >
                <Text style={[{ color: '#fff', fontSize: 16, fontFamily: 'Inter_600SemiBold' }]}>{t.common.save}</Text>
              </Pressable>
              <Pressable onPress={() => setShowRenameQuality(false)} style={{ alignItems: 'center', padding: 10 }}>
                <Text style={{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }}>{t.common.cancel}</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <PremiumModal visible={showPremium} onClose={() => setShowPremium(false)} />
      {selectedYarn && (
        <ColorDetailModal
          yarn={selectedYarn}
          gramsPerSkein={quality.gramsPerSkein}
          visible={!!selectedYarn}
          onClose={() => setSelectedYarn(null)}
          onAdd={(grams) => updateYarnStock(selectedYarn.id, { skeins: quality.gramsPerSkein > 0 ? grams / quality.gramsPerSkein : grams })}
          onDelete={() => { deleteYarnStock(selectedYarn.id); setSelectedYarn(null); Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); }}
        />
      )}

      <Modal visible={!!renameYarn} transparent animationType="fade" onRequestClose={() => setRenameYarn(null)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
              <View style={styles.modalHandle} />
              <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Endre navn på farge</Text>
              <TextInput
                style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
                placeholder="Fargenavn"
                placeholderTextColor={colors.textTertiary}
                value={renameInput}
                onChangeText={setRenameInput}
                autoFocus
                autoCapitalize="words"
                returnKeyType="done"
                selectTextOnFocus
                onSubmitEditing={() => {
                  if (renameInput.trim() && renameYarn) {
                    updateYarnStock(renameYarn.id, { colorName: renameInput.trim() });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setRenameYarn(null);
                }}
              />
              <Pressable
                style={[styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: renameInput.trim() ? 1 : 0.5 }]}
                onPress={() => {
                  if (renameInput.trim() && renameYarn) {
                    updateYarnStock(renameYarn.id, { colorName: renameInput.trim() });
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  }
                  setRenameYarn(null);
                }}
                disabled={!renameInput.trim()}
              >
                <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
              </Pressable>
              <Pressable style={styles.cancelBtn} onPress={() => setRenameYarn(null)}>
                <Text style={[styles.cancelBtnText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
              </Pressable>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

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

      <Modal visible={skeinEditField !== null} transparent animationType="fade" onRequestClose={() => setSkeinEditField(null)}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom, 24) }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
              {skeinEditField === 'grams' ? 'Gram per nøste' : 'Meter per nøste'}
            </Text>
            <TextInput
              style={[styles.modalInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular', textAlign: 'center', fontSize: 22 }]}
              value={skeinEditInput}
              onChangeText={setSkeinEditInput}
              keyboardType="decimal-pad"
              placeholder={skeinEditField === 'grams' ? '50' : '100'}
              placeholderTextColor={colors.textTertiary}
              autoFocus
              selectTextOnFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                const val = parseFloat(skeinEditInput.replace(',', '.'));
                if (val > 0) {
                  updateQuality(id, skeinEditField === 'grams' ? { gramsPerSkein: val } : { metersPerSkein: val });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setSkeinEditField(null);
              }}
            />
            <Pressable
              style={({ pressed }) => [styles.modalBtn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1 }]}
              onPress={() => {
                const val = parseFloat(skeinEditInput.replace(',', '.'));
                if (val > 0) {
                  updateQuality(id, skeinEditField === 'grams' ? { gramsPerSkein: val } : { metersPerSkein: val });
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                }
                setSkeinEditField(null);
              }}
            >
              <Text style={[styles.modalBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
            </Pressable>
            <Pressable style={styles.modalCancel} onPress={() => setSkeinEditField(null)}>
              <Text style={{ color: colors.textSecondary, fontSize: 15, fontFamily: 'Inter_400Regular' }}>Avbryt</Text>
            </Pressable>
          </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {draggingYarn && (
        <View
          style={[{
            position: 'absolute',
            left: 16,
            right: 16,
            top: dragY - containerPageY.current - 35,
            zIndex: 999,
            pointerEvents: 'none' as any,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.18,
            shadowRadius: 12,
            elevation: 12,
          }]}>
          <View style={[styles.yarnCard, { backgroundColor: colors.surface }]}>
            <View style={[styles.colorSwatch, { backgroundColor: draggingYarn.colorHex }]} />
            <View style={styles.yarnCardContent}>
              <Text style={[styles.colorName, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>
                {draggingYarn.colorName}
              </Text>
            </View>
            <View style={styles.yarnCardRight}>
              <View style={[styles.gramBadge, { backgroundColor: colors.badgeBg }]}>
                <Text style={[styles.gramBadgeText, { color: colors.badgeText, fontFamily: 'Inter_600SemiBold' }]}>
                  {quality.gramsPerSkein > 0 ? `${Math.round(draggingYarn.skeins * quality.gramsPerSkein)} g` : `${draggingYarn.skeins} stk`}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

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
  miniStatsRow: { flexDirection: 'row', gap: 10 },
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
  sortPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1 },
  yarnCardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  yarnCardDeleteBg: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#C97B84',
    alignItems: 'center',
    justifyContent: 'center',
  },
  yarnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
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
  yarnCardRight: { paddingRight: 14, alignItems: 'center' },
  gramBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  gramBadgeText: { fontSize: 14 },
  counter: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'center' },
  counterBtn: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  counterValue: { fontSize: 18, minWidth: 28, textAlign: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 16 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  emptyBtnText: { color: '#fff', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  renameQualitySheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  renameQualityTitle: { fontSize: 18, textAlign: 'center' },
  renameQualityInput: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  renameQualitySaveBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 10 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8 },
  modalTitle: { fontSize: 22, marginBottom: 4, textAlign: 'center' },
  colorPreviewRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  bigColorSwatch: { width: 64, height: 64, borderRadius: 32 },
  fieldLabel: { fontSize: 13, marginBottom: 6 },
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
