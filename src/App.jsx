import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PLAN_MD from "../fuel-optimal-8-fighter.md?raw";

/* ================================================================
   FUEL — OPTIMAL 8 · companion app
   Warm kitchen palette. Ember = the feeds that decide sessions.
   Honey = carbs/energy. Sage = done/protein. Copper = warnings.
   ================================================================ */
const C = {
  ink: "#14110D", slab: "#1C1712", card: "#241D14", line: "#3B3226", ash: "#A0937F", bone: "#F0E8D8",
  ember: "#D97742", honey: "#D8A24A", sage: "#8C9C64", copper: "#C24E33", frost: "#8CA6B5",
};
const FONTS = `
/* Barlow / Barlow Condensed / IBM Plex Mono are loaded by a <link> in index.html.
   With no signal they simply never arrive and the fallback stacks below take over. */
* { -webkit-tap-highlight-color: transparent; box-sizing: border-box; }
html, body { background: ${C.ink}; }
body { font-family: 'Barlow', system-ui, -apple-system, sans-serif; }
input, button, textarea { font-family: inherit; }
input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
input[type=date] { color-scheme: dark; }
button:focus-visible, input:focus-visible { outline: 2px solid ${C.ember}; outline-offset: 2px; }
@keyframes pulse { 0%,100% { opacity: 1 } 50% { opacity: .5 } }
@keyframes rise { from { opacity: 0; transform: translateY(6px) } to { opacity: 1; transform: none } }
.rise { animation: rise .16s ease-out; }
@media (prefers-reduced-motion: reduce) { .rise { animation: none } * { transition: none !important; animation: none !important } }
::-webkit-scrollbar { width: 0; height: 0; }
`;
const dsp = { fontFamily: "'Barlow Condensed', 'Arial Narrow', sans-serif" };
const bdy = { fontFamily: "'Barlow', system-ui, sans-serif" };
const mno = { fontFamily: "'IBM Plex Mono', 'Roboto Mono', monospace" };

async function load(k, f) { try { const r = await window.storage.get(k); return r ? JSON.parse(r.value) : f; } catch { return f; } }
async function save(k, v) { try { await window.storage.set(k, JSON.stringify(v)); } catch (e) { console.error(e); } }
const buzz = (m) => { try { if (navigator.vibrate) navigator.vibrate(m); } catch (e) {} };
const num = (v) => { if (v === "" || v === null || v === undefined) return null; const n = Number(v); return isNaN(n) ? null : n; };
const mmss = (s) => { const a = Math.max(0, Math.round(s)), m = Math.floor(a / 60), x = a % 60; return m + ":" + (x < 10 ? "0" : "") + x; };
const r5 = (n) => Math.round(n / 5) * 5;
const iso = (d) => { const z = new Date(d); z.setMinutes(z.getMinutes() - z.getTimezoneOffset()); return z.toISOString().slice(0, 10); };
const mondayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const parseISO = (s) => { const p = String(s).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DSH = { mon: "MON", tue: "TUE", wed: "WED", thu: "THU", fri: "FRI", sat: "SAT", sun: "SUN" };
const todayKey = () => DAYS[(new Date().getDay() + 6) % 7];
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const tMin = (t) => { const p = t.split(":").map(Number); return p[0] * 60 + p[1]; };

/* ================================================================
   THE BLOCKS — every meal, weighed once
   ================================================================ */
const B = {
  batch:     { n: "BATCH", kcal: 543, p: 36, c: 66, f: 15, cook: "std", i: [["Beef mince 5%", "150g raw"], ["Sweet potato", "300g raw"], ["Passata + beef stock", "150g"], ["Mushrooms (optional)", "150g · +33 kcal"]] },
  batchbig:  { n: "BATCH BIG", kcal: 671, p: 47, c: 76, f: 20, cook: "big", i: [["Beef mince 5%", "200g raw"], ["Sweet potato", "350g raw"], ["Passata + beef stock", "150g"], ["Mushrooms (optional)", "150g"]] },
  porridge:  { n: "PORRIDGE", kcal: 570, p: 16, c: 105, f: 10, bn: "Made with hot milk in the thermos; add a splash of water if it's thick.", i: [["Quaker Oat So Simple Golden Syrup", "2 sachets · 2 × 36g"], ["Milk", "250ml"], ["Honey", "20g"], ["Banana", "1"]] },
  porridgeb: { n: "PORRIDGE BIG", kcal: 710, p: 19, c: 130, f: 12, bn: "Made with hot milk in the thermos; add a splash of water if it's thick.", i: [["Quaker Oat So Simple Golden Syrup", "3 sachets"], ["Milk", "250ml"], ["Honey", "20g"], ["Banana", "1"]] },
  shake:     { n: "PRE-SESSION SHAKE", kcal: 225, p: 25, c: 30, f: 2, i: [["Whey", "30g"], ["Banana", "1"], ["Water", ""]] },
  topup:     { n: "CARB TOP-UP", kcal: 522, p: 8, c: 122, f: 1, i: [["Rice", "100g dry"], ["Banana", "1"], ["Honey", "20g"]] },
  shakefr:   { n: "SHAKE + FRUIT", kcal: 360, p: 24, c: 60, f: 3, i: [["UFIT", "1"], ["Bananas", "2"]] },
  steak:     { n: "STEAK & EGGS", kcal: 936, p: 79, c: 79, f: 33, i: [["Steak", "200g"], ["Eggs", "3"], ["Rice", "100g dry"]] },
  steakbig:  { n: "STEAK & EGGS BIG", kcal: 1117, p: 94, c: 99, f: 37, i: [["Steak", "250g"], ["Eggs", "3"], ["Rice", "125g dry"]] },
  pasta:     { n: "CHICKEN PASTA", kcal: 916, p: 84, c: 100, f: 20, i: [["Chicken breast", "250g"], ["Pasta", "125g dry"], ["Passata", "150g"], ["Mushrooms", "150g"]] },
  banana:    { n: "BANANA + ELECTROLYTES", kcal: 105, p: 1, c: 27, f: 0, i: [["Banana", "1"], ["Electrolytes", ""]] },
  ufit:      { n: "UFIT", kcal: 150, p: 20, c: 15, f: 1, i: [["UFIT", "1"]] },
  ufitban:   { n: "UFIT + BANANA", kcal: 255, p: 21, c: 42, f: 1, i: [["UFIT", "1"], ["Banana", "1"]] },
};

/* Day plans — Optimal 8's actual clock */
const F = (t, b, o) => Object.assign({ t, b }, o);
const E = (t, n, o) => Object.assign({ t, ev: n }, o);
const D = {
  mon: { n: "MONDAY", kcal: 3327, p: 236, c: 421, f: 79, tag: "3:30 upper strength + rings ~65 min", star: 0,
    call: ["THE 3:10 SHAKE FUELS THE BENCH", "Bench throws, box jumps, bench, dips, chins, rows — a real session, not a warm-up. Shake at 3:10, porridge in the thermos at 4:50."],
    feeds: [F("03:10", "shake", { crit: 1, note: "Made the night before, in the fridge." }), E("03:30", "UPPER STRENGTH + POWER + RINGS · ~65 MIN"), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("18:30", "steak"), F("21:00", "ufit")] },
  tue: { n: "TUESDAY", kcal: 3699, p: 224, c: 528, f: 79, tag: "3:30 jumps, pistols, engine 1 ~65 min → load Wednesday", star: 0,
    call: ["THE 5PM FEED LOADS WEDNESDAY'S TRAP BAR", "Muscle fuel takes hours to load. Tomorrow's sled, trap bar and pause squat at 3:30am run on today's 5pm carb feed. If Wednesday feels flat, the fault was here."],
    feeds: [F("03:10", "shake", { crit: 1, note: "Non-negotiable. Jumps into an interval session." }), E("03:30", "JUMPS · PISTOLS · ENGINE 1 · TRUNK · ACHILLES · ~65 MIN"), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("17:00", "topup", { crit: 1, note: "This loads Wednesday morning." }), F("20:15", "steak")] },
  wed: { n: "WEDNESDAY", kcal: 3648, p: 254, c: 466, f: 85, tag: "3:30 sled · trap bar · pause squat · RDL ~60 min", star: 1,
    call: ["NOT FASTED. EVER.", "The loading was done last night at 5pm; the 3:10 shake is non-negotiable. The session is finished by 4:30am — there is nothing at 7pm. Porridge big after it, steak and eggs big tonight: the heavy lower day gets the bigger recovery."],
    feeds: [F("03:10", "shake", { crit: 1, note: "The loading was done last night. This is non-negotiable." }), E("03:30", "SLED · TRAP BAR · PAUSE SQUAT · RDL · RING ROWS · ~60 MIN"), F("04:50", "porridgeb", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("18:30", "steakbig"), F("21:00", "ufit")] },
  thu: { n: "THURSDAY", kcal: 3327, p: 236, c: 421, f: 79, tag: "3:30 throws, split squat, engine 2, neck ~61 min", star: 0,
    call: ["24 MINUTES OF INTERVALS — THE SHAKE IS NOT OPTIONAL", "Throws, split squat, tendon hold, the bike, neck. Shake at 3:10, thermos at 4:50."],
    feeds: [F("03:10", "shake", { crit: 1, note: "24 minutes of intervals. The shake is not optional." }), E("03:30", "THROWS · SPLIT SQUAT · TENDON · ENGINE 2 · NECK · ~61 MIN"), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("18:30", "steak"), F("21:00", "ufit")] },
  fri: { n: "FRIDAY", kcal: 3454, p: 204, c: 519, f: 64, tag: "sleep day → work → load Saturday", star: 0,
    call: ["NO SESSION, SAME FOOD", "A rest day is not a low-food day when the biggest session of the week is tomorrow morning. The 5pm carb feed is the most important feed of the week — Saturday's sprints, jumps and squat run on it. If Saturday feels flat, the fault was Friday at 5pm."],
    feeds: [E("", "SLEEP DAY — NO SESSION"), F("07:00", "porridge", { tl: "WAKE", note: "Breakfast, no session in front of it." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr", { note: "The pre-load starts here." }), F("17:00", "topup", { crit: 1, note: "This loads SATURDAY. The most important feed of the week." }), F("19:30", "pasta")] },
  sat: { n: "SATURDAY", kcal: 4148, p: 253, c: 583, f: 90, tag: "legs & power ~96 min, then the easy hour", star: 1,
    call: ["THE BIGGEST DAY OF TRAINING AND FOOD", "Porridge big 6:30, shake 7:45, start 8:15. Water and electrolytes during. Today's 5pm carb feed loads Sunday's rounds."],
    feeds: [F("06:30", "porridgeb"), F("07:45", "shake"), E("08:15", "★ THE LEG & POWER SESSION · ~96 MIN", { sub: "Get-ups, sprints, jumps, squat, circuit, push press." }), F("10:30", "shakefr", { crit: 1, note: "Within the hour after finishing." }), F("11:30", "batchbig"), F("14:30", "batch", { note: "The easy hour, if it's today, sits between the 11:30 and 14:30 feeds or after this one — water only." }), F("17:00", "topup", { crit: 1, note: "This loads SUNDAY." }), F("20:00", "steakbig")] },
  sun: { n: "SUNDAY", kcal: 3552, p: 245, c: 494, f: 68, tag: "throws · Nordics · fight rounds · core ~80 min", star: 1,
    call: ["THE ROUNDS DRAIN THE TANK", "Electrolytes throughout, and a banana in the gap between the throws and the Nordics on fight-sim weeks. Weeks 1 and 16 the rounds are the 20-minute bike test — same rule."],
    feeds: [F("06:30", "porridgeb"), F("07:45", "shake"), E("08:15", "★ THROWS · NORDICS · FIGHT ROUNDS · CORE · ~80 MIN", { sub: "Sim weeks: banana in the throws → Nordics gap." }), F("10:00", "shakefr", { crit: 1, note: "Within the hour after finishing." }), F("11:30", "batch"), F("14:30", "batch", { note: "If the easy hour is today, it's after this feed." }), F("17:00", "ufitban"), F("19:30", "pasta")] },
};

/* Shopping list */
const SHOP = [
  ["MEAT & EGGS", [["Beef mince 5%", "2.2 kg raw"], ["Steak", "5 × 200–250g"], ["Chicken breast", "2 × 250g"], ["Eggs", "15–18"]]],
  ["CARBS", [["Sweet potato", "4.3 kg raw"], ["Quaker Oat So Simple Golden Syrup sachets", "17 a week — two boxes of 15 last under a fortnight"], ["Honey", "~200g"], ["Rice, dry", "1 kg"], ["Pasta, dry", "250g"], ["Bananas", "~30 — not a typo. Buy green on Sunday."]]],
  ["THE REST", [["Passata", "2.1 L"], ["Beef stock", "as needed"], ["Mushrooms", "1 kg"], ["Milk", "2 L"], ["Whey", "1 tub"], ["UFIT", "8–10 bottles"], ["Electrolytes", "as needed — you sweat for a living"]]],
  ["SUPPLEMENTS", [["Creatine monohydrate", "5g every day, any time, in a shake"], ["Omega-3 (fish oil)", "1–2g EPA+DHA daily — there is no oily fish anywhere in your diet"], ["Vitamin D", "1,000–2,000 IU daily · October to April"], ["Multivitamin", "cheap insurance"], ["Beta-alanine (optional)", "3.2g/day split in two · needs four-plus weeks, so start week 1 or don't bother · tingling is harmless"]]],
];

/* Typical raw→cooked yields (fallbacks until he weighs his own) */
const YIELDS = [["White rice", "×2.6 from dry"], ["Pasta", "×2.2 from dry"], ["Chicken breast", "×0.75 from raw"], ["Mince 5%", "×0.7 from raw"], ["Sweet potato (boiled in)", "×0.8 from raw"], ["The batch, mixed", "≈ ×0.8 of everything in"]];


/* ================================================================
   ATOMS + a small timer
   ================================================================ */
const Card = ({ children, s, ac, tid }) => <div data-testid={tid} style={Object.assign({ background: C.card, border: "1px solid " + C.line, borderLeft: ac ? "3px solid " + ac : "1px solid " + C.line, borderRadius: 6, marginBottom: 10, padding: 14 }, s)}>{children}</div>;
const Eye = ({ children, c, s }) => <div style={Object.assign({}, mno, { fontSize: 9.5, letterSpacing: 1.6, color: c || C.ash, marginBottom: 8, textTransform: "uppercase" }, s)}>{children}</div>;
const Lab = ({ children }) => <div style={Object.assign({}, mno, { fontSize: 8, color: C.ash, marginBottom: 3, letterSpacing: 1, textTransform: "uppercase" })}>{children}</div>;
const Fld = ({ v, on, ph, type, s }) => <input value={v == null ? "" : v} onChange={(e) => on(e.target.value)} placeholder={ph} inputMode={type === "date" ? undefined : "decimal"} type={type || "text"}
  style={Object.assign({}, mno, { width: "100%", background: C.ink, border: "1px solid " + C.line, borderRadius: 4, color: C.bone, fontSize: 16, padding: "10px 8px", textAlign: "center", minHeight: 44 }, s)} />;
const Btn = ({ children, on, c, fill, s, dis, small }) => <button onClick={on} disabled={dis} style={Object.assign({}, dsp, { fontSize: small ? 12 : 14, fontWeight: 700, letterSpacing: 1.2, background: fill ? (c || C.ember) : "transparent", color: fill ? C.ink : (c || C.ember), border: "1px solid " + (c || C.ember), borderRadius: 5, padding: small ? "8px 10px" : "12px 14px", cursor: dis ? "default" : "pointer", opacity: dis ? .4 : 1, minHeight: small ? 34 : 44 }, s)}>{children}</button>;
const Chip = ({ children, c, s }) => <span style={Object.assign({}, mno, { fontSize: 8.5, letterSpacing: 1.2, color: c || C.ash, border: "1px solid " + (c || C.line), borderRadius: 3, padding: "2px 6px", textTransform: "uppercase", whiteSpace: "nowrap" }, s)}>{children}</span>;
const Note = ({ children, c, bold, s }) => <div style={Object.assign({}, bdy, { fontSize: 12.5, color: c || C.ash, lineHeight: 1.5, marginTop: 8, fontWeight: bold ? 600 : 400 }, s)}>{children}</div>;

function useBeep(sound) {
  const ctxRef = useRef(null);
  return useCallback((f, ms, vol) => { if (!sound) return; try {
    if (!ctxRef.current) ctxRef.current = new (window.AudioContext || window.webkitAudioContext)();
    const ctx = ctxRef.current; if (ctx.state === "suspended") ctx.resume();
    const o = ctx.createOscillator(), g = ctx.createGain(); o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(ctx.destination);
    const now = ctx.currentTime; g.gain.setValueAtTime(vol || .3, now); g.gain.exponentialRampToValueAtTime(.0001, now + ms / 1000); o.start(now); o.stop(now + ms / 1000 + .03);
  } catch (e) {} }, [sound]);
}

/* ================================================================
   KITCHEN TIMER — one dock, one job
   ================================================================ */
function useKTimer(beep) {
  const [t, setT] = useState(null);
  const tRef = useRef(null), endRef = useRef(0), pipRef = useRef("");
  useEffect(() => { tRef.current = t; }, [t]);
  useEffect(() => {
    if (!t || !t.run) return;
    const id = setInterval(() => { const cur = tRef.current; if (!cur || !cur.run) return;
      const rem = Math.ceil((endRef.current - Date.now()) / 1000);
      if (rem > 0 && rem <= 3 && pipRef.current !== "" + rem) { pipRef.current = "" + rem; beep(880, 80, .2); buzz(30); }
      if (rem <= 0) { beep(523, 200); setTimeout(() => beep(659, 200), 160); setTimeout(() => beep(784, 420), 320); buzz([150, 80, 150, 80, 300]); setT(Object.assign({}, cur, { left: 0, run: false, done: true })); }
      else if (rem !== cur.left) setT(Object.assign({}, cur, { left: rem }));
    }, 200);
    return () => clearInterval(id);
  }, [t && t.run, beep]);
  const start = (label, secs) => { endRef.current = Date.now() + secs * 1000; pipRef.current = ""; setT({ label, left: secs, total: secs, run: true, done: false }); beep(660, 80, .15); };
  const toggle = () => { const cur = tRef.current; if (!cur || cur.done) return; if (cur.run) setT(Object.assign({}, cur, { run: false })); else { endRef.current = Date.now() + cur.left * 1000; setT(Object.assign({}, cur, { run: true })); } };
  const close = () => setT(null);
  return { t, start, toggle, close };
}
function KDock({ K }) {
  const t = K.t; if (!t) return null;
  const frac = t.done ? 1 : 1 - t.left / (t.total || 1);
  return (
    <div style={{ position: "fixed", left: 0, right: 0, bottom: "calc(58px + env(safe-area-inset-bottom))", zIndex: 70, background: C.slab, borderTop: "1px solid " + C.line }}>
      <div style={{ height: 4, background: C.ink }}><div style={{ width: frac * 100 + "%", height: "100%", background: t.done ? C.sage : C.ember, transition: "width .2s linear" }} /></div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", maxWidth: 640, margin: "0 auto" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={Object.assign({}, mno, { fontSize: 9, letterSpacing: 1.2, color: t.done ? C.sage : C.ember })}>{t.label}{t.done ? " · DONE" : ""}</div>
          <div style={Object.assign({}, mno, { fontSize: 22, fontWeight: 700, color: C.bone, lineHeight: 1.1 })}>{t.done ? "✓" : mmss(t.left)}</div>
        </div>
        <Btn on={K.toggle} c={C.ember} small dis={t.done} s={{ minWidth: 64 }}>{t.run ? "PAUSE" : "START"}</Btn>
        <button onClick={K.close} aria-label="Close timer" style={Object.assign({}, mno, { background: "transparent", border: "1px solid " + C.line, color: C.ash, borderRadius: 4, width: 34, height: 34, cursor: "pointer", fontSize: 14 })}>×</button>
      </div>
    </div>);
}

/* ================================================================
   TODAY — the day spine
   ================================================================ */
function MacroBar({ label, val, max, c }) {
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}><span style={Object.assign({}, mno, { fontSize: 7.5, color: C.ash, letterSpacing: 1 })}>{label}</span><span style={Object.assign({}, mno, { fontSize: 8.5, color: C.bone })}>{val}<span style={{ color: C.ash }}>/{max}</span></span></div>
      <div style={{ height: 4, background: C.ink, borderRadius: 2, marginTop: 3 }}><div style={{ width: Math.min(100, val / max * 100) + "%", height: "100%", background: c, borderRadius: 2, transition: "width .3s" }} /></div>
    </div>);
}
function Today({ day, setDay, week, cycle, done, tick, cook, sound }) {
  const d = D[day], today = todayKey(), isToday = day === today;
  const dl = done || {};
  const eaten = d.feeds.reduce((a, f, i) => f.b && dl[i] ? { k: a.k + B[f.b].kcal, p: a.p + B[f.b].p, c: a.c + B[f.b].c, f: a.f + B[f.b].f } : a, { k: 0, p: 0, c: 0, f: 0 });
  const nm = nowMin();
  const nextIdx = isToday ? d.feeds.findIndex((f, i) => f.b && !dl[i] && tMin(f.t) >= nm - 5) : -1;
  const [open, setOpen] = useState(null);
  const dload = week === 5 || week === 10 || (week === 18 && cycle === 18), taper = week === 15 || week === 16;
  return (
    <div>
      {dload ? <Card ac={C.sage}><Eye c={C.sage}>Easy week {week}</Eye><Note c={C.bone} s={{ marginTop: 0 }}>Keep eating exactly as written — the training drops, the building doesn't. No fight rounds means no mid-session banana on Sunday.</Note></Card> : null}
      {taper ? <Card ac={C.frost}><Eye c={C.frost}>{week === 16 ? "Test week" : "Taper week " + week}</Eye><Note c={C.bone} s={{ marginTop: 0 }}>Volume drops, food holds. Do not cut carbs — arrive at {week === 16 ? "Saturday" : "test day"} full.{week === 16 ? " Test day eats exactly like a normal Saturday." : ""}</Note></Card> : null}

      <Card ac={d.star ? C.ember : C.line} s={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={Object.assign({}, dsp, { fontSize: 28, fontWeight: 800, letterSpacing: 1.6, color: C.bone, lineHeight: 1 })}>{d.star ? "★ " : ""}{d.n}</span>
            <span style={Object.assign({}, mno, { fontSize: 18, fontWeight: 700, color: C.honey })}>{d.kcal.toLocaleString()}<span style={{ fontSize: 9, color: C.ash }}> KCAL</span></span>
          </div>
          <div style={Object.assign({}, bdy, { fontSize: 12.5, color: C.ash, marginTop: 4 })}>{d.tag}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <MacroBar label="KCAL" val={eaten.k} max={d.kcal} c={C.honey} />
            <MacroBar label="P" val={eaten.p} max={d.p} c={C.sage} />
            <MacroBar label="C" val={eaten.c} max={d.c} c={C.ember} />
            <MacroBar label="F" val={eaten.f} max={d.f} c={C.frost} />
          </div>
        </div>
        <div style={{ background: C.ink, borderTop: "1px solid " + C.line, padding: "10px 14px" }}>
          <div style={Object.assign({}, mno, { fontSize: 8.5, letterSpacing: 1.4, color: C.ember })}>{d.call[0]}</div>
          <div style={Object.assign({}, bdy, { fontSize: 12, color: C.bone, marginTop: 4, lineHeight: 1.45 })}>{d.call[1]}</div>
        </div>
      </Card>

      {isToday && nextIdx >= 0 ? (() => { const f = d.feeds[nextIdx]; const mins = tMin(f.t) - nm;
        return (
          <Card ac={C.ember} s={{ background: "#2A1F13" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>
                <Eye c={C.ember} s={{ marginBottom: 3 }}>Next feed{sound ? " · chimes when due" : ""}</Eye>
                <div style={Object.assign({}, dsp, { fontSize: 21, fontWeight: 800, letterSpacing: 1, color: C.bone })}>{B[f.b].n}</div>
              </span>
              <span style={{ textAlign: "right" }}>
                <div style={Object.assign({}, mno, { fontSize: 26, fontWeight: 700, color: C.ember, lineHeight: 1 })}>{f.tl || f.t}</div>
                <div style={Object.assign({}, mno, { fontSize: 9.5, color: mins <= 0 ? C.sage : C.ash, marginTop: 3, animation: mins <= 0 ? "pulse 1.4s infinite" : "none" })}>{mins <= 0 ? "NOW" : "IN " + (mins >= 60 ? Math.floor(mins / 60) + "H " + (mins % 60) + "M" : mins + " MIN")}</div>
              </span>
            </div>
          </Card>); })() : null}

      {d.feeds.map((f, i) => {
        if (f.ev) return (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 2px", opacity: .95 }}>
            <span style={Object.assign({}, mno, { fontSize: 10, color: C.ash, width: 40, flexShrink: 0 })}>{f.t}</span>
            <span style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <span style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px dashed " + C.line }} />
              <span style={Object.assign({}, dsp, { position: "relative", display: "inline-block", background: C.ink, padding: "0 8px", fontSize: 13, fontWeight: 700, letterSpacing: 1, lineHeight: 1.25, color: f.ev.indexOf("★") >= 0 ? C.ember : C.ash })}>{f.ev}</span>
            </span>
          </div>);
        const bl = B[f.b], on = !!dl[i], isNext = i === nextIdx, isOpen = open === i;
        return (
          <Card key={i} tid="feed" ac={on ? C.sage : f.crit ? C.ember : C.line} s={{ padding: 0, opacity: on ? .68 : 1, borderColor: isNext ? C.ember : C.line }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
              <span onClick={() => setOpen(isOpen ? null : i)} style={{ flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={Object.assign({}, mno, { fontSize: 11, color: isNext ? C.ember : C.ash, width: 40, flexShrink: 0, fontWeight: isNext ? 700 : 400 })}>{f.tl || f.t}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={Object.assign({}, bdy, { fontSize: 14.5, fontWeight: 600, color: f.crit && !on ? C.ember : C.bone })}>{f.crit ? "★ " : ""}{bl.n}</div>
                  <div style={Object.assign({}, mno, { fontSize: 9, color: C.ash, marginTop: 2 })}>{bl.kcal} KCAL · P{bl.p} C{bl.c} F{bl.f}</div>
                </span>
              </span>
              <button onClick={() => tick(i)} aria-label={"Mark " + bl.n} style={Object.assign({}, mno, { width: 44, height: 44, borderRadius: 6, cursor: "pointer", fontSize: 17, fontWeight: 700, flexShrink: 0, background: on ? C.sage : "transparent", color: on ? C.ink : C.ash, border: "1px solid " + (on ? C.sage : C.line) })}>{on ? "✓" : "○"}</button>
            </div>
            {isOpen ? (
              <div className="rise" style={{ padding: "0 12px 12px 62px" }}>
                {bl.i.map((it, j) => <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: j ? "1px solid " + C.line : "none" }}>
                  <span style={Object.assign({}, bdy, { fontSize: 13, color: C.bone })}>{it[0]}</span>
                  <span style={Object.assign({}, mno, { fontSize: 11, color: C.honey })}>{it[1]}</span></div>)}
{bl.cook ? (() => {
                  const parts = [];
                  if (cook && cook.mince) parts.push("cooked mince ≈ " + cook.mince[bl.cook] + " g");
                  if (cook && cook.potato) parts.push("cooked sweet potato ≈ " + cook.potato[bl.cook] + " g");
                  return parts.length
                    ? <div style={Object.assign({}, mno, { fontSize: 10.5, color: C.sage, marginTop: 8, lineHeight: 1.5 })}>{parts.join(" · ")}</div>
                    : <div style={Object.assign({}, bdy, { fontSize: 11.5, color: C.ash, marginTop: 8, fontStyle: "italic" })}>Weigh each pan once in COOK and this card shows what one portion of each looks like cooked.</div>;
                })() : null}
                {bl.bn ? <Note s={{ fontStyle: "italic" }}>{bl.bn}</Note> : null}
                {f.note ? <Note s={{ fontStyle: "italic" }}>{f.note}</Note> : null}
              </div>) : null}
            {f.sub && isOpen ? <div style={{ padding: "0 12px 10px 62px" }}><Note s={{ marginTop: 0 }}>{f.sub}</Note></div> : null}
          </Card>);
      })}
      <Card s={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={Object.assign({}, mno, { fontSize: 9, color: C.frost, letterSpacing: 1 })}>HYDRATION</span>
          <span style={Object.assign({}, bdy, { fontSize: 12, color: C.ash, flex: 1 })}>Electrolytes on site · urine pale straw — dark at 10am means the morning session ran under-watered. Drink before bed, not just at 3am.</span>
        </div>
      </Card>
    </div>);
}

/* ================================================================
   COOK — the raw→cooked problem, solved
   ================================================================ */
const Step = ({ n, t }) => <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}><span style={Object.assign({}, mno, { fontSize: 11, fontWeight: 700, color: C.ember, width: 16, flexShrink: 0 })}>{n}</span><span style={Object.assign({}, bdy, { fontSize: 13, color: C.bone, lineHeight: 1.45 })}>{t}</span></div>;
const Big = ({ v, on, ph, lab }) => (
  <div style={{ flex: 1, minWidth: 0 }}>
    <Lab>{lab}</Lab>
    <input value={v} onChange={(e) => on(e.target.value)} placeholder={ph} inputMode="decimal" type="text"
      style={Object.assign({}, mno, { width: "100%", background: C.ink, border: "1px solid " + C.line, borderRadius: 5, color: C.bone, fontSize: 20, fontWeight: 700, padding: "12px 8px", textAlign: "center", minHeight: 56 })} />
  </div>
);
const Out = ({ lab, v, colour }) => (
  <div style={{ flex: 1, background: C.card, border: "1px solid " + colour, borderRadius: 6, padding: "14px 6px", textAlign: "center" }}>
    <div style={Object.assign({}, mno, { fontSize: 8.5, color: C.ash, letterSpacing: 1.2 })}>{lab}</div>
    <div style={Object.assign({}, mno, { fontSize: 40, fontWeight: 700, color: colour, lineHeight: 1.05 })}>{v}<span style={{ fontSize: 15, color: C.ash }}>g</span></div>
  </div>
);
/* One calculator: two inputs, two live outputs, a portion count and a save. */
const Calc = ({ title, colour, blurb, rawLab, rawPh, ckLab, ckPh, raw, setRaw, ck, setCk, out, count, countLab, saved, onSave }) => (
  <Card ac={colour}>
    <Eye c={colour}>{title}</Eye>
    <Note s={{ marginTop: 0 }}>{blurb}</Note>
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <Big lab={rawLab} ph={rawPh} v={raw} on={setRaw} />
      <Big lab={ckLab} ph={ckPh} v={ck} on={setCk} />
    </div>
    {out ? (
      <div className="rise" style={{ marginTop: 12 }}>
        <div style={{ display: "flex", gap: 8 }}>
          <Out lab="ONE STANDARD" v={out.std} colour={colour} />
          <Out lab="ONE BIG" v={out.big} colour={C.bone} />
        </div>
        <Btn c={C.sage} fill s={{ width: "100%", marginTop: 10 }} on={() => { onSave(out); buzz([60, 40, 60]); }}>SAVE — SHOW ON EVERY BATCH FEED</Btn>
      </div>
    ) : <Note s={{ fontStyle: "italic" }}>Type both weights and the two numbers appear here.</Note>}
    {count ? <div style={Object.assign({}, mno, { fontSize: 10, color: C.ash, marginTop: 10, letterSpacing: .6 })}>{countLab} {count} STANDARD PORTIONS</div> : null}
    {saved ? <div style={Object.assign({}, mno, { fontSize: 9.5, color: C.sage, marginTop: 6 })}>SAVED · {saved.std}g STANDARD · {saved.big}g BIG{saved.date ? " · " + saved.date : ""}</div> : null}
  </Card>
);

function Cook({ cook, setCook, foods, setFoods, K }) {
  /* Two independent calculators. Each takes the raw weight that went in and the
     cooked weight that came out, and scales one portion's raw share by the loss.
     Mince pot: 150g raw mince standard, 200g big. Sweet potato: 300g and 350g. */
  const [mRaw, setMRaw] = useState(""); const [mCooked, setMCooked] = useState("");
  const [sRaw, setSRaw] = useState(""); const [sCooked, setSCooked] = useState("");
  const [uRaw, setURaw] = useState(""); const [uCooked, setUCooked] = useState(""); const [uTarget, setUTarget] = useState(""); const [uName, setUName] = useState("");

  const portion = (raw, cooked, stdShare, bigShare) => {
    const r = num(raw), c = num(cooked);
    return r > 0 && c > 0 ? { std: r5(c * stdShare / r), big: r5(c * bigShare / r) } : null;
  };
  const countOf = (raw, share) => { const r = num(raw); return r > 0 ? Math.round(r / share * 10) / 10 : null; };
  const mOut = portion(mRaw, mCooked, 150, 200);
  const sOut = portion(sRaw, sCooked, 300, 350);
  const mCount = countOf(mRaw, 150), sCount = countOf(sRaw, 300);





  const uOut = num(uCooked) && num(uRaw) && num(uTarget) ? r5(num(uCooked) * num(uTarget) / num(uRaw)) : null;
  const uFactor = num(uCooked) && num(uRaw) ? num(uCooked) / num(uRaw) : null;
  return (
    <div>
      <Card ac={C.ember}>
        <Eye c={C.ember}>The batch — two pans, weighed separately</Eye>
        <Note s={{ marginTop: 0 }}>Cook the mince and the sweet potato in separate pans — they cook at different rates and lose different amounts of water, so one pot weighed together tells you nothing about either. Weigh each one cooked, type the raw weight in and the cooked weight out, and serve by the two numbers it gives you.</Note>
        <div style={{ background: C.ink, border: "1px solid " + C.line, borderRadius: 5, padding: "11px 12px", marginTop: 12 }}>
          <Eye c={C.honey} s={{ marginBottom: 6 }}>The method</Eye>
          <Step n="1" t="Brown the mince, stock and passata in, simmer it down — one pan, everything in it." />
          <Step n="2" t="Sweet potato in its own pan: roasted or boiled, however much you're cooking." />
          <Step n="3" t="Weigh each one cooked. The mince pot is mince, passata and stock together, minus the pot." />
          <Step n="4" t="Type raw and cooked below. Serve by the two numbers from then on — until the recipe or the pan changes." />
          <Btn small c={C.ember} s={{ marginTop: 6 }} on={() => K.start("SIMMER", 25 * 60)}>▶ SIMMER TIMER · 25:00</Btn>
        </div>
        <Note s={{ fontStyle: "italic" }}>Mushrooms go in per portion when you eat — 150g, +33 kcal — not into the pan.</Note>
      </Card>

      <Calc
        title="Mince pot"
        colour={C.copper}
        blurb="Mince, passata and stock together. A standard portion is 150g of raw mince, a big one 200g."
        rawLab="Raw mince cooked (g)" rawPh="e.g. 2200"
        ckLab="Cooked pot weight (g)" ckPh="e.g. 3500"
        raw={mRaw} setRaw={setMRaw} ck={mCooked} setCk={setMCooked}
        out={mOut} count={mCount} countLab="THIS POT ="
        saved={cook && cook.mince}
        onSave={(o) => setCook(Object.assign({}, cook, { mince: { std: o.std, big: o.big, date: iso(new Date()) } }))}
      />

      <Calc
        title="Sweet potato"
        colour={C.honey}
        blurb="All of it, roasted or boiled. A standard portion is 300g raw, a big one 350g."
        rawLab="Raw sweet potato cooked (g)" rawPh="e.g. 4300"
        ckLab="Cooked weight (g)" ckPh="e.g. 3400"
        raw={sRaw} setRaw={setSRaw} ck={sCooked} setCk={setSCooked}
        out={sOut} count={sCount} countLab="THIS BATCH ="
        saved={cook && cook.potato}
        onSave={(o) => setCook(Object.assign({}, cook, { potato: { std: o.std, big: o.big, date: iso(new Date()) } }))}
      />

      <Card ac={C.honey}>
        <Eye c={C.honey}>Batch anything — the universal converter</Eye>
        <Note s={{ marginTop: 0 }}>Rice, pasta, chicken — cook a batch, weigh it once, and serve by cooked weight from then on.</Note>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          <div style={{ flex: 1 }}><Lab>Raw in (g)</Lab><Fld v={uRaw} on={setURaw} ph="e.g. 500" /></div>
          <div style={{ flex: 1 }}><Lab>Cooked out (g)</Lab><Fld v={uCooked} on={setUCooked} ph="e.g. 1300" /></div>
          <div style={{ flex: 1 }}><Lab>Plan asks (g raw)</Lab><Fld v={uTarget} on={setUTarget} ph="e.g. 100" /></div>
        </div>
        {uOut ? <div className="rise" style={{ textAlign: "center", marginTop: 12 }}>
          <div style={Object.assign({}, mno, { fontSize: 34, fontWeight: 700, color: C.honey })}>{uOut}<span style={{ fontSize: 14, color: C.ash }}>g cooked</span></div>
          <div style={Object.assign({}, mno, { fontSize: 9.5, color: C.ash, marginTop: 3 })}>YOUR RATIO ×{uFactor.toFixed(2)}</div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <div style={{ flex: 2 }}><Fld v={uName} on={setUName} ph="save as… e.g. RICE 100g dry" s={{ textAlign: "left", fontSize: 12 }} /></div>
            <Btn small c={C.honey} dis={!uName.trim()} on={() => { setFoods([{ n: uName.trim().toUpperCase(), out: uOut, factor: +uFactor.toFixed(2) }].concat(foods.filter((x) => x.n !== uName.trim().toUpperCase()))); setUName(""); buzz(40); }}>SAVE</Btn>
          </div>
        </div> : null}
        {foods.length ? <div style={{ marginTop: 12 }}>
          <Eye s={{ marginBottom: 4 }}>Your saved ratios — one tap in the kitchen</Eye>
          {foods.map((x, i) => <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "7px 0", borderTop: "1px solid " + C.line }}>
            <span style={Object.assign({}, bdy, { fontSize: 13, fontWeight: 600, color: C.bone })}>{x.n}</span>
            <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <span style={Object.assign({}, mno, { fontSize: 14, fontWeight: 700, color: C.honey })}>{x.out}g cooked</span>
              <button onClick={() => setFoods(foods.filter((_, j) => j !== i))} style={Object.assign({}, mno, { background: "transparent", border: "none", color: C.ash, cursor: "pointer", fontSize: 13 })}>×</button>
            </span></div>)}
        </div> : null}
        <div style={{ marginTop: 12 }}>
          <Eye s={{ marginBottom: 4 }}>Typical yields — guides until you've weighed your own</Eye>
          {YIELDS.map((y) => <div key={y[0]} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}><span style={Object.assign({}, bdy, { fontSize: 12, color: C.ash })}>{y[0]}</span><span style={Object.assign({}, mno, { fontSize: 10.5, color: C.ash })}>{y[1]}</span></div>)}
        </div>
      </Card>

      <Card>
        <Eye>Cook days</Eye>
        <Note s={{ marginTop: 0 }}><span style={{ color: C.bone, fontWeight: 600 }}>Cook Sunday, cook Wednesday — half a batch each time.</span> Fourteen portions a week: thirteen standard, one big. Two half-week cooks beat one giant pot — fresher, and the pans fit.</Note>
      </Card>
    </div>);
}

/* ================================================================
   SHOP
   ================================================================ */
function Shop({ shop, setShop }) {
  const total = SHOP.reduce((a, g) => a + g[1].length, 0);
  const got = Object.values(shop).filter(Boolean).length;
  return (
    <div>
      <Card ac={C.honey} s={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span><Eye c={C.honey} s={{ marginBottom: 2 }}>The weekly shop</Eye><span style={Object.assign({}, mno, { fontSize: 13, color: C.bone })}>{got}/{total} in the trolley</span></span>
          <Btn small c={C.ash} on={() => setShop({})}>NEW WEEK</Btn>
        </div>
        <div style={{ height: 4, background: C.ink, borderRadius: 2, marginTop: 10 }}><div style={{ width: got / total * 100 + "%", height: "100%", background: C.honey, borderRadius: 2, transition: "width .3s" }} /></div>
      </Card>
      {SHOP.map((g, gi) => (
        <Card key={g[0]} ac={[C.copper, C.honey, C.frost, C.sage][gi]}>
          <Eye c={[C.copper, C.honey, C.frost, C.sage][gi]}>{g[0]}</Eye>
          {g[1].map((it, i) => { const k = gi + "-" + i, on = !!shop[k];
            return (
              <div key={k} onClick={() => setShop(Object.assign({}, shop, { [k]: !on }))} style={{ display: "flex", gap: 11, alignItems: "center", padding: "9px 0", borderTop: i ? "1px solid " + C.line : "none", cursor: "pointer" }}>
                <span style={Object.assign({}, mno, { width: 26, height: 26, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: on ? C.sage : "transparent", color: C.ink, border: "1px solid " + (on ? C.sage : C.line) })}>{on ? "✓" : ""}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={Object.assign({}, bdy, { fontSize: 14, fontWeight: 600, color: on ? C.ash : C.bone, textDecoration: on ? "line-through" : "none" })}>{it[0]}</div>
                  <div style={Object.assign({}, bdy, { fontSize: 11.5, color: C.ash, marginTop: 1 })}>{it[1]}</div>
                </span>
              </div>);
          })}
        </Card>))}
      <Card><Note s={{ marginTop: 0, fontStyle: "italic" }}>Bananas green on Sunday ripen across the week. The supplements aren't a substitute for food — they're the honest answer to the one hole your food list actually has.</Note></Card>
    </div>);
}

/* ================================================================
   PLAN + SETTINGS + SHELL
   ================================================================ */
/* ================================================================
   PLAN — the fuel document itself, bundled so it reads with no signal.
   The document uses headings, rules, tables and bold. Nothing else,
   so the parser only has to cover those four.
   ================================================================ */
const mdBold = (t) => t.split("**").map((part, i) => i % 2
  ? <span key={i} style={{ color: C.bone, fontWeight: 600 }}>{part}</span>
  : <React.Fragment key={i}>{part}</React.Fragment>);

function mdBlocks(lines) {
  const out = [];
  let i = 0;
  while (i < lines.length) {
    const ln = lines[i];
    if (!ln.trim()) { i++; continue; }
    if (/^\|/.test(ln)) {                                   // table
      const rows = [];
      while (i < lines.length && /^\|/.test(lines[i])) {
        rows.push(lines[i].replace(/^\||\|$/g, "").split("|").map((c) => c.trim()));
        i++;
      }
      const sep = rows.findIndex((r) => r.length && r.every((c) => /^:?-{2,}:?$/.test(c)));
      out.push({ t: "table", head: sep > 0 ? rows[sep - 1] : [], body: rows.slice(sep + 1) });
      continue;
    }
    if (/^###?#?\s/.test(ln)) { out.push({ t: "h", lvl: (ln.match(/^#+/) || ["#"])[0].length, s: ln.replace(/^#+\s*/, "") }); i++; continue; }
    if (/^---+$/.test(ln.trim())) { out.push({ t: "hr" }); i++; continue; }
    const para = [];
    while (i < lines.length && lines[i].trim() && !/^\||^#|^---+$/.test(lines[i])) { para.push(lines[i].trim()); i++; }
    out.push({ t: "p", s: para.join(" ") });
  }
  return out;
}

function MdTable({ head, body }) {
  const cols = head.length;
  const hasHead = head.some((c) => c);
  const LONG = 25;
  const longCols = head.map((_, j) => body.some((r) => (r[j] || "").length > LONG)).filter(Boolean).length;

  if (cols === 2) {
    /* Two columns read best stacked on a phone — unless every value is short,
       in which case the app's usual label-left / value-right row is tidier. */
    const shortVals = body.every((r) => (r[1] || "").length <= 30);
    return (
      <div style={{ marginTop: 10 }}>
        {hasHead ? <Eye s={{ marginBottom: 6 }}>{head.join(" · ")}</Eye> : null}
        {body.map((r, i) => shortVals ? (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "6px 0", borderTop: i ? "1px solid " + C.line : "none" }}>
            <span style={Object.assign({}, bdy, { fontSize: 13, color: C.bone })}>{mdBold(r[0])}</span>
            <span style={Object.assign({}, mno, { fontSize: 11.5, color: C.honey, textAlign: "right", flexShrink: 0 })}>{mdBold(r[1] || "")}</span>
          </div>
        ) : (
          <div key={i} style={{ padding: "7px 0", borderTop: i ? "1px solid " + C.line : "none" }}>
            <div style={Object.assign({}, bdy, { fontSize: 13, fontWeight: 600, color: C.bone })}>{mdBold(r[0])}</div>
            <div style={Object.assign({}, bdy, { fontSize: 12.5, color: C.ash, lineHeight: 1.5, marginTop: 2 })}>{mdBold(r[1] || "")}</div>
          </div>
        ))}
      </div>
    );
  }

  /* A real table only where it still fits a phone: three columns with at most
     one wordy one (the day plans). Anything wider stacks, so nothing important
     ends up off the right-hand edge. */
  if (cols <= 3 && longCols <= 1) {
    const th = Object.assign({}, mno, { fontSize: 8.5, letterSpacing: 1, color: C.ash, textAlign: "left", padding: "0 8px 6px 0", textTransform: "uppercase", whiteSpace: "nowrap" });
    const td = Object.assign({}, bdy, { fontSize: 12.5, padding: "6px 8px 6px 0", borderTop: "1px solid " + C.line, verticalAlign: "top", lineHeight: 1.45 });
    return (
      <div style={{ marginTop: 10 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", tableLayout: "auto" }}>
          {hasHead ? <thead><tr>{head.map((c, i) => <th key={i} style={th}>{c}</th>)}</tr></thead> : null}
          <tbody>{body.map((r, i) => <tr key={i}>{r.map((c, j) => (
            <td key={j} style={Object.assign({}, td, j === 0 ? Object.assign({}, mno, { fontSize: 11, color: C.ash, whiteSpace: "nowrap", width: 1 }) : { color: C.bone }, j && j === cols - 1 && c.length <= LONG ? Object.assign({}, mno, { fontSize: 11.5, color: C.honey, textAlign: "right", whiteSpace: "nowrap", width: 1 }) : {})}>{mdBold(c)}</td>
          ))}</tr>)}</tbody>
        </table>
      </div>
    );
  }

  /* Stacked: the first cell heads the row, wordy cells get their own line,
     short ones pair up with their column header on one compact line. */
  return (
    <div style={{ marginTop: 10 }}>
      {body.map((r, i) => {
        const rest = r.slice(1).map((c, j) => ({ h: head[j + 1] || "", v: c || "" })).filter((x) => x.v);
        const wordy = rest.filter((x) => x.v.length > LONG);
        const brief = rest.filter((x) => x.v.length <= LONG);
        return (
          <div key={i} style={{ padding: "8px 0", borderTop: i ? "1px solid " + C.line : "none" }}>
            <div style={Object.assign({}, bdy, { fontSize: 13.5, fontWeight: 600, color: C.bone })}>{mdBold(r[0])}</div>
            {wordy.map((x, j) => <div key={j} style={Object.assign({}, bdy, { fontSize: 12.5, color: C.ash, lineHeight: 1.5, marginTop: 3 })}>{x.h && head.some((c) => c) ? <span style={Object.assign({}, mno, { fontSize: 8.5, letterSpacing: 1, color: C.ash, marginRight: 6, textTransform: "uppercase" })}>{x.h}</span> : null}{mdBold(x.v)}</div>)}
            {brief.length ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "2px 12px", marginTop: 4 }}>
                {brief.map((x, j) => <span key={j} style={Object.assign({}, mno, { fontSize: 11, color: C.honey, whiteSpace: "nowrap" })}>{x.h ? <span style={{ fontSize: 8.5, letterSpacing: 1, color: C.ash, marginRight: 4, textTransform: "uppercase" }}>{x.h}</span> : null}{mdBold(x.v)}</span>)}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function MdBody({ blocks }) {
  return blocks.map((b, i) => {
    if (b.t === "hr") return null;
    if (b.t === "h") return <div key={i} style={Object.assign({}, dsp, { fontSize: 14, fontWeight: 700, letterSpacing: 1, color: C.honey, marginTop: i ? 14 : 0 })}>{b.s}</div>;
    if (b.t === "table") return <MdTable key={i} head={b.head} body={b.body} />;
    return <div key={i} style={Object.assign({}, bdy, { fontSize: 12.5, color: C.ash, lineHeight: 1.6, marginTop: 10 })}>{mdBold(b.s)}</div>;
  });
}

/* Split the document into its ## sections, keeping whatever sits above the first. */
const PLAN_DOC = (() => {
  const lines = PLAN_MD.replace(/\r/g, "").split("\n");
  const title = (lines.find((l) => /^#\s/.test(l)) || "# FUEL").replace(/^#\s*/, "");
  const secs = [];
  let cur = null, pre = [];
  for (const l of lines) {
    if (/^##\s/.test(l)) { cur = { h: l.replace(/^##\s*/, ""), lines: [] }; secs.push(cur); continue; }
    if (/^#\s/.test(l)) continue;
    (cur ? cur.lines : pre).push(l);
  }
  return { title, intro: mdBlocks(pre), secs: secs.map((x) => ({ h: x.h, blocks: mdBlocks(x.lines) })) };
})();

function PlanView() {
  const refs = useRef({});
  const go = (i) => { const el = refs.current[i]; if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 66, behavior: "smooth" }); };
  return (
    <div>
      <Card ac={C.ember}>
        <div style={Object.assign({}, dsp, { fontSize: 22, fontWeight: 800, letterSpacing: 1.4, color: C.bone, lineHeight: 1.05 })}>{PLAN_DOC.title}</div>
        <MdBody blocks={PLAN_DOC.intro} />
      </Card>

      <Card ac={C.honey}>
        <Eye c={C.honey}>Contents</Eye>
        {PLAN_DOC.secs.map((sec, i) => (
          <button key={i} onClick={() => go(i)} style={Object.assign({}, bdy, { display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", borderTop: i ? "1px solid " + C.line : "none", color: C.bone, fontSize: 13, padding: "9px 0", cursor: "pointer", lineHeight: 1.35 })}>
            <span style={Object.assign({}, mno, { fontSize: 9, color: C.ash, marginRight: 8 })}>{String(i + 1).padStart(2, "0")}</span>{sec.h}
          </button>
        ))}
      </Card>

      {PLAN_DOC.secs.map((sec, i) => (
        <div key={i} ref={(el) => { refs.current[i] = el; }}>
          <Card ac={C.line}>
            <div style={Object.assign({}, dsp, { fontSize: 16, fontWeight: 700, letterSpacing: 1.1, color: C.bone, lineHeight: 1.15 })}>{sec.h}</div>
            <MdBody blocks={sec.blocks} />
          </Card>
        </div>
      ))}
    </div>
  );
}
function Settings({ st, setSt, week, close, onExport, onImport }) {
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(20,17,13,.94)", zIndex: 95, overflowY: "auto" }} onClick={close}>
      <div className="rise" onClick={(e) => e.stopPropagation()} style={{ background: C.card, maxWidth: 640, margin: "24px auto", marginTop: "calc(24px + env(safe-area-inset-top))", marginBottom: "calc(24px + env(safe-area-inset-bottom))", borderRadius: 8, border: "1px solid " + C.line, padding: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={Object.assign({}, dsp, { fontSize: 20, fontWeight: 800, letterSpacing: 1.4, color: C.bone })}>SETTINGS</span>
          <Btn on={close} c={C.ash} small s={{ minWidth: 44, minHeight: 44 }}>CLOSE</Btn>
        </div>
        <Lab>Monday of Optimal 8 week 1 — keeps the easy-week and taper banners honest</Lab>
        <Fld type="date" v={st.start} on={(v) => { if (v) setSt(Object.assign({}, st, { start: iso(mondayOf(parseISO(v))) })); }} s={{ textAlign: "left" }} />
        <Note>Today reads as <span style={{ color: C.honey }}>week {week}</span>.</Note>
        {[["iron", "18-week cycle (Hell Week + reload)", "Match the Optimal 8 app. Off = 16 weeks."], ["sound", "Chimes", "Feed-time chime while the app is open, plus timer bells."]].map((x) => (
          <div key={x[0]} onClick={() => setSt(Object.assign({}, st, { [x[0]]: !st[x[0]] }))} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0", borderTop: "1px solid " + C.line, cursor: "pointer", marginTop: 10 }}>
            <span style={{ width: 40, height: 24, borderRadius: 12, background: st[x[0]] ? C.sage : C.ink, border: "1px solid " + (st[x[0]] ? C.sage : C.line), position: "relative", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 2, left: st[x[0]] ? 18 : 2, width: 18, height: 18, borderRadius: 9, background: C.bone, transition: "left .15s" }} /></span>
            <span style={{ flex: 1 }}><div style={Object.assign({}, bdy, { fontSize: 13.5, fontWeight: 600, color: C.bone })}>{x[1]}</div><div style={Object.assign({}, bdy, { fontSize: 11.5, color: C.ash })}>{x[2]}</div></span>
          </div>))}
        <Backup onExport={onExport} onImport={onImport} />
      </div>
    </div>);
}

const KEYS = { st: "fu8-settings", done: "fu8-done", cook: "fu8-cook", foods: "fu8-foods", shop: "fu8-shop" };
const DEFAULT_ST = () => ({ start: iso(mondayOf(new Date())), iron: false, sound: true });
export default function App() {
  const [st, setStRaw] = useState(DEFAULT_ST);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("today");
  const [day, setDay] = useState(todayKey());
  const [doneAll, setDoneRaw] = useState({});
  const [cook, setCookRaw] = useState(null);
  const [foods, setFoodsRaw] = useState([]);
  const [shop, setShopRaw] = useState({});
  const [showSet, setShowSet] = useState(false);
  const beep = useBeep(st.sound);
  const K = useKTimer(beep);
  const chimed = useRef({});
  const mk = (setter, key) => (v) => { setter(v); save(key, v); };
  const setSt = mk(setStRaw, KEYS.st), setDoneAll = mk(setDoneRaw, KEYS.done), setCook = mk(setCookRaw, KEYS.cook), setFoods = mk(setFoodsRaw, KEYS.foods), setShop = mk(setShopRaw, KEYS.shop);

  /* --- backup: all five fu8 keys, out and back in --------------------- */
  const buildBackup = useCallback(async () => {
    const data = {};
    for (const short of Object.keys(KEYS)) data[KEYS[short]] = await load(KEYS[short], null);
    return JSON.stringify({ app: "optimal-8-fuel", version: 1, exported: new Date().toISOString(), data }, null, 2);
  }, []);
  const applyBackup = useCallback(async (text) => {
    let obj;
    try { obj = JSON.parse(String(text).trim()); } catch (e) { return { ok: 0, msg: "That isn't a Fuel backup — check you pasted the whole thing." }; }
    const data = obj && typeof obj === "object" && obj.data && typeof obj.data === "object" ? obj.data : obj;
    if (!data || typeof data !== "object") return { ok: 0, msg: "That isn't a Fuel backup." };
    const setters = { st: setStRaw, done: setDoneRaw, cook: setCookRaw, foods: setFoodsRaw, shop: setShopRaw };
    const found = Object.keys(KEYS).filter((short) => Object.prototype.hasOwnProperty.call(data, KEYS[short]));
    if (!found.length) return { ok: 0, msg: "No Fuel data found in that backup." };
    for (const short of found) {
      let v = data[KEYS[short]];
      if (short === "st") v = Object.assign(DEFAULT_ST(), v || {});
      if (short === "done" || short === "shop") v = v || {};
      if (short === "foods") v = Array.isArray(v) ? v : [];
      await save(KEYS[short], v);
      setters[short](v);
    }
    return { ok: 1, msg: "Restored " + found.length + " of 5 sections. You're back." };
  }, []);
  useEffect(() => { (async () => {
    const s = await load(KEYS.st, null); if (s) setStRaw(s); else save(KEYS.st, st);
    setDoneRaw(await load(KEYS.done, {})); setCookRaw(await load(KEYS.cook, null)); setFoodsRaw(await load(KEYS.foods, [])); setShopRaw(await load(KEYS.shop, {}));
    setLoaded(true);
  })(); }, []);
  const L = st.iron ? 18 : 16;
  const week = useMemo(() => { const wk = Math.floor((mondayOf(new Date()) - mondayOf(parseISO(st.start))) / 604800000); return wk < 0 ? 1 : (wk % L) + 1; }, [st.start, L]);
  const dateK = iso(new Date());
  const dayDone = (doneAll[dateK + "-" + day]) || {};
  const tick = (i) => { const k = dateK + "-" + day; const cur = Object.assign({}, doneAll[k]); cur[i] = !cur[i]; const n = Object.assign({}, doneAll); n[k] = cur; setDoneAll(n); buzz(25); };
  useEffect(() => { const id = setInterval(() => { if (!st.sound) return; const t = todayKey(); const nm = nowMin();
    D[t].feeds.forEach((f, i) => { if (f.b && tMin(f.t) === nm && !chimed.current[dateK + i] && !((doneAll[dateK + "-" + t] || {})[i])) { chimed.current[dateK + i] = 1; beep(660, 200); setTimeout(() => beep(880, 350), 220); buzz([120, 60, 120]); } });
  }, 20000); return () => clearInterval(id); }, [st.sound, doneAll, beep]);
  const TABS = [["today", "TODAY"], ["cook", "COOK"], ["shop", "SHOP"], ["plan", "PLAN"]];
  return (
    <div style={Object.assign({}, bdy, { background: C.ink, minHeight: "100vh", color: C.bone })}>
      <style>{FONTS}</style>
      {showSet ? <Settings st={st} setSt={setSt} week={week} close={() => setShowSet(false)} onExport={buildBackup} onImport={applyBackup} /> : null}
      <div style={{ borderBottom: "1px solid " + C.line, background: C.slab, position: "sticky", top: 0, zIndex: 30, paddingTop: "env(safe-area-inset-top)" }}>
        <div style={{ borderTop: "3px solid " + C.ember }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 13px", paddingLeft: "max(13px, env(safe-area-inset-left))", paddingRight: "max(13px, env(safe-area-inset-right))", maxWidth: 640, margin: "0 auto" }}>
          <span style={Object.assign({}, dsp, { fontSize: 19, fontWeight: 800, letterSpacing: 2, color: C.bone })}>FUEL<span style={{ color: C.ember }}>·</span>O8</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Chip c={C.honey}>WK {week} · ~3,600 KCAL</Chip>
            <button onClick={() => setShowSet(true)} aria-label="Settings" style={Object.assign({}, mno, { background: "transparent", border: "1px solid " + C.line, color: C.ash, borderRadius: 4, width: 44, height: 44, cursor: "pointer", fontSize: 16 })}>⚙</button>
          </span>
        </div>
        {tab === "today" ? (
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 13px 10px", display: "flex", gap: 3 }}>
            {DAYS.map((k) => { const active = day === k, isT = k === todayKey();
              return <button key={k} onClick={() => setDay(k)} style={Object.assign({}, dsp, { flex: 1, fontSize: 10.5, fontWeight: 700, padding: "7px 0", borderRadius: 4, cursor: "pointer", minHeight: 32, background: active ? C.ember : "transparent", color: active ? C.ink : isT ? C.sage : C.ash, border: "1px solid " + (active ? C.ember : isT ? C.sage : C.line) })}>{DSH[k]}</button>; })}
          </div>) : <div style={{ paddingBottom: 2 }} />}
      </div>
      <div style={{ padding: "13px 13px 150px", maxWidth: 640, margin: "0 auto" }}>
        {!loaded ? <div style={Object.assign({}, mno, { fontSize: 11, color: C.ash, padding: "40px 0", textAlign: "center" })}>LOADING…</div> : (
          <div>
            {tab === "today" ? <Today day={day} setDay={setDay} week={week} cycle={L} done={dayDone} tick={tick} cook={cook} sound={st.sound} /> : null}
            {tab === "cook" ? <Cook cook={cook} setCook={setCook} foods={foods} setFoods={setFoods} K={K} /> : null}
            {tab === "shop" ? <Shop shop={shop} setShop={setShop} /> : null}
            {tab === "plan" ? <PlanView /> : null}
            <div style={Object.assign({}, bdy, { fontSize: 10.5, color: C.ash, textAlign: "center", padding: "24px 0 6px", lineHeight: 1.6 })}>Eat for it. The training only writes the cheque.</div>
          </div>)}
      </div>
      <KDock K={K} />
      <div style={{ position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 50, background: C.slab, borderTop: "1px solid " + C.line, paddingBottom: "env(safe-area-inset-bottom)" }}>
        <div style={{ display: "flex", maxWidth: 640, margin: "0 auto" }}>
          {TABS.map((x) => <button key={x[0]} onClick={() => setTab(x[0])} style={Object.assign({}, dsp, { flex: 1, fontSize: 11, fontWeight: 700, letterSpacing: .8, background: "transparent", border: "none", borderTop: "2px solid " + (tab === x[0] ? C.ember : "transparent"), color: tab === x[0] ? C.bone : C.ash, padding: "12px 2px 14px", cursor: "pointer", minHeight: 50 })}>{x[1]}</button>)}
        </div>
      </div>
    </div>);
}
