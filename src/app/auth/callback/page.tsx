import { redirect } from "next/navigation";
// Supabase Auth is no longer an account entry point.
export default function Callback() { redirect("/"); }
