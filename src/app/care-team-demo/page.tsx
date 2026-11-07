import { CareWorkspace } from "@/components/afyanine/CareWorkspace";
export default async function CareTeamDemo({ searchParams }: { searchParams: Promise<{ actor?: string; tab?: string }> }) {
  const params = await searchParams;
  const actor = params.actor === "chw" || params.actor === "partner" || params.actor === "admin" ? params.actor : "mother";
  const tab = params.tab === "visits" || params.tab === "patients" || params.tab === "profile" ? params.tab : "home";
  return <CareWorkspace demo initialActor={actor} initialTab={tab} />;
}
