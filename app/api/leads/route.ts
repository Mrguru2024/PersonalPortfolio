/**
 * POST /api/leads — alias for growth funnel lead capture.
 * Stores answers, score, recommendation, and form data; sends user + admin emails via Brevo.
 * Same behavior as POST /api/funnel/leads.
 */
export { POST } from "../funnel/leads/route";
