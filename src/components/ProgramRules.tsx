import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts } from '@/theme';

export function ProgramRules({ onReset }: { onReset: () => void }) {
  return (
    <View style={s.card} accessibilityLabel="Program rules">
      <Text style={s.heading}>THE PROGRAM</Text>
      <Text style={s.body}>
        <Text style={s.bold}>A:</Text> Squat 5×5, Bench 5×5, Row 5×5
      </Text>
      <Text style={s.body}>
        <Text style={s.bold}>B:</Text> Squat 5×5, Overhead Press 5×5, Deadlift 1×5
      </Text>
      <Text style={[s.body, s.soft]}>Classic plan: alternate A and B, three days a week. The tracker doesn&apos;t enforce it, so log whichever lifts you do.</Text>
      <Text style={[s.body, s.soft]}>
        Hit every rep and the weight goes up 5 lb next time (10 lb on deadlift). Miss and you repeat it. Miss three sessions
        in a row and it drops 10%.
      </Text>
      <Text style={[s.body, s.soft]}>Rest about 2 minutes between sets.</Text>
      <View style={s.foot}>
        <Pressable onPress={onReset} style={s.reset} accessibilityRole="button">
          <Text style={s.resetText}>Reset all data</Text>
        </Pressable>
        <Text style={s.note}>Saved on this device.</Text>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.dark, borderRadius: 16, padding: 24, gap: 12 },
  heading: { fontFamily: fonts.monoBold, fontSize: 14, letterSpacing: 1.7, color: colors.darkMuted },
  body: { fontFamily: fonts.regular, fontSize: 14, lineHeight: 21, color: colors.darkText },
  bold: { fontFamily: fonts.bold },
  soft: { color: colors.darkBody },
  foot: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', rowGap: 8, columnGap: 12, marginTop: 8, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.darkLine },
  reset: { minHeight: 44, paddingHorizontal: 16, borderRadius: 999, borderWidth: 1.5, borderColor: colors.danger, justifyContent: 'center' },
  resetText: { fontFamily: fonts.semibold, fontSize: 13, color: colors.danger },
  note: { fontFamily: fonts.regular, fontSize: 12, color: colors.darkMuted },
});
