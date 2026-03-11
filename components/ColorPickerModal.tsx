import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TextInput,
  PanResponder,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useColors } from '@/context/ThemeContext';

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }
  const toHex = (n: number) => Math.round((n + m) * 255).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  if (!/^#[0-9A-Fa-f]{6}$/.test(hex)) return { h: 0, s: 0.9, v: 0.8 };
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const v = max;
  const d = max - min;
  const s = max === 0 ? 0 : d / max;
  let h = 0;
  if (max !== min) {
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) * 60; break;
      case g: h = ((b - r) / d + 2) * 60; break;
      case b: h = ((r - g) / d + 4) * 60; break;
    }
  }
  return { h, s: s || 0.9, v: v || 0.8 };
}

function Slider({
  value,
  onChange,
  gradientColors,
}: {
  value: number;
  onChange: (v: number) => void;
  gradientColors: string[];
}) {
  const [sliderWidth, setSliderWidth] = useState(280);
  const widthRef = useRef(280);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / widthRef.current));
        onChangeRef.current(ratio);
        Haptics.selectionAsync();
      },
      onPanResponderMove: (e) => {
        const ratio = Math.max(0, Math.min(1, e.nativeEvent.locationX / widthRef.current));
        onChangeRef.current(ratio);
      },
    })
  ).current;

  const thumbLeft = Math.max(0, Math.min(value * (sliderWidth - 28), sliderWidth - 28));

  return (
    <View
      style={styles.sliderTrack}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        widthRef.current = w;
        setSliderWidth(w);
      }}
      {...panResponder.panHandlers}
    >
      <LinearGradient
        colors={gradientColors as any}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
      />
      <View style={[styles.sliderThumb, { left: thumbLeft }]} />
    </View>
  );
}

interface Props {
  visible: boolean;
  initialHex: string;
  onClose: () => void;
  onSelect: (hex: string) => void;
}

export function ColorPickerModal({ visible, initialHex, onClose, onSelect }: Props) {
  const colors = useColors();
  const [hue, setHue] = useState(200);
  const [saturation, setSaturation] = useState(0.9);
  const [brightness, setBrightness] = useState(0.8);
  const [hexInput, setHexInput] = useState('');

  React.useEffect(() => {
    if (visible) {
      const hsv = hexToHsv(initialHex);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setBrightness(hsv.v);
      setHexInput(initialHex.toUpperCase());
    }
  }, [visible]);

  const currentHex = hsvToHex(hue, saturation, brightness).toUpperCase();
  const hueFullColor = hsvToHex(hue, 1, 1);
  const grayAtBrightness = hsvToHex(0, 0, brightness);

  const displayHex = /^#[0-9A-Fa-f]{6}$/.test(hexInput) ? hexInput : currentHex;

  React.useEffect(() => {
    setHexInput(currentHex);
  }, [hue, saturation, brightness]);

  const handleHexInput = (text: string) => {
    const cleaned = (text.startsWith('#') ? text : '#' + text).toUpperCase();
    setHexInput(cleaned);
    if (/^#[0-9A-Fa-f]{6}$/.test(cleaned)) {
      const hsv = hexToHsv(cleaned);
      setHue(hsv.h);
      setSaturation(hsv.s);
      setBrightness(hsv.v);
    }
  };

  const handleConfirm = () => {
    onSelect(displayHex);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          <View style={styles.handle} />
          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
            Spesiell farge
          </Text>

          <View style={styles.previewRow}>
            <View
              style={[
                styles.preview,
                { backgroundColor: displayHex },
                displayHex === '#FFFFFF' && { borderWidth: 1.5, borderColor: 'rgba(0,0,0,0.15)' },
              ]}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium' }]}>
                HEX
              </Text>
              <TextInput
                style={[styles.hexInput, { color: colors.text, backgroundColor: colors.background, fontFamily: 'Inter_400Regular' }]}
                value={hexInput}
                onChangeText={handleHexInput}
                autoCapitalize="characters"
                maxLength={7}
                placeholder="#FFFFFF"
                placeholderTextColor={colors.textTertiary}
              />
            </View>
          </View>

          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium', marginBottom: 6 }]}>
            Fargetone
          </Text>
          <Slider
            value={hue / 360}
            onChange={(v) => setHue(v * 360)}
            gradientColors={['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000']}
          />

          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium', marginTop: 12, marginBottom: 6 }]}>
            Lysstyrke
          </Text>
          <Slider
            value={brightness}
            onChange={setBrightness}
            gradientColors={['#000000', hueFullColor]}
          />

          <Text style={[styles.label, { color: colors.textSecondary, fontFamily: 'Inter_500Medium', marginTop: 12, marginBottom: 6 }]}>
            Metning
          </Text>
          <Slider
            value={saturation}
            onChange={setSaturation}
            gradientColors={[grayAtBrightness, hueFullColor]}
          />

          <Pressable
            style={({ pressed }) => [styles.btn, { backgroundColor: colors.primaryBtn, opacity: pressed ? 0.85 : 1, marginTop: 20 }]}
            onPress={handleConfirm}
          >
            <Text style={[styles.btnText, { fontFamily: 'Inter_600SemiBold' }]}>Velg farge</Text>
          </Pressable>
          <Pressable style={styles.cancelBtn} onPress={onClose}>
            <Text style={[styles.cancelText, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
              Avbryt
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingBottom: 40,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    marginBottom: 16,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  preview: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  label: {
    fontSize: 13,
  },
  hexInput: {
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 15,
    letterSpacing: 1,
    marginTop: 4,
  },
  sliderTrack: {
    height: 32,
    borderRadius: 16,
  },
  sliderThumb: {
    position: 'absolute',
    top: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.12)',
    zIndex: 1,
  },
  btn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  cancelText: {
    fontSize: 15,
  },
});
