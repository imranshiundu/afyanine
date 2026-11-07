"use client";
import Link from "next/link";
import { useLanguage } from "@/components/afyanine/language";

export default function SignedOut() {
  const { t } = useLanguage();
  return <div className="page"><div className="app-shell"><main className="screen logout-screen standalone-screen"><section className="profile-card"><p className="eyebrow">AFYANINE</p><h1>{t("You’re signed out.")}</h1><p>{t("Your session has ended on this device. You can sign in again whenever you’re ready.")}</p><Link className="primary-button" href="/">{t("Back to sign in")}</Link></section></main></div></div>;
}
