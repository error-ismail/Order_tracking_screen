import { useState, useEffect } from "react";

/* ───────── Mock data (frontend only) ───────── */
const NOW = new Date("2026-09-23T10:00:00");
const PRODUCT = { name: "Merino crew sweater", meta: "Moss green · Size M · Qty 1", total: "৳3,500", pay: "bKash •••• 4242", addr: "House 12, Road 4, Khulshi, Chattogram", carrier: "Sundarban Courier" };
const ORDERS = [
  { label: "On the way", id: "#BD-48213", placed: "Sep 19", status: "out_for_delivery", trackingId: "SCS 9920 4417 03", eta: "2026-09-23T18:00:00", updated: "4 min ago",
    events: [["Out for delivery", "Today, 9:00 AM · Chattogram", "Your courier is 6 stops away.", "cur"], ["Arrived at local hub", "Today, 5:30 AM · Agrabad hub", "", "done"], ["Shipped", "Sep 21, 4:00 PM · Dhaka", "", "done"], ["Order confirmed", "Sep 19, 8:30 PM", "", "done"], ["Delivered", "Expected today", "", "todo"]] },
  { label: "Delayed", id: "#BD-48214", placed: "Sep 18", status: "shipped", trackingId: "SCS 9920 5521 88", eta: "2026-09-22T18:00:00", newEta: "2026-09-26", updated: "12 min ago",
    events: [["Delay at Dhaka hub", "Today, 8:00 AM", "Sorting delays. Estimate moved to Sep 26.", "cur"], ["Shipped", "Sep 20, 3:00 PM", "", "done"], ["Order confirmed", "Sep 18, 8:30 PM", "", "done"], ["Out for delivery", "", "", "todo"], ["Delivered", "", "", "todo"]] },
  { label: "Not received", id: "#BD-48215", placed: "Sep 17", status: "delivered", trackingId: "SCS 9920 3310 21", deliveredAt: "2026-09-22T14:00:00", reportedMissing: true, updated: "1 hr ago",
    events: [["Delivered", "Sep 22, 2:00 PM", "Left at front door. Photo proof available.", "cur"], ["Out for delivery", "Sep 22, 9:00 AM", "", "done"], ["Shipped", "Sep 20, 3:00 PM", "", "done"], ["Order confirmed", "Sep 17, 8:30 PM", "", "done"]] },
  { label: "No tracking yet", id: "#BD-48216", placed: "Sep 22", status: "processing", trackingId: null, shipBy: "2026-09-24", updated: "just now",
    events: [["Order confirmed", "Sep 22, 8:30 PM", "Payment received. Seller notified.", "done"], ["Seller is packing", "In progress", "", "cur"], ["Handed to courier", "", "", "todo"], ["Delivered", "", "", "todo"]] },
];
const TABS = [...ORDERS.map((o) => o.label), "Loading", "Empty", "Error"];

/* ───────── Status logic: data → view state ───────── */
const STAGE = { processing: 0, shipped: 1, out_for_delivery: 2, delivered: 3 };
const STEPS = ["Confirmed", "Shipped", "Out for delivery", "Delivered"];
const fmtD = (d) => new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const fmtT = (d) => new Date(d).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

function getViewState(o) {
  if (!o.trackingId) return "pending";
  if (o.status === "delivered") return o.reportedMissing ? "missing" : "delivered";
  if (new Date(o.eta) < NOW) return "delayed";
  return "transit";
}
const TONE = { transit: "ok", delivered: "ok", delayed: "warn", missing: "bad", pending: "idle" };

function describe(o, s) {
  const late = Math.max(1, Math.ceil((NOW - new Date(o.eta)) / 864e5));
  const etaD = new Date(o.eta);
  const sameDay = etaD.toDateString() === NOW.toDateString();
  const etaLabel = sameDay ? `today by ${etaD.toLocaleTimeString("en-US", { hour: "numeric" })}` : `${fmtD(etaD)} by ${etaD.toLocaleTimeString("en-US", { hour: "numeric" })}`;
  return {
    transit: { pill: "Out for delivery", title: `Arriving ${etaLabel}`, sub: `Placed ${fmtD(o.placed + ", 2026")} · Your courier is on the way.` },
    delivered: { pill: "Delivered", title: "Delivered", sub: `${fmtD(o.deliveredAt || NOW)} at ${fmtT(o.deliveredAt || NOW)}.` },
    delayed: { pill: "Delayed", title: `New estimate: ${fmtD(o.newEta)}`, sub: `Was due ${fmtD(o.eta)}. It's ${late} day${late > 1 ? "s" : ""} late. Placed ${fmtD(o.placed + ", 2026")}.`, notice: { h: "Why it's late", p: "A regional hub is backed up. Your package is safe and still moving." } },
    missing: { pill: "Marked delivered", title: "Not received yet?", sub: `Delivered ${fmtD(o.deliveredAt)} at ${fmtT(o.deliveredAt)}. Left at the front door.`, notice: { h: "Try these first (2 min)", p: "Check with neighbors, building staff, porch, mailbox and side doors." } },
    pending: { pill: "Preparing", title: "We're getting it ready", sub: `Placed ${fmtD(o.placed + ", 2026")}. Tracking appears once the seller hands it to the courier, usually within 24 hours.`, est: `Expected to ship by ${fmtD(o.shipBy)}`, notice: { h: "Nothing to do right now", p: "We'll notify you the moment tracking is live." } },
  }[s];
}


/* ───────── Illustrations ───────── */
function Illus({ s }) {
  const p = { width: 72, height: 72, viewBox: "0 0 72 72", fill: "none", stroke: "currentColor", strokeWidth: 2.5, strokeLinecap: "round", strokeLinejoin: "round", "aria-hidden": true };
  if (s === "transit") return (<svg {...p}><path d="M6 20h34v28H6zM40 28h14l10 10v10H40z" /><circle cx="20" cy="52" r="6" fill="var(--card)" /><circle cx="52" cy="52" r="6" fill="var(--card)" /><path d="M12 28h16" /></svg>);
  if (s === "delayed") return (<svg {...p}><circle cx="36" cy="38" r="24" /><path d="M36 22v16l10 6" /><path d="M28 8h16" /></svg>);
  if (s === "missing") return (<svg {...p}><path d="M14 8h30l14 14v42H14z" /><path d="M44 8v14h14" /><circle cx="36" cy="42" r="9" /><path d="M43 49l8 8" /></svg>);
  if (s === "delivered") return (<svg {...p}><path d="M10 26l26-16 26 16v34H10z" /><path d="M24 44l9 9 16-18" /></svg>);
  if (s === "empty") return (<svg {...p}><path d="M12 30l24-14 24 14" strokeDasharray="4 5" /><path d="M12 30v22a4 4 0 0 0 4 4h40a4 4 0 0 0 4-4V30" strokeDasharray="4 5" /><path d="M12 30l24 12 24-12" strokeDasharray="4 5" /></svg>);
  return (<svg {...p}><path d="M10 22l26-12 26 12v28L36 62 10 50z" /><path d="M10 22l26 12 26-12M36 34v28" strokeDasharray="4 5" /></svg>);
}

function ProductThumb() {
  return (
    <svg width="34" height="34" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M14 6l-9 7 3 7 4-2v25a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V18l4 2 3-7-9-7-5 4h-10z" fill="#fff" fillOpacity=".92" />
      <path d="M14 6l-9 7 3 7 4-2v25a2 2 0 0 0 2 2h20a2 2 0 0 0 2-2V18l4 2 3-7-9-7-5 4h-10z" stroke="#fff" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M19 6c0 3 2.5 5 5 5s5-2 5-5" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

/* ───────── Components ───────── */
function StatusHero({ o, s }) {
  const d = describe(o, s), stage = STAGE[o.status];
  return (
    <section className={`card hero ${TONE[s]}`} aria-live="polite">
      <div className="hrow"><div><span className="pill">{d.pill}</span><h1>{d.title}</h1></div><div className="ill"><Illus s={s} /></div></div>
      <p>{d.sub}</p>
      {o.trackingId && <div className="trk"><b>{PRODUCT.carrier}</b><i>{o.trackingId}</i></div>}
      {d.est && <p className="est">{d.est}</p>}
      <div className="steps" aria-label={`Step ${stage + 1} of 4: ${STEPS[stage]}`}>
        {STEPS.map((x, i) => <div key={x} className={`stp ${i === stage ? "on" : i < stage ? "past" : ""}`}><span className="sd">{i < stage ? "✓" : i + 1}</span><span className="sl">{x}</span></div>)}
      </div>
    </section>
  );
}

function Timeline({ events, tone }) {
  const [open, setOpen] = useState(false);
  const latest = events.filter((e) => e[3] === "cur");
  const shown = open ? events : latest.length ? latest : events.slice(0, 1);
  return (
    <div className="card acc">
      <h2 className="h s">Delivery history</h2>
      <ol className="tl" style={{ "--c": `var(--${tone === "idle" ? "ok" : tone})` }}>
        {shown.map(([t, w, x, k]) => (
          <li key={t} className={`${k}${open && k !== "cur" ? " in" : ""}`}>
            <span className="dot">{k === "done" ? "✓" : k === "cur" ? "●" : ""}</span>
            <div className="tlrow"><b>{t}</b>{k === "cur" && <span className="tlnow">Now</span>}</div>
            {w && <span className="t">{w}</span>}{x && <span className="t ink">{x}</span>}
          </li>
        ))}
      </ol>
      <button className="more" aria-expanded={open} onClick={() => setOpen(!open)}>
        {open ? "Show less" : `See all updates (${events.length})`}<span className="chev" />
      </button>
    </div>
  );
}

function Sheet({ title, onClose, children }) {
  useEffect(() => { const h = (e) => e.key === "Escape" && onClose(); document.addEventListener("keydown", h); return () => document.removeEventListener("keydown", h); }, [onClose]);
  return (
    <div className="ov" onClick={onClose}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <div className="shead"><h2 className="h">{title}</h2><button className="xbtn" aria-label="Close" onClick={onClose}>✕</button></div>
        {children}
      </div>
    </div>
  );
}
const KV = ({ a, b }) => (<div className="kv"><span>{a}</span><span>{b}</span></div>);

const REASONS = {
  missing: ["Marked delivered, but I didn't get it", "Delivered to the wrong address", "Package arrived damaged", "Something is missing from the package"],
  delivered: ["Delivered to the wrong address", "Package arrived damaged", "Something is missing from the package", "Something else"],
  delayed: ["It's taking too long", "Tracking hasn't updated", "I want to cancel this order", "Something else"],
  transit: ["Courier hasn't arrived", "Wrong or missed delivery time", "Tracking looks wrong", "Something else"],
  pending: ["Seller hasn't shipped it", "I want to change the address", "I want to cancel this order", "Something else"],
};

function ReportFlow({ s, onDone, onPhoto }) {
  const [reason, setReason] = useState(null);
  const R = REASONS[s] || REASONS.missing;
  return (
    <>
      <p className="mut">Tell us what happened.</p>
      {R.map((r, i) => <button key={r} className="opt" aria-pressed={reason === i} onClick={() => setReason(i)}>{r}</button>)}
      {s === "missing" && <button className="link" onClick={onPhoto}>View delivery photo</button>}
      <button className="btn p" disabled={reason === null} style={{ opacity: reason === null ? 0.4 : 1 }} onClick={onDone}>Submit report</button>
      <p className="mut sm">{s === "missing" ? "Support replies within 24 hours. We'll offer a replacement or refund if it can't be found." : "Support replies within 24 hours."}</p>
    </>
  );
}

/* ───────── Screen ───────── */
export default function OrderTrackingV2() {
  const [tab, setTab] = useState(TABS[0]);
  const [sheet, setSheet] = useState(null);
  const [reportedId, setReportedId] = useState(null);
  const close = () => setSheet(null);
  const retry = () => { setTab("Loading"); setTimeout(() => setTab(TABS[0]), 900); };

  const o = ORDERS.find((x) => x.label === tab);
  const s = o && getViewState(o);

  let bar = {
    transit: ["Contact support", "support", null], delivered: ["Contact support", "support", null], delayed: ["Ask about my delay", "support", null],
    missing: ["Report not received", "report", "danger"], pending: ["Contact support", "support", null],
  }[s || "transit"];
  if (o && reportedId === o.id) bar = ["Report sent · Case #C-77120", "support", null];

  let main;
  if (tab === "Loading") main = (
    <div aria-busy="true" aria-label="Loading tracking">
      <div className="card hero idle skl">
        <div className="hrow">
          <div><div className="sk" style={{ height: 28, width: 120, borderRadius: 999 }} /><div className="sk" style={{ height: 30, width: 190, margin: "14px 0 0" }} /></div>
          <div className="sk" style={{ height: 76, width: 76, borderRadius: "50%", flex: "none" }} />
        </div>
        <div className="sk" style={{ height: 13, width: "72%", marginTop: 12 }} />
        <div className="lroute"><div className="ltrk"><span className="lend" /><span className="lend b" /><div className="lparcel"><svg width="26" height="26" viewBox="0 0 34 34" fill="none" aria-hidden="true"><rect x="3" y="9" width="28" height="21" rx="4" fill="#F2A93B" /><path d="M3 16h28" stroke="#E0821F" strokeWidth="2" /><rect x="14" y="9" width="6" height="21" fill="#FFF1D6" /><path d="M17 9c-3-5-8-4-7-1s5 1 7 1zM17 9c3-5 8-4 7-1s-5 1-7 1z" stroke="#E0821F" strokeWidth="1.6" strokeLinejoin="round" /></svg></div></div></div>
        <div className="lsteps">{[0, 1, 2, 3].map((n) => <div key={n} className="sk" style={{ height: 30, borderRadius: 999 }} />)}</div>
      </div>
      <div className="card acc">
        <div className="sk" style={{ height: 18, width: 150, marginBottom: 18 }} />
        {[0, 1, 2].map((n) => (
          <div key={n} className="lrow"><div className="sk ldot" /><div style={{ flex: 1 }}><div className="sk" style={{ height: 14, width: `${72 - n * 14}%` }} /><div className="sk" style={{ height: 11, width: "46%", marginTop: 8 }} /></div></div>
        ))}
      </div>
      <p className="lmsg">Tracking your parcel…</p>
    </div>
  );
  else if (tab === "Empty") main = (
    <div className="card center st">
      <div className="stbadge"><Illus s="empty" /></div>
      <h2 className="h stt">No orders on the way</h2>
      <p className="mut">Anything you order will show up here with live tracking.</p>
      <div className="chips"><span>Live tracking</span><span>Delivery alerts</span><span>Easy reports</span></div>
      <div className="acts"><button className="btn p">View order history</button><button className="btn">Continue shopping</button></div>
    </div>
  );
  else if (tab === "Error") main = (
    <div className="card center st err">
      <div className="stbadge bad"><svg width="60" height="60" viewBox="0 0 72 72" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true"><path d="M8 28c16-14 40-14 56 0M18 38c11-9 25-9 36 0M28 48c5-4 11-4 16 0" /><path d="M10 62L62 10" /></svg></div>
      <h2 className="h stt">Couldn't load tracking</h2>
      <p className="mut">Check your connection and try again. Your order is not affected.</p>
      <ul className="chk"><li>Check Wi-Fi or mobile data</li><li>Turn off airplane mode</li><li>Try again in a minute</li></ul>
      <div className="acts"><button className="btn p" onClick={retry}>Try again</button><button className="btn" onClick={() => setSheet("support")}>Contact support</button></div>
    </div>
  );
  else {
    const d = describe(o, s);
    main = (
      <>
        <StatusHero o={o} s={s} />
        {d.notice && (<div className={`notice ${s}`}><div><h2 className="h">{d.notice.h}</h2><p>{d.notice.p}</p></div></div>)}
        <Timeline events={o.events} tone={TONE[s]} />
        <div className="card acc amber">
          <div className="prod"><div className="thumb sweater"><ProductThumb /></div><div><b>{PRODUCT.name}</b><span>{PRODUCT.meta}</span></div></div>
          <div className="two"><button className="btn o" onClick={() => setSheet("details")} style={{ gridColumn: "1 / -1" }}>Order details</button></div>
        </div>
      </>
    );
  }

  return (
    <div className="root">
      <style>{CSS}</style>
      <div className="app">
        <div className="demo">
          <div className="seg">{TABS.map((t) => { const ord = ORDERS.find((x) => x.label === t); const tone = ord ? TONE[getViewState(ord)] : "idle"; return (
            <button key={t} aria-pressed={tab === t} onClick={() => setTab(t)}><span className={`tdot ${tone}`} />{t}</button>
          ); })}</div></div>
        {tab !== "Empty" && <div className="top"><b>Order {o ? o.id : "#BD-48213"}</b>{o && <span className="updtop">Updated {o.updated}</span>}</div>}
        <div className="fade-wrap" key={tab}>{main}</div>
      </div>

      {o && s && (
        <div className="abar"><div className="abin">
          <button className={`btn ${bar[2] === "danger" ? "d" : "p"}`} onClick={() => setSheet(bar[1])}>{bar[0]}</button>
          {bar[1] !== "support" && <button className="btn sq" aria-label="Contact support" onClick={() => setSheet("support")}>?</button>}
        </div></div>
      )}

      {sheet === "details" && o && (<Sheet title="Order details" onClose={close}>
        <KV a="Order" b={o.id} /><KV a="Placed" b={o.placed} /><KV a="Total" b={PRODUCT.total} /><KV a="Payment" b={PRODUCT.pay} /><KV a="Ship to" b={PRODUCT.addr} /><KV a="Tracking no." b={o.trackingId || "Not assigned yet"} /></Sheet>)}
      {sheet === "support" && (<Sheet title="Contact support" onClose={close}>
        <p className="mut" style={{ marginBottom: 12 }}>Your order is attached, so you won't need to repeat details.</p>
        <button className="opt" onClick={close}><b>Chat now</b><small className="mut">Avg. wait 2 min</small></button>
        <button className="opt" onClick={close}><b>Call us</b><small className="mut">9 AM to 9 PM daily</small></button>
        <button className="opt" onClick={() => setSheet("report")}><b>Report a delivery issue</b></button></Sheet>)}
      {sheet === "report" && (<Sheet title={s === "missing" ? "Package not received" : "Report an issue"} onClose={close}><ReportFlow s={s} onDone={() => { setReportedId(o.id); setSheet("done"); }} onPhoto={() => setSheet("photo")} /></Sheet>)}
      {sheet === "done" && (<Sheet title="Report received" onClose={close}><div className="center" style={{ padding: "8px 0" }}><p style={{ marginBottom: 16 }}>Case #C-77120 is open. We'll message you within 24 hours.</p><button className="btn p" onClick={close}>Done</button></div></Sheet>)}
      {sheet === "photo" && (<Sheet title="Delivery photo" onClose={close}><div className="photo">Photo of front door, Sep 22, 2:00 PM</div><p className="mut" style={{ marginTop: 10 }}>If this isn't your door, report it.</p><button className="btn d" style={{ marginTop: 12 }} onClick={() => setSheet("report")}>This isn't my door</button></Sheet>)}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
.root{--bg:#FBF6EC;--card:#fff;--ink:#1B2420;--mut:#6B7570;--line:#EDE4D2;--brand:#0E8F79;--brand2:#F2A93B;--ok:#0F9D6E;--okbg:#E1F7EC;--warn:#E08A00;--warnbg:#FFF1D6;--bad:#E0303F;--badbg:#FDE6E7;--idle:#E4DECE;--wm:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cg fill='none' stroke='%230E8F79' stroke-width='1.5'%3E%3Cpath d='M14 92c12-22 22-40 44-48' stroke-opacity='.14'/%3E%3Ccircle cx='14' cy='92' r='2.5' stroke-opacity='.18'/%3E%3Ccircle cx='58' cy='44' r='2.5' stroke-opacity='.18'/%3E%3C/g%3E%3C/svg%3E");background:var(--bg);color:var(--ink);font:400 15px/1.45 "Inter",system-ui,sans-serif;min-height:100vh}
.root *{box-sizing:border-box;margin:0}
.root h1,.root h2,.root .h{font-family:"Baloo 2","Inter",system-ui,sans-serif}
.root button{font:inherit;color:inherit;cursor:pointer}
.root button:focus-visible{outline:2px solid var(--brand);outline-offset:2px}
.app{max-width:430px;margin:0 auto;padding:0 16px 110px}
.demo{position:sticky;top:0;z-index:5;background:var(--bg);padding:10px 16px 8px;margin:0 -16px;border-bottom:1px solid var(--line)}
.demo small{display:block;color:var(--mut);font-size:12px;margin-bottom:6px}
.seg{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.seg button{flex:none;border:1px solid var(--line);background:var(--card);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:600}
.seg button[aria-pressed=true]{background:linear-gradient(135deg,var(--brand),#0B6F5E);color:#fff;border-color:transparent}
.tdot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;background:var(--mut)}
.tdot.ok{background:var(--ok)}.tdot.warn{background:var(--warn)}.tdot.bad{background:var(--bad)}.tdot.idle{background:var(--idle)}
.seg button[aria-pressed=true] .tdot{background:#fff}
.top{padding:16px 0 8px;font-size:13px;color:var(--mut);display:flex;align-items:center;justify-content:space-between}
.top b{color:var(--ink);font-size:15px}
.updtop{font-size:11px;color:var(--mut);display:inline-flex;align-items:center;gap:5px}
.updtop::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--brand);animation:dotpulse 1.6s ease-in-out infinite}
.mut{color:var(--mut)}.sm{font-size:13px;margin-top:10px}
.card{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px;margin-top:12px;box-shadow:0 1px 2px rgba(27,36,32,.04)}
.fade-wrap{display:block}
.fade-wrap>*{animation:fadeUp .5s cubic-bezier(.2,.7,.2,1) both}
.fade-wrap>*:nth-child(1){animation-delay:0s}
.fade-wrap>*:nth-child(2){animation-delay:.06s}
.fade-wrap>*:nth-child(3){animation-delay:.12s}
.fade-wrap>*:nth-child(4){animation-delay:.18s}
.fade-wrap>*:nth-child(5){animation-delay:.24s}
@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
@media (prefers-reduced-motion:reduce){.fade-wrap>*{animation:none}}
.hero{border-radius:24px;padding:22px 18px 18px;margin-top:0;position:relative;border:1px solid transparent}
.hero.ok{background:linear-gradient(160deg,var(--okbg) 0%,#CDEEDD 130%);border-color:#BFE9D9}
.hero.warn{background:linear-gradient(160deg,var(--warnbg) 0%,#FDE2AE 130%);border-color:#F7D68F}
.hero.bad{background:linear-gradient(160deg,var(--badbg) 0%,#FAD1D3 130%);border-color:#F5B9BC}
.hero.idle{background:linear-gradient(160deg,#F1EFE6 0%,#E7E1D0 130%);border-color:var(--line)}
.ok{--c:var(--ok)}.warn{--c:var(--warn)}.bad{--c:var(--bad)}.idle{--c:var(--mut)}.transit,.delivered{--c:var(--ok)}.delayed{--c:var(--warn)}.missing{--c:var(--bad)}
.hrow{display:flex;justify-content:space-between;gap:12px;align-items:flex-start}
.ill{color:var(--c);flex:none;margin:-4px -4px 0 0;filter:drop-shadow(0 2px 3px rgba(0,0,0,.08));animation:breathe 3.2s ease-in-out infinite}
@keyframes breathe{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-3px) scale(1.03)}}
.pill{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;border-radius:999px;padding:4px 12px;background:var(--card);color:var(--c);box-shadow:0 1px 2px rgba(0,0,0,.06)}
.pill::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--c);animation:dotpulse 1.6s ease-in-out infinite}
@keyframes dotpulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(1.4)}}
@media (prefers-reduced-motion:reduce){.ill,.pill::before{animation:none}}
.hero h1{font-size:26px;line-height:1.15;margin:12px 0 6px;letter-spacing:-.01em;font-weight:700}
.hero p{color:var(--ink);opacity:.72}.hero .est{color:var(--ink);font-weight:700;margin-top:6px}
.route{position:relative;margin:26px 34px 0}
.rtrackrow{position:relative;height:28px}
.rtrack{position:absolute;top:11px;left:0;right:0;height:5px;border-radius:3px;background:rgba(255,255,255,.65)}
.rtrack.dash{background:repeating-linear-gradient(90deg,var(--idle) 0 8px,transparent 8px 14px)}
.rfill{height:100%;border-radius:3px;background:linear-gradient(90deg,var(--c),color-mix(in srgb,var(--c) 60%,#fff));transition:width 1.1s cubic-bezier(.3,.7,.2,1)}
.rdot{position:absolute;top:5px;transform:translateX(-50%);width:16px;height:16px;border-radius:50%;background:var(--card);border:3px solid var(--idle);z-index:1}
.rdot.on{border-color:var(--c);box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 20%,transparent)}
.rmark{position:absolute;top:2px;transform:translateX(-50%);width:22px;height:22px;border-radius:50%;background:var(--c);color:#fff;display:grid;place-items:center;font-weight:700;font-size:11px;transition:left 1.1s cubic-bezier(.3,.7,.2,1);z-index:3;border:2.5px solid var(--card);box-shadow:0 2px 5px rgba(0,0,0,.18)}
.rmark.pulse{animation:pl 1.8s ease-out infinite}
@keyframes pl{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--c) 45%,transparent)}100%{box-shadow:0 0 0 12px transparent}}
@media (prefers-reduced-motion:reduce){.rmark.pulse,.sk{animation:none}.rfill,.rmark{transition:none}}
.rlabels{position:relative;height:16px;margin-top:8px}
.rlabels span{position:absolute;top:0;transform:translateX(-50%);font-size:12px;color:var(--ink);opacity:.6;white-space:nowrap;text-align:center}
.rlabels span.on{opacity:1;font-weight:700}
.steps{display:flex;justify-content:space-between;font-size:12px;color:var(--ink);opacity:.6;margin-top:6px;padding-top:10px;border-top:1px solid color-mix(in srgb,var(--c) 25%,transparent)}
.upd{font-size:12px;color:var(--mut);text-align:center;margin-top:8px}
.notice{margin-top:12px;padding:14px 16px;border-radius:14px;border:1px solid var(--line);border-left:5px solid var(--c);background:var(--card)}
.notice.transit,.notice.delivered{background:linear-gradient(120deg,var(--okbg),#fff)}
.notice.delayed{background:linear-gradient(120deg,var(--warnbg),#fff)}
.notice.missing{background:linear-gradient(120deg,var(--badbg),#fff)}
.notice.pending{background:linear-gradient(120deg,#F1EFE6,#fff)}
.notice h2{font-size:16px;margin-bottom:2px}.notice p{color:var(--mut);font-size:14px}
.btn{width:100%;min-height:48px;border-radius:14px;border:1px solid var(--line);background:var(--card);font-weight:700}
.btn.p{background:linear-gradient(135deg,var(--brand),#0B6F5E);color:#fff;border-color:transparent;box-shadow:0 4px 10px rgba(14,143,121,.25)}
.btn.d{background:linear-gradient(135deg,var(--bad),#B8232F);color:#fff;border-color:transparent;box-shadow:0 4px 10px rgba(224,48,63,.25)}
.two{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.acts{display:grid;gap:8px;margin-top:14px}
h2.s{font-size:16px;margin-bottom:12px}
.tl{list-style:none;padding:0}
.tl li{position:relative;padding:0 0 18px 32px}.tl li:last-child{padding-bottom:0}
.tl li::before{content:"";position:absolute;left:9px;top:20px;bottom:-2px;width:2px;background:var(--idle)}
.tl li.done::before{background:linear-gradient(var(--ok),var(--c))}
.tl li:last-child::before{display:none}
.tl .dot{position:absolute;left:0;top:2px;width:20px;height:20px;border-radius:50%;background:var(--card);border:2px solid var(--idle);display:grid;place-items:center;font-size:9px;color:#fff}
.tl .done .dot{background:var(--ok);border-color:var(--ok)}
.tl .cur .dot{background:var(--c);border-color:var(--c);box-shadow:0 0 0 5px color-mix(in srgb,var(--c) 22%,transparent)}
.tl .todo .dot{background:var(--card);border:2px dashed var(--idle)}
.tl li.cur{background:color-mix(in srgb,var(--c) 8%,transparent);margin:0 -12px 4px;padding:8px 12px 18px 44px;border-radius:12px}
.tl li.cur .dot{left:12px}
.tl li.cur::before{left:21px}
.tlrow{display:flex;align-items:center;gap:8px}
.tlnow{display:inline-block;font-size:10px;font-weight:700;color:var(--c);background:var(--card);border:1px solid var(--c);border-radius:999px;padding:1px 7px;margin-left:8px;vertical-align:middle}
.tl b{display:block;font-weight:600}.tl .t{display:block;color:var(--mut);font-size:13px}.tl .ink{color:var(--ink)}
.tl li.todo{opacity:.6}
.tl li.todo b{color:var(--mut);font-weight:500}
.prod{display:flex;gap:12px;align-items:center}
.thumb{width:56px;height:56px;border-radius:14px;background:linear-gradient(150deg,var(--brand2),#E0821F);color:#fff;display:grid;place-items:center;flex:none;box-shadow:0 3px 8px rgba(242,169,59,.35)}
.thumb.sweater{background:linear-gradient(150deg,#7A8F5E,#4F6142)}
.thumb svg{width:32px;height:32px}
.prod b{display:block}.prod span{color:var(--mut);font-size:13px}
.link{background:none;border:0;color:var(--brand);font-weight:700;padding:10px 0 0;min-height:44px;display:block}
.sk{background:var(--line);border-radius:8px;animation:p 1.4s ease-in-out infinite}
@keyframes p{50%{opacity:.4}}
.center{text-align:center;padding:32px 12px}
.abar{position:fixed;left:0;right:0;bottom:0;z-index:10;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(8px);border-top:1px solid var(--line);padding:10px 16px calc(10px + env(safe-area-inset-bottom,0px))}
.abin{max-width:430px;margin:0 auto;display:flex;gap:8px}
.btn.sq{width:52px;flex:none}
.ov{position:fixed;inset:0;background:rgba(20,20,18,.5);display:flex;align-items:flex-end;justify-content:center;z-index:20}
.sheet{background:var(--card);color:var(--ink);width:100%;max-width:430px;border-radius:22px 22px 0 0;padding:8px 16px calc(24px + env(safe-area-inset-bottom,0px));max-height:88vh;overflow:auto;animation:up .22s ease-out}
@keyframes up{from{transform:translateY(40px);opacity:.6}}
.grab{width:40px;height:4px;border-radius:2px;background:var(--line);margin:0 auto 14px}
.shead{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;gap:12px}
.shead h2{font-size:20px}
.xbtn{width:32px;height:32px;flex:none;border-radius:50%;border:1px solid var(--line);background:var(--card);display:grid;place-items:center;font-size:14px;color:var(--mut);line-height:1}
.xbtn:hover{background:var(--badbg);color:var(--bad);border-color:transparent}
.opt{display:flex;gap:12px;align-items:center;justify-content:space-between;width:100%;text-align:left;padding:12px;border:1px solid var(--line);border-radius:14px;background:none;margin-bottom:8px;min-height:48px}
.opt[aria-pressed=true]{border-color:var(--brand);background:var(--okbg)}
.cb{width:22px;height:22px;border-radius:6px;border:2px solid var(--idle);display:grid;place-items:center;font-size:13px;color:var(--brand);flex:none;margin-right:-4px}
.opt[aria-pressed=true] .cb{border-color:var(--brand)}
.kv{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--line);gap:16px}
.kv span:first-child{color:var(--mut)}.kv span:last-child{text-align:right;font-weight:600}
.photo{height:170px;border-radius:14px;background:linear-gradient(150deg,var(--okbg),#CDEEDD);color:var(--mut);display:grid;place-items:center;text-align:center;padding:12px;font-size:14px}
.root{isolation:isolate}
.root::before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;background:radial-gradient(420px 320px at 105% 6%,rgba(242,169,59,.30),transparent 70%),radial-gradient(460px 360px at -12% 32%,rgba(14,143,121,.20),transparent 70%),radial-gradient(420px 320px at 105% 92%,rgba(224,48,63,.11),transparent 70%)}
.hero{overflow:hidden;box-shadow:0 12px 26px -14px color-mix(in srgb,var(--c) 60%,transparent)}
.hero::after{content:"";position:absolute;right:-46px;top:-56px;width:180px;height:180px;border-radius:50%;background:color-mix(in srgb,var(--c) 14%,transparent);pointer-events:none}
.hero::before{content:"";position:absolute;left:-30px;bottom:-60px;width:130px;height:130px;border-radius:50%;background:color-mix(in srgb,var(--brand2) 16%,transparent);pointer-events:none}
.hero>*{position:relative;z-index:1}
.ill{background:rgba(255,255,255,.8);border-radius:50%;padding:8px;margin:-6px -6px 0 0;box-shadow:0 4px 12px -4px color-mix(in srgb,var(--c) 45%,transparent)}
.ill svg{width:60px;height:60px;display:block}
.trk{display:inline-flex;align-items:center;gap:8px;margin-top:12px;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.72);border:1px dashed color-mix(in srgb,var(--c) 50%,transparent);font-size:12.5px}
.trk b{color:var(--c)}
.trk i{font-style:normal;letter-spacing:.04em;font-variant-numeric:tabular-nums}
.steps{opacity:1;border-top:0;padding-top:0;gap:4px;margin-top:14px}
.card.acc{position:relative;overflow:hidden;padding-top:22px}
.card.acc::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--brand),var(--ok),var(--brand2))}
.card.acc.amber::before{background:linear-gradient(90deg,var(--brand2),#E0821F,var(--bad))}
h2.s{display:flex;align-items:center;gap:9px}
h2.s::before{content:"";width:10px;height:10px;border-radius:3px;background:var(--brand2);transform:rotate(45deg);flex:none}
.tl li.cur{background:color-mix(in srgb,var(--c) 13%,#fff)}
.tl .done .dot{background:linear-gradient(135deg,var(--ok),var(--brand))}
.notice{border-left-width:6px;box-shadow:0 8px 18px -12px color-mix(in srgb,var(--c) 60%,transparent)}
.btn:active{transform:scale(.98)}
.seg button{box-shadow:0 1px 2px rgba(27,36,32,.05)}
.pill{display:inline-flex;align-items:center;justify-content:center;line-height:1;min-height:28px;padding:0 12px}
.tlnow{display:inline-flex;align-items:center;justify-content:center;line-height:1;min-height:20px;padding:0 8px;vertical-align:middle}
.seg button{display:inline-flex;align-items:center;justify-content:center;line-height:1;min-height:34px;padding:0 13px}
.tdot{flex:none}
.btn{display:flex;align-items:center;justify-content:center;line-height:1.2;padding:0 16px}
.btn.sq{padding:0}
.rmark,.tl .dot{line-height:1}
.sk{background:linear-gradient(90deg,var(--line) 0%,#F8F1E2 50%,var(--line) 100%);background-size:200% 100%;animation:shim 1.3s linear infinite}
@keyframes shim{to{background-position:-200% 0}}
.lroute{margin:26px 10px 0}
.ltrk{position:relative;height:6px;border-radius:3px;background:rgba(255,255,255,.75);overflow:hidden}
.ltruck{position:absolute;top:0;bottom:0;width:38%;border-radius:3px;background:linear-gradient(90deg,transparent,var(--brand),transparent);animation:slide 1.3s ease-in-out infinite}
@keyframes slide{from{left:-40%}to{left:100%}}
.lsteps{display:grid;grid-template-columns:repeat(4,1fr);gap:4px;margin-top:22px}
.lrow{display:flex;gap:12px;align-items:flex-start;margin-bottom:18px}
.lrow:last-child{margin-bottom:0}
.ldot{width:20px;height:20px;border-radius:50%;flex:none;margin-top:2px}
.lmsg{text-align:center;color:var(--mut);font-size:13px;margin-top:14px}
.st{position:relative;overflow:hidden;padding:40px 20px 22px}
.st::before{content:"";position:absolute;left:0;right:0;top:0;height:5px;background:linear-gradient(90deg,var(--brand),var(--ok),var(--brand2))}
.st.err::before{background:linear-gradient(90deg,var(--bad),#E0821F,var(--brand2))}
.stbadge{width:112px;height:112px;margin:0 auto 34px;border-radius:50%;display:grid;place-items:center;color:var(--brand);background:#fff;box-shadow:0 0 0 10px color-mix(in srgb,var(--brand) 12%,transparent),0 0 0 22px color-mix(in srgb,var(--brand2) 12%,transparent)}
.stbadge.bad{color:var(--bad);box-shadow:0 0 0 10px color-mix(in srgb,var(--bad) 12%,transparent),0 0 0 22px color-mix(in srgb,var(--brand2) 12%,transparent)}
.stt{font-size:22px;margin:0 0 6px}
.chips{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-top:16px}
.chips span{display:inline-flex;align-items:center;justify-content:center;min-height:28px;padding:0 12px;border-radius:999px;font-size:12.5px;font-weight:600;line-height:1;background:var(--okbg);color:var(--ok)}
.chips span:nth-child(2){background:var(--warnbg);color:#9A5F00}
.chips span:nth-child(3){background:var(--badbg);color:var(--bad)}
.chk{list-style:none;padding:12px 14px;margin:16px 0 0;text-align:left;display:grid;gap:8px;background:var(--badbg);border-radius:14px;font-size:13.5px}
.chk li{display:flex;align-items:center;gap:10px}
.chk li::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--bad);flex:none}
.st .acts{margin-top:20px}
@media (prefers-reduced-motion:reduce){.sk,.ltruck{animation:none}}
.steps{display:grid;grid-template-columns:repeat(4,1fr);gap:0;margin-top:20px;opacity:1}
.hero.idle .steps{--c:var(--brand)}
.stp{position:relative;display:flex;flex-direction:column;align-items:center;gap:8px;text-align:center}
.stp:not(:first-child)::before{content:"";position:absolute;top:13px;right:50%;width:100%;height:3px;border-radius:2px;background:rgba(255,255,255,.85)}
.stp.past::before,.stp.on::before{background:var(--c)}
.sd{position:relative;z-index:1;width:28px;height:28px;border-radius:50%;display:grid;place-items:center;font-size:12px;font-weight:700;line-height:1;background:#fff;color:var(--mut);border:2px solid #fff;transition:transform .25s}
.stp.past .sd{background:var(--c);border-color:var(--c);color:#fff}
.stp.on .sd{background:var(--c);border-color:#fff;color:#fff;box-shadow:0 0 0 4px color-mix(in srgb,var(--c) 28%,transparent)}
.sl{display:flex;align-items:flex-start;justify-content:center;min-height:30px;padding:0 2px;font-size:12.5px;line-height:1.2;font-weight:500;color:var(--ink);opacity:.62}
.stp.past .sl{opacity:.85}
.stp.on .sl{opacity:1;font-weight:700}

.btn,.seg button,.opt,.xbtn,.link,.kv,.chips span,.tl li b,.thumb{transition:transform .22s cubic-bezier(.2,.7,.2,1),box-shadow .22s,background-color .22s,border-color .22s,color .22s,padding .22s}
.btn{position:relative;overflow:hidden}
.btn::after{content:"";position:absolute;top:0;bottom:0;left:-70%;width:40%;background:linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent);transform:skewX(-20deg);transition:left .6s ease;pointer-events:none}
.btn:disabled{cursor:not-allowed}
@media (hover:hover){
.btn:not(:disabled):hover{transform:translateY(-2px)}
.btn:not(:disabled):hover::after{left:135%}
.btn:not(.p):not(.d):not(.o):not(:disabled):hover{border-color:var(--brand);background:var(--okbg);color:#0B6F5E;box-shadow:0 8px 16px -10px rgba(14,143,121,.5)}
.btn.p:not(:disabled):hover{box-shadow:0 10px 20px -6px rgba(14,143,121,.45)}
.btn.d:not(:disabled):hover{box-shadow:0 10px 20px -6px rgba(224,48,63,.45)}
.seg button:not([aria-pressed=true]):hover{transform:translateY(-2px);border-color:var(--brand);color:#0B6F5E;box-shadow:0 6px 12px -8px rgba(14,143,121,.5)}
.opt:hover{transform:translateX(4px);border-color:var(--brand);background:var(--okbg)}
.link:hover{transform:translateX(4px);text-decoration:underline;text-underline-offset:4px}
.xbtn:hover{transform:rotate(90deg)}
.kv:hover{background:var(--okbg);padding-left:8px;padding-right:8px;border-radius:8px;border-color:transparent}
.chips span:hover{transform:translateY(-2px)}
.card:not(.hero){transition:box-shadow .25s,border-color .25s}
.card:not(.hero):hover{box-shadow:0 14px 26px -16px rgba(27,36,32,.3);border-color:color-mix(in srgb,var(--brand) 35%,var(--line))}
.card:hover .thumb{transform:rotate(-7deg) scale(1.08)}
.tl li:not(.cur):not(.todo):hover b{color:var(--brand)}
.stp:hover .sd{transform:scale(1.14)}
}
.btn:not(:disabled):active{transform:translateY(0) scale(.98)}
@media (prefers-reduced-motion:reduce){
.btn,.seg button,.opt,.xbtn,.link,.kv,.chips span,.tl li b,.thumb,.sd{transition:none}
.btn::after{display:none}
.btn:hover,.seg button:hover,.opt:hover,.xbtn:hover,.link:hover,.chips span:hover,.card:hover .thumb,.stp:hover .sd{transform:none!important}
}
.hero::before{content:none}
.steps{margin-top:24px}
.hero h1{font-size:24px;text-wrap:balance}
.ill{padding:8px;margin:-4px -4px 0 0}
.ill svg{width:44px;height:44px}
.stp.past .sd{background:var(--ok);border-color:var(--ok)}
.stp.past::before,.stp.on::before{background:var(--ok)}
.hero.skl::after{content:none}
.lroute{margin:34px 12px 0}
.ltrk{overflow:visible;height:5px;background:repeating-linear-gradient(90deg,#fff 0 8px,transparent 8px 14px);border-radius:0}
.lend{position:absolute;top:-6px;left:0;width:16px;height:16px;border-radius:50%;background:#fff;border:3px solid var(--idle);transform:translateX(-50%)}
.lend.b{left:100%;border-color:var(--brand)}
.lparcel{position:absolute;top:-17px;left:0;width:38px;height:38px;border-radius:12px;background:#fff;display:grid;place-items:center;box-shadow:0 6px 14px -4px rgba(224,138,0,.5);animation:drive 2.6s cubic-bezier(.45,.05,.55,.95) infinite;z-index:2}
.lparcel svg{animation:bob .55s ease-in-out infinite alternate}
@keyframes drive{0%{left:0;opacity:0}12%{opacity:1}88%{opacity:1}100%{left:calc(100% - 38px);opacity:0}}
@keyframes bob{to{transform:translateY(-3px) rotate(-4deg)}}
@media (prefers-reduced-motion:reduce){.lparcel,.lparcel svg{animation:none}.lparcel{left:calc(50% - 19px)}}
.more{width:100%;margin-top:14px;min-height:44px;border-radius:12px;border:1px solid var(--line);background:#fff;display:flex;align-items:center;justify-content:center;gap:9px;font-weight:700;font-size:14px;line-height:1;color:var(--brand);transition:background-color .22s,border-color .22s,transform .22s}
.chev{width:7px;height:7px;border-right:2px solid currentColor;border-bottom:2px solid currentColor;transform:rotate(45deg) translate(-2px,-2px);transition:transform .25s}
.more[aria-expanded=true] .chev{transform:rotate(-135deg) translate(-1px,-1px)}
.tl li.in{animation:fadeUp .35s cubic-bezier(.2,.7,.2,1) both}
@media (hover:hover){.more:hover{border-color:var(--brand);background:var(--okbg);transform:translateY(-2px)}}
.more:active{transform:scale(.98)}
@media (prefers-reduced-motion:reduce){.tl li.in{animation:none}.more,.chev{transition:none}.more:hover{transform:none}}
.root .more{color:var(--brand)}
.root .btn.o{background:linear-gradient(135deg,#F7BC55,#F2A93B 50%,#E8901A);color:var(--ink);border-color:transparent;box-shadow:0 4px 10px rgba(242,169,59,.35)}
@media (hover:hover){.btn.o:not(:disabled):hover{box-shadow:0 10px 20px -6px rgba(232,144,26,.55)}}
`;
