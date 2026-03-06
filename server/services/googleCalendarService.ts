import { DateTime } from "luxon";
import { google } from "googleapis";

interface ConsultationCalendarEventInput {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  websiteUrl?: string;
  topic: string;
  notes?: string;
  startUtcIso: string;
  endUtcIso: string;
  timezone: string;
}

interface ConsultationCalendarEventResult {
  eventId?: string;
  eventLink?: string;
}

export class GoogleCalendarService {
  private readonly calendarId: string;
  private readonly clientEmail?: string;
  private readonly privateKey?: string;
  private readonly adminEmail?: string;
  private readonly isConfigured: boolean;

  constructor() {
    this.calendarId =
      process.env.GOOGLE_CALENDAR_ID || process.env.GOOGLE_CALENDAR_PRIMARY_ID || "";
    this.clientEmail =
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || process.env.GOOGLE_CLIENT_EMAIL;
    this.privateKey = (
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
      process.env.GOOGLE_PRIVATE_KEY ||
      ""
    ).replace(/\\n/g, "\n");
    this.adminEmail = process.env.ADMIN_EMAIL || "";

    this.isConfigured = Boolean(
      this.calendarId && this.clientEmail && this.privateKey
    );
  }

  async createConsultationEvent(
    input: ConsultationCalendarEventInput
  ): Promise<ConsultationCalendarEventResult> {
    if (!this.isConfigured) {
      return {};
    }

    try {
      const auth = new google.auth.JWT({
        email: this.clientEmail,
        key: this.privateKey,
        scopes: ["https://www.googleapis.com/auth/calendar"],
      });

      const calendar = google.calendar({ version: "v3", auth });
      const viewerStart = DateTime.fromISO(input.startUtcIso, { zone: "utc" }).setZone(
        input.timezone
      );
      const viewerEnd = DateTime.fromISO(input.endUtcIso, { zone: "utc" }).setZone(
        input.timezone
      );

      const attendees = [
        this.adminEmail ? { email: this.adminEmail } : null,
        input.email ? { email: input.email } : null,
      ].filter(Boolean) as Array<{ email: string }>;

      const descriptionLines = [
        `Consultation booked via website scheduler`,
        ``,
        `Client: ${input.name}`,
        `Email: ${input.email}`,
        `Phone: ${input.phone || "Not provided"}`,
        `Company: ${input.company || "Not provided"}`,
        `Website: ${input.websiteUrl || "Not provided"}`,
        `Topic: ${input.topic}`,
        ``,
        `Client timezone: ${input.timezone}`,
        `Local time: ${viewerStart.toFormat("cccc, LLL d, yyyy")} · ${viewerStart.toFormat(
          "h:mm a"
        )} - ${viewerEnd.toFormat("h:mm a")}`,
        ``,
        `Notes:`,
        input.notes || "No additional notes.",
      ];

      const event = await calendar.events.insert({
        calendarId: this.calendarId,
        sendUpdates: "all",
        requestBody: {
          summary: `Consultation: ${input.name} – ${input.topic}`,
          description: descriptionLines.join("\n"),
          start: {
            dateTime: input.startUtcIso,
            timeZone: "UTC",
          },
          end: {
            dateTime: input.endUtcIso,
            timeZone: "UTC",
          },
          attendees,
          reminders: {
            useDefault: false,
            overrides: [
              { method: "email", minutes: 24 * 60 },
              { method: "popup", minutes: 30 },
            ],
          },
        },
      });

      return {
        eventId: event.data.id || undefined,
        eventLink: event.data.htmlLink || undefined,
      };
    } catch (error) {
      console.error("Failed to create Google Calendar event:", error);
      return {};
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
