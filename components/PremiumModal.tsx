import React, { useState } from 'react';
import { View, Text, Modal, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, Feather as FeatherIcon } from '@expo/vector-icons';
import { useT } from '@/context/LanguageContext';
import { T } from '@/i18n/translations';
import { useSubscription } from '@/lib/revenuecat';
import { useColors } from '@/context/ThemeContext';

export function getPremiumFeatures(t: T) {
  return [
    { icon: 'layers-outline' as const, label: t.premium.unlimitedProjects },
    { icon: 'cube-outline' as const, label: t.premium.unlimitedYarn },
  ];
}

export const PREMIUM_FEATURES = [
  { icon: 'layers-outline' as const, label: 'Ubegrenset prosjekter' },
  { icon: 'cube-outline' as const, label: 'Ubegrenset garnlager' },
];

export const FREE_FEATURES = [
  '5 prosjekter',
  '50 nøster',
  'Verktøy',
];

export const LOCKED_FEATURES = [
  'Ubegrenset antall prosjekter',
  'Ubegrenset garnlager',
];

export const MONTHLY_PRICE = 69;
export const YEARLY_MONTHLY_PRICE = 59;
const YEARLY_TOTAL = YEARLY_MONTHLY_PRICE * 12;
export const YEARLY_SAVINGS = MONTHLY_PRICE * 12 - YEARLY_TOTAL;

type Plan = 'yearly' | 'monthly';

export function PremiumModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const t = useT();
  const colors = useColors();
  const { offerings, purchase, isPurchasing, restore, isRestoring } = useSubscription();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan>('monthly');

  const monthlyPackage = offerings?.current?.monthly ?? offerings?.current?.availablePackages?.[0];
  const yearlyPackage = offerings?.current?.annual ?? offerings?.current?.availablePackages?.[0];

  const activePackage = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;

  const handlePurchase = async () => {
    if (!activePackage) return;
    setErrorMsg(null);
    try {
      await purchase(activePackage);
      onClose();
    } catch (e: any) {
      if (e?.userCancelled) return;
      setErrorMsg(e?.message ?? 'Noe gikk galt. Prøv igjen.');
    }
  };

  const handleRestore = async () => {
    setErrorMsg(null);
    try {
      await restore();
      onClose();
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Klarte ikke gjenopprette kjøp.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: Math.max(insets.bottom + 16, 32) }]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Prøv Knitto+ gratis</Text>
          <Text style={[styles.sub, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
            Lås opp alt og strikk uten grenser
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureRow}>
              <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                <FeatherIcon name="feather" size={13} color="#4CAF50" style={{ alignSelf: 'center' }} />
              </View>
              <Text style={[styles.featureText, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
                {FREE_FEATURES.join('  ·  ')}
              </Text>
            </View>

            <View style={[styles.divider, { backgroundColor: colors.border }]} />

            {LOCKED_FEATURES.map((label, i) => (
              <View key={`locked-${i}`} style={styles.featureRow}>
                <View style={[styles.iconCircle, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="add" size={18} color="#4CAF50" style={{ alignSelf: 'center' }} />
                </View>
                <Text style={[styles.featureTextLocked, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>{label}</Text>
              </View>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.planRow}>
            <Pressable
              style={[
                styles.planCard,
                { borderColor: selectedPlan === 'monthly' ? '#5B7FBF' : colors.border, backgroundColor: colors.background },
                selectedPlan === 'monthly' && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <Text style={[styles.planTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Månedlig</Text>
              <Text style={[styles.planPrice, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {MONTHLY_PRICE} kr / mnd
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.planCard,
                { borderColor: selectedPlan === 'yearly' ? '#5B7FBF' : colors.border, backgroundColor: colors.background },
                selectedPlan === 'yearly' && styles.planCardActive,
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <View style={styles.planBadgeRow}>
                <Text style={[styles.planTitle, { color: colors.text, fontFamily: 'Inter_600SemiBold' }]}>Årlig</Text>
                <View style={styles.savingsBadge}>
                  <Text style={[styles.savingsText, { fontFamily: 'Inter_600SemiBold' }]}>Spar {YEARLY_SAVINGS} kr</Text>
                </View>
              </View>
              <Text style={[styles.planPrice, { color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>
                {YEARLY_MONTHLY_PRICE} kr / mnd
              </Text>
            </Pressable>
          </View>

          {errorMsg && (
            <Text style={[styles.errorText, { fontFamily: 'Inter_400Regular' }]}>{errorMsg}</Text>
          )}

          <Pressable
            style={({ pressed }) => [styles.btn, { opacity: (pressed || isPurchasing || isRestoring) ? 0.85 : 1 }]}
            onPress={handlePurchase}
            disabled={isPurchasing || isRestoring || !activePackage}
          >
            {isPurchasing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={[styles.btnText, { fontFamily: 'Inter_700Bold' }]}>
                  Start gratis prøveperiode
                </Text>
                <Text style={[styles.btnSub, { fontFamily: 'Inter_400Regular' }]}>
                  {`14 dager gratis, deretter ${selectedPlan === 'yearly' ? YEARLY_MONTHLY_PRICE : MONTHLY_PRICE} kr / mnd`}
                </Text>
              </>
            )}
          </Pressable>

          <View style={styles.footerLinks}>
            <Pressable onPress={handleRestore} hitSlop={16} disabled={isPurchasing || isRestoring}>
              <Text style={[styles.footerLink, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                {isRestoring ? 'Gjenoppretter...' : 'Gjenopprett kjøp'}
              </Text>
            </Pressable>
            <Text style={[styles.footerDot, { color: colors.textTertiary }]}>·</Text>
            <Pressable onPress={onClose} hitSlop={16} disabled={isPurchasing}>
              <Text style={[styles.footerLink, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>{t.premium.notNow}</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 22,
  },
  featureList: {
    gap: 11,
    marginBottom: 20,
    alignItems: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    width: '100%',
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 15,
  },
  featureTextLocked: {
    fontSize: 15,
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  planRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  planCard: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 14,
    padding: 14,
    gap: 4,
    alignItems: 'center',
  },
  planCardActive: {
    borderWidth: 2,
  },
  planBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  planTitle: {
    fontSize: 15,
  },
  planPrice: {
    fontSize: 13,
  },
  savingsBadge: {
    backgroundColor: '#5B7FBF',
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  savingsText: {
    color: '#fff',
    fontSize: 11,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: 'center',
    backgroundColor: '#5B7FBF',
    gap: 3,
    minHeight: 64,
    justifyContent: 'center',
    marginBottom: 16,
  },
  btnText: {
    color: '#fff',
    fontSize: 16,
  },
  btnSub: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
  },
  errorText: {
    color: '#C97B84',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 12,
  },
  footerLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  footerLink: {
    fontSize: 13,
  },
  footerDot: {
    fontSize: 13,
  },
});
