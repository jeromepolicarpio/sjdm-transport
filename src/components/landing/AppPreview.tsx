"use client";

import { useState } from "react";
import { ArrowRight, BusFront, Check, Coins, MapPin, Navigation } from "lucide-react";
import Link from "next/link";
import { fareSchedule } from "@/data/fare-schedule";
import styles from "./LandingPage.module.css";

// Schematic illustration, not navigation geometry. Keep the map runtime and
// full route dataset out of the landing-page preview.
const sampleSchedule = fareSchedule.find((entry) => entry.bracket === "71-90")!;

export function AppPreview() {
  const [mode, setMode] = useState<"fare" | "routes">("fare");
  const isFare = mode === "fare";
  return (
    <div className={styles.preview}>
      <div className={styles.previewTop}><span><span className={styles.statusDot} /> A good day to get going.</span><Navigation size={18} aria-hidden /></div>
      <div className={styles.previewModes} role="group" aria-label="Choose a map preview">
        <button type="button" aria-pressed={isFare} aria-controls="map-preview-content" onClick={() => setMode("fare")}><Coins size={16} aria-hidden /> Tricycle fares</button>
        <button type="button" aria-pressed={!isFare} aria-controls="map-preview-content" onClick={() => setMode("routes")}><BusFront size={16} aria-hidden /> PUV routes</button>
      </div>
      <div className={styles.mapDrawing} aria-hidden="true">
        <svg viewBox="0 0 600 530" fill="none" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="landing-blocks" width="112" height="94" patternUnits="userSpaceOnUse" patternTransform="rotate(-18)"><rect width="112" height="94" fill="#e8edf1" /><rect x="9" y="9" width="41" height="30" rx="5" fill="#dce3e9" /><rect x="58" y="9" width="44" height="30" rx="5" fill="#dce3e9" /><rect x="9" y="47" width="93" height="36" rx="5" fill="#dce3e9" /><path d="M0 0H112M0 0V94" stroke="#f9fbfd" strokeWidth="9" /></pattern></defs>
          <rect width="600" height="530" fill="url(#landing-blocks)" />
          <path d="M465-30C350 75 530 160 450 245S465 430 610 460" stroke="#c6dfe7" strokeWidth="38" />
          <path d="M-40 370L115 300L194 184L338 151L392-20M202 550L250 360L370 275L620 212" stroke="#cbd5df" strokeWidth="24" />
          <path d="M-40 370L115 300L194 184L338 151L392-20M202 550L250 360L370 275L620 212" stroke="#fff" strokeWidth="18" />
          <path d="M-40 115L180 237L390 335L620 380" stroke="#fff" strokeWidth="13" />
          <path d="M35 60L95 42L130 99L65 127Z" fill="#cedfce" /><path d="M335 365L392 340L440 383L398 428L344 408Z" fill="#cedfce" /><path d="M475 80L540 72L560 123L499 145Z" fill="#cedfce" />
          <path d="M115 300L194 184L338 151L370 82" stroke="white" strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M115 300L194 184L338 151L370 82" stroke={isFare ? "#2151e8" : "#247c64"} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="115" cy="300" r="13" fill="white" stroke={isFare ? "#2151e8" : "#247c64"} strokeWidth="6" />
          <circle cx="370" cy="82" r="17" fill="#2151e8" stroke="white" strokeWidth="5" /><circle cx="370" cy="82" r="5" fill="white" />
          {!isFare && <><circle cx="194" cy="184" r="7" fill="white" stroke="#247c64" strokeWidth="4" /><circle cx="338" cy="151" r="7" fill="white" stroke="#247c64" strokeWidth="4" /></>}
          <g fontFamily="Arial, sans-serif" fontSize="10" fill="#738191"><text x="50" y="199" transform="rotate(-56 50 199)">Neighborhood streets</text><text x="420" y="307" transform="rotate(12 420 307)">Around the city</text></g>
        </svg>
        <span className={styles.mapOrigin}>{isFare ? "Your starting point" : "Muzon Central Terminal"}</span>
        <span className={styles.mapDestination}><MapPin size={13} />{isFare ? "Your next stop" : "SM City SJDM"}</span>
      </div>
      <div id="map-preview-content" className={styles.previewTicket} aria-live="polite" aria-atomic="true">
        <div className={styles.ticketHeading}><span>{isFare ? "A little fare clarity." : "A local connection."}</span><span className={styles.sampleBadge}>Example</span></div>
        {isFare ? <><div className={styles.fareValue}><strong>₱{sampleSchedule.firstTwoKmFare.toFixed(2)}</strong><span>per passenger<br />Regular trip · 2 km</span></div><div className={styles.ticketFoot}><span><Check size={14} aria-hidden /> 2022 fare schedule</span><span>Gasoline ₱71–90/L</span></div></> : <><div className={styles.routeExample}><BusFront size={27} aria-hidden /><strong>Muzon to SM City SJDM<span>Jeepney & modern jeepney</span></strong></div><div className={styles.ticketFoot}><span>Contributed route</span><span>Awaiting verification</span></div></>}
      </div>
      <div className={styles.previewBottom}><span>Illustrative map · {isFare ? "sample estimate" : "sample route"}</span><Link href="/app" prefetch={false} aria-label="Explore the real map"><ArrowRight size={19} aria-hidden /></Link></div>
    </div>
  );
}
