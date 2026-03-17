import { useState } from “react”;

const RING_COLORS = [”#FF6B6B”, “#FFD93D”, “#6BCB77”, “#4D96FF”, “#C77DFF”];
const VOICE_NAMES = [“Kick”, “Snare”, “Hi-hat”, “Clap”, “Tom”];
const COLOR_BG = “#1A1A2E”;
const COLOR_FIELD = “#16213E”;
const COLOR_PAD_OFF = “#3A3A3A”;

const DEFAULT_PATTERN = [
[true, false, true, false, true, false, true, false],
[false, false, true, false, false, false, true, false],
[true, true, true, true, true, true, true, true],
[false, false, false, false, false, false, false, false],
[false, false, false, false, false, false, false, false],
];

function degToRad(deg) {
return (deg * Math.PI) / 180;
}

function polarToXY(cx, cy, angleDeg, radius) {
const rad = degToRad(angleDeg);
return [cx + radius * Math.cos(rad), cy + radius * Math.sin(rad)];
}

function arcPath(cx, cy, innerR, outerR, startDeg, endDeg) {
const [ox1, oy1] = polarToXY(cx, cy, startDeg, outerR);
const [ox2, oy2] = polarToXY(cx, cy, endDeg, outerR);
const [ix1, iy1] = polarToXY(cx, cy, startDeg, innerR);
const [ix2, iy2] = polarToXY(cx, cy, endDeg, innerR);
const large = endDeg - startDeg > 180 ? 1 : 0;
return `M ${ox1} ${oy1} A ${outerR} ${outerR} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${innerR} ${innerR} 0 ${large} 0 ${ix1} ${iy1} Z`;
}

function RadialSequencer({
size,
pattern,
currentStep,
showPlayhead,
playheadAngle,
}) {
const c = size / 2;
const scale = size / 400;
const ringRadii = [
[170, 190],
[140, 158],
[110, 128],
[80, 98],
[54, 72],
];

return (
<svg
width={size}
height={size}
viewBox={`0 0 ${size} ${size}`}
style={{ display: “block” }}
>
<defs>
<filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
<feGaussianBlur
in=“SourceGraphic”
stdDeviation={3 * scale}
result=“blur”
/>
<feMerge>
<feMergeNode in="blur" />
<feMergeNode in="SourceGraphic" />
</feMerge>
</filter>
<filter
id="playhead-glow"
x="-50%"
y="-50%"
width="200%"
height="200%"
>
<feGaussianBlur in=“SourceGraphic” stdDeviation={3 * scale} />
</filter>
</defs>

```
  <circle cx={c} cy={c} r={195 * scale} fill={COLOR_FIELD} />

  {ringRadii.map(([innerR, outerR], ring) =>
    Array.from({ length: 8 }, (_, step) => {
      const startDeg = -90 + step * 45 + 3.5;
      const endDeg = startDeg + 38;
      const armed = pattern[ring][step];
      const triggering = armed && step === currentStep && showPlayhead;
      const fill = armed ? RING_COLORS[ring] : COLOR_PAD_OFF;
      return (
        <path
          key={`${ring}-${step}`}
          d={arcPath(
            c,
            c,
            innerR * scale,
            outerR * scale,
            startDeg,
            endDeg
          )}
          fill={fill}
          opacity={triggering ? 1 : armed ? 0.8 : 1}
          filter={triggering ? "url(#glow)" : "none"}
          stroke={armed ? "none" : RING_COLORS[ring]}
          strokeWidth={armed ? 0 : 0.5 * scale}
          strokeOpacity={0.2}
        />
      );
    })
  )}

  {showPlayhead && (
    <line
      x1={c}
      y1={c}
      x2={c}
      y2={c - 195 * scale}
      stroke="white"
      strokeOpacity={0.7}
      strokeWidth={3 * scale}
      strokeLinecap="round"
      filter="url(#playhead-glow)"
      transform={`rotate(${playheadAngle}, ${c}, ${c})`}
    />
  )}

  <circle
    cx={c}
    cy={c}
    r={35 * scale}
    fill="rgba(255,255,255,0.08)"
    stroke="rgba(255,255,255,0.15)"
    strokeWidth={1.5 * scale}
  />
  {showPlayhead ? (
    <rect
      x={c - 10 * scale}
      y={c - 10 * scale}
      width={20 * scale}
      height={20 * scale}
      rx={2 * scale}
      fill="white"
    />
  ) : (
    <polygon
      points={`${c - 8 * scale},${c - 12 * scale} ${c - 8 * scale},${c + 12 * scale} ${c + 14 * scale},${c}`}
      fill="white"
    />
  )}
</svg>
```

);
}

function TurtleIcon({ size = 28 }) {
return (
<svg viewBox="0 0 24 24" width={size} height={size}>
<ellipse cx="12" cy="14" rx="8" ry="5" fill="#6BCB77" />
<ellipse
cx="12"
cy="14"
rx="8"
ry="5"
fill="none"
stroke="white"
strokeWidth="1"
/>
<circle cx="19" cy="12" r="2.5" fill="#6BCB77" stroke="white" strokeWidth="1"/>
<circle cx="20" cy="11.5" r="0.7" fill="white" />
{[6, 10, 14, 18].map((x, i) => (
<line key={i} x1={x} y1=“18” x2={x - 1 + (i > 1 ? 2 : 0)} y2=“21” stroke=“white” strokeWidth=“1.5” strokeLinecap=“round”/>
))}
</svg>
);
}

function RabbitIcon({ size = 28 }) {
return (
<svg viewBox="0 0 24 24" width={size} height={size}>
<ellipse cx="12" cy="16" rx="6" ry="5" fill="#FF6B6B" stroke="white" strokeWidth="1"/>
<ellipse cx="9" cy="6" rx="2.5" ry="6" fill="#FF6B6B" stroke="white" strokeWidth="1"/>
<ellipse cx="15" cy="6" rx="2.5" ry="6" fill="#FF6B6B" stroke="white" strokeWidth="1"/>
<ellipse cx="9" cy="6" rx="1.2" ry="4" fill="#FFB3B3" />
<ellipse cx="15" cy="6" rx="1.2" ry="4" fill="#FFB3B3" />
<circle cx="10" cy="15" r="1" fill="white" />
<circle cx="14" cy="15" r="1" fill="white" />
<ellipse cx="12" cy="17.5" rx="1.5" ry="1" fill="#FFB3B3" />
</svg>
);
}

function DiceIcon({ size = 28 }) {
return (
<svg viewBox="0 0 24 24" width={size} height={size}>
<rect x="3" y="3" width="18" height="18" rx="3" fill="white" opacity="0.9"/>
{[[8, 8], [16, 8], [8, 16], [16, 16], [12, 12]].map(([x, y], i) => (
<circle key={i} cx={x} cy={y} r="1.5" fill={COLOR_BG} />
))}
</svg>
);
}

function LoopIcon({ size = 28 }) {
return (
<svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
<path d="M17 2l4 4-4 4" />
<path d="M3 11V9a4 4 0 014-4h14" />
<path d="M7 22l-4-4 4-4" />
<path d="M21 13v2a4 4 0 01-4 4H3" />
</svg>
);
}

function ActionRow({ scale = 1 }) {
const btnSize = 48 * scale;
const iconSize = 28 * scale;
return (
<div style={{ display: “flex”, alignItems: “center”, gap: 20 * scale, justifyContent: “center” }}>
<div style={{ width: btnSize, height: btnSize, borderRadius: “50%”, background: “rgba(255,255,255,0.08)”, display: “flex”, alignItems: “center”, justifyContent: “center”, border: “1.5px solid rgba(255,255,255,0.15)” }}>
<DiceIcon size={iconSize} />
</div>
<div style={{ display: “flex”, alignItems: “center”, gap: 12 * scale }}>
<div style={{ width: 36 * scale, height: 36 * scale, borderRadius: “50%”, background: “rgba(255,255,255,0.08)”, display: “flex”, alignItems: “center”, justifyContent: “center”, border: “1.5px solid rgba(255,255,255,0.15)” }}>
<TurtleIcon size={20 * scale} />
</div>
<div style={{ width: 14 * scale, height: 14 * scale, borderRadius: “50%”, background: “white”, opacity: 0.8 }} />
<div style={{ width: 36 * scale, height: 36 * scale, borderRadius: “50%”, background: “rgba(255,255,255,0.08)”, display: “flex”, alignItems: “center”, justifyContent: “center”, border: “1.5px solid rgba(255,255,255,0.15)” }}>
<RabbitIcon size={20 * scale} />
</div>
</div>
<div style={{ width: btnSize, height: btnSize, borderRadius: “50%”, background: “rgba(255,255,255,0.08)”, display: “flex”, alignItems: “center”, justifyContent: “center”, border: “1.5px solid rgba(255,255,255,0.15)” }}>
<LoopIcon size={iconSize} />
</div>
</div>
);
}

function DiagonalFader({ ring, value = 0.5, width = 100 }) {
const color = RING_COLORS[ring];
const thumbX = 10 + value * (width - 20);
return (
<div style={{ transform: “rotate(-45deg)”, margin: “8px 0” }}>
<svg width={width} height={32} viewBox={`0 0 ${width} 32`}>
<line x1=“10” y1=“16” x2={width - 10} y2=“16” stroke={color} strokeWidth=“4” strokeLinecap=“round” opacity=“0.25” />
<line x1="10" y1="16" x2={thumbX} y2="16" stroke={color} strokeWidth="4" strokeLinecap="round" />
<circle cx={thumbX} cy="16" r="10" fill={color} stroke="white" strokeWidth="2" />
</svg>
</div>
);
}

function FaderPanel({ orientation = “vertical”, compact = false }) {
return (
<div style={{
display: “flex”,
flexDirection: orientation === “vertical” ? “column” : “row”,
alignItems: “center”,
gap: compact ? 2 : 6,
padding: compact ? “8px 4px” : “12px 8px”,
background: “rgba(255,255,255,0.03)”,
borderRadius: 12,
border: “1px solid rgba(255,255,255,0.06)”
}}>
{RING_COLORS.map((_, i) => (
<DiagonalFader key={i} ring={i} value={0.5} width={compact ? 70 : 100} />
))}
</div>
);
}

function BreakpointLabel({ children, dims }) {
return (
<div style={{ textAlign: “center”, marginBottom: 8 }}>
<div style={{ fontSize: 14, fontWeight: 700, color: “#fff”, letterSpacing: 1 }}>{children}</div>
<div style={{ fontSize: 11, color: “rgba(255,255,255,0.4)”, marginTop: 2 }}>{dims}</div>
</div>
);
}

function AnnotationLine({ x1, y1, x2, y2, label, side = “right” }) {
return (
<div style={{ position: “absolute”, left: 0, top: 0, width: “100%”, height: “100%”, pointerEvents: “none” }}>
<svg style={{ position: “absolute”, left: 0, top: 0, width: “100%”, height: “100%”, overflow: “visible” }}>
<line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#FF6B6B" strokeWidth="1" strokeDasharray="4,3" />
<circle cx={x1} cy={y1} r="3" fill="#FF6B6B" />
</svg>
<div style={{
position: “absolute”,
left: side === “right” ? x2 + 6 : undefined,
right: side === “left” ? `calc(100% - ${x2}px + 6px)` : undefined,
top: y2 - 8,
fontSize: 10,
color: “#FF6B6B”,
whiteSpace: “nowrap”,
fontWeight: 600,
fontFamily: “monospace”
}}>
{label}
</div>
</div>
);
}

function PhoneMockup() {
const seqSize = 270;
return (
<div style={{ position: “relative” }}>
<BreakpointLabel dims="375 × 667 · Portrait">PHONE (Small)</BreakpointLabel>
<div style={{
width: 375 * 0.72,
height: 667 * 0.72,
background: COLOR_BG,
borderRadius: 28,
border: “3px solid rgba(255,255,255,0.12)”,
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
padding: “28px 8px 8px”,
gap: 8,
overflow: “hidden”,
position: “relative”,
boxShadow: “0 8px 40px rgba(0,0,0,0.5)”
}}>
<div style={{ width: 50, height: 5, background: “rgba(255,255,255,0.15)”, borderRadius: 3, marginBottom: 4 }} />
<RadialSequencer
size={seqSize * 0.72}
pattern={DEFAULT_PATTERN}
currentStep={2}
showPlayhead={true}
playheadAngle={90}
/>
<ActionRow scale={0.65} />
<div style={{
width: “100%”,
background: “rgba(255,255,255,0.03)”,
borderTop: “1px solid rgba(255,255,255,0.08)”,
borderRadius: “12px 12px 0 0”,
padding: “6px 0 2px”,
display: “flex”,
justifyContent: “center”,
gap: 10,
marginTop: “auto”
}}>
{RING_COLORS.map((c, i) => (
<div key={i} style={{ width: 10, height: 10, borderRadius: “50%”, background: c, opacity: 0.7 }} />
))}
<div style={{ position: “absolute”, bottom: 14, fontSize: 8, color: “rgba(255,255,255,0.3)”, letterSpacing: 1 }}>
↑ SWIPE FOR FADERS
</div>
</div>
</div>
</div>
);
}

function TabletPortraitMockup() {
const seqSize = 300;
return (
<div>
<BreakpointLabel dims="768 × 1024 · Portrait">TABLET (Portrait)</BreakpointLabel>
<div style={{
width: 768 * 0.44,
height: 1024 * 0.44,
background: COLOR_BG,
borderRadius: 20,
border: “3px solid rgba(255,255,255,0.12)”,
display: “flex”,
flexDirection: “column”,
alignItems: “center”,
padding: “20px 12px 12px”,
gap: 12,
overflow: “hidden”,
boxShadow: “0 8px 40px rgba(0,0,0,0.5)”
}}>
<RadialSequencer
size={seqSize}
pattern={DEFAULT_PATTERN}
currentStep={5}
showPlayhead={true}
playheadAngle={225}
/>
<ActionRow scale={0.85} />
<div style={{ marginTop: “auto”, width: “85%” }}>
<FaderPanel orientation="vertical" compact={false} />
</div>
</div>
</div>
);
}

function TabletLandscapeMockup() {
const seqSize = 260;
return (
<div>
<BreakpointLabel dims="1024 × 768 · Landscape">TABLET (Landscape)</BreakpointLabel>
<div style={{
width: 1024 * 0.42,
height: 768 * 0.42,
background: COLOR_BG,
borderRadius: 20,
border: “3px solid rgba(255,255,255,0.12)”,
display: “flex”,
flexDirection: “row”,
alignItems: “center”,
padding: “12px 16px”,
gap: 16,
overflow: “hidden”,
boxShadow: “0 8px 40px rgba(0,0,0,0.5)”
}}>
<div style={{ display: “flex”, flexDirection: “column”, alignItems: “center”, gap: 10, flex: “1 1 auto” }}>
<RadialSequencer
size={seqSize}
pattern={DEFAULT_PATTERN}
currentStep={7}
showPlayhead={true}
playheadAngle={315}
/>
<ActionRow scale={0.72} />
</div>
<div style={{ flex: “0 0 auto” }}>
<FaderPanel orientation="vertical" compact={true} />
</div>
</div>
</div>
);
}

function PadStateReference() {
const states = [
{ label: “Off”, fill: COLOR_PAD_OFF, opacity: 1, glow: false, border: true },
{ label: “Armed”, fill: RING_COLORS[0], opacity: 0.8, glow: false, border: false },
{ label: “Triggering”, fill: RING_COLORS[0], opacity: 1, glow: true, border: false },
{ label: “Touched”, fill: COLOR_PAD_OFF, opacity: 1, glow: false, border: true, bright: true },
];
return (
<div style={{ display: “flex”, gap: 16, flexWrap: “wrap”, justifyContent: “center” }}>
{states.map((s, i) => (
<div key={i} style={{ textAlign: “center” }}>
<svg width="56" height="56" viewBox="0 0 56 56">
<defs>
<filter id={`ref-glow-${i}`} x=”-50%” y=”-50%” width=“200%” height=“200%”>
<feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
<feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
</filter>
</defs>
<path
d={arcPath(28, 28, 14, 26, -109, -71)}
fill={s.fill}
opacity={s.opacity}
filter={s.glow ? `url(#ref-glow-${i})` : “none”}
stroke={s.border ? RING_COLORS[0] : “none”}
strokeWidth={s.border ? 0.8 : 0}
strokeOpacity={0.25}
style={s.bright ? { filter: “brightness(1.3)” } : {}}
/>
</svg>
<div style={{ fontSize: 10, color: “rgba(255,255,255,0.6)”, marginTop: 4, fontWeight: 600 }}>{s.label}</div>
</div>
))}
</div>
);
}

function ColorSwatchRow() {
const items = [
{ label: “Background”, hex: COLOR_BG },
{ label: “Field”, hex: COLOR_FIELD },
{ label: “Pad Off”, hex: COLOR_PAD_OFF },
…RING_COLORS.map((c, i) => ({ label: VOICE_NAMES[i], hex: c })),
];
return (
<div style={{ display: “flex”, gap: 8, flexWrap: “wrap”, justifyContent: “center” }}>
{items.map((item, i) => (
<div key={i} style={{ textAlign: “center” }}>
<div style={{ width: 36, height: 36, borderRadius: 8, background: item.hex, border: “1.5px solid rgba(255,255,255,0.15)”, margin: “0 auto” }} />
<div style={{ fontSize: 9, color: “rgba(255,255,255,0.5)”, marginTop: 3, fontWeight: 600 }}>{item.label}</div>
<div style={{ fontSize: 8, color: “rgba(255,255,255,0.3)”, fontFamily: “monospace” }}>{item.hex}</div>
</div>
))}
</div>
);
}

function IconReference() {
const icons = [
{ label: “Play”, el: <svg viewBox="0 0 24 24" width="24" height="24"><polygon points="8,5 8,19 20,12" fill="white"/></svg> },
{ label: “Stop”, el: <svg viewBox="0 0 24 24" width="24" height="24"><rect x="5" y="5" width="14" height="14" rx="2" fill="white"/></svg> },
{ label: “Dice”, el: <DiceIcon size={24} /> },
{ label: “Loop”, el: <LoopIcon size={24} /> },
{ label: “Turtle”, el: <TurtleIcon size={24} /> },
{ label: “Rabbit”, el: <RabbitIcon size={24} /> },
];
return (
<div style={{ display: “flex”, gap: 16, flexWrap: “wrap”, justifyContent: “center” }}>
{icons.map((ic, i) => (
<div key={i} style={{ textAlign: “center” }}>
<div style={{
width: 44, height: 44, borderRadius: “50%”,
background: “rgba(255,255,255,0.08)”,
border: “1.5px solid rgba(255,255,255,0.15)”,
display: “flex”, alignItems: “center”, justifyContent: “center”
}}>
{ic.el}
</div>
<div style={{ fontSize: 9, color: “rgba(255,255,255,0.5)”, marginTop: 4, fontWeight: 600 }}>{ic.label}</div>
</div>
))}
</div>
);
}

export default function App() {
const [activeTab, setActiveTab] = useState(“layouts”);

const tabs = [
{ id: “layouts”, label: “Breakpoint Layouts” },
{ id: “components”, label: “Component Reference” },
];

return (
<div style={{
minHeight: “100vh”,
background: “#0D0D1A”,
color: “white”,
fontFamily: “‘SF Pro Display’, -apple-system, system-ui, sans-serif”,
padding: “24px 16px”,
}}>
<div style={{ maxWidth: 960, margin: “0 auto” }}>
<div style={{ textAlign: “center”, marginBottom: 24 }}>
<div style={{ fontSize: 11, letterSpacing: 3, color: “rgba(255,255,255,0.3)”, fontWeight: 700, marginBottom: 6 }}>
ORBIT — PRD SECTION 22
</div>
<h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, background: “linear-gradient(135deg, #FF6B6B, #FFD93D, #6BCB77, #4D96FF, #C77DFF)”, WebkitBackgroundClip: “text”, WebkitTextFillColor: “transparent” }}>
Visual Reference Mockups
</h1>
<p style={{ fontSize: 12, color: “rgba(255,255,255,0.4)”, marginTop: 6 }}>
Pixel-accurate targets for the building agent at every breakpoint
</p>
</div>

```
    <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 24 }}>
      {tabs.map(t => (
        <button
          key={t.id}
          onClick={() => setActiveTab(t.id)}
          style={{
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            background: activeTab === t.id ? "rgba(255,255,255,0.12)" : "transparent",
            color: activeTab === t.id ? "white" : "rgba(255,255,255,0.4)",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            letterSpacing: 0.5,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>

    {activeTab === "layouts" && (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
        <div style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 32,
          justifyContent: "center",
          alignItems: "flex-start",
        }}>
          <PhoneMockup />
          <TabletPortraitMockup />
        </div>
        <TabletLandscapeMockup />

        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: "16px 20px",
          maxWidth: 600,
          width: "100%",
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 10 }}>
            LAYOUT RULES
          </div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.7 }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: "#FF6B6B", fontWeight: 700 }}>{'<'}480px</span> — Sequencer 85vw. Faders in bottom drawer (swipe up). Action row below sequencer.
            </div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: "#FFD93D", fontWeight: 700 }}>768px+</span> — Sequencer 60vw max 500px. Faders always visible below (portrait) or beside (landscape).
            </div>
            <div>
              <span style={{ color: "#6BCB77", fontWeight: 700 }}>1024px+</span> — Two-column: sequencer left, fader panel right. Max sequencer width 500px.
            </div>
          </div>
        </div>
      </div>
    )}

    {activeTab === "components" && (
      <div style={{ display: "flex", flexDirection: "column", gap: 28, alignItems: "center" }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          width: "100%",
          maxWidth: 500,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 12 }}>
            COLOR PALETTE
          </div>
          <ColorSwatchRow />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          width: "100%",
          maxWidth: 500,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 12 }}>
            PAD STATES (Ring 0 — Kick)
          </div>
          <PadStateReference />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          width: "100%",
          maxWidth: 500,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 12 }}>
            ICON SET (All Inline SVG — No External Assets)
          </div>
          <IconReference />
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          width: "100%",
          maxWidth: 500,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 12 }}>
            DIAGONAL FADERS
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
            {RING_COLORS.map((_, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", width: 40, textAlign: "right", fontWeight: 600 }}>{VOICE_NAMES[i]}</div>
                <DiagonalFader ring={i} value={[0.3, 0.5, 0.7, 0.4, 0.6][i]} width={100} />
              </div>
            ))}
          </div>
        </div>

        <div style={{
          background: "rgba(255,255,255,0.03)",
          borderRadius: 12,
          border: "1px solid rgba(255,255,255,0.06)",
          padding: 20,
          width: "100%",
          maxWidth: 500,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.5)", letterSpacing: 1, marginBottom: 12 }}>
            TEMPO CONTROL (Turtle / Dot / Rabbit)
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <TurtleIcon size={28} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 16, height: 16, borderRadius: "50%", background: "white", opacity: 0.8, margin: "0 auto" }} />
              <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>100 BPM</div>
            </div>
            <div style={{
              width: 48, height: 48, borderRadius: "50%",
              background: "rgba(255,255,255,0.08)",
              border: "1.5px solid rgba(255,255,255,0.15)",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <RabbitIcon size={28} />
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
</div>
```

);
}
