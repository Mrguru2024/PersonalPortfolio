import { redirect } from "next/navigation";

/** Legacy URL; resume request flow retired — send visitors to contact instead. */
export default function ResumePageRoute() {
  redirect("/contact");
}
