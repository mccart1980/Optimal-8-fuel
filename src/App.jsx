import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";

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
  porridge:  { n: "PORRIDGE", kcal: 612, p: 20, c: 112, f: 11, i: [["Oats", "80g"], ["Milk", "250ml"], ["Golden syrup", "25g"], ["Banana", "1"]] },
  porridgeb: { n: "PORRIDGE BIG", kcal: 688, p: 23, c: 126, f: 13, i: [["Oats", "100g"], ["Milk", "250ml"], ["Golden syrup", "25g"], ["Banana", "1"]] },
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
  mon: { n: "MONDAY", kcal: 3369, p: 240, c: 428, f: 80, tag: "3am upper strength + box jumps ~72 min", star: 0,
    call: ["THE 3:10 SHAKE FUELS THE BENCH", "Bench throws, box jumps and bench at 3:30 — a real session, not a warm-up. Shake at 3:10, porridge in the thermos at 4:50."],
    feeds: [F("03:10", "shake", { crit: 1, note: "Made the night before, in the fridge." }), E("03:30", "UPPER STRENGTH + BOX JUMPS · ~72 MIN"), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("18:30", "steak"), F("21:00", "ufit")] },
  tue: { n: "TUESDAY", kcal: 3741, p: 228, c: 535, f: 80, tag: "3am jumps + engine 1 ~61 min → load Wednesday", star: 1,
    call: ["THE 5PM FEED LOADS WEDNESDAY'S TRAP BAR", "Muscle fuel takes hours to load. Tomorrow's sled, trap bar and pause squat at 3:30am run on today's 5pm carb feed. If Wednesday feels flat, the fault was here."],
    feeds: [F("03:10", "shake", { crit: 1, note: "Non-negotiable. Jumps into an interval session." }), E("03:30", "JUMPS + ENGINE 1 + HANDS + TRUNK · ~61 MIN"), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("17:00", "topup", { crit: 1, note: "This loads Wednesday morning." }), F("20:15", "steak")] },
  wed: { n: "WEDNESDAY", kcal: 3626, p: 258, c: 462, f: 86, tag: "3am sled · trap bar · pause squat · RDL ~67 min", star: 1,
    call: ["NOT FASTED — THE HEAVIEST WEEKDAY MORNING", "The loading was done last night at 5pm; the 3:10 shake is non-negotiable. Porridge big after, steak & eggs big tonight. The session is finished by 4:10am — there is nothing at 7pm."],
    feeds: [F("03:10", "shake", { crit: 1, note: "Made the night before." }), E("03:30", "SLED · TRAP BAR · PAUSE SQUAT · RDL · ~67 MIN"), F("04:50", "porridgeb", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("18:30", "steakbig"), F("21:00", "ufit")] },
  thu: { n: "THURSDAY", kcal: 3369, p: 240, c: 428, f: 80, tag: "3am throws + engine 2 + size + neck ~74 min", star: 0,
    call: ["24 MINUTES OF INTERVALS — THE SHAKE IS NOT OPTIONAL", "Throws, the second bike session, then the size block. The longest weekday morning. Shake at 3:10, thermos at 4:50."],
    feeds: [F("03:10", "shake", { crit: 1, note: "Non-negotiable." }), E("03:30", "THROWS + LANDMINE · ENGINE 2 · SIZE A · NECK · ~74 MIN"), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("18:30", "steak"), F("21:00", "ufit")] },
  fri: { n: "FRIDAY", kcal: 3496, p: 208, c: 526, f: 65, tag: "3am easy ride fasted → load Saturday", star: 1,
    call: ["THE 5PM FEED LOADS SATURDAY", "Muscle fuel takes hours to load. Tomorrow's sprints, jumps and squat run on today's 5pm carb feed. If Saturday feels flat, the fault was here."],
    feeds: [E("03:15", "EASY RIDE — FASTED", { sub: "Water and electrolytes only. Weeks 6–10: 40 min, otherwise 50." }), F("04:30", "porridge", { note: "After the ride, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "shakefr"), F("17:00", "topup", { crit: 1, note: "This loads SATURDAY. The most important feed of the week." }), F("19:30", "pasta")] },
  sat: { n: "SATURDAY", kcal: 4126, p: 257, c: 579, f: 91, tag: "legs & power ~120 min · no work", star: 1,
    call: ["THE BIGGEST DAY OF TRAINING AND FOOD", "Porridge 6:30, shake 7:45, start 8:15. Today's 5pm carb feed loads Sunday's rounds."],
    feeds: [F("06:30", "porridgeb"), F("07:45", "shake"), E("08:15", "★ LEGS & POWER · ~120 MIN"), F("10:30", "shakefr", { crit: 1, note: "Within 60 min of finishing." }), F("11:30", "batchbig"), F("14:30", "batch"), F("17:00", "topup", { crit: 1, note: "This loads SUNDAY." }), F("20:00", "steakbig")] },
  sun: { n: "SUNDAY", kcal: 3530, p: 249, c: 490, f: 69, tag: "throws · rounds · size · Nordics ~90 min", star: 1,
    call: ["THE ROUNDS DRAIN THE TANK", "Electrolytes throughout, and eat a banana in the gap between the throws and the rounds on fight-sim weeks. Weeks 1 and 16 the rounds are the bike test — same rule."],
    feeds: [F("06:30", "porridgeb"), F("07:45", "shake"), E("08:15", "★ THROWS · ROUNDS · SIZE · NORDICS · ~90 MIN", { sub: "Sim weeks: banana in the throws → rounds gap." }), F("10:00", "shakefr", { crit: 1, note: "Within 60 min of finishing." }), F("11:30", "batch"), F("14:30", "batch"), F("17:00", "ufitban"), F("19:30", "pasta")] },
};

/* Shopping list */
const SHOP = [
  ["MEAT & EGGS", [["Beef mince 5%", "2.2 kg raw"], ["Steak", "5 × 200–250g"], ["Chicken breast", "2 × 250g"], ["Eggs", "15–18"]]],
  ["CARBS", [["Sweet potato", "4.3 kg"], ["Oats", "700g"], ["Rice, dry", "1 kg"], ["Pasta, dry", "250g"], ["Bananas", "~26 — not a typo. Buy green on Sunday."], ["Golden syrup + honey", "as needed"]]],
  ["THE REST", [["Passata", "2.1 L"], ["Mushrooms", "1 kg"], ["Milk", "2 L"], ["Whey", "1 tub"], ["UFIT", "8–10 bottles"], ["Electrolytes", "daily — you sweat for a living"]]],
  ["SUPPLEMENTS", [["Creatine monohydrate", "5g every day, any time, in a shake"], ["Omega-3 (fish oil)", "1–2g EPA+DHA daily — zero oily fish in your diet"], ["Vitamin D", "1,000–2,000 IU · October–April"], ["Multivitamin", "cheap insurance"], ["Beta-alanine (optional)", "3.2g/day split in two · start week 1 or don't bother · tingling is harmless"]]],
];

/* Typical raw→cooked yields (fallbacks until he weighs his own) */
const YIELDS = [["White rice", "×2.6 from dry"], ["Pasta", "×2.2 from dry"], ["Chicken breast", "×0.75 from raw"], ["Mince 5%", "×0.7 from raw"], ["Sweet potato (boiled in)", "×0.8 from raw"], ["The batch, mixed", "≈ ×0.8 of everything in"]];

const PLANREF = [
  ["THE NUMBERS", C.honey, [
    ["Maintenance ~3,400 (9¼-hour training week, no boxing for now) · target ~3,600 · surplus ~190 kcal/day → ~0.7 kg/month. Muscle has a rate limit — a bigger surplus just adds fat, which enters the punch without producing force.", 1],
    ["WHEN DAILY BOXING RETURNS: on every boxing day without a 5pm feed already, add a CARB TOP-UP at 17:30 and push dinner to 20:15. That lifts the average to ~3,800. Sparring day adds the banana + electrolytes at 18:45. Nothing else changes.", 1],
    ["Protein 240g (3.0 g/kg) — above requirement, a by-product of your food. Carbs 493g (6.1 g/kg) — rises again when boxing returns. Fat 79g (1.0 g/kg) — at the floor, never lower.", 0],
    ["Calories cycle with the session: Saturday 4,126, Monday and Thursday 3,369. Same week, 750 apart.", 0]]],
  ["EASY WEEKS & THE TAPER", C.sage, [
    ["Easy weeks (5 and 10 — and 18 only if the 18-week cycle is switched on in Settings): keep eating exactly as written. The training drops; the building doesn't. Only change: no fight rounds = no mid-session banana Sunday.", 1],
    ["Taper (15–16): do not cut carbs. Volume drops, food holds, and you walk into test day full. Test day eats exactly like a normal Saturday.", 1]]],
  ["THE HONEST GAP — CORRECTED", C.copper, [
    ["Your fibre is ~35–40g/day — above the guideline. Vitamin C ~150–200mg — covered. Potassium — excellent. The no-veg hole is exactly three things: vitamin D in winter, omega-3, maybe magnesium. The supplement row on the shop list closes all three.", 1],
    ["Sodium: salt food to taste, electrolytes daily, and the urine check stands — pale straw. Dark at 10am means the 3am sessions are being run on a half-empty tank.", 0]]],
  ["AROUND THE SESSION", C.ember, [
    ["BEFORE — the meal that fuels a session is hours out, not minutes. The 3am sessions run on last night's dinner plus the 3:10 shake. Wednesday's heavy morning runs on Tuesday's 5pm feed as well. The weekend sessions run on the 5pm feed the evening before.", 1],
    ["DURING — water and electrolytes everywhere, except fight-round Sundays: banana in the throws → rounds gap.", 0],
    ["AFTER — Monday to Thursday you go straight to the scaffold at 5:15. The meal you skip rushing is the one that costs you the muscle. Thermos of porridge, made the night before. No decisions at 4:50am.", 0]]],
  ["THE FEEDBACK LOOP", C.honey, [
    ["Tape every 4–6 weeks. Waist decides. Arms/shoulders up, waist flat → change nothing. Waist climbing faster → cut 100–150 kcal from the 3pm shake on non-training days. Nothing moving in 6 weeks → add one CARB TOP-UP. Bodyweight falling, sessions unchanged → eat more; the answer is never a program change.", 1],
    ["Log the tape in the Optimal 8 app (TRACK → BODY) so everything lives in one place.", 0]]],
  ["IF YOU EVER MAKE WEIGHT", C.frost, [
    ["Calories to maintenance → ~3,100. Protein becomes deliberate: 190–200g. Carbs 380–420g — cut here, never from protein. Fat holds at 70g.", 0],
    ["Cut in order: 3pm shake on non-training days → Sunday's top-up → BATCH BIG back to standard. Never cut: the pre-session shake, the 5pm feeds, Saturday.", 1]]],
  ["THE COACHING NOTE", C.ember, [
    ["The three 5pm feeds — Tuesday loads Wednesday's trap bar, Friday loads Saturday, Saturday loads Sunday.", 1],
    ["The 3:10 shake Monday to Thursday — strength, intervals and power doses before a shift. An empty tank at 3am is the cheapest mistake to make.", 1],
    ["Eat for it. The training only writes the cheque.", 0]]],
];

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
      {dload ? <Card ac={C.sage}><Eye c={C.sage}>Easy week {week}</Eye><Note c={C.bone} s={{ marginTop: 0 }}>Keep eating exactly as written — the training drops, the building doesn't. No fight sim Saturday, so skip the mid-session banana.</Note></Card> : null}
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
                <div style={Object.assign({}, mno, { fontSize: 26, fontWeight: 700, color: C.ember, lineHeight: 1 })}>{f.t}</div>
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
              <span style={Object.assign({}, dsp, { position: "relative", display: "inline-block", background: C.ink, padding: "0 8px", fontSize: 13, fontWeight: 700, letterSpacing: 1, lineHeight: 1.25, color: f.ev.indexOf("★") >= 0 ? C.ember : C.ash })}>{f.ev.replace("EASY RIDE — FASTED", "EASY RIDE " + (f.t === "03:15" && f.ev.indexOf("BOX") >= 0 ? (week >= 6 && week <= 10 ? "20" : "30") : (week >= 6 && week <= 10 ? "40" : "50")) + " MIN — FASTED")}</span>
            </span>
          </div>);
        const bl = B[f.b], on = !!dl[i], isNext = i === nextIdx, isOpen = open === i;
        return (
          <Card key={i} tid="feed" ac={on ? C.sage : f.crit ? C.ember : C.line} s={{ padding: 0, opacity: on ? .68 : 1, borderColor: isNext ? C.ember : C.line }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
              <span onClick={() => setOpen(isOpen ? null : i)} style={{ flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={Object.assign({}, mno, { fontSize: 11, color: isNext ? C.ember : C.ash, width: 40, flexShrink: 0, fontWeight: isNext ? 700 : 400 })}>{f.t}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={Object.assign({}, bdy, { fontSize: 14.5, fontWeight: 600, color: f.crit && !on ? C.ember : C.bone })}>{f.crit ? "★ " : ""}{bl.n}</div>
                  <div style={Object.assign({}, mno, { fontSize: 9, color: C.ash, marginTop: 2 })}>{bl.kcal} KCAL · P{bl.p} C{bl.c} F{bl.f}{bl.cook && cook ? " · ≈" + (bl.cook === "std" ? cook.std : cook.big) + "G COOKED" : ""}</div>
                </span>
              </span>
              <button onClick={() => tick(i)} aria-label={"Mark " + bl.n} style={Object.assign({}, mno, { width: 44, height: 44, borderRadius: 6, cursor: "pointer", fontSize: 17, fontWeight: 700, flexShrink: 0, background: on ? C.sage : "transparent", color: on ? C.ink : C.ash, border: "1px solid " + (on ? C.sage : C.line) })}>{on ? "✓" : "○"}</button>
            </div>
            {isOpen ? (
              <div className="rise" style={{ padding: "0 12px 12px 62px" }}>
                {bl.i.map((it, j) => <div key={j} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderTop: j ? "1px solid " + C.line : "none" }}>
                  <span style={Object.assign({}, bdy, { fontSize: 13, color: C.bone })}>{it[0]}</span>
                  <span style={Object.assign({}, mno, { fontSize: 11, color: C.honey })}>{it[1]}</span></div>)}
                {bl.cook && cook ? <div style={Object.assign({}, mno, { fontSize: 10.5, color: C.sage, marginTop: 8 })}>YOUR COOKED PORTION ≈ {(bl.cook === "std" ? cook.std : cook.big)}g — weighed {cook.date}</div> : bl.cook ? <div style={Object.assign({}, bdy, { fontSize: 11.5, color: C.ash, marginTop: 8, fontStyle: "italic" })}>Batch-cooked? Weigh the pot once in COOK and this card shows your cooked-portion weight.</div> : null}
                {f.note ? <Note s={{ fontStyle: "italic" }}>{f.note}</Note> : null}
              </div>) : null}
            {f.sub && isOpen ? <div style={{ padding: "0 12px 10px 62px" }}><Note s={{ marginTop: 0 }}>{f.sub}</Note></div> : null}
          </Card>);
      })}
      <Card s={{ padding: "10px 14px" }}>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={Object.assign({}, mno, { fontSize: 9, color: C.frost, letterSpacing: 1 })}>HYDRATION</span>
          <span style={Object.assign({}, bdy, { fontSize: 12, color: C.ash, flex: 1 })}>Electrolytes on site · urine pale straw — dark at 10am means tomorrow's 3:30 is compromised before lunch.</span>
        </div>
      </Card>
    </div>);
}

/* ================================================================
   COOK — the raw→cooked problem, solved
   ================================================================ */
function Cook({ cook, setCook, foods, setFoods, K }) {
  const [std, setStd] = useState(6); const [big, setBig] = useState(1);
  const [potIn, setPotIn] = useState(""); const [mode, setMode] = useState("half");
  const [uRaw, setURaw] = useState(""); const [uCooked, setUCooked] = useState(""); const [uTarget, setUTarget] = useState(""); const [uName, setUName] = useState("");
  const setPreset = (m) => { setMode(m); if (m === "half") { setStd(6); setBig(1); } if (m === "full") { setStd(12); setBig(2); } };
  const S = Number(std) || 0, G = Number(big) || 0;
  const mince = S * 150 + G * 200, sp = S * 300 + G * 350, pas = (S + G) * 150;
  const rawTot = S * 600 + G * 700;
  const ck = num(potIn);
  const stdOut = ck && rawTot ? r5(ck * 600 / rawTot) : null;
  const bigOut = ck && rawTot ? r5(ck * 700 / rawTot) : null;
  const yieldPct = ck && rawTot ? Math.round(ck / rawTot * 100) : null;
  const Step = ({ n, t }) => <div style={{ display: "flex", gap: 10, alignItems: "baseline", marginBottom: 6 }}><span style={Object.assign({}, mno, { fontSize: 11, fontWeight: 700, color: C.ember, width: 16, flexShrink: 0 })}>{n}</span><span style={Object.assign({}, bdy, { fontSize: 13, color: C.bone, lineHeight: 1.45 })}>{t}</span></div>;
  const uOut = num(uCooked) && num(uRaw) && num(uTarget) ? r5(num(uCooked) * num(uTarget) / num(uRaw)) : null;
  const uFactor = num(uCooked) && num(uRaw) ? num(uCooked) / num(uRaw) : null;
  return (
    <div>
      <Card ac={C.ember}>
        <Eye c={C.ember}>The batch — weigh raw once, serve cooked forever</Eye>
        <Note s={{ marginTop: 0 }}>The plan weighs food raw, but a batch gets cooked whole. Solution: put known raw amounts in, weigh the finished pot once, and the app tells you what one portion weighs <span style={{ color: C.bone }}>cooked</span>.</Note>
        <div style={{ display: "flex", gap: 5, margin: "12px 0 10px" }}>
          {[["half", "HALF WEEK · 6+1"], ["full", "FULL WEEK · 12+2"], ["custom", "CUSTOM"]].map((o) => <button key={o[0]} onClick={() => setPreset(o[0])} style={Object.assign({}, dsp, { flex: 1, fontSize: 11, fontWeight: 700, letterSpacing: .6, padding: "9px 2px", borderRadius: 4, cursor: "pointer", background: mode === o[0] ? C.ember : "transparent", color: mode === o[0] ? C.ink : C.ash, border: "1px solid " + (mode === o[0] ? C.ember : C.line) })}>{o[1]}</button>)}
        </div>
        {mode === "custom" ? <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ flex: 1 }}><Lab>Standard portions</Lab><Fld v={std} on={setStd} /></div>
          <div style={{ flex: 1 }}><Lab>Big portions</Lab><Fld v={big} on={setBig} /></div>
        </div> : null}
        <div style={{ background: C.ink, border: "1px solid " + C.line, borderRadius: 5, padding: "11px 12px", marginBottom: 10 }}>
          <Eye c={C.honey} s={{ marginBottom: 6 }}>1 · Raw, into the pot — {S} standard + {G} big</Eye>
          {[["Beef mince 5%", mince + "g"], ["Sweet potato, chunks", sp + "g"], ["Passata", pas + "g"], ["Beef stock", "to taste"], ["Mushrooms (optional)", (S + G) * 150 + "g · +33 kcal/portion"]].map((r) => (
            <div key={r[0]} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px solid " + C.line }}>
              <span style={Object.assign({}, bdy, { fontSize: 13.5, color: C.bone })}>{r[0]}</span>
              <span style={Object.assign({}, mno, { fontSize: 13, fontWeight: 700, color: C.honey })}>{r[1]}</span></div>))}
        </div>
        <div style={{ background: C.ink, border: "1px solid " + C.line, borderRadius: 5, padding: "11px 12px", marginBottom: 10 }}>
          <Eye c={C.honey} s={{ marginBottom: 6 }}>2 · Cook</Eye>
          <Step n="1" t="Brown the mince." />
          <Step n="2" t="Stock and passata in." />
          <Step n="3" t="Sweet potato chunks in, mushrooms if using." />
          <Step n="4" t="Simmer ~25 min until the potato gives. Mix through properly — the maths below assumes an even mix." />
          <Btn small c={C.ember} s={{ marginTop: 6 }} on={() => K.start("SIMMER", 25 * 60)}>▶ SIMMER TIMER · 25:00</Btn>
        </div>
        <div style={{ background: C.ink, border: "1px solid " + C.ember, borderRadius: 5, padding: "11px 12px" }}>
          <Eye c={C.ember} s={{ marginBottom: 6 }}>3 · Weigh the cooked pot — once</Eye>
          <Note s={{ marginTop: 0 }}>Ladle everything into a tared container (or weigh the pot and subtract its empty weight). Enter total cooked grams:</Note>
          <div style={{ marginTop: 8 }}><Fld v={potIn} on={setPotIn} ph="total cooked (g)" /></div>
          {stdOut ? (
            <div className="rise" style={{ marginTop: 12, textAlign: "center" }}>
              <div style={{ display: "flex", gap: 8 }}>
                <div style={{ flex: 1, background: C.card, border: "1px solid " + C.sage, borderRadius: 6, padding: "12px 6px" }}>
                  <div style={Object.assign({}, mno, { fontSize: 8, color: C.ash, letterSpacing: 1.2 })}>ONE STANDARD</div>
                  <div style={Object.assign({}, mno, { fontSize: 34, fontWeight: 700, color: C.sage, lineHeight: 1.1 })}>{stdOut}<span style={{ fontSize: 14, color: C.ash }}>g</span></div>
                </div>
                {G > 0 ? <div style={{ flex: 1, background: C.card, border: "1px solid " + C.honey, borderRadius: 6, padding: "12px 6px" }}>
                  <div style={Object.assign({}, mno, { fontSize: 8, color: C.ash, letterSpacing: 1.2 })}>ONE BIG</div>
                  <div style={Object.assign({}, mno, { fontSize: 34, fontWeight: 700, color: C.honey, lineHeight: 1.1 })}>{bigOut}<span style={{ fontSize: 14, color: C.ash }}>g</span></div>
                </div> : null}
              </div>
              <div style={Object.assign({}, mno, { fontSize: 9.5, color: yieldPct >= 65 && yieldPct <= 95 ? C.ash : C.copper, marginTop: 8 })}>YIELD {yieldPct}% {yieldPct >= 65 && yieldPct <= 95 ? "— normal for a simmered batch" : "— check the number; that's outside the usual range"}</div>
              <Btn c={C.sage} fill s={{ width: "100%", marginTop: 10 }} on={() => { setCook({ std: stdOut, big: bigOut, date: iso(new Date()) }); buzz([60, 40, 60]); }}>SAVE — SHOW ON EVERY BATCH FEED</Btn>
            </div>) : null}
          {cook ? <div style={Object.assign({}, mno, { fontSize: 9.5, color: C.sage, marginTop: 10 })}>SAVED: STANDARD ≈ {cook.std}g · BIG ≈ {cook.big}g · {cook.date}</div> : null}
        </div>
      </Card>

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
        <Note s={{ marginTop: 0 }}><span style={{ color: C.bone, fontWeight: 600 }}>Sunday and Wednesday.</span> Two half-week cooks of 7 portions (6 standard + 1 big) beats one giant pot — fresher, and the pot fits.</Note>
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
function PlanView() {
  const [open, setOpen] = useState(0);
  return (
    <div>
      {PLANREF.map((sec, i) => (
        <Card key={i} s={{ padding: 0 }} ac={sec[1]}>
          <button onClick={() => setOpen(open === i ? null : i)} style={{ display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between", background: "transparent", border: "none", padding: "13px 14px", cursor: "pointer", textAlign: "left" }}>
            <span style={Object.assign({}, dsp, { fontSize: 15, fontWeight: 700, letterSpacing: 1.1, color: C.bone })}>{sec[0]}</span>
            <span style={Object.assign({}, mno, { fontSize: 15, color: C.ash })}>{open === i ? "−" : "+"}</span>
          </button>
          {open === i ? <div className="rise" style={{ padding: "0 14px 14px" }}>
            {sec[2].map((ln, j) => <div key={j} style={Object.assign({}, bdy, { fontSize: 12.5, color: ln[1] ? C.bone : C.ash, padding: "5px 0", lineHeight: 1.55, fontWeight: ln[1] ? 600 : 400 })}>{ln[0]}</div>)}
          </div> : null}
        </Card>))}
    </div>);
}

/* ================================================================
   BACKUP — everything lives on this phone, so it must be exportable
   ================================================================ */
const backupName = () => "fuel-backup-" + iso(new Date()) + ".json";

async function shareOrDownload(text) {
  const name = backupName();
  try {
    if (typeof File !== "undefined" && navigator.canShare && navigator.share) {
      const file = new File([text], name, { type: "application/json" });
      if (navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: "Fuel backup" }); return "Sent to the share sheet."; }
    }
  } catch (e) { if (e && e.name === "AbortError") return ""; }
  try {
    const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
    const a = document.createElement("a"); a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return "Saved as " + name + ".";
  } catch (e) { return "Couldn't save the file — use COPY BACKUP instead."; }
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return "Backup copied. Paste it somewhere safe."; } catch (e) {}
  try {
    const ta = document.createElement("textarea"); ta.value = text;
    ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand("copy"); ta.remove();
    if (ok) return "Backup copied. Paste it somewhere safe.";
  } catch (e) {}
  return "Couldn't reach the clipboard — use EXPORT TO FILE instead.";
}

function Backup({ onExport, onImport }) {
  const [txt, setTxt] = useState("");
  const [msg, setMsg] = useState(null);
  const fileRef = useRef(null);
  const say = (m) => { if (m) { setMsg(m); buzz(30); } };
  const doImport = async (text) => { const r = await onImport(text); say(r.msg); if (r.ok) setTxt(""); };
  return (
    <div style={{ borderTop: "1px solid " + C.line, marginTop: 14, paddingTop: 14 }}>
      <Eye c={C.frost}>Backup — your data lives only on this phone</Eye>
      <Note s={{ marginTop: 0 }}>Nothing is stored on a server and there is no sign-in. Export before you change phone, clear Safari's data, or delete the app.</Note>
      <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
        <Btn small c={C.frost} s={{ flex: 1 }} on={async () => say(await copyText(await onExport()))}>COPY BACKUP</Btn>
        <Btn small c={C.frost} s={{ flex: 1 }} on={async () => say(await shareOrDownload(await onExport()))}>EXPORT TO FILE</Btn>
      </div>
      <div style={{ marginTop: 14 }}>
        <Lab>Restore — paste a backup here</Lab>
        <textarea value={txt} onChange={(e) => setTxt(e.target.value)} placeholder='{"app":"optimal-8-fuel",…}' rows={3}
          style={Object.assign({}, mno, { width: "100%", background: C.ink, border: "1px solid " + C.line, borderRadius: 4, color: C.bone, fontSize: 12, padding: 8, resize: "vertical" })} />
        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
          <Btn small c={C.sage} s={{ flex: 1 }} dis={!txt.trim()} on={() => doImport(txt)}>IMPORT PASTED TEXT</Btn>
          <Btn small c={C.sage} s={{ flex: 1 }} on={() => fileRef.current && fileRef.current.click()}>IMPORT FROM FILE</Btn>
        </div>
        <input ref={fileRef} type="file" accept="application/json,.json,text/plain" style={{ display: "none" }}
          onChange={async (e) => { const f = e.target.files && e.target.files[0]; e.target.value = ""; if (!f) return;
            try { await doImport(await f.text()); } catch (err) { say("Couldn't read that file."); } }} />
      </div>
      {msg ? <Note c={C.honey}>{msg}</Note> : null}
      <Note s={{ fontStyle: "italic" }}>Importing replaces what's in the app with what's in the backup.</Note>
    </div>);
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
