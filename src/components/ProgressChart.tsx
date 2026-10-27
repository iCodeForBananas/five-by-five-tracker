import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path } from 'react-native-svg';

import { fmtW, KEYS, LIFTS, num, shortDate, type LiftKey, type TrackerData } from '@/lib/program';
import { useLayout } from '@/hooks/useLayout';
import { colors, fonts } from '@/theme';

const H = 320;

type Props = { data: TrackerData; onToggle: (k: LiftKey) => void };

export function ProgressChart({ data, onToggle }: Props) {
  const [width, setWidth] = useState(0);
  const { cardPad, type } = useLayout();
  const sess = data.sessions;
  const n = sess.length;

  const series = {} as Record<LiftKey, { i: number; w: number; ok: boolean }[]>;
  const all: number[] = [];
  KEYS.forEach((k) => {
    series[k] = [];
    sess.forEach((ss, i) => {
      const e = ss.entries.find((x) => x.k === k);
      if (e) series[k].push({ i, w: num(e.w), ok: e.ok });
    });
    if (!data.hidden[k]) series[k].forEach((p) => all.push(p.w));
  });

  let lo = 0;
  let hi = 100;
  if (all.length) {
    lo = Math.max(0, Math.floor(Math.min(...all) / 20) * 20 - 20);
    hi = Math.ceil(Math.max(...all) / 20) * 20 + 20;
    if (hi - lo < 80) hi = lo + 80;
    hi = lo + Math.ceil((hi - lo) / 20) * 20;
  }
  // Same 0..1000 layout space as the prototype, scaled to pixels.
  const X = (i: number) => ((n <= 1 ? 500 : 20 + (i * 960) / (n - 1)) / 1000) * width;
  const Y = (w: number) => ((960 - ((w - lo) / (hi - lo)) * 920) / 1000) * H;
  const ticks = [0, 1, 2, 3, 4].map((j) => lo + ((hi - lo) * j) / 4);
  const hasChart = n > 0 && all.length > 0;

  return (
    <View style={[s.card, { padding: cardPad }]} accessibilityLabel="Progress">
      <View>
        <Text style={[s.title, { fontSize: type(28) }]}>Weight over time</Text>
        <Text style={s.sub}>
          {n ? `${n} session${n > 1 ? 's' : ''} · tap a lift to show or hide it` : 'Your lifts will chart here as you log sessions'}
        </Text>
      </View>
      <View style={s.chips}>
        {KEYS.map((k) => {
          const on = !data.hidden[k];
          return (
            <Pressable
              key={k}
              onPress={() => onToggle(k)}
              accessibilityRole="switch"
              accessibilityState={{ checked: on }}
              style={[s.chip, { backgroundColor: on ? colors.bg : colors.card, borderColor: on ? colors.ink : colors.line }]}>
              <View style={[s.dot, { backgroundColor: LIFTS[k].color, opacity: on ? 1 : 0.3 }]} />
              <Text style={[s.chipText, { color: on ? colors.ink : colors.muted }]}>{LIFTS[k].name}</Text>
            </Pressable>
          );
        })}
      </View>

      {hasChart ? (
        <>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 44, height: H }}>
              {ticks.map((v) => (
                <Text key={v} style={[s.tick, { top: Y(v) - 8 }]}>
                  {fmtW(Math.round(v))}
                </Text>
              ))}
            </View>
            <View
              style={{ flex: 1, height: H }}
              onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
              accessible
              accessibilityRole="image"
              accessibilityLabel={`Line chart of working weight per lift across ${n} sessions`}>
              {width > 0 && (
                <Svg width={width} height={H} style={{ overflow: 'visible' }}>
                  {[40, 270, 500, 730].map((y) => (
                    <Line key={y} x1={0} x2={width} y1={(y / 1000) * H} y2={(y / 1000) * H} stroke={colors.grid} strokeWidth={1} />
                  ))}
                  <Line x1={0} x2={width} y1={0.96 * H} y2={0.96 * H} stroke={colors.lineStrong} strokeWidth={1.5} />
                  {KEYS.filter((k) => !data.hidden[k]).map((k) => (
                    <Path
                      key={k}
                      d={series[k].map((p, j) => (j ? 'L' : 'M') + X(p.i).toFixed(1) + ' ' + Y(p.w).toFixed(1)).join(' ')}
                      fill="none"
                      stroke={LIFTS[k].color}
                      strokeWidth={3}
                      strokeLinejoin="round"
                      strokeLinecap="round"
                    />
                  ))}
                  {KEYS.filter((k) => !data.hidden[k]).flatMap((k) =>
                    series[k].map((p) => (
                      <Circle
                        key={k + p.i}
                        cx={X(p.i)}
                        cy={Y(p.w)}
                        r={5}
                        stroke={LIFTS[k].color}
                        strokeWidth={2}
                        fill={p.ok ? LIFTS[k].color : '#FFFFFF'}
                      />
                    )),
                  )}
                </Svg>
              )}
            </View>
          </View>
          <View style={s.dates}>
            <Text style={s.date}>{shortDate(sess[0].date)}</Text>
            <Text style={s.date}>{n > 1 ? shortDate(sess[n - 1].date) : ''}</Text>
          </View>
          <Text style={s.sub}>Solid dots: all reps completed. Hollow dots: missed reps at that weight.</Text>
        </>
      ) : (
        <View style={s.empty}>
          <Text style={s.emptyText}>
            {n ? 'All lifts are hidden. Tap one above to show it.' : 'Finish your first workout to start the graph.'}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: 16, gap: 20 },
  title: { fontFamily: fonts.black, letterSpacing: -0.3, color: colors.ink },
  sub: { fontFamily: fonts.regular, fontSize: 13, color: colors.muted, marginTop: 4 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { minHeight: 40, paddingHorizontal: 14, borderRadius: 999, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 8 },
  chipText: { fontFamily: fonts.semibold, fontSize: 13 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  tick: { position: 'absolute', right: 0, fontFamily: fonts.mono, fontSize: 12, lineHeight: 16, color: colors.muted },
  dates: { flexDirection: 'row', justifyContent: 'space-between', paddingLeft: 54 },
  date: { fontFamily: fonts.mono, fontSize: 12, color: colors.muted },
  empty: { height: 220, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.lineStrong, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { fontFamily: fonts.regular, fontSize: 15, color: colors.muted, textAlign: 'center' },
});
