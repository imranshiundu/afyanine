import { redirect } from "next/navigation";
// Never offer a Supabase reset flow for database-backed password accounts.
export default function ResetPassword() { redirect("/"); }
