import React, { useMemo } from "react";
import { StyleProp, ViewStyle, View } from "react-native";
import {
  Canvas,
  Group,
  Path,
  Circle,
  BlurMask,
  Skia,
  useClock,
  usePathValue,
  vec,
} from "@shopify/react-native-skia";
import { useDerivedValue } from "react-native-reanimated";

type LivingOrbProps = {
  size: number;
  inhaleMs?: number;
  holdMs?: number;
  exhaleMs?: number;
  restMs?: number;
  style?: StyleProp<ViewStyle>;
};

const TAU = Math.PI * 2;

export function LivingOrb({
  size,
  inhaleMs = 4200,
  holdMs = 400,
  exhaleMs = 5200,
  restMs = 400,
  style,
}: LivingOrbProps) {
  const cx = size / 2;
  const cy = size / 2;

  const t = useClock(); // ms since mounted

  // 0..1 breath curve with optional holds
  const breath = useDerivedValue(() => {
    const cycle = inhaleMs + holdMs + exhaleMs + restMs;
    const m = t.value % cycle;

    // inhale 0->1 (ease)
    if (m < inhaleMs) {
      const p = m / inhaleMs;
      return 0.5 - 0.5 * Math.cos(Math.PI * p); // smoothstep-ish
    }

    // hold at 1
    if (m < inhaleMs + holdMs) return 1;

    // exhale 1->0 (ease)
    if (m < inhaleMs + holdMs + exhaleMs) {
      const p = (m - inhaleMs - holdMs) / exhaleMs;
      return 0.5 + 0.5 * Math.cos(Math.PI * p);
    }

    // rest at 0
    return 0;
  });

  // Base radii
  const baseR = (size * 0.26);

  // Two blob layers with slightly different wobble speeds
  const blob1 = usePathValue((p) => {
    "worklet";
    p.reset();

    const time = t.value / 1000;
    const r = baseR * (0.90 + 0.10 * breath.value);
    const amp = r * 0.07;
    const points = 48;
    const lobes = 5.0;     // controls "organic bumps"
    const speed = 0.22;    // wobble speed

    // Build a smooth-ish closed curve using cubic segments
    const step = TAU / points;

    // helper to compute point on deformed circle
    const pointAt = (i: number) => {
      const a = i * step;
      const wobble =
        Math.sin(a * lobes + time * TAU * speed) * 0.65 +
        Math.sin(a * (lobes * 0.5) - time * TAU * speed * 0.6) * 0.35;
      const rr = r + amp * wobble;
      return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a), a, rr };
    };

    const p0 = pointAt(0);
    p.moveTo(p0.x, p0.y);

    // cubic smoothing using tangent control points
    const smooth = 0.35;
    for (let i = 0; i < points; i++) {
      const a0 = pointAt(i);
      const a1 = pointAt((i + 1) % points);

      const t0x = -Math.sin(a0.a);
      const t0y =  Math.cos(a0.a);
      const t1x = -Math.sin(a1.a);
      const t1y =  Math.cos(a1.a);

      const cLen0 = a0.rr * step * smooth;
      const cLen1 = a1.rr * step * smooth;

      const c1x = a0.x + t0x * cLen0;
      const c1y = a0.y + t0y * cLen0;
      const c2x = a1.x - t1x * cLen1;
      const c2y = a1.y - t1y * cLen1;

      p.cubicTo(c1x, c1y, c2x, c2y, a1.x, a1.y);
    }

    p.close();
  }, Skia.Path.Make());

  const blob2 = usePathValue((p) => {
    "worklet";
    p.reset();

    const time = t.value / 1000;
    const r = baseR * (0.74 + 0.08 * breath.value);
    const amp = r * 0.06;
    const points = 40;
    const lobes = 7.0;
    const speed = 0.16;

    const step = TAU / points;

    const pointAt = (i: number) => {
      const a = i * step;
      const wobble =
        Math.sin(a * lobes - time * TAU * speed) * 0.6 +
        Math.sin(a * (lobes * 0.33) + time * TAU * speed * 0.8) * 0.4;
      const rr = r + amp * wobble;
      return { x: cx + rr * Math.cos(a), y: cy + rr * Math.sin(a), a, rr };
    };

    const p0 = pointAt(0);
    p.moveTo(p0.x, p0.y);

    const smooth = 0.32;
    for (let i = 0; i < points; i++) {
      const a0 = pointAt(i);
      const a1 = pointAt((i + 1) % points);

      const t0x = -Math.sin(a0.a);
      const t0y =  Math.cos(a0.a);
      const t1x = -Math.sin(a1.a);
      const t1y =  Math.cos(a1.a);

      const cLen0 = a0.rr * step * smooth;
      const cLen1 = a1.rr * step * smooth;

      p.cubicTo(
        a0.x + t0x * cLen0,
        a0.y + t0y * cLen0,
        a1.x - t1x * cLen1,
        a1.y - t1y * cLen1,
        a1.x,
        a1.y
      );
    }

    p.close();
  }, Skia.Path.Make());

  // A readable "breath ring"
  const ringR = useDerivedValue(() => baseR * (1.35 + 0.10 * breath.value));
  const ringAlpha = useDerivedValue(() => 0.18 + 0.22 * breath.value);

  // You can tune these colors to match your app's palette
  const coreColor = "#F2F2F2";
  const glowColor = "#FFFFFF";

  // Ensure we have valid dimensions
  const canvasStyle = useMemo(() => {
    return [
      { width: size, height: size },
      style,
    ];
  }, [size, style]);

  return (
    <View style={{ width: size, height: size }}>
      <Canvas style={canvasStyle}>
      {/* Halo bloom */}
      <Group opacity={0.18}>
        <Path path={blob1} color={glowColor}>
          <BlurMask blur={26} style="normal" />
        </Path>
      </Group>

      {/* Core blob */}
      <Group opacity={0.20}>
        <Path path={blob1} color={coreColor}>
          <BlurMask blur={10} style="normal" />
        </Path>
      </Group>

      {/* Inner blob */}
      <Group opacity={0.18}>
        <Path path={blob2} color={coreColor}>
          <BlurMask blur={8} style="normal" />
        </Path>
      </Group>

      {/* Breath ring */}
      <Group opacity={ringAlpha}>
        <Circle c={vec(cx, cy)} r={ringR} color={coreColor} style="stroke" strokeWidth={2}>
          <BlurMask blur={2} style="normal" />
        </Circle>
      </Group>
    </Canvas>
    </View>
  );
}

