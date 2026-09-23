import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import PLAN_MD from "../fuel-optimal-8-fighter.md?raw";
import MENUB_MD from "../fuel-menu-b.md?raw";
import SEASON_MD from "../fuel-season.md?raw";

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
input[type=date], input[type=time] { color-scheme: dark; }
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
const sundayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - (x.getDay() === 0 ? 0 : x.getDay())); return x; };
const mondayOf = (d) => { const x = new Date(d); x.setHours(0, 0, 0, 0); x.setDate(x.getDate() - ((x.getDay() + 6) % 7)); return x; };
const parseISO = (s) => { const p = String(s).split("-").map(Number); return new Date(p[0], p[1] - 1, p[2]); };
const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
const DSH = { mon: "MON", tue: "TUE", wed: "WED", thu: "THU", fri: "FRI", sat: "SAT", sun: "SUN" };
const todayKey = () => DAYS[(new Date().getDay() + 6) % 7];
const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
const tMin = (t) => { const p = t.split(":").map(Number); return p[0] * 60 + p[1]; };
const hhmm = (m) => { const x = ((Math.round(m) % 1440) + 1440) % 1440; return String(Math.floor(x / 60)).padStart(2, "0") + ":" + String(x % 60).padStart(2, "0"); };

/* ================================================================
   THE BLOCKS — every meal, weighed once
   ================================================================ */
const B = {
  batch:     { n: "BATCH", kcal: 543, p: 36, c: 66, f: 15, cook: "std", i: [["Beef mince 5%", "150g raw"], ["Sweet potato", "300g raw"], ["Passata + beef stock", "150g"], ["Mushrooms (optional)", "150g · +33 kcal"]] },
  batchbig:  { n: "BATCH BIG", kcal: 671, p: 47, c: 76, f: 20, cook: "big", i: [["Beef mince 5%", "200g raw"], ["Sweet potato", "350g raw"], ["Passata", "150g"], ["Mushrooms (optional)", "150g"]] },
  porridge:  { n: "PORRIDGE", kcal: 570, p: 16, c: 105, f: 10, bn: "Sachets into the thermos, hot milk on top, a splash of water if it's thick, honey stirred in. No decisions at half past four.", i: [["Quaker Oat So Simple Golden Syrup", "2 sachets · 2 × 36g"], ["Milk", "250ml"], ["Honey", "20g"], ["Banana", "1"]] },
  porridgeb: { n: "PORRIDGE BIG", kcal: 710, p: 19, c: 130, f: 12, bn: "Sachets into the thermos, hot milk on top, a splash of water if it's thick, honey stirred in.", i: [["Quaker Oat So Simple Golden Syrup", "3 sachets"], ["Milk", "250ml"], ["Honey", "20g"], ["Banana", "1"]] },
  halfban:   { n: "HALF BOTTLE + BANANA", kcal: 249, p: 26, c: 36, f: 1, bn: "One UFIT 50g on every training day — half before, half straight after. Six bottles a week. Nothing sitting heavy at half past three.", i: [["UFIT 50g", "half · 250ml"], ["Banana", "1"]] },
  half:      { n: "HALF BOTTLE", kcal: 144, p: 25, c: 9, f: 0, bn: "The other half of the morning bottle, straight after the session.", i: [["UFIT 50g", "the other half"]] },
  half2ban:  { n: "HALF BOTTLE + 2 BANANAS", kcal: 354, p: 27, c: 63, f: 1, bn: "The other half of the bottle with two bananas — after the weekend sessions.", i: [["UFIT 50g", "the other half"], ["Bananas", "2"]] },
  twoban:    { n: "TWO BANANAS", kcal: 210, p: 2, c: 54, f: 1, i: [["Bananas", "2"]] },
  topup:     { n: "CARB TOP-UP", kcal: 526, p: 9, c: 116, f: 6, bn: "One Ben's Original pouch is 100g of dry rice cooked — about 360 kcal, 72g carbs. Nothing to weigh.", i: [["Ben's Original rice pouch", "1 · 250g"], ["Banana", "1"], ["Honey", "20g"]] },
  steak:     { n: "STEAK & EGGS", kcal: 943, p: 78, c: 72, f: 39, i: [["Steak", "200g"], ["Eggs", "3"], ["Ben's Original rice pouch", "1"]] },
  steakbig:  { n: "STEAK & EGGS BIG", kcal: 1135, p: 83, c: 99, f: 37, i: [["Steak", "250g"], ["Eggs", "3"], ["Ben's Original rice pouch", "1"], ["Banana", "1"]] },
  chicken:   { n: "CHICKEN, EGGS & RICE", kcal: 941, p: 91, c: 83, f: 25, i: [["Chicken breast", "250g"], ["Eggs", "3"], ["Ben's Original rice pouch", "1"], ["Passata", ""], ["Mushrooms", "150g"]] },
  pasta:     { n: "CHICKEN PASTA", kcal: 916, p: 84, c: 100, f: 20, i: [["Chicken breast", "250g"], ["Pasta", "125g dry"], ["Passata", ""], ["Mushrooms", "150g"]] },
  casein:    { n: "CASEIN", kcal: 130, p: 30, c: 3, f: 1, bn: "Slow protein through the night, on the five nights dinner is early. Three eggs do the same job if you'd rather eat.", i: [["Casein in water", "35g"]] },
  banana:    { n: "BANANA", kcal: 105, p: 1, c: 27, f: 0, i: [["Banana", "1"]] },
  /* Menu B — the same plan eaten standing up. Every one of these matches the
     Menu A feed it replaces to within fifty calories. */
  wraps:     { n: "MINCE WRAPS + BANANA", kcal: 580, p: 42, c: 73, f: 11, menu: "B", cook: "std", bn: "Same mince, same pot — the wraps stand in for the sweet potato. Rolled tight, foiled, made the night before. Cold mince travels in a cool bag with an ice block.", i: [["Wholemeal tortilla wraps", "2 × ~40g"], ["Pot mince, cooked", "1 standard portion"], ["Banana", "1"]] },
  tunabagel: { n: "TUNA & EGG BAGEL + BANANA", kcal: 590, p: 47, c: 72, f: 12, menu: "B", bn: "Assembled the night before and foiled, or carried as parts and put together at the break. Salt and pepper, nothing else needed.", i: [["Plain bagel", "1"], ["Tuna in spring water", "1 tin, drained"], ["Boiled eggs", "2, sliced"], ["Banana", "1"]] },
  eggbagel:  { n: "EGG BAGEL + BANANA", kcal: 568, p: 30, c: 72, f: 17, menu: "B", bn: "The lightest on protein of the three and the easiest to carry — nothing to open.", i: [["Plain bagel", "1"], ["Boiled eggs", "3"], ["Banana", "1"]] },
  onebagel:  { n: "ONE BAGEL", kcal: 230, p: 9, c: 45, f: 1, menu: "B", bn: "The 3pm feed, when two bananas are two things too many to carry. Honey on it if you want; it's 60 calories you'll use.", i: [["Plain bagel", "1"], ["Honey (optional)", "+60 kcal"]] },
  /* The season document's swaps — one set per slot, each matching Menu A's
     feed for that slot to within about sixty calories. */
  halfhoney: { n: "HALF BOTTLE + HONEY", kcal: 205, p: 25, c: 25, f: 0, bn: "The morning the banana won't sit.", i: [["UFIT 50g", "half · 250ml"], ["Honey", "20g, in it"]] },
  halfdates: { n: "HALF BOTTLE + 3 DATES", kcal: 215, p: 26, c: 40, f: 0, extra: [["Dried dates", "a small bag"]], i: [["UFIT 50g", "half · 250ml"], ["Dried dates", "3"]] },
  oatscold:  { n: "OVERNIGHT SACHETS", kcal: 570, p: 16, c: 105, f: 10, bn: "The same as the porridge in a tub, cold, made the night before.", i: [["Quaker Oat So Simple Golden Syrup", "2 sachets"], ["Milk", "250ml"], ["Honey", "20g"], ["Banana", "1"]] },
  eggbagelbf: { n: "EGG BAGEL BREAKFAST", kcal: 629, p: 30, c: 88, f: 17, extra: [["Plain bagels", "as Menu B"], ["Eggs", "3 per breakfast taken"]], i: [["Plain bagel", "1"], ["Boiled eggs", "3"], ["Banana", "1"], ["Honey", "20g on the bagel"]] },
  eggbagelbb: { n: "EGG BAGEL BREAKFAST BIG", kcal: 800, p: 39, c: 133, f: 18, extra: [["Plain bagels", "as Menu B"], ["Eggs", "3 per breakfast taken"]], i: [["Plain bagels", "2"], ["Boiled eggs", "3"], ["Banana", "1"], ["Honey", "none"]] },
  tunabagelbf: { n: "TUNA BAGEL BREAKFAST", kcal: 601, p: 35, c: 115, f: 2, extra: [["Plain bagels", "as Menu B"], ["Tuna in spring water", "4 tins a week"]], i: [["Plain bagel", "1"], ["Tuna in spring water", "1 tin"], ["Bananas", "2"], ["Honey", "20g"]] },
  jacket:    { n: "JACKET POTATO, TUNA & EGG", kcal: 535, p: 44, c: 64, f: 12, extra: [["Potatoes", "for the jacket or the potato top-up"], ["Tuna in spring water", "4 tins a week"]], i: [["Baking potato", "300g"], ["Tuna in spring water", "1 tin"], ["Boiled eggs", "2"]] },
  chickpouch: { n: "CHICKEN & POUCH", kcal: 610, p: 58, c: 72, f: 11, bn: "Eaten cold from a tub.", extra: [["Chicken breast", "+150g per feed taken"]], i: [["Chicken breast, cooked", "150g"], ["Ben's Original rice pouch", "1"]] },
  twofruit:  { n: "ANY TWO PIECES OF FRUIT", kcal: 200, p: 2, c: 50, f: 0, bn: "Apples, pears, oranges; two bananas is the standard.", extra: [["Apples, pears or oranges", "two a day when taken"]], i: [["Fruit", "2 pieces"]] },
  flapjack:  { n: "HOMEMADE FLAPJACK", kcal: 250, p: 5, c: 40, f: 8, bn: "Oats, honey, a little butter; made on batch day.", extra: [["Oats and butter for the flapjack", "as needed"]], i: [["Flapjack", "60g"]] },
  pastatop:  { n: "PASTA TOP-UP", kcal: 546, p: 17, c: 110, f: 3, extra: [["Pasta, dry", "+125g per top-up taken"]], i: [["Pasta", "125g dry"], ["Passata", ""], ["Honey", "20g after"]] },
  potatotop: { n: "POTATO TOP-UP", kcal: 516, p: 9, c: 123, f: 1, extra: [["Potatoes", "for the jacket or the potato top-up"]], i: [["Boiled potatoes", "400g"], ["Banana", "1"], ["Honey", "20g"]] },
  salmon:    { n: "SALMON, EGGS & RICE", kcal: 945, p: 63, c: 77, f: 43, bn: "The only thing on the list that puts real omega-3 in the day. Two salmon dinners a week does more for recovery and joints than the capsules do.", extra: [["Salmon", "two 200g fillets a week"]], i: [["Salmon", "200g"], ["Eggs", "2"], ["Ben's Original rice pouch", "1"], ["Mushrooms", "150g"]] },
  turkey:    { n: "TURKEY CHILLI & RICE", kcal: 905, p: 83, c: 78, f: 28, extra: [["Lean turkey mince", "500g if you take the chilli"]], i: [["Lean turkey mince", "250g"], ["Passata", ""], ["Ben's Original rice pouch", "1"], ["Eggs", "2 on top"]] },
  minceeggs: { n: "MINCE, EGGS & RICE", kcal: 930, p: 75, c: 88, f: 25, extra: [["Beef mince 5%", "+250g per dinner taken"]], i: [["Beef mince 5%", "250g"], ["Passata", ""], ["Ben's Original rice pouch", "1"], ["Eggs", "2"]] },
  threeeggs: { n: "THREE BOILED EGGS", kcal: 233, p: 20, c: 1, f: 16, extra: [["Eggs", "3 per night taken"]], i: [["Boiled eggs", "3"]] },
  bageltop:  { n: "BAGEL TOP-UP", kcal: 521, p: 18, c: 106, f: 2, menu: "B", bn: "The 5pm feed on a night you're not home by five — same carbohydrate as the pouch, no fridge, no microwave. It loads tomorrow's session exactly as the pouch does.", i: [["Plain bagels", "2"], ["Honey", "20g"]] },
};

/* Which Menu A feeds have a Menu B alternative, and what it is. */
/* ================================================================
   THE SLOTS — every feed of the day and the options that match it.
   Each option holds the slot's timing and its carbohydrate, so any
   option can be taken in any phase and the day still adds up.
   ================================================================ */
const SLOT_OF = { halfban: "pre", porridge: "breakfast", porridgeb: "breakfast", batch: "lunch", batchbig: "lunch",
  twoban: "three", topup: "five", steak: "dinner", steakbig: "dinner", chicken: "dinner", pasta: "dinner", casein: "bed" };
/* Menu A's BIG portions, and the increment the document puts on each slot.
   Where the document names a BIG option outright it is used as written;
   the rest take the increment of that slot's own A -> BIG pair, which
   reproduces the document's "+130" at lunch and its ~1,135 dinner. */
const BIGKEY = { porridgeb: 1, batchbig: 1, steakbig: 1 };
const SLOTS = {
  pre:       { n: "Before the session", opts: ["halfban", "halfhoney", "halfdates"] },
  breakfast: { n: "Breakfast", opts: ["porridge", "oatscold", "eggbagelbf", "tunabagelbf"], big: { porridge: "porridgeb", eggbagelbf: "eggbagelbb" }, d: [140, 3, 25, 2] },
  lunch:     { n: "Mid-morning and lunch", opts: ["batch", "wraps", "tunabagel", "eggbagel", "jacket", "chickpouch"], big: { batch: "batchbig" }, d: [128, 11, 10, 5] },
  three:     { n: "The 3pm feed", opts: ["twoban", "onebagel", "twofruit", "flapjack"] },
  five:      { n: "The 5pm top-up", opts: ["topup", "bageltop", "pastatop", "potatotop"] },
  dinner:    { n: "Dinner", opts: ["steak", "chicken", "pasta", "salmon", "turkey", "minceeggs"], big: { steak: "steakbig" }, d: [192, 5, 27, -2] },
  bed:       { n: "Before bed", opts: ["casein", "threeeggs", "half"] },
};
/* The option actually on the plate: the base option, or its BIG form on
   the days Menu A serves a BIG portion in that slot. */
function blockOf(key, slot, big) {
  const S = SLOTS[slot];
  if (!big || !S) return B[key];
  if (S.big && S.big[key]) return B[S.big[key]];
  const b = B[key], d = S.d;
  if (!d) return b;
  return Object.assign({}, b, { n: b.n + " BIG", kcal: b.kcal + d[0], p: b.p + d[1], c: b.c + d[2], f: b.f + d[3] });
}
/* The base key for a feed: BIG blocks resolve to the option they enlarge. */
const BASE_OF = { porridgeb: "porridge", batchbig: "batch", steakbig: "steak" };
const slotOf = (k) => SLOT_OF[k] || null;

/* Day plans — Optimal 8's actual clock */
const F = (t, b, o) => Object.assign({ t, b }, o);
const E = (t, n, o) => Object.assign({ t, ev: n }, o);
const D = {
  mon: { n: "MONDAY", kcal: 3332, p: 249, c: 411, f: 82, tag: "3:30 upper strength + rings ~65 min", star: 0,
    call: ["HALF THE BOTTLE BEFORE, HALF AFTER", "Bench throws, box jumps, bench, dips, chins, rows — a real session, not a warm-up. Half the bottle and a banana at 3:10, the other half the moment you finish, porridge in the thermos behind it."],
    feeds: [F("03:10", "halfban", { crit: 1, note: "Twenty minutes before you start." }), E("03:30", "UPPER STRENGTH + POWER + RINGS · ~65 MIN"), F("04:50", "half", { note: "Straight after the session." }), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "twoban"), F("18:30", "steak"), F("21:00", "casein", { note: "Half an hour before bed." })] },
  tue: { n: "TUESDAY", kcal: 3726, p: 241, c: 535, f: 73, tag: "3:30 jumps, pistols, engine 1 ~65 min → load Wednesday", star: 0,
    call: ["THE 5PM FEED LOADS WEDNESDAY'S TRAP BAR", "Muscle fuel takes hours to load. Tomorrow's sled, trap bar and pause squat at 3:30am run on today's 5pm carb feed. If Wednesday feels flat, the fault was here. Dinner is late, so no casein tonight."],
    feeds: [F("03:10", "halfban", { crit: 1, note: "Non-negotiable. Jumps into an interval session." }), E("03:30", "JUMPS · PISTOLS · ENGINE 1 · TRUNK · ACHILLES · ~65 MIN"), F("04:50", "half", { note: "Straight after the session." }), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "twoban"), F("17:00", "topup", { crit: 1, note: "This loads Wednesday morning." }), F("20:15", "chicken", { note: "Dinner is late, so no casein tonight." })] },
  wed: { n: "WEDNESDAY", kcal: 3664, p: 257, c: 463, f: 82, tag: "3:30 sled · trap bar · pause squat · RDL ~60 min", star: 1,
    call: ["NOT FASTED. EVER.", "The loading was done last night at 5pm; the 3:10 half-bottle is non-negotiable. The session is finished by 4:30am — there is nothing at 7pm. Porridge big after it, the big steak tonight: the heavy lower day gets the bigger recovery."],
    feeds: [F("03:10", "halfban", { crit: 1, note: "The loading was done last night. This is non-negotiable." }), E("03:30", "SLED · TRAP BAR · PAUSE SQUAT · RDL · RING ROWS · ~60 MIN"), F("04:50", "half", { note: "Straight after the session." }), F("04:50", "porridgeb", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "twoban"), F("18:30", "steakbig"), F("21:00", "casein", { note: "Half an hour before bed." })] },
  thu: { n: "THURSDAY", kcal: 3330, p: 262, c: 422, f: 68, tag: "3:30 throws, split squat, engine 2, neck ~61 min", star: 0,
    call: ["24 MINUTES OF INTERVALS — NOT OPTIONAL", "Throws, split squat, tendon hold, the bike, neck. Half the bottle and a banana at 3:10, the other half the moment you finish, thermos at 4:50."],
    feeds: [F("03:10", "halfban", { crit: 1, note: "24 minutes of intervals. Not optional." }), E("03:30", "THROWS · SPLIT SQUAT · TENDON · ENGINE 2 · NECK · ~61 MIN"), F("04:50", "half", { note: "Straight after the session." }), F("04:50", "porridge", { note: "Thermos, on the way to work." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "twoban"), F("18:30", "chicken"), F("21:00", "casein", { note: "Half an hour before bed." })] },
  fri: { n: "FRIDAY", kcal: 3438, p: 213, c: 510, f: 68, tag: "sleep day → work → load Saturday", star: 0,
    call: ["NO SESSION, SAME FOOD", "A rest day is not a low-food day when the biggest session of the week is tomorrow morning. The 5pm carb feed is the most important feed of the week — Saturday's sprints, jumps and squat run on it. If Saturday feels flat, the fault was Friday at 5pm."],
    feeds: [E("", "SLEEP DAY — NO SESSION"), F("05:00", "porridge", { tl: "WAKE", note: "Breakfast, no session in front of it, no bottle." }), F("09:00", "batch"), F("12:30", "batch"), F("15:00", "twoban", { note: "The pre-load starts here." }), F("17:00", "topup", { crit: 1, note: "This loads SATURDAY. The most important feed of the week." }), F("19:30", "pasta"), F("21:00", "casein", { note: "Half an hour before bed." })] },
  sat: { n: "SATURDAY", kcal: 4188, p: 247, c: 586, f: 92, tag: "legs & power ~96 min, then the easy hour", star: 1,
    call: ["THE BIGGEST DAY OF TRAINING AND FOOD", "Porridge big 6:30, half the bottle 7:45, start 8:15. Water and electrolytes during. Today's 5pm carb feed loads Sunday's rounds. Dinner's late, so no casein."],
    feeds: [F("06:30", "porridgeb"), F("07:45", "halfban"), E("08:15", "★ THE LEG & POWER SESSION · ~96 MIN", { sub: "Get-ups, sprints, jumps, squat, circuit, push press." }), F("10:00", "half2ban", { crit: 1, note: "Within the hour after finishing." }), F("11:30", "batchbig"), F("14:30", "batch", { note: "The easy hour, if it's today, sits between the 11:30 and 14:30 feeds or after this one — water only." }), F("17:00", "topup", { crit: 1, note: "This loads SUNDAY." }), F("20:00", "steakbig", { note: "Dinner's late; no casein tonight." })] },
  sun: { n: "SUNDAY", kcal: 3550, p: 259, c: 491, f: 65, tag: "throws · Nordics · fight rounds · core ~80 min", star: 1,
    call: ["THE ROUNDS DRAIN THE TANK", "Electrolytes throughout, and a banana in the gap between the throws and the Nordics on fight-sim weeks — that one's extra, and it's the only extra. Weeks 1 and 16 the rounds are the 20-minute bike test — same rule."],
    feeds: [F("06:30", "porridgeb"), F("07:45", "halfban"), E("08:15", "★ THROWS · NORDICS · FIGHT ROUNDS · CORE · ~80 MIN", { sub: "Sim weeks: banana in the throws → Nordics gap. That one's extra, and it's the only extra." }), F("10:00", "half2ban", { crit: 1, note: "Within the hour after finishing." }), F("11:30", "batch"), F("14:30", "batch", { note: "If the easy hour is today, it's after this feed." }), F("17:00", "banana"), F("19:30", "pasta"), F("21:00", "casein", { note: "Half an hour before bed." })] },
};

/* ================================================================
   SESSION TIME — the shift moves, so the morning moves with it.
   Presets, break times and session lengths live in Settings; the
   preset tapped today is remembered until midnight.
   ================================================================ */
const LATE = tMin("15:00");            /* from here on, printed times stand */
/* What the picker opens on — the plan's printed start, or Friday's wake. */
const DEFAULT_START = { mon: "03:30", tue: "03:30", wed: "03:30", thu: "03:30", fri: "05:00", sat: "08:15", sun: "08:15" };
const DEFAULT_BREAKS = () => ["09:00", "12:30"];
const DEFAULT_LEN = () => ({ mon: 65, tue: 65, wed: 62, thu: 65, sat: 90, sun: 80 });

/* Re-times one day's morning around a chosen start. Feed order is left
   alone so the tick marks stay on the feeds they were put on. */
function retime(k, feeds, start, st) {
  if (!start) return feeds;
  const S = tMin(start);
  const len = Number((st.len || DEFAULT_LEN())[k]) || 0;
  const breaks = (st.breaks || DEFAULT_BREAKS()).filter(Boolean);
  const weekend = k === "sat" || k === "sun";
  let nth = 0;
  const at = (f, m) => Object.assign({}, f, { t: hhmm(m), tl: undefined });
  return feeds.map((f) => {
    if (f.ev) return f.t ? Object.assign({}, f, { t: hhmm(S) }) : f;
    if (tMin(f.t) >= LATE) return f;
    if (!weekend && (f.b === "batch" || f.b === "batchbig")) {       /* the two work breaks */
      const b = breaks[Math.min(nth++, breaks.length - 1)];
      return b ? at(f, tMin(b)) : f;
    }
    if (k === "fri") return f.b === "porridge" ? at(f, S + 15) : f;  /* no session: wake + 15 */
    if (weekend) {
      if (f.b === "porridgeb") return at(f, S - 105);
      if (f.b === "halfban") return at(f, S - 30);
      if (f.b === "half2ban") return at(f, S + len + 15);
      return f;
    }
    if (f.b === "halfban") return at(f, S - 20);
    if (f.b === "half" || f.b === "porridge" || f.b === "porridgeb") return at(f, S + len);
    return f;
  });
}

/* ================================================================
   THE SEASON — which block of training today sits in, and what the
   phase table changes about the food. The base day is Menu A.
   ================================================================ */
const PROGRAMS = [["prep14", "Prep 14-week"], ["prep16", "Prep 16-week"], ["camp", "Camp"], ["o8", "Optimal 8 Fighter"]];
const BASE_TARGET = { kcal: 3600, p: 245, c: 487, f: 78 };
/* The document's phase table. `rules` are applied to the day automatically. */
const PHASES = {
  build:   { n: "BUILD", sub: "Prep accumulation", t: { kcal: 3900, p: 245, c: 560, f: 80 }, c: C.honey,
             r: ["Add a CARB TOP-UP at 17:00 on Monday and Thursday — the two days without one.", "Surplus about 300. Tissue is being built; feed it. The tape at the block's end decides whether it stays."] },
  heavy:   { n: "HEAVY", sub: "Intensify", t: BASE_TARGET, c: C.ember, r: ["Menu A as written. The extra top-ups come off."] },
  fast:    { n: "FAST", sub: "Convert", t: BASE_TARGET, c: C.ember, r: ["Menu A as written.", "On the scored round weeks, the mid-session banana."] },
  test:    { n: "TEST WEEK", sub: "Prep's last week", t: BASE_TARGET, c: C.frost, r: ["Do not cut. Training drops, carbs hold; the tank fills.", "Test day eats like a Saturday."] },
  camp:    { n: "CAMP", sub: "Foundation, build, peak", t: BASE_TARGET, c: C.ember,
             r: ["Menu A.", "Seven-round weeks keep the mid-session banana.", "Sauna weeks: the hydration schedule's sauna line."] },
  easy:    { n: "EASY WEEK", sub: "Camp", t: BASE_TARGET, c: C.sage, r: ["Do not cut. The commonest way to lose a fight is eating less because you're training less."] },
  sharpen: { n: "SHARPEN", sub: "Camp", t: BASE_TARGET, c: C.sage, r: ["Do not cut. The commonest way to lose a fight is eating less because you're training less."] },
  fight:   { n: "FIGHT WEEK", sub: "", t: BASE_TARGET, c: C.copper, r: ["Menu A exactly.", "Weigh-in day per the weight section."] },
  trans:   { n: "TRANSITION", sub: "The two weeks after a fight", t: { kcal: 3300, p: 235, c: 420, f: 78 }, c: C.frost,
             r: ["Drop the 3pm feed on Monday, Wednesday and Thursday, and Saturday's BIG portion back to standard.", "Maintenance. Protein holds so the muscle does."] },
  cut:     { n: "MAKING WEIGHT", sub: "Only when the limit demands it", t: { kcal: 3100, p: 200, c: 400, f: 70 }, c: C.copper,
             r: ["Carbs off the light days, never protein, never the bottle, never the 5pm loads.", "Cut in order: the casein, then Saturday's BIG back to standard, then one of the 3pm bananas on Monday and Thursday.", "Half a percent of bodyweight a week, no faster."] },
};
/* Week 1 is the week containing the program start. Prep's shape follows the
   document: accumulation 1-5 (1-6 over sixteen), then intensify, convert,
   and the last week as test week. Camp's ten weeks run foundation, build,
   easy week, peak, sharpen, fight week. */
function weekOf(startISO, onISO) {
  if (!startISO) return null;
  const a = mondayOf(parseISO(startISO)), b = mondayOf(parseISO(onISO));
  const w = Math.floor((b - a) / 604800000) + 1;
  return w;
}
function phaseOf(season, onISO, cycleWeek) {
  if (!season) return null;
  if (season.cut) return "cut";
  if (season.fight) {
    const d = (parseISO(onISO) - parseISO(season.fight)) / 86400000;
    if (d > 0 && d <= 14) return "trans";
  }
  const w = weekOf(season.start, onISO);
  if (season.prog === "o8") {
    const k = cycleWeek;
    if (k === 5 || k === 10) return "easy";
    if (k === 15 || k === 16) return "test";
    return "camp";
  }
  if (w == null || w < 1) return null;
  if (season.prog === "prep14") {
    if (w <= 5) return "build";
    if (w <= 10) return "heavy";
    if (w <= 13) return "fast";
    if (w === 14) return "test";
    return null;
  }
  if (season.prog === "prep16") {
    if (w <= 6) return "build";
    if (w <= 12) return "heavy";
    if (w <= 15) return "fast";
    if (w === 16) return "test";
    return null;
  }
  if (season.prog === "camp") {
    if (w <= 3) return "camp";
    if (w <= 6) return "camp";
    if (w === 7) return "easy";
    if (w === 8) return "camp";
    if (w === 9) return "sharpen";
    if (w === 10) return "fight";
    return null;
  }
  return null;
}

/* The phase table's changes, applied to a day's feeds. */
function phaseFeeds(ph, day, feeds) {
  if (!ph) return feeds;
  if (ph === "build" && (day === "mon" || day === "thu")) {
    /* the 17:00 top-up the two light days don't otherwise get */
    const at = feeds.findIndex((f) => f.b && tMin(f.t) > tMin("15:00"));
    const row = F("17:00", "topup", { crit: 1, note: "BUILD adds this on Monday and Thursday — the two days without one." });
    return feeds.slice(0, at < 0 ? feeds.length : at).concat([row], at < 0 ? [] : feeds.slice(at));
  }
  if (ph === "trans") {
    let out = feeds;
    if (day === "mon" || day === "wed" || day === "thu") out = out.filter((f) => f.b !== "twoban");
    if (day === "sat") out = out.map((f) => f.b === "batchbig" ? Object.assign({}, f, { b: "batch" }) : f);
    return out;
  }
  if (ph === "cut") {
    /* the making-weight section, in its order */
    let out = feeds.filter((f) => f.b !== "casein");
    out = out.map((f) => f.b === "batchbig" ? Object.assign({}, f, { b: "batch" }) : f);
    if (day === "mon" || day === "thu") out = out.map((f) => f.b === "twoban" ? Object.assign({}, f, { b: "banana" }) : f);
    return out;
  }
  return feeds;
}
const MIDBANANA = { fast: 1, camp: 1 };

/* ================================================================
   HYDRATION — the schedule replaces thirst. Fixed times, fixed
   amounts, ticked off. Rows anchored to a feed follow the session
   start entered on TODAY; the rest sit on the clock.
   ================================================================ */
const FEEDY = ["batch", "batchbig", "wraps", "tunabagel", "eggbagel"];
const DINNERY = ["steak", "steakbig", "chicken", "pasta"];
const SACHET = "⚡";
const HYDRA = {
  work: [
    { id: "wake", lab: "On waking", ml: 500, tl: "WAKING", ord: -1, note: "Before the strap reading if you can wait, straight after if not. You lose about half a litre overnight." },
    { id: "sess", lab: "In the session", ml: 500, at: "event", note: "The gym bottle, sipped between blocks. Not electrolytes — an hour indoors doesn't need them." },
    { id: "porr", lab: "With the porridge", ml: 300, at: ["porridge", "porridgeb"], note: "The second half of the UFIT counts as another 250." },
    { id: "start", lab: "Work start — the 1-litre bottle", ml: 1000, t: "05:15", sachet: "SACHET 1", note: "Sip it from now to the first break. It should be empty by 09:00." },
    { id: "check7", lab: "Check the bottle", ml: 0, t: "07:00", note: "If it's still full, drink 300 ml now." },
    { id: "feed1", lab: "First feed", ml: 500, at: FEEDY, nth: 0, note: "Refill the litre bottle, plain water." },
    { id: "u1", lab: "Urine check", check: 1, t: "10:00", note: "Pale straw = carry on. Dark = 500 ml now and sachet 2 at 15:00 today." },
    { id: "t1045", lab: "Top up", ml: 300, t: "10:45" },
    { id: "feed2", lab: "Lunch", ml: 500, at: FEEDY, nth: 1 },
    { id: "t1400", lab: "Top up", ml: 300, t: "14:00", note: "On a hot day or a heavy-sweat day, 500." },
    { id: "feed3", lab: "The 3pm feed", ml: 500, t: "15:00", sachet: "SACHET 2", sachetIf: 1, note: "With sachet 2 on hot days, heavy-sweat days, or after a dark 10am check. Otherwise plain." },
    { id: "u2", lab: "Urine check", check: 2, t: "16:00", note: "Dark = 500 ml before 17:00 and salt on dinner." },
    { id: "top", lab: "Top-up feed", ml: 300, t: "17:00" },
    { id: "din", lab: "Dinner", ml: 300, at: DINNERY },
    { id: "last", lab: "Last big drink", ml: 250, t: "20:00", note: "Nothing large after this. Water at 9pm is a 2am toilet trip, and the sleep is worth more than the fluid." },
  ],
  wend: [
    { id: "wake", lab: "On waking", ml: 500, tl: "WAKING", ord: -1 },
    { id: "porr", lab: "With the porridge", ml: 300, at: ["porridgeb"] },
    { id: "half", lab: "Half the bottle", ml: 250, at: ["halfban"], note: "Counts as 250." },
    { id: "sess", lab: "In the session", ml: 750, at: "event", sachet: "A SACHET", note: "Saturday's sprints and Sunday's rounds are the two sessions that drain you. Sunday, on the seven-round weeks, keep sipping through the rounds." },
    { id: "after", lab: "Straight after", ml: 500, at: ["half2ban"], note: "With the half-bottle and bananas." },
    { id: "f1", lab: "With the feed", ml: 500, at: FEEDY, nth: 0 },
    { id: "f2", lab: "With the feed", ml: 500, at: FEEDY, nth: 1 },
    { id: "t1700", lab: "With the feed", ml: 500, t: "17:00" },
    { id: "easy", lab: "The easy hour", ml: 500, tl: "EASY HR", ord: 1050, note: "Nasal, easy, and still a litre of sweat in warm weather." },
    { id: "sauna1", lab: "Before the sauna", ml: 500, tl: "SAUNA", ord: 1065, sauna: 1 },
    { id: "sauna2", lab: "After the sauna", ml: 500, tl: "SAUNA", ord: 1080, sauna: 1, sachet: "A SECOND SACHET", note: "Twenty minutes in a sauna is half a litre gone. Never sauna dry." },
    { id: "din", lab: "Dinner", ml: 300, at: DINNERY },
    { id: "last", lab: "Last big drink", ml: 250, t: "20:00", note: "Same last-drink rule." },
  ],
};
const HYDRA_RULES = [
  ["The 5:15 litre with the sachet is the one that never moves.", "You start every shift already sweating from a session; this is what stops the day going dark at ten."],
  ["Pale straw at 10 and 4.", "The check outranks the schedule — dark means more, however much you've drunk."],
  ["Cramps at night, a headache in the afternoon, a resting heart rate up with no other reason:", "under-replaced yesterday. Sachet 2 today, salt on dinner, and the 14:00 goes to 500."],
  ["Nothing big after eight.", "The camp runs on sleep."],
];

/* Friday drops the session bottle and the porridge drink and runs the
   work-day schedule from the work-start alarm. */
function hydraFor(day, feeds, bkey, sauna) {
  const wend = day === "sat" || day === "sun";
  let rows = (wend ? HYDRA.wend : HYDRA.work).filter((r) => !(day === "fri" && (r.id === "sess" || r.id === "porr")));
  if (!sauna) rows = rows.filter((r) => !r.sauna);
  const seen = {};
  return rows.map((r) => {
    let mins = r.ord != null ? r.ord : null, tl = r.tl || null;
    if (r.t) mins = tMin(r.t);
    if (r.at === "event") { const e = feeds.find((f) => f.ev && f.t); if (e) mins = tMin(e.t); }
    else if (Array.isArray(r.at)) {
      const hits = feeds.filter((f, i) => f.b && r.at.indexOf(bkey(f, i)) >= 0);
      const hit = hits[r.nth || 0];
      if (hit) mins = tMin(hit.t);
    }
    seen[r.id] = 1;
    return Object.assign({}, r, { mins: mins == null ? 0 : mins, tl });
  }).sort((a, b) => a.mins - b.mins);
}

/* Shopping list */
const SHOP = [
  ["MEAT & EGGS", [["Beef mince 5%", "2.2 kg raw — the batch only"], ["Steak", "3 — one 200 g, two 250 g"], ["Chicken breast", "4 × 250 g"], ["Eggs", "15"]]],
  ["CARBS", [["Sweet potato", "4.3 kg raw"], ["Ben's Original rice pouches", "8"], ["Pasta, dry", "250 g"], ["Quaker Oat So Simple Golden Syrup sachets", "17 — two boxes of 15 last under a fortnight"], ["Honey", "~200 g"], ["Bananas", "~35"]]],
  ["THE REST", [["Passata", "2.5 L — the batch, plus the two chicken dinners"], ["Beef stock", "as needed"], ["UFIT 50 g", "6 bottles"], ["Casein", "a 1 kg tub lasts about six weeks"], ["Milk", "2 L — the porridge only"], ["Mushrooms", "1.3 kg"], ["Electrolytes", "as needed"]]],
  ["MENU B — ADDED TO MENU A", [["Wholemeal tortilla wraps, standard (about 40 g)", "10–12"], ["Plain bagels", "10"], ["Tuna in spring water", "4 tins"], ["Eggs", "+21 on top of Menu A's 15"], ["Bananas", "+5 — the third banana on full Menu B days"], ["Honey", "as before"], ["A cool bag and a freezer block", "once"], ["A 1-litre bottle and a 500 ml bottle", "once"], ["Electrolyte sachets", "8–12 a week"]]],
  ["SUPPLEMENTS", [["Creatine monohydrate", "5 g every day, any time, in the bottle"], ["Omega-3 (fish oil)", "1–2 g EPA+DHA daily — there is no oily fish anywhere in your diet"], ["Vitamin D", "1,000–2,000 IU daily, October to April"], ["Multivitamin", "as before — cheap insurance"], ["Beta-alanine (optional)", "3.2 g/day split in two; needs four-plus weeks to work, so start week 1 or don't bother. Helps exactly where it hurts: the 40-second repeats, the repeat bursts and the fight sim. The tingling is harmless."]]],
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

/* The DRINK strip — the day's schedule, ticked off, against its target. */
function Drink({ day, rows, st8, set }) {
  const [info, setInfo] = useState(false);
  const ticks = st8.t || {}, checks = st8.c || {};
  const wend = day === "sat" || day === "sun";
  const target = (wend ? 4000 : 4500) + (st8.sauna ? 500 : 0);
  /* A dark check is 500 ml of its own, per the document. */
  const mlOf = (r) => r.check ? (checks[r.check] === "dark" ? 500 : 0) : r.ml;
  const drunk = rows.reduce((a, r) => a + (ticks[r.id] ? mlOf(r) : 0), 0);
  const pct = Math.min(100, drunk / target * 100);
  const L = (ml) => (ml / 1000).toFixed(ml % 1000 === 0 ? 1 : 2).replace(/\.00$/, "");
  return (
    <Card ac={C.frost} s={{ padding: 0, overflow: "hidden" }}>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <Eye c={C.frost} s={{ marginBottom: 0 }}>Drink</Eye>
          <span style={Object.assign({}, mno, { fontSize: 13, fontWeight: 700, color: drunk >= target ? C.sage : C.bone })}>{L(drunk)}<span style={{ fontSize: 9, color: C.ash }}> / {L(target)} L</span></span>
        </div>
        <div style={{ height: 4, background: C.ink, borderRadius: 2, marginTop: 8 }}>
          <div style={{ width: pct + "%", height: "100%", background: drunk >= target ? C.sage : C.frost, borderRadius: 2, transition: "width .3s" }} /></div>
        <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
          {wend ? <button onClick={() => { set({ sauna: !st8.sauna }); buzz(20); }}
            style={Object.assign({}, mno, { flex: 1, fontSize: 9.5, letterSpacing: 1, padding: "8px 4px", borderRadius: 4, cursor: "pointer", minHeight: 36, background: st8.sauna ? C.copper : "transparent", color: st8.sauna ? C.ink : C.ash, border: "1px solid " + (st8.sauna ? C.copper : C.line) })}>SAUNA DAY</button> : null}
          <button onClick={() => setInfo(!info)} style={Object.assign({}, mno, { flex: 1, fontSize: 9.5, letterSpacing: 1, padding: "8px 4px", borderRadius: 4, cursor: "pointer", minHeight: 36, background: "transparent", color: C.ash, border: "1px solid " + C.line })}>{info ? "HIDE THE RULES" : "THE FOUR RULES"}</button>
        </div>
        {info ? (
          <div className="rise" style={{ marginTop: 10 }}>
            {HYDRA_RULES.map((r, i) => (
              <div key={i} style={{ display: "flex", gap: 8, padding: "6px 0", borderTop: i ? "1px solid " + C.line : "none" }}>
                <span style={Object.assign({}, mno, { fontSize: 10, color: C.frost, flexShrink: 0 })}>{i + 1}</span>
                <span style={Object.assign({}, bdy, { fontSize: 12.5, color: C.ash, lineHeight: 1.5 })}><span style={{ color: C.bone, fontWeight: 600 }}>{r[0]}</span> {r[1]}</span>
              </div>))}
            <Note s={{ fontStyle: "italic" }}>One 1-litre bottle for work, one 500 ml for the gym, sachets in the bag. Two sachets a day is the ceiling — three only on a sauna day — and salt your food.</Note>
          </div>) : null}
      </div>

      <div style={{ borderTop: "1px solid " + C.line }}>
        {rows.map((r) => { const on = !!ticks[r.id], ml = mlOf(r), dark = checks[r.check] === "dark";
          const litSachet = r.sachet && (!r.sachetIf || checks[r.sachetIf] === "dark");
          return (
            <div key={r.id} style={{ display: "flex", alignItems: "center", gap: 9, padding: "8px 14px", borderTop: "1px solid " + C.line, opacity: on ? .6 : 1 }}>
              <span style={Object.assign({}, mno, { fontSize: 10, color: C.ash, width: 46, flexShrink: 0 })}>{r.tl || hhmm(r.mins)}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={Object.assign({}, bdy, { fontSize: 13, color: dark ? C.copper : C.bone })}>{r.lab}{ml ? " · " + ml + " ml" : ""}</div>
                {r.sachet ? <span style={Object.assign({}, mno, { fontSize: 8, letterSpacing: 1, display: "inline-block", marginTop: 3, padding: "1px 5px", borderRadius: 3, color: litSachet ? C.ink : C.ash, background: litSachet ? C.honey : "transparent", border: "1px solid " + (litSachet ? C.honey : C.line) })}>{SACHET} {r.sachet}</span> : null}
                {r.note ? <div style={Object.assign({}, bdy, { fontSize: 11, color: C.ash, marginTop: 3, lineHeight: 1.45 })}>{r.note}</div> : null}
                {r.check ? (
                  <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                    {["pale", "dark"].map((v) => { const sel = checks[r.check] === v;
                      return <button key={v} onClick={() => { set({ c: Object.assign({}, checks, { [r.check]: sel ? null : v }) }); buzz(20); }}
                        style={Object.assign({}, mno, { fontSize: 9.5, letterSpacing: 1, padding: "7px 12px", borderRadius: 4, cursor: "pointer", minHeight: 36, background: sel ? (v === "dark" ? C.copper : C.sage) : "transparent", color: sel ? C.ink : C.ash, border: "1px solid " + (sel ? (v === "dark" ? C.copper : C.sage) : C.line) })}>{v.toUpperCase()}</button>; })}
                  </div>) : null}
              </span>
              <button onClick={() => { set({ t: Object.assign({}, ticks, { [r.id]: !on }) }); buzz(25); }} aria-label={"Mark " + r.lab}
                style={Object.assign({}, mno, { width: 38, height: 38, borderRadius: 6, cursor: "pointer", fontSize: 15, fontWeight: 700, flexShrink: 0, background: on ? C.frost : "transparent", color: on ? C.ink : C.ash, border: "1px solid " + (on ? C.frost : C.line) })}>{on ? "✓" : "○"}</button>
            </div>); })}
      </div>
    </Card>);
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
function Today({ day, setDay, week, cycle, done, tick, cook, sound, st, pick, setPick, menu, setMenu, drink, setDrink, phase }) {
  const d = D[day], today = todayKey(), isToday = day === today;
  const dl = done || {};
  const feeds = useMemo(() => retime(day, phaseFeeds(phase, day, d.feeds), pick, st), [day, d, pick, st, phase]);
  const mn = menu || {};
  /* Each feed belongs to a slot. The slot remembers what was last chosen for
     this weekday; BIG applies where Menu A serves a BIG portion. */
  const meta = (() => { const seen = {};
    return feeds.map((f) => {
      if (!f.b) return null;
      const base = BASE_OF[f.b] || f.b, slot = slotOf(f.b);
      if (!slot) return { base, slot: null, big: false, id: null, key: f.b };
      const nth = seen[slot] || 0; seen[slot] = nth + 1;
      const id = day + "-" + slot + (nth ? "-" + nth : "");
      const chosen = mn[id];
      const key = chosen && SLOTS[slot].opts.indexOf(chosen) >= 0 ? chosen : base;
      return { base, slot, big: !!BIGKEY[f.b], id, key };
    }); })();
  const blk = (i) => { const m = meta[i]; return m.slot ? blockOf(m.key, m.slot, m.big) : B[m.key]; };
  const tot = feeds.reduce((a, f, i) => { if (!f.b) return a; const b = blk(i);
    return { k: a.k + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f }; }, { k: 0, p: 0, c: 0, f: 0 });
  const swapped = feeds.some((f, i) => f.b && meta[i].slot && meta[i].key !== meta[i].base);
  const eaten = feeds.reduce((a, f, i) => { if (!f.b || !dl[i]) return a; const b = blk(i);
    return { k: a.k + b.kcal, p: a.p + b.p, c: a.c + b.c, f: a.f + b.f }; }, { k: 0, p: 0, c: 0, f: 0 });
  const nm = nowMin();
  const nextIdx = isToday ? feeds.findIndex((f, i) => f.b && !dl[i] && tMin(f.t) >= nm - 5) : -1;
  const [open, setOpen] = useState(null);
  const dload = week === 5 || week === 10 || (week === 18 && cycle === 18), taper = week === 15 || week === 16;
  const wake = day === "fri";
  return (
    <div>
      <Card ac={pick ? C.ember : C.line} s={{ padding: "12px 14px" }}>
        <Eye c={pick ? C.ember : C.ash}>{wake ? "Wake" : "Session start"}</Eye>
        <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
          <input type="time" aria-label={wake ? "Wake time" : "Session start time"}
            value={pick || DEFAULT_START[day] || ""}
            onChange={(e) => { setPick(day, e.target.value || null); buzz(20); }}
            style={Object.assign({}, mno, { flex: 1, minWidth: 0, background: C.ink, border: "1px solid " + (pick ? C.ember : C.line), borderRadius: 5, color: pick ? C.bone : C.ash, fontSize: 22, fontWeight: 700, padding: "10px 8px", textAlign: "center", minHeight: 56 })} />
          {pick ? <Btn small c={C.ash} on={() => { setPick(day, null); buzz(20); }} s={{ minHeight: 56, whiteSpace: "nowrap" }}>PLAN TIMES</Btn> : null}
        </div>
        <Note s={{ marginTop: 8 }}>{pick
          ? <span>Morning re-timed around <span style={{ color: C.honey }}>{pick}</span>.</span>
          : <span>Showing the plan's printed times. Set {wake ? "when you woke" : "when you start"} and the morning moves with it.</span>}</Note>
      </Card>
      {phase ? (() => { const P = PHASES[phase];
        return (
          <Card ac={P.c} s={{ padding: "12px 14px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
              <span>
                <span style={Object.assign({}, dsp, { fontSize: 17, fontWeight: 800, letterSpacing: 1.3, color: P.c })}>{P.n}</span>
                {P.sub ? <span style={Object.assign({}, bdy, { fontSize: 11.5, color: C.ash, marginLeft: 7 })}>{P.sub}</span> : null}
              </span>
              <span style={Object.assign({}, mno, { fontSize: 12, fontWeight: 700, color: C.honey, whiteSpace: "nowrap" })}>~{P.t.kcal.toLocaleString()}</span>
            </div>
            <div style={Object.assign({}, mno, { fontSize: 9, color: C.ash, marginTop: 3 })}>P{P.t.p} · C{P.t.c} · F{P.t.f} · DAILY AVERAGE</div>
            {P.r.map((x, i) => <Note key={i} s={{ marginTop: 6 }}>{x}</Note>)}
            {MIDBANANA[phase] && day === "sun" ? <Note c={C.honey} bold>Scored and seven-round weeks: the mid-session banana, in the gap before the Nordics.</Note> : null}
          </Card>); })() : null}
      <Drink day={day} rows={hydraFor(day, feeds, (f, i) => (meta[i] && meta[i].key) || f.b, !!(drink || {}).sauna)} st8={drink || {}} set={setDrink} />
      {dload ? <Card ac={C.sage}><Eye c={C.sage}>Easy week {week}</Eye><Note c={C.bone} s={{ marginTop: 0 }}>Keep eating exactly as written — the training drops, the building doesn't. No fight rounds means no mid-session banana on Sunday.</Note></Card> : null}
      {taper ? <Card ac={C.frost}><Eye c={C.frost}>{week === 16 ? "Test week" : "Taper week " + week}</Eye><Note c={C.bone} s={{ marginTop: 0 }}>Volume drops, food holds. Do not cut carbs — arrive at {week === 16 ? "Saturday" : "test day"} full.{week === 16 ? " Test day eats exactly like a normal Saturday." : ""}</Note></Card> : null}

      <Card ac={d.star ? C.ember : C.line} s={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={Object.assign({}, dsp, { fontSize: 28, fontWeight: 800, letterSpacing: 1.6, color: C.bone, lineHeight: 1 })}>{d.star ? "★ " : ""}{d.n}</span>
            <span style={{ textAlign: "right" }}>
              <span style={Object.assign({}, mno, { fontSize: 18, fontWeight: 700, color: C.honey })}>{tot.k.toLocaleString()}<span style={{ fontSize: 9, color: C.ash }}> KCAL</span></span>
              {swapped ? <div style={Object.assign({}, mno, { fontSize: 8, letterSpacing: 1.2, color: C.ember, marginTop: 2 })}>SWAPS IN PLAY</div> : null}
            </span>
          </div>
          <div style={Object.assign({}, bdy, { fontSize: 12.5, color: C.ash, marginTop: 4 })}>{d.tag}</div>
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            <MacroBar label="KCAL" val={eaten.k} max={tot.k} c={C.honey} />
            <MacroBar label="P" val={eaten.p} max={tot.p} c={C.sage} />
            <MacroBar label="C" val={eaten.c} max={tot.c} c={C.ember} />
            <MacroBar label="F" val={eaten.f} max={tot.f} c={C.frost} />
          </div>
        </div>
        <div style={{ background: C.ink, borderTop: "1px solid " + C.line, padding: "10px 14px" }}>
          <div style={Object.assign({}, mno, { fontSize: 8.5, letterSpacing: 1.4, color: C.ember })}>{d.call[0]}</div>
          <div style={Object.assign({}, bdy, { fontSize: 12, color: C.bone, marginTop: 4, lineHeight: 1.45 })}>{d.call[1]}</div>
        </div>
      </Card>

      {isToday && nextIdx >= 0 ? (() => { const f = feeds[nextIdx]; const mins = tMin(f.t) - nm;
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

      {feeds.map((f, i) => {
        if (f.ev) return (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "9px 2px", opacity: .95 }}>
            <span style={Object.assign({}, mno, { fontSize: 10, color: C.ash, width: 40, flexShrink: 0 })}>{f.t}</span>
            <span style={{ flex: 1, minWidth: 0, position: "relative" }}>
              <span style={{ position: "absolute", top: "50%", left: 0, right: 0, borderTop: "1px dashed " + C.line }} />
              <span style={Object.assign({}, dsp, { position: "relative", display: "inline-block", background: C.ink, padding: "0 8px", fontSize: 13, fontWeight: 700, letterSpacing: 1, lineHeight: 1.25, color: f.ev.indexOf("★") >= 0 ? C.ember : C.ash })}>{f.ev}</span>
            </span>
          </div>);
        const m = meta[i], bl = blk(i), on = !!dl[i], isNext = i === nextIdx, isOpen = open === i;
        const S = m.slot ? SLOTS[m.slot] : null;
        return (
          <Card key={i} tid="feed" ac={on ? C.sage : f.crit ? C.ember : C.line} s={{ padding: 0, opacity: on ? .68 : 1, borderColor: isNext ? C.ember : C.line }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px" }}>
              <span onClick={() => setOpen(isOpen ? null : i)} style={{ flex: 1, minWidth: 0, cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={Object.assign({}, mno, { fontSize: 11, color: isNext ? C.ember : C.ash, width: 40, flexShrink: 0, fontWeight: isNext ? 700 : 400 })}>{f.tl || f.t}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <div style={Object.assign({}, bdy, { fontSize: 14.5, fontWeight: 600, color: f.crit && !on ? C.ember : C.bone })}>{f.crit ? "★ " : ""}{bl.n}</div>
                  <div style={Object.assign({}, mno, { fontSize: 9, color: C.ash, marginTop: 2, display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" })}>
                    <span>{bl.kcal} KCAL · P{bl.p} C{bl.c} F{bl.f}</span>
                    {S ? <span style={{ fontSize: 8, letterSpacing: 1, color: m.key !== m.base ? C.ink : C.ash, background: m.key !== m.base ? C.ember : "transparent", border: "1px solid " + (m.key !== m.base ? C.ember : C.line), borderRadius: 3, padding: "1px 4px" }}>{m.key !== m.base ? "SWAP" : "AS WRITTEN"}</span> : null}
                  </div>
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
                {S ? (
                  <div style={{ marginTop: 10, borderTop: "1px solid " + C.line, paddingTop: 8 }}>
                    <Eye c={C.ember} s={{ marginBottom: 6 }}>{S.n}{m.big ? " · BIG" : ""}</Eye>
                    {S.opts.map((k, oi) => { const b = blockOf(k, m.slot, m.big), sel = k === m.key;
                      return (
                        <button key={k} onClick={() => { setMenu(m.id, k === m.base ? null : k, k); buzz(20); }}
                          style={{ display: "flex", width: "100%", alignItems: "center", gap: 8, textAlign: "left", background: "transparent", border: "none", borderTop: oi ? "1px solid " + C.line : "none", padding: "8px 0", cursor: "pointer", minHeight: 44 }}>
                          <span style={Object.assign({}, mno, { fontSize: 11, color: sel ? C.ember : C.line, flexShrink: 0 })}>{sel ? "●" : "○"}</span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span style={Object.assign({}, bdy, { fontSize: 13, fontWeight: sel ? 600 : 400, color: sel ? C.bone : C.ash, display: "block" })}>{b.n}</span>
                            <span style={Object.assign({}, mno, { fontSize: 9, color: C.ash })}>{b.kcal} KCAL · P{b.p} C{b.c} F{b.f}</span>
                          </span>
                        </button>); })}
                  </div>) : null}
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

function Cook({ cook, setCook, foods, setFoods, K, prep, setPrep }) {
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

      <Card ac={C.ember}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
          <Eye c={C.ember} s={{ marginBottom: 0 }}>Menu B prep — once, twice a week</Eye>
          <Btn small c={C.ash} on={() => { setPrep({}); buzz(30); }}>NEW COOK DAY</Btn>
        </div>
        <Note s={{ marginTop: 8 }}>On the batch days — Sunday and Wednesday — three extra jobs, fifteen minutes.</Note>
        {[["Portion the mince separately.", "The pot calculator already gives you the cooked grams per portion. Put four standard portions of mince alone into tubs for the wraps; the rest goes into the batch tubs with the sweet potato as now."],
          ["Boil the eggs.", "Twelve on Sunday, nine on Wednesday, ten minutes from boiling, straight into cold water. In the shell they keep a week in the fridge; peel them the night before, not the week before."],
          ["Bagels and tins in the bag.", "Bagels keep a week; tuna keeps forever. Two bagels and a tin live in the work bag permanently, so a day that goes wrong still has a Menu B in it."],
          ["The night before.", "Wraps rolled and foiled, eggs peeled into a tub, bananas counted."],
          ["Cold mince is cold mince.", "In a cool bag with an ice block from the fridge to the break, and eaten by lunchtime. Wraps made at 9pm and eaten at 12:30 with no cooling in between is the one way Menu B goes wrong."]].map((x, i) => {
          const on = !!prep[i];
          return (
            <div key={i} onClick={() => { setPrep(Object.assign({}, prep, { [i]: !on })); buzz(25); }}
              style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "10px 0", borderTop: "1px solid " + C.line, cursor: "pointer" }}>
              <span style={Object.assign({}, mno, { width: 26, height: 26, borderRadius: 4, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, background: on ? C.sage : "transparent", color: C.ink, border: "1px solid " + (on ? C.sage : C.line) })}>{on ? "✓" : ""}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={Object.assign({}, bdy, { fontSize: 13.5, fontWeight: 600, color: on ? C.ash : C.bone, textDecoration: on ? "line-through" : "none" })}>{x[0]}</div>
                <div style={Object.assign({}, bdy, { fontSize: 11.5, color: C.ash, marginTop: 2, lineHeight: 1.45 })}>{x[1]}</div>
              </span>
            </div>); })}
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
function Shop({ shop, setShop, used, today }) {
  /* Only the extras for options taken in the last fortnight. */
  const swaps = (() => {
    const rows = [], seen = {};
    for (const [k, d] of Object.entries(used || {})) {
      if (!B[k] || !B[k].extra) continue;
      if ((parseISO(today) - parseISO(d)) / 86400000 > 14) continue;
      for (const [item, qty] of B[k].extra) { if (seen[item]) continue; seen[item] = 1; rows.push([item, qty]); }
    }
    return rows;
  })();
  const GROUPS = swaps.length ? SHOP.concat([["SWAPS — WHAT YOU'VE BEEN TAKING", swaps]]) : SHOP;
  const total = GROUPS.reduce((a, g) => a + g[1].length, 0);
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
      {GROUPS.map((g, gi) => (
        <Card key={g[0]} ac={[C.copper, C.honey, C.frost, C.ember, C.sage, C.frost][gi]}>
          <Eye c={[C.copper, C.honey, C.frost, C.ember, C.sage, C.frost][gi]}>{g[0]}</Eye>
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
   THE REFEREE — the tape and the scale. No calorie burn anywhere:
   what the numbers do over weeks is the only verdict that counts.
   ================================================================ */
/* Small multiples, one measure per chart. Arm sits near 39cm and shoulder
   near 121cm, so a shared axis would flatten both into straight lines —
   each gets its own scale instead. Colours are the app's own, and every
   chart's title names its single series, so identity is never colour-alone. */
const MEASURES = [
  { k: "kg", n: "BODYWEIGHT", unit: "kg", c: C.sage },
  { k: "waist", n: "WAIST", unit: "cm", c: C.ember },
  { k: "arm", n: "ARM", unit: "cm", c: C.honey, every4: true },
  { k: "shoulder", n: "SHOULDER", unit: "cm", c: C.frost, every4: true },
];
const UPPER = MEASURES.filter((m) => m.every4);
const WEEKLY = MEASURES.filter((m) => !m.every4);
const DAY_MS = 86400000;
const weeksBetween = (a, b) => (parseISO(b) - parseISO(a)) / (DAY_MS * 7);

/* Least-squares slope in units per week. Null under two points. */
function slope(pts) {
  if (!pts || pts.length < 2) return null;
  const t0 = parseISO(pts[0].d);
  const xs = pts.map((p) => (parseISO(p.d) - t0) / (DAY_MS * 7)), ys = pts.map((p) => p.v);
  const n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0;
  for (let i = 0; i < n; i++) { num += (xs[i] - mx) * (ys[i] - my); den += (xs[i] - mx) ** 2; }
  return den === 0 ? null : num / den;
}
const series = (rows, k) => rows.filter((r) => r[k] != null && r[k] !== "").map((r) => ({ d: r.d, v: Number(r[k]) }));
const within = (pts, days) => { if (!pts.length) return []; const last = parseISO(pts[pts.length - 1].d); return pts.filter((p) => (last - parseISO(p.d)) <= days * DAY_MS); };
const fmt = (v, dp) => (v > 0 ? "+" : "") + v.toFixed(dp == null ? 1 : dp);

/* The three rules from THE FEEDBACK LOOP, read off the logged numbers. */
function verdicts(rows) {
  const kg = series(rows, "kg"), waist = series(rows, "waist");
  const arm = series(rows, "arm"), sh = series(rows, "shoulder");
  const out = [];

  /* 1 — waist climbing faster than arms and shoulders, over the tape window */
  const taped = rows.filter((r) => r.waist != null && r.waist !== "" && ((r.arm != null && r.arm !== "") || (r.shoulder != null && r.shoulder !== "")));
  if (taped.length >= 2) {
    const a = taped[taped.length - 2], b = taped[taped.length - 1];
    const wk = weeksBetween(a.d, b.d);
    const dW = Number(b.waist) - Number(a.waist);
    const ups = [];
    if (a.arm != null && a.arm !== "" && b.arm != null && b.arm !== "") ups.push(Number(b.arm) - Number(a.arm));
    if (a.shoulder != null && a.shoulder !== "" && b.shoulder != null && b.shoulder !== "") ups.push(Number(b.shoulder) - Number(a.shoulder));
    const dU = ups.length ? ups.reduce((x, y) => x + y, 0) / ups.length : 0;
    out.push({ id: "waist", lit: dW > 0 && dW > dU,
      head: "Waist climbing faster than arms and shoulders",
      act: "Cut 100–150 kcal — one of the 3pm bananas on Monday and Thursday.",
      read: "Waist " + fmt(dW) + " cm against " + fmt(dU) + " cm up top, over " + wk.toFixed(0) + " week" + (Math.round(wk) === 1 ? "" : "s") + "." });
  } else {
    out.push({ id: "waist", lit: false, head: "Waist climbing faster than arms and shoulders",
      act: "Cut 100–150 kcal — one of the 3pm bananas on Monday and Thursday.",
      read: "Needs two tape sessions with waist and arm or shoulder." });
  }

  /* 2 — nothing moving in six weeks, waist flat */
  const six = within(kg, 45), sixW = within(waist, 45);
  if (six.length >= 3 && sixW.length >= 2 && weeksBetween(six[0].d, six[six.length - 1].d) >= 5.5) {
    const kgWk = slope(six), wWk = slope(sixW);
    const upWk = [slope(within(arm, 45)), slope(within(sh, 45))].filter((x) => x != null);
    const upFlat = !upWk.length || upWk.every((x) => x <= 0.02);
    out.push({ id: "stuck", lit: Math.abs(wWk) <= 0.08 && Math.abs(kgWk) <= 0.06 && upFlat,
      head: "Nothing moving in six weeks, waist flat",
      act: "Add 200 kcal — one extra CARB TOP-UP.",
      read: "Weight " + fmt(kgWk * 6, 1) + " kg and waist " + fmt(wWk * 6, 1) + " cm over the last six weeks." });
  } else {
    out.push({ id: "stuck", lit: false, head: "Nothing moving in six weeks, waist flat",
      act: "Add 200 kcal — one extra CARB TOP-UP.",
      read: "Needs six weeks of weekly weigh-ins." });
  }

  /* 3 — bodyweight falling more than half a kilo a week */
  const four = within(kg, 28);
  if (four.length >= 3) {
    const kgWk = slope(four);
    out.push({ id: "falling", lit: kgWk < -0.5,
      head: "Bodyweight falling more than 0.5 kg a week",
      act: "Add the CARB TOP-UP and a rice pouch on the light days. You're under-eating — the answer is food, not a program change.",
      read: "Trending " + fmt(kgWk, 2) + " kg a week over the last four." });
  } else {
    out.push({ id: "falling", lit: false, head: "Bodyweight falling more than 0.5 kg a week",
      act: "Add the CARB TOP-UP and a rice pouch on the light days.",
      read: "Needs three weekly weigh-ins." });
  }
  return out;
}

/* A thin trend line. One axis per chart — weight and waist never share one. */
function Trend({ lines, unit }) {
  const W = 300, H = 92, P = { l: 4, r: 4, t: 10, b: 16 };
  const all = lines.flatMap((l) => l.pts);
  if (all.length < 2) return <div style={Object.assign({}, bdy, { fontSize: 12, color: C.ash, fontStyle: "italic", padding: "14px 0" })}>Two entries and the line starts.</div>;
  const xs = all.map((p) => parseISO(p.d).getTime());
  const x0 = Math.min(...xs), x1 = Math.max(...xs);
  const vs = all.map((p) => p.v);
  let lo = Math.min(...vs), hi = Math.max(...vs);
  if (hi - lo < 1e-6) { lo -= 1; hi += 1; }
  const pad = (hi - lo) * 0.18; lo -= pad; hi += pad;
  const X = (d) => P.l + (x1 === x0 ? (W - P.l - P.r) / 2 : (parseISO(d).getTime() - x0) / (x1 - x0) * (W - P.l - P.r));
  const Y = (v) => P.t + (1 - (v - lo) / (hi - lo)) * (H - P.t - P.b);
  return (
    <svg viewBox={"0 0 " + W + " " + H} width="100%" height={H} role="img" style={{ display: "block", overflow: "visible" }}>
      {[0, 0.5, 1].map((f) => <line key={f} x1={P.l} x2={W - P.r} y1={P.t + f * (H - P.t - P.b)} y2={P.t + f * (H - P.t - P.b)} stroke={C.line} strokeWidth="1" />)}
      {lines.map((l) => <polyline key={l.k} fill="none" stroke={l.c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        points={l.pts.map((p) => X(p.d) + "," + Y(p.v)).join(" ")} />)}
      {lines.map((l) => l.pts.map((p, i) => <circle key={l.k + i} cx={X(p.d)} cy={Y(p.v)} r="4" fill={l.c} stroke={C.card} strokeWidth="2" />))}
      {lines.map((l) => { const p = l.pts[l.pts.length - 1];
        return <text key={l.k + "lab"} x={Math.min(X(p.d) + 7, W - 2)} y={Y(p.v) - 7} textAnchor={X(p.d) > W - 60 ? "end" : "start"}
          style={Object.assign({}, mno, { fontSize: 10, fontWeight: 700 })} fill={C.bone}>{p.v}{unit}</text>; })}
    </svg>);
}

function Referee({ tape, setTape, phase }) {
  const rows = (tape || []).slice().sort((a, b) => a.d < b.d ? -1 : 1);
  const [d, setD] = useState(iso(sundayOf(new Date())));
  const [f, setF] = useState({ kg: "", waist: "", arm: "", shoulder: "" });
  const [msg, setMsg] = useState(null);
  const set = (k) => (v) => setF(Object.assign({}, f, { [k]: v }));

  const existing = rows.find((r) => r.d === d);
  const save = () => {
    const row = { d };
    for (const k of ["kg", "waist", "arm", "shoulder"]) { const n = num(f[k]); if (n != null) row[k] = n; }
    if (Object.keys(row).length < 2) { setMsg("Put a number in first."); return; }
    const merged = existing ? Object.assign({}, existing, row) : row;
    setTape(rows.filter((r) => r.d !== d).concat([merged]).sort((a, b) => a.d < b.d ? -1 : 1));
    setF({ kg: "", waist: "", arm: "", shoulder: "" });
    setMsg(existing ? "Updated " + d + "." : "Logged " + d + ".");
    buzz([60, 40, 60]);
  };
  const drop = (date) => { setTape(rows.filter((r) => r.d !== date)); buzz(30); };

  const P = phase ? PHASES[phase] : null;
  const V = verdicts(rows);
  const lit = V.filter((v) => v.lit);
  const latest = (k) => { const p = series(rows, k); return p.length ? p[p.length - 1].v : null; };

  return (
    <div>
      <Card ac={C.ember}>
        <Eye c={C.ember}>The referee</Eye>
        <Note s={{ marginTop: 0 }}>Bodyweight and waist every Sunday; arm and shoulder every four weeks. Nothing here counts calories burned — what the tape and the scale do over weeks is the only verdict that counts.</Note>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          {MEASURES.map((m) => { const v = latest(m.k);
            return (
              <div key={m.k} style={{ flex: 1, minWidth: 0 }}>
                <div style={Object.assign({}, mno, { fontSize: 7.5, letterSpacing: 1, color: C.ash })}>{m.n}</div>
                <div style={Object.assign({}, mno, { fontSize: 17, fontWeight: 700, color: v == null ? C.line : m.c, lineHeight: 1.2 })}>{v == null ? "—" : v}</div>
              </div>); })}
        </div>
      </Card>

      {P ? (
        <Card ac={P.c}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <Eye c={P.c} s={{ marginBottom: 0 }}>{P.n}{P.sub ? " · " + P.sub : ""}</Eye>
            <span style={Object.assign({}, mno, { fontSize: 12, fontWeight: 700, color: C.honey, whiteSpace: "nowrap" })}>~{P.t.kcal.toLocaleString()}</span>
          </div>
          <div style={Object.assign({}, mno, { fontSize: 9, color: C.ash, marginTop: 4 })}>P{P.t.p} · C{P.t.c} · F{P.t.f} · DAILY AVERAGE</div>
          {P.r.map((x, i) => <Note key={i} s={{ marginTop: 6 }}>{x}</Note>)}
        </Card>) : null}

      <Card>
        <Eye c={C.honey}>Log a reading</Eye>
        <Lab>Date — Sunday</Lab>
        <Fld type="date" v={d} on={(v) => { if (v) setD(v); }} s={{ textAlign: "left" }} />
        {[["Every Sunday", WEEKLY, { "kg": "80.4", "waist": "84" }], ["Every four weeks", UPPER, { "arm": "39.5", "shoulder": "121" }]].map((g) => (
          <div key={g[0]} style={{ marginTop: 10 }}>
            <Lab>{g[0]}</Lab>
            <div style={{ display: "flex", gap: 6 }}>
              {g[1].map((m) => (
                <div key={m.k} style={{ flex: 1, minWidth: 0 }}>
                  <Lab>{m.n.toLowerCase()} {m.unit}</Lab>
                  <Fld v={f[m.k]} on={set(m.k)} ph={existing && existing[m.k] != null ? String(existing[m.k]) : g[2][m.k]} />
                </div>))}
            </div>
          </div>))}
        <Btn c={C.sage} fill s={{ width: "100%", marginTop: 12 }} on={save}>{existing ? "UPDATE THIS SUNDAY" : "LOG IT"}</Btn>
        {msg ? <Note c={C.honey}>{msg}</Note> : null}
      </Card>

      {MEASURES.map((m) => (
        <Card key={m.k} ac={m.c}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
            <Eye c={m.c} s={{ marginBottom: 0 }}>{m.n} · {m.unit}</Eye>
            <span style={Object.assign({}, mno, { fontSize: 9, color: C.ash, whiteSpace: "nowrap" })}>{series(rows, m.k).length} ENTRIES{m.every4 ? " · EVERY 4 WEEKS" : ""}</span>
          </div>
          <Trend lines={[{ k: m.k, c: m.c, pts: series(rows, m.k) }]} unit={m.unit} />
        </Card>))}

      <Card ac={lit.length ? C.copper : C.sage}>
        <Eye c={lit.length ? C.copper : C.sage}>The feedback loop — read off your numbers</Eye>
        {V.map((v) => (
          <div key={v.id} style={{ borderTop: "1px solid " + C.line, padding: "10px 0 2px" }}>
            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <span style={Object.assign({}, mno, { fontSize: 9, fontWeight: 700, color: v.lit ? C.copper : C.line, flexShrink: 0, marginTop: 2 })}>{v.lit ? "●" : "○"}</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <div style={Object.assign({}, bdy, { fontSize: 13, fontWeight: 600, color: v.lit ? C.bone : C.ash })}>{v.head}</div>
                <div style={Object.assign({}, mno, { fontSize: 10, color: v.lit ? C.honey : C.ash, marginTop: 3 })}>{v.read}</div>
                {v.lit ? <div style={Object.assign({}, bdy, { fontSize: 12.5, color: C.bone, marginTop: 5, lineHeight: 1.5 })}>{v.act}</div> : null}
              </span>
            </div>
          </div>))}
        {!lit.length ? <Note c={C.sage} bold>Arms and shoulders up, waist flat — correct. Change nothing.</Note> : null}
      </Card>

      <Card>
        <Eye>Every reading</Eye>
        {rows.length ? rows.slice().reverse().map((r) => (
          <div key={r.d} style={{ display: "flex", gap: 8, alignItems: "center", padding: "8px 0", borderTop: "1px solid " + C.line }}>
            <span style={Object.assign({}, mno, { fontSize: 10, color: C.ash, width: 74, flexShrink: 0 })}>{r.d}</span>
            <span style={{ flex: 1, minWidth: 0, display: "flex", flexWrap: "wrap", gap: "2px 10px" }}>
              {MEASURES.map((m) => r[m.k] == null ? null : (
                <span key={m.k} style={Object.assign({}, mno, { fontSize: 11, color: m.c, whiteSpace: "nowrap" })}>
                  <span style={{ fontSize: 8, color: C.ash, letterSpacing: 1, marginRight: 3 }}>{m.n.slice(0, 2)}</span>{r[m.k]}</span>))}
            </span>
            <button onClick={() => drop(r.d)} aria-label={"Delete " + r.d} style={Object.assign({}, mno, { background: "transparent", border: "1px solid " + C.line, color: C.ash, borderRadius: 4, width: 32, height: 32, cursor: "pointer", fontSize: 13, flexShrink: 0 })}>×</button>
          </div>)) : <Note s={{ fontStyle: "italic" }}>Nothing logged yet. Tape every four to six weeks; waist is the number that decides.</Note>}
      </Card>
    </div>);
}

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
  const lines = [PLAN_MD, MENUB_MD.replace(/^#\s+/, "## "), SEASON_MD.replace(/^#\s+/, "## ")].join("\n\n---\n\n").replace(/\r/g, "").split("\n");
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

const TFld = ({ v, on }) => <input type="time" value={v || ""} onChange={(e) => on(e.target.value)}
  style={Object.assign({}, mno, { width: "100%", background: C.ink, border: "1px solid " + C.line, borderRadius: 4, color: C.bone, fontSize: 15, padding: "9px 6px", textAlign: "center", minHeight: 44 })} />;

function Settings({ st, setSt, week, close, onExport, onImport, phase }) {
  const se = st.season || {};
  const setSe = (patch) => setSt(Object.assign({}, st, { season: Object.assign({}, se, patch) }));
  const breaks = st.breaks || DEFAULT_BREAKS();
  const len = st.len || DEFAULT_LEN();
  const setBreak = (i, v) => { const n = breaks.slice(); n[i] = v; setSt(Object.assign({}, st, { breaks: n })); };
  const setLen = (k, v) => setSt(Object.assign({}, st, { len: Object.assign({}, len, { [k]: v === "" ? "" : Number(v) }) }));
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
        <div style={{ borderTop: "1px solid " + C.line, marginTop: 14, paddingTop: 14 }}>
          <Eye c={C.ember}>The season</Eye>
          <Note s={{ marginTop: 0 }}>Which block of training today sits in. The phase sets the day's target and the changes the plan makes to Menu A.</Note>
          <div style={{ marginTop: 10 }}>
            <Lab>Program</Lab>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {PROGRAMS.map((x) => { const on = (se.prog || "") === x[0];
                return <button key={x[0]} onClick={() => setSe({ prog: on ? "" : x[0] })}
                  style={Object.assign({}, dsp, { flex: "1 1 45%", fontSize: 11.5, fontWeight: 700, letterSpacing: .5, padding: "10px 4px", borderRadius: 4, cursor: "pointer", minHeight: 44, background: on ? C.ember : "transparent", color: on ? C.ink : C.ash, border: "1px solid " + (on ? C.ember : C.line) })}>{x[1]}</button>; })}
            </div>
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
            <div style={{ flex: 1, minWidth: 0 }}><Lab>Program start date</Lab><Fld type="date" v={se.start || ""} on={(v) => setSe({ start: v })} s={{ textAlign: "left", fontSize: 14 }} /></div>
            <div style={{ flex: 1, minWidth: 0 }}><Lab>Fight date (optional)</Lab><Fld type="date" v={se.fight || ""} on={(v) => setSe({ fight: v })} s={{ textAlign: "left", fontSize: 14 }} /></div>
          </div>
          <div onClick={() => setSe({ cut: !se.cut })} style={{ display: "flex", gap: 10, alignItems: "center", padding: "12px 0", borderTop: "1px solid " + C.line, cursor: "pointer", marginTop: 10 }}>
            <span style={{ width: 40, height: 24, borderRadius: 12, background: se.cut ? C.copper : C.ink, border: "1px solid " + (se.cut ? C.copper : C.line), position: "relative", flexShrink: 0 }}>
              <span style={{ position: "absolute", top: 2, left: se.cut ? 18 : 2, width: 18, height: 18, borderRadius: 9, background: C.bone, transition: "left .15s" }} /></span>
            <span style={{ flex: 1 }}><div style={Object.assign({}, bdy, { fontSize: 13.5, fontWeight: 600, color: C.bone })}>Making weight</div><div style={Object.assign({}, bdy, { fontSize: 11.5, color: C.ash })}>Only when the limit demands it, decided in camp week 1. Overrides the phase.</div></span>
          </div>
          <Note c={phase ? C.honey : C.ash}>{phase ? <span>Today reads as <span style={{ color: PHASES[phase].c }}>{PHASES[phase].n}</span>.</span> : "Set a program and a start date and the phase shows on TODAY."}</Note>
        </div>

        <div style={{ borderTop: "1px solid " + C.line, marginTop: 14, paddingTop: 14 }}>
          <Eye c={C.ember}>Session times</Eye>
          <Note s={{ marginTop: 0 }}>What TODAY works from when you enter a session start.</Note>

          <div style={{ marginTop: 12 }}>
            <Lab>Break times at work — where the two BATCH portions land</Lab>
            <div style={{ display: "flex", gap: 6 }}>
              {[0, 1].map((i) => <div key={i} style={{ flex: 1, minWidth: 0 }}><TFld v={breaks[i]} on={(v) => setBreak(i, v)} /></div>)}
            </div>
          </div>

          <div style={{ marginTop: 14 }}>
            <Lab>Session length in minutes — taken from the plan</Lab>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {[["mon", "MON"], ["tue", "TUE"], ["wed", "WED"], ["thu", "THU"], ["sat", "SAT"], ["sun", "SUN"]].map((x) => (
                <div key={x[0]} style={{ flex: "1 1 30%", minWidth: 0 }}>
                  <div style={Object.assign({}, mno, { fontSize: 8, color: C.ash, letterSpacing: 1, textAlign: "center", marginBottom: 3 })}>{x[1]}</div>
                  <Fld v={len[x[0]]} on={(v) => setLen(x[0], v)} />
                </div>))}
            </div>
            <Note>The porridge lands a session-length after you start; the weekend bottle a quarter of an hour after that.</Note>
          </div>
        </div>

        <Backup onExport={onExport} onImport={onImport} />
      </div>
    </div>);
}

const KEYS = { st: "fu8-settings", done: "fu8-done", cook: "fu8-cook", foods: "fu8-foods", shop: "fu8-shop", tape: "fu8-tape", menu: "fu8-menu", drink: "fu8-drink" };
const DEFAULT_ST = () => ({ start: iso(mondayOf(new Date())), iron: false, sound: true, breaks: DEFAULT_BREAKS(), len: DEFAULT_LEN(), pick: null, season: { prog: "", start: "", fight: "", cut: false } });
export default function App() {
  const [st, setStRaw] = useState(DEFAULT_ST);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("today");
  const [day, setDay] = useState(todayKey());
  const [doneAll, setDoneRaw] = useState({});
  const [cook, setCookRaw] = useState(null);
  const [foods, setFoodsRaw] = useState([]);
  const [shop, setShopRaw] = useState({});
  const [tape, setTapeRaw] = useState([]);
  const [menuAll, setMenuRaw] = useState({});
  const [drinkAll, setDrinkRaw] = useState({});
  const [showSet, setShowSet] = useState(false);
  const beep = useBeep(st.sound);
  const K = useKTimer(beep);
  const chimed = useRef({});
  const mk = (setter, key) => (v) => { setter(v); save(key, v); };
  const setSt = mk(setStRaw, KEYS.st), setDoneAll = mk(setDoneRaw, KEYS.done), setCook = mk(setCookRaw, KEYS.cook), setFoods = mk(setFoodsRaw, KEYS.foods), setShop = mk(setShopRaw, KEYS.shop), setTape = mk(setTapeRaw, KEYS.tape), setMenuAll = mk(setMenuRaw, KEYS.menu), setDrinkAll = mk(setDrinkRaw, KEYS.drink);

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
    const setters = { st: setStRaw, done: setDoneRaw, cook: setCookRaw, foods: setFoodsRaw, shop: setShopRaw, tape: setTapeRaw, menu: setMenuRaw, drink: setDrinkRaw };
    const found = Object.keys(KEYS).filter((short) => Object.prototype.hasOwnProperty.call(data, KEYS[short]));
    if (!found.length) return { ok: 0, msg: "No Fuel data found in that backup." };
    for (const short of found) {
      let v = data[KEYS[short]];
      if (short === "st") v = Object.assign(DEFAULT_ST(), v || {});
      if (short === "done" || short === "shop" || short === "menu" || short === "drink") v = v || {};
      if (short === "foods" || short === "tape") v = Array.isArray(v) ? v : [];
      await save(KEYS[short], v);
      setters[short](v);
    }
    return { ok: 1, msg: "Restored " + found.length + " of " + Object.keys(KEYS).length + " sections. You're back." };
  }, []);
  useEffect(() => { (async () => {
    const s = await load(KEYS.st, null); if (s) setStRaw(s); else save(KEYS.st, st);
    setDoneRaw(await load(KEYS.done, {})); setCookRaw(await load(KEYS.cook, null)); setFoodsRaw(await load(KEYS.foods, [])); setShopRaw(await load(KEYS.shop, {})); setTapeRaw(await load(KEYS.tape, [])); setMenuRaw(await load(KEYS.menu, {})); setDrinkRaw(await load(KEYS.drink, {}));
    setLoaded(true);
  })(); }, []);
  const L = st.iron ? 18 : 16;
  const week = useMemo(() => { const wk = Math.floor((mondayOf(new Date()) - mondayOf(parseISO(st.start))) / 604800000); return wk < 0 ? 1 : (wk % L) + 1; }, [st.start, L]);
  const dateK = iso(new Date());
  /* The pick is stamped with the day it was made, so it lapses at midnight. */
  const picks = st.pick && st.pick.date === dateK ? (st.pick.sel || {}) : {};
  const setPick = (k, v) => {
    const sel = Object.assign({}, picks);
    if (v) sel[k] = v; else delete sel[k];
    setSt(Object.assign({}, st, { pick: { date: dateK, sel } }));
  };
  const dayKey = dateK + "-" + day;
  const dayDone = (doneAll[dayKey]) || {};
  /* Slot picks are remembered per slot per weekday, so the default is
     whatever was chosen last. `used` dates each option for the shop. */
  const dayMenu = menuAll.picks || {};
  const setMenu = (id, k, chosen) => {
    const sel = Object.assign({}, dayMenu);
    if (k) sel[id] = k; else delete sel[id];
    const used = Object.assign({}, menuAll.used, chosen ? { [chosen]: dateK } : {});
    setMenuAll(Object.assign({}, menuAll, { picks: sel, used }));
  };
  const setPrep = (v) => setMenuAll(Object.assign({}, menuAll, { prep: v }));
  const dayDrink = drinkAll[dayKey] || {};
  const setDrink = (patch) => setDrinkAll(Object.assign({}, drinkAll, { [dayKey]: Object.assign({}, dayDrink, patch) }));
  const tick = (i) => { const k = dateK + "-" + day; const cur = Object.assign({}, doneAll[k]); cur[i] = !cur[i]; const n = Object.assign({}, doneAll); n[k] = cur; setDoneAll(n); buzz(25); };
  useEffect(() => { const id = setInterval(() => { if (!st.sound) return; const t = todayKey(); const nm = nowMin();
    const sel = st.pick && st.pick.date === iso(new Date()) ? (st.pick.sel || {}) : {};
    retime(t, D[t].feeds, sel[t], st).forEach((f, i) => { if (f.b && tMin(f.t) === nm && !chimed.current[dateK + i] && !((doneAll[dateK + "-" + t] || {})[i])) { chimed.current[dateK + i] = 1; beep(660, 200); setTimeout(() => beep(880, 350), 220); buzz([120, 60, 120]); } });
  }, 20000); return () => clearInterval(id); }, [st, doneAll, beep]);
  const season = st.season || {};
  const phase = useMemo(() => phaseOf(season, dateK, week), [season, dateK, week]);
  const TABS = [["today", "TODAY"], ["cook", "COOK"], ["shop", "SHOP"], ["plan", "PLAN"], ["ref", "REFEREE"]];
  return (
    <div style={Object.assign({}, bdy, { background: C.ink, minHeight: "100vh", color: C.bone })}>
      <style>{FONTS}</style>
      {showSet ? <Settings st={st} setSt={setSt} week={week} close={() => setShowSet(false)} onExport={buildBackup} onImport={applyBackup} phase={phase} /> : null}
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
            {tab === "today" ? <Today day={day} setDay={setDay} week={week} cycle={L} done={dayDone} tick={tick} cook={cook} sound={st.sound} st={st} pick={picks[day]} setPick={setPick} menu={dayMenu} setMenu={setMenu} drink={dayDrink} setDrink={setDrink} phase={phase} /> : null}
            {tab === "cook" ? <Cook cook={cook} setCook={setCook} foods={foods} setFoods={setFoods} K={K} prep={menuAll.prep || {}} setPrep={setPrep} /> : null}
            {tab === "shop" ? <Shop shop={shop} setShop={setShop} used={menuAll.used || {}} today={dateK} /> : null}
            {tab === "plan" ? <PlanView /> : null}
            {tab === "ref" ? <Referee tape={tape} setTape={setTape} phase={phase} /> : null}
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
