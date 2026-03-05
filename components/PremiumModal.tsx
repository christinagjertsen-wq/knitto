import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export const PREMIUM_FEATURES = [
  'Ubegrenset prosjekter',
  'Ubegrenset garnlager',
  'Sikkerhetskopiering',
];

export function PremiumModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 28) }]} onPress={() => {}}>
          <View style={styles.handle} />
          <View style={styles.top}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { fontFamily: 'Inter_700Bold' }]}>Prøv Premium gratis</Text>
              <Text style={[styles.sub, { fontFamily: 'Inter_400Regular' }]}>14 dager, ingen binding</Text>
            </View>
            <View style={styles.badge}>
              <Text style={[styles.badgeText, { fontFamily: 'Inter_600SemiBold' }]}>GRATIS</Text>
            </View>
          </View>
          <View style={styles.features}>
            {PREMIUM_FEATURES.map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={[styles.featureText, { fontFamily: 'Inter_400Regular' }]}>{f}</Text>
              </View>
            ))}
          </View>
          <Pressable
            style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.9 : 1 }]}
            onPress={onClose}
          >
            <Text style={[styles.btnText, { fontFamily: 'Inter_700Bold' }]}>Start 14-dagers prøveperiode</Text>
            <Text style={[styles.btnSub, { fontFamily: 'Inter_400Regular' }]}>Deretter 69 kr / mnd</Text>
          </Pressable>
          <Pressable onPress={onClose} hitSlop={12}>
            <Text style={[styles.dismiss, { fontFamily: 'Inter_400Regular' }]}>Ikke nå</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, gap: 14, backgroundColor: '#2C3E6B' },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', alignSelf: 'center', marginBottom: 4 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 18, color: '#fff' },
  sub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  badge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(255,255,255,0.15)' },
  badgeText: { color: '#fff', fontSize: 11, letterSpacing: 0.5 },
  features: { gap: 8 },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  featureText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  btn: { borderRadius: 14, padding: 16, alignItems: 'center', backgroundColor: '#fff', gap: 2 },
  btnText: { color: '#2C3E6B', fontSize: 15 },
  btnSub: { color: 'rgba(44,62,107,0.6)', fontSize: 12 },
  dismiss: { textAlign: 'center', fontSize: 14, paddingVertical: 4, color: 'rgba(255,255,255,0.5)' },
});
