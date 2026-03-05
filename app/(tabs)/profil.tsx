import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useKnitting } from '@/context/KnittingContext';
import { useUser, getGreeting } from '@/context/UserContext';
import { useColors } from '@/context/ThemeContext';
import { useT } from '@/context/LanguageContext';

export default function ProfilScreen() {
  const colors = useColors();
  const t = useT();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === 'web' ? 67 : insets.top;
  const { firstName, setFirstName } = useUser();
  const { projects, yarnStock, needles } = useKnitting();
  const [showEditName, setShowEditName] = useState(false);
  const [nameInput, setNameInput] = useState('');

  const greeting = getGreeting(firstName, t);

  const activeProjects = projects.filter(p => p.status === 'aktiv').length;
  const finishedProjects = projects.filter(p => p.status === 'ferdig').length;
  const totalSkeins = yarnStock.reduce((s, y) => s + y.skeins, 0);

  const statRows = [
    { label: t.home.statActiveProjects, value: String(activeProjects), icon: 'play-circle-outline' as const },
    { label: t.home.statFinishedProjects, value: String(finishedProjects), icon: 'checkmark-circle-outline' as const },
    { label: t.home.statTotalSkeins, value: String(totalSkeins), icon: 'cube-outline' as const },
    { label: t.home.statNeedlesRegistered, value: String(needles.length), icon: 'construct-outline' as const },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Text style={[styles.title, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Profil</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Platform.OS === 'web' ? 100 : insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: colors.primaryBtn }]}>
          <View style={styles.avatarCircle}>
            <Text style={[styles.avatarLetter, { fontFamily: 'Inter_700Bold' }]}>
              {firstName ? firstName[0].toUpperCase() : '?'}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.greetingText, { fontFamily: 'Inter_400Regular' }]}>{greeting}</Text>
            <Text style={[styles.nameText, { fontFamily: 'Inter_700Bold' }]}>
              {firstName || 'Legg til navn'}
            </Text>
          </View>
          <Pressable
            style={styles.editNameBtn}
            onPress={() => { setNameInput(firstName); setShowEditName(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          >
            <Ionicons name="pencil" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>{t.settings.stats}</Text>
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          {statRows.map((row, i) => (
            <View key={row.label}>
              <View style={styles.statRow}>
                <Ionicons name={row.icon} size={18} color={colors.primaryBtn} />
                <Text style={[styles.statLabel, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
                  {row.label}
                </Text>
                <Text style={[styles.statValue, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>
                  {row.value}
                </Text>
              </View>
              {i < statRows.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Premium</Text>
        <View style={[styles.premiumCard, { backgroundColor: '#2C3E6B' }]}>
          <View style={styles.premiumTop}>
            <View>
              <Text style={[styles.premiumTitle, { fontFamily: 'Inter_700Bold' }]}>Prøv Premium gratis</Text>
              <Text style={[styles.premiumSub, { fontFamily: 'Inter_400Regular' }]}>14 dager, ingen binding</Text>
            </View>
            <View style={[styles.premiumBadge, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
              <Text style={[styles.premiumBadgeText, { fontFamily: 'Inter_600SemiBold' }]}>GRATIS</Text>
            </View>
          </View>
          <View style={styles.premiumFeatures}>
            {[
              'Ubegrenset prosjekter',
              'Ubegrenset garnlager',
              'Prosjektbilder',
              'Full statistikk',
            ].map(f => (
              <View key={f} style={styles.premiumFeatureRow}>
                <Ionicons name="checkmark-circle" size={16} color="rgba(255,255,255,0.7)" />
                <Text style={[styles.premiumFeatureText, { fontFamily: 'Inter_400Regular' }]}>{f}</Text>
              </View>
            ))}
          </View>
          <Pressable style={[styles.premiumBtn, { backgroundColor: '#fff' }]}>
            <Text style={[styles.premiumBtnText, { color: '#2C3E6B', fontFamily: 'Inter_700Bold' }]}>
              Start 14-dagers prøveperiode
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Om appen</Text>
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          {[
            { label: 'App', value: 'Knitto' },
            { label: 'Versjon', value: '1.0.0' },
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.statRow}>
                <Text style={[styles.statLabel, { color: colors.text, fontFamily: 'Inter_400Regular' }]}>
                  {row.label}
                </Text>
                <Text style={[styles.statValue, { color: colors.textTertiary, fontFamily: 'Inter_400Regular' }]}>
                  {row.value}
                </Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>
      </ScrollView>

      <Modal visible={showEditName} transparent animationType="slide" onRequestClose={() => setShowEditName(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
          <View style={[styles.modalSheet, { backgroundColor: colors.surface }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.text, fontFamily: 'Inter_700Bold' }]}>Ditt navn</Text>
            <TextInput
              style={[styles.nameInput, { color: colors.text, backgroundColor: colors.background, borderColor: colors.border, fontFamily: 'Inter_400Regular' }]}
              value={nameInput}
              onChangeText={setNameInput}
              placeholder="Hva heter du?"
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            <Pressable
              style={[styles.saveBtn, { backgroundColor: nameInput.trim() ? colors.primaryBtn : colors.border }]}
              disabled={!nameInput.trim()}
              onPress={() => {
                setFirstName(nameInput.trim());
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                setShowEditName(false);
              }}
            >
              <Text style={[styles.saveBtnText, { fontFamily: 'Inter_600SemiBold' }]}>Lagre</Text>
            </Pressable>
            <Pressable onPress={() => setShowEditName(false)} style={styles.cancelBtn}>
              <Text style={[{ color: colors.textSecondary, fontFamily: 'Inter_400Regular' }]}>Avbryt</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 12 },
  title: { fontSize: 34 },
  content: { padding: 20, gap: 12 },
  sectionTitle: { fontSize: 20, marginTop: 8, marginBottom: 4 },
  profileCard: {
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { fontSize: 24, color: '#fff' },
  greetingText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginBottom: 2 },
  nameText: { fontSize: 20, color: '#fff' },
  editNameBtn: { padding: 8 },
  statsCard: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  statLabel: { flex: 1, fontSize: 15 },
  statValue: { fontSize: 15 },
  divider: { height: 1, marginHorizontal: 16 },
  premiumCard: {
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  premiumTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  premiumTitle: { fontSize: 18, color: '#fff' },
  premiumSub: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  premiumBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  premiumBadgeText: { color: '#fff', fontSize: 11, letterSpacing: 0.5 },
  premiumFeatures: { gap: 8 },
  premiumFeatureRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  premiumFeatureText: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  premiumBtn: { borderRadius: 14, padding: 16, alignItems: 'center' },
  premiumBtnText: { fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalSheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40, gap: 12 },
  modalHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 4 },
  modalTitle: { fontSize: 22 },
  nameInput: { borderRadius: 12, padding: 14, fontSize: 16, borderWidth: 1 },
  saveBtn: { borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 4 },
  saveBtnText: { color: '#fff', fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: 8 },
});
