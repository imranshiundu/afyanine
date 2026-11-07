"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Icon, type IconName } from "../Icon";
import { InstallReminder } from "../InstallReminder";
import { Logo } from "../Logo";
import { ThemeToggle } from "../chrome";
import { completeInstalledOnboarding } from "../installed-onboarding";
import type { Lang } from "../data";

const COPY = {
  EN: {
    welcome: "WELCOME TO AFYANINE",
    skip: "Skip",
    next: "Next",
    back: "Back",
    start: "Get started",
    steps: "Welcome steps",
    demo: "Fictional-data prototype. Not a medical service.",
    pages: [
      { eyebrow: "01 · YOUR JOURNEY", title: "Nine months.\nOne place for you.", body: "Get to know your pregnancy, keep track of visits and explore your care team — all in AfyaNine.", detail: "Your journey, at a glance", tags: ["Pregnancy", "Visits", "Community"] },
      { eyebrow: "02 · EVERYDAY REASSURANCE", title: "Know your\nnumbers.", body: "Explore blood-pressure and heart-rate trends, with clear charts that help you see changes over time.", detail: "Make sense of your vitals", tags: ["Blood pressure", "Heart rate", "Trends"] },
      { eyebrow: "03 · CONNECTED CARE", title: "Support is\npart of the journey.", body: "Explore the community health worker experience, find care options and learn how the demo’s SOS flow works.", detail: "Get familiar with your care options", tags: ["Find care", "Your CHW", "SOS demo"] },
    ],
  },
  SW: {
    welcome: "KARIBU AFYANINE",
    skip: "Ruka",
    next: "Endelea",
    back: "Rudi",
    start: "Anza",
    steps: "Hatua za utangulizi",
    demo: "Mfano wenye taarifa za kubuni. Si huduma ya matibabu.",
    pages: [
      { eyebrow: "01 · SAFARI YAKO", title: "Miezi tisa.\nSehemu yako moja.", body: "Fahamu ujauzito wako, fuatilia miadi na gundua timu yako ya huduma — yote ndani ya AfyaNine.", detail: "Safari yako kwa muhtasari", tags: ["Ujauzito", "Miadi", "Jamii"] },
      { eyebrow: "02 · UFAHAMU WA KILA SIKU", title: "Fahamu\nvipimo vyako.", body: "Gundua mwenendo wa shinikizo la damu na mapigo ya moyo kwa chati zinazoonyesha mabadiliko ya muda.", detail: "Elewa vipimo vya afya yako", tags: ["Shinikizo la damu", "Mapigo ya moyo", "Mwenendo"] },
      { eyebrow: "03 · HUDUMA PAMOJA", title: "Msaada katika\nsafari yako.", body: "Gundua mfano wa mhudumu wa afya ya jamii, tafuta chaguo za huduma na ujifunze jinsi mfano wa SOS unavyofanya kazi.", detail: "Fahamu chaguo zako za huduma", tags: ["Tafuta huduma", "CHW wako", "Mfano wa SOS"] },
    ],
  },
} as const;

const ICONS: IconName[] = ["calendar", "activity", "people"];

export function Onboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [language, setLanguage] = useState<Lang>("EN");
  const screenRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const t = COPY[language];
  const page = t.pages[step];
  useEffect(() => {
    screenRef.current?.scrollTo({ top: 0, behavior: "auto" });
    headingRef.current?.focus({ preventScroll: true });
  }, [step]);
  const finish = () => {
    completeInstalledOnboarding();
    router.replace("/");
  };

  return (
    <div className="page">
      <div className="app-shell">
        <main ref={screenRef} className="screen onboarding-screen">
          <header className="onboarding-header">
            <Logo />
            <button type="button" className="onboarding-skip" onClick={finish}>{t.skip}<Icon name="arrow" size={18} /></button>
          </header>
          <div className="onboarding-tools">
            <span>{t.welcome}</span>
            <div role="group" aria-label="Language">
              {(["EN", "SW"] as const).map((lang) => (
                <button key={lang} type="button" aria-pressed={language === lang} onClick={() => setLanguage(lang)}>{lang}</button>
              ))}
            </div>
            <ThemeToggle />
          </div>

          <section key={step} className="onboarding-step" aria-labelledby="onboarding-title" aria-live="polite">
            <div className="onboarding-art" aria-hidden="true">
              <span className="onboarding-ring" />
              <span className="onboarding-ring outer" />
              <span className="onboarding-symbol"><Icon name={ICONS[step]} size={64} strokeWidth={2.2} /></span>
              <span className="onboarding-orbit one"><Icon name={ICONS[(step + 1) % 3]} size={29} /></span>
              <span className="onboarding-orbit two"><Icon name={ICONS[(step + 2) % 3]} size={29} /></span>
              <span className="onboarding-spark"><Icon name="sparkles" size={28} /></span>
            </div>
            <p className="onboarding-eyebrow">{page.eyebrow}</p>
            <h1 ref={headingRef} id="onboarding-title" tabIndex={-1}>{page.title}</h1>
            <p className="onboarding-body">{page.body}</p>
            <div className="onboarding-detail">
              <span><Icon name="check" size={19} />{page.detail}</span>
              <div>{page.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            </div>
          </section>

          <footer className="onboarding-footer">
            <nav aria-label={t.steps} className="onboarding-progress">
              {ICONS.map((_, index) => (
                <button
                  key={index}
                  type="button"
                  aria-label={`${t.steps} ${index + 1}`}
                  aria-current={step === index ? "step" : undefined}
                  onClick={() => setStep(index)}
                ><span /></button>
              ))}
              <span>{String(step + 1).padStart(2, "0")} / 03</span>
            </nav>
            <button type="button" className="primary-button" onClick={step === 2 ? finish : () => setStep((value) => value + 1)}>
              {step === 2 ? t.start : t.next}<Icon name="arrow" />
            </button>
            {step > 0 && <button type="button" className="onboarding-back" onClick={() => setStep((value) => value - 1)}><Icon name="back" size={18} />{t.back}</button>}
            <p className="onboarding-demo">{t.demo}</p>
          </footer>
        </main>
        <InstallReminder raised={false} suppressed />
      </div>
    </div>
  );
}
