import Link from "next/link";

export default function SignedOut() {
  return <div className="page"><div className="app-shell"><main className="screen logout-screen standalone-screen"><section className="profile-card"><p className="eyebrow">AFYANINE</p><h1>You’re signed out.</h1><p>Your session has ended on this device. You can sign in again whenever you’re ready.</p><Link className="primary-button" href="/">Back to sign in</Link></section></main></div></div>;
}
