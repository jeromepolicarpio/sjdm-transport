import Image from "next/image";
import Link from "next/link";
import { ArrowDown, ArrowRight, BusFront, Check, Heart, MapPin, Navigation, Route, ShieldCheck, Smartphone, WifiOff } from "lucide-react";
import { AppPreview } from "@/components/landing/AppPreview";
import { FEEDBACK_FORM_URL } from "@/lib/feedback-form";
import styles from "./LandingPage.module.css";

const STEPS = [
  { icon: MapPin, title: "Choose your stops.", description: "Search for a familiar place or tap the map to set your starting point and destination." },
  { icon: Route, title: "Make it your trip.", description: "Choose a regular or special tricycle trip, your passenger type, and the gasoline price bracket." },
  { icon: Navigation, title: "Head out informed.", description: "See your estimated fare and its breakdown. Or switch to routes to explore local PUV connections." },
];
const QUESTIONS = [
  { question: "Is SJDM Transport free?", answer: "Yes. The map, tricycle fare calculator, and route explorer are free to use, with no account or ads. This is an independent community project." },
  { question: "Where do the fare estimates come from?", answer: "The calculator uses the published 2022 CSJDM tricycle fare schedule. Estimates depend on distance, trip type, passenger type, and gasoline price bracket. Confirmation of a newer schedule is still pending, so the figures may be outdated. Special trips outside a TODA’s operating zone are subject to agreement with the driver." },
  { question: "Can I use it without an internet connection?", answer: "The Android app is coming soon and isn’t available to download yet. It will include the city map and fare calculator for offline use. Without a connection, distance estimates use a straight line rather than a road route and may underestimate the fare. Online place search and road routing need an internet connection." },
  { question: "Are bus and jeepney fares included?", answer: "The fare calculator is for tricycles within SJDM. The PUV explorer shows routes and stops, without bus or jeepney fares. Routes come from contributed Google Maps directions exports and are labeled as awaiting verification on the ground." },
];
function Brand() {
  return <><Image src="/sjdm-transport-logo.png" alt="" width={38} height={38} /><span>SJDM<span className={styles.brandLight}> Transport</span></span></>;
}
function OpenMap({ light = false }: { light?: boolean }) {
  return <Link href="/app" prefetch={false} className={`${styles.button} ${light ? styles.buttonLight : styles.buttonBlue}`}>Open the map <ArrowRight size={18} aria-hidden /></Link>;
}
export function LandingPage({ puvRouteCount }: { puvRouteCount: number }) {
  return (
    <div className={styles.page}>
      <a className={styles.skipLink} href="#main-content">Skip to content</a>
      <header className={styles.header}>
        <nav className={`${styles.container} ${styles.nav}`} aria-label="Main navigation">
          <a className={styles.brand} href="#" aria-label="SJDM Transport home"><Brand /></a>
          <div className={styles.navLinks}><a href="#how-it-works">How it works</a><a href="#community">Our community</a></div>
          <OpenMap />
        </nav>
      </header>
      <main id="main-content">
        <section className={`${styles.container} ${styles.hero}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.location}><span aria-hidden /><span>Made for San Jose del Monte</span></p>
            <h1 id="hero-title">Know your fare.<br />Find your way.</h1>
            <p className={styles.heroDescription}>A little local knowledge goes a long way. Check tricycle fares and explore PUV routes around SJDM, all in one free map.</p>
            <div className={styles.heroActions}><OpenMap /><a className={styles.textLink} href="#how-it-works">Take a quick look <ArrowDown size={17} aria-hidden /></a></div>
            <p className={styles.heroNote}><Check size={15} aria-hidden /> No account. No ads. Just your next trip.</p>
          </div>
          <AppPreview />
          <div className={styles.heroBottom}><span>Your everyday commute, a little clearer.</span><span>San Jose del Monte, Bulacan <MapPin size={14} aria-hidden /></span></div>
        </section>
        <div className={styles.benefits}>
          <div className={`${styles.container} ${styles.benefitGrid}`}>
            <div><Route aria-hidden /><span><strong>{puvRouteCount} local PUV routes</strong><span>More ways to find your way</span></span></div>
            <div><ShieldCheck aria-hidden /><span><strong>Published fare schedule</strong><span>See what your estimate is based on</span></span></div>
            <div><Heart aria-hidden /><span><strong>Built for San Joseños</strong><span>Free to use, for everyone</span></span></div>
          </div>
        </div>
        <section id="how-it-works" className={`${styles.container} ${styles.how}`}>
          <div className={styles.sectionHeading}><h2>A better start<br />to your next trip.</h2><p>From your first pin to your fare estimate.<br />A few taps, a little more peace of mind.</p></div>
          <ol className={styles.steps}>
            {STEPS.map(({ icon: Icon, title, description }, index) => <li key={title}><div className={styles.stepTop}><span className={styles.stepNumber}>0{index + 1}</span><Icon size={23} aria-hidden /></div><h3>{title}</h3><p>{description}</p></li>)}
          </ol>
        </section>
        <section id="community" className={`${styles.container} ${styles.community}`}>
          <div className={styles.communityVisual}>
            <div className={styles.communityVisualTop}><span><MapPin size={16} aria-hidden /> At home in SJDM</span><Heart size={21} aria-hidden /></div>
            <div className={styles.localDiagram} aria-hidden="true"><svg viewBox="0 0 480 220" fill="none"><path d="M-20 165H130Q165 165 165 130V90Q165 55 200 55H500" stroke="#aec1f8" strokeWidth="22" /><path d="M-20 165H130Q165 165 165 130V90Q165 55 200 55H500" stroke="white" strokeWidth="3" strokeDasharray="8 10" /><path d="M70 0V55Q70 90 105 90H280Q315 90 315 125V240" stroke="#6f91ed" strokeWidth="18" /><circle cx="165" cy="115" r="14" fill="#f8cf57" stroke="#2151e8" strokeWidth="5" /><circle cx="315" cy="165" r="10" fill="white" stroke="#2151e8" strokeWidth="5" /></svg><span className={styles.diagramHome}>Home</span><span className={styles.diagramDestination}><BusFront size={16} /> Your next stop</span></div>
            <h3>Small trips.<br />A more connected city.</h3><p>To school, to work, to wherever life takes you.</p>
          </div>
          <div className={styles.communityCopy}>
            <h2>Local knowledge.<br />Open to everyone.</h2>
            <p>Getting around your own city shouldn’t be a guessing game. This independent project puts useful fare and route information in the hands of the people who ride every day.</p>
            <div className={styles.featureRow}><WifiOff size={23} aria-hidden /><div><h3>A little less signal-dependent. (Coming soon)</h3><p>The upcoming Android app will keep the city map and fare calculator with you, even offline.</p></div></div>
            <div className={styles.featureRow}><BusFront size={23} aria-hidden /><div><h3>Local routes, with honest details.</h3><p>Explore contributed routes and their stops, with clear labels for what still needs verification.</p></div></div>
            <a className={styles.textLink} href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">Help improve the map <ArrowRight size={17} aria-hidden /></a>
          </div>
        </section>
        <section className={`${styles.container} ${styles.faq}`} aria-labelledby="faq-title">
          <div><span className={styles.faqIcon}><Smartphone size={25} aria-hidden /></span><h2 id="faq-title">Before you<br />head out.</h2><p>A few things worth knowing.</p></div>
          <div className={styles.questions}>{QUESTIONS.map(({ question, answer }) => <details key={question}><summary>{question}<span className={styles.plus} aria-hidden /></summary><p>{answer}</p></details>)}</div>
        </section>
        <section className={`${styles.container} ${styles.finalCta}`}><div><p>Tara, let’s go.</p><h2>Your next trip<br />starts here.</h2></div><div><OpenMap light /><p>Find your fare. Find your route.<br />Make yourself at home in SJDM.</p></div><Route className={styles.ctaRoute} size={300} strokeWidth={0.6} aria-hidden /></section>
      </main>
      <footer className={`${styles.container} ${styles.footer}`}>
        <div className={styles.footerTop}><a href="#" className={styles.brand} aria-label="SJDM Transport home"><Brand /></a><p>A community project. A more informed commute.</p><div><Link href="/privacy">Privacy</Link><a href={FEEDBACK_FORM_URL} target="_blank" rel="noopener noreferrer">Feedback</a></div></div>
        <div className={styles.footerBottom}><p>Made by <a href="https://jeromepolicarpio.github.io/" target="_blank" rel="noopener noreferrer">Jerome Policarpio</a>. Inspired by <a href="https://gensantransport.vercel.app/" target="_blank" rel="noopener noreferrer">GenSan Transport</a>.</p><span>San Jose del Monte, Philippines</span></div>
      </footer>
    </div>
  );
}
