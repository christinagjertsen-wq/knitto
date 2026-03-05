import React from 'react';
import { View, Text, Modal, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export const PREMIUM_FEATURES = [
  { icon: 'layers-outline' as const, label: 'Ubegrenset prosjekter' },
  { icon: 'cube-outline' as const, label: 'Ubegrenset garnlager' },
  { icon: 'cloud-upload-outline' as const, label: 'Sikkerhetskopiering' },
];

export function PremiumModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheetWrapper} onPress={() => {}}>
          <LinearGradient
            colors={['#1A2340', '#2C3E6B', '#3A5080']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.sheet, { paddingBottom: Math.max(insets.bottom + 12, 36) }]}
          >
            <View style={styles.handle} />

            <View style={styles.iconWrap}>
              <LinearGradient
                colors={['rgba(255,255,255,0.18)', 'rgba(255,255,255,0.06)']}
                style={styles.iconCircle}
              >
                <Ionicons name="diamond-outline" size={32} color="#fff" />
              </LinearGradient>
            </View>

            <View style={styles.titleBlock}>
              <Text style={[styles.title, { fontFamily: 'Inter_700Bold' }]}>
                Prøv Knitty Premium gratis
              </Text>
              <Text style={[styles.sub, { fontFamily: 'Inter_400Regular' }]}>
                14 dager uten kostnad, ingen binding
              </Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.features}>
              {PREMIUM_FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIconWrap}>
                    <Ionicons name={f.icon} size={18} color="rgba(255,255,255,0.9)" />
                  </View>
                  <Text style={[styles.featureText, { fontFamily: 'Inter_500Medium' }]}>{f.label}</Text>
                </View>
              ))}
            </View>

            <View style={styles.divider} />

            <Pressable
              style={({ pressed }) => [styles.btn, { opacity: pressed ? 0.92 : 1 }]}
              onPress={onClose}
            >
              <Text style={[styles.btnText, { fontFamily: 'Inter_700Bold' }]}>
                Start gratis prøveperiode
              </Text>
              <Text style={[styles.btnSub, { fontFamily: 'Inter_400Regular' }]}>
                Deretter 69 kr / mnd
              </Text>
            </Pressable>

            <Pressable onPress={onClose} hitSlop={16} style={styles.dismissWrap}>
              <Text style={[styles.dismiss, { fontFamily: 'Inter_400Regular' }]}>Ikke nå</Text>
            </Pressable>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetWrapper: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'hidden',
  },
  sheet: {
    padding: 28,
    gap: 0,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 24,
  },
  iconWrap: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  titleBlock: {
    alignItems: 'center',
    marginBottom: 24,
    gap: 6,
  },
  title: {
    fontSize: 22,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 28,
  },
  sub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 20,
  },
  features: {
    gap: 14,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    color: '#fff',
    fontSize: 15,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#fff',
    gap: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 6,
  },
  btnText: {
    color: '#1A2340',
    fontSize: 16,
  },
  btnSub: {
    color: 'rgba(26,35,64,0.5)',
    fontSize: 12,
  },
  dismissWrap: {
    alignItems: 'center',
    marginTop: 16,
  },
  dismiss: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.4)',
  },
});
