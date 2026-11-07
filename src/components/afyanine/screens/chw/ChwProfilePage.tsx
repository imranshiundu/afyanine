import { ChwIcon, ChwNav, ChwPageHeader } from "./ChwShared";
import { mockChwProfile } from "./mock-data";
import type { ChwPageProps } from "./types";

interface ChwProfilePageProps extends ChwPageProps {
  onLogout: () => void;
}

export function ChwProfilePage({ navigate, notify, onLogout }: ChwProfilePageProps) {
  const details = [
    ["hospital", "Registered institution", mockChwProfile.institution],
    ["pin", "Area served", mockChwProfile.areasServed.join(" · ")],
    ["people", "Mothers assigned", `${mockChwProfile.mothersAssigned} active mothers`],
    ["calendar", "CHW since", mockChwProfile.activeSince],
  ];

  return (
    <main className="screen chw-screen chw-profile-screen">
      <ChwPageHeader eyebrow="COMMUNITY HEALTH WORKER" title="My profile" />
      <section className="chw-profile-hero">
        <span>{mockChwProfile.initials}</span>
        <div>
          <h2>{mockChwProfile.name}</h2>
          <p>{mockChwProfile.email}</p>
          <small>CHW ID · {mockChwProfile.registrationId}</small>
        </div>
        <button onClick={() => notify("Profile editing opened")}>
          <ChwIcon name="edit" size={17} />
        </button>
      </section>
      <section className="chw-impact-card">
        <small>YOUR IMPACT</small>
        <div>
          <span>
            <b>{mockChwProfile.mothersSeen}</b>
            <p>Mothers seen</p>
          </span>
          <i />
          <span>
            <b>{mockChwProfile.visitsLogged}</b>
            <p>Visits logged</p>
          </span>
          <i />
          <span>
            <b>{mockChwProfile.yearsActive}</b>
            <p>Years active</p>
          </span>
        </div>
      </section>
      <p className="profile-group-label">WORK &amp; REGISTRATION</p>
      <section className="chw-details-list">
        {details.map(([icon, label, value]) => (
          <button key={label} onClick={() => notify(`${label} details opened`)}>
            <span>
              <ChwIcon name={icon} size={20} />
            </span>
            <div>
              <small>{label}</small>
              <b>{value}</b>
            </div>
            <ChwIcon name="chevron" size={17} />
          </button>
        ))}
      </section>
      <section className="profile-contact">
        <span>
          <ChwIcon name="phone" size={19} />
        </span>
        <div>
          <small>PHONE NUMBER</small>
          <b>{mockChwProfile.phone}</b>
        </div>
        <i>Verified</i>
      </section>
      <button className="profile-signout" onClick={() => navigate("login")}>
        Sign out
      </button>
      <ChwNav active="profile" navigate={navigate} notify={notify} />
    </main>
  );
}
