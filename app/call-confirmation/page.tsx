import { redirect } from "next/navigation";
import { funnelThankYouUrl } from "@/lib/funnelThankYou";

/** Legacy URL for strategy-call success; canonical conversion page is `/thank-you?form=strategy_call_landing`. */
export default function CallConfirmationPage() {
  redirect(funnelThankYouUrl("strategy_call_landing"));
}
