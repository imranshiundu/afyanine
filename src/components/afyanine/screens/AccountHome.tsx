"use client";

import type { User } from "@supabase/supabase-js";
import { BottomNav, Header } from "../chrome";
import { Icon } from "../Icon";
import type { Screen } from "../data";

export function AccountHome({ user, navigate, vitals = false }: { user: User; navigate: (screen: Screen) => void; vitals?: boolean }) {
  const name = typeof user.user_metadata.display_name === "string" ? user.user_metadata.display_name : "there";
  return <main className="screen with-nav account-home">
    <Header title={vitals ? "My vitals" : "Your AfyaNine"} action={<button className="icon-button" aria-label="Open profile" onClick={() => navigate("profile")}><Icon name="user" /></button>} />
    <div className="profile-hero"><span className="profile-avatar"><Icon name={vitals ? "activity" : "heart"} size={38} /></span><h1>{vitals ? "No readings linked yet" : `Hello, ${name}`}</h1><p>{vitals ? "Your account has not been connected to a clinical record or wearable." : "Your account is ready. Find care and manage your profile here."}</p></div>
    <section className="profile-card"><h2>Your information stays yours</h2><p>We won’t show another mother’s pregnancy, appointments or vitals as yours. Clinical record linking and consent controls are still being built; do not enter real health information in this prototype.</p></section>
    <button className="primary-button" onClick={() => navigate("care")}><Icon name="pin" />Find care nearby</button>
    <button className="secondary-button" onClick={() => navigate("profile")}>Manage my profile</button>
    <BottomNav active={vitals ? "vitals" : "home"} navigate={navigate} onProfile={() => navigate("profile")} />
  </main>;
}
