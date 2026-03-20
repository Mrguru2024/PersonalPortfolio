import { redirect } from "next/navigation";

export default function ContentStudioIndexPage() {
  redirect("/admin/content-studio/documents");
}
