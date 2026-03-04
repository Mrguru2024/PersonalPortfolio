import { z } from "zod";

export const CONSULTATION_DURATIONS = [30, 45, 60] as const;
export const DEFAULT_CONSULTATION_DURATION = 30;

export const CONSULTATION_STATUSES = [
  "booked",
  "cancelled",
  "completed",
] as const;

export const consultationAvailabilityQuerySchema = z.object({
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must use YYYY-MM-DD format."),
  timezone: z.string().min(1).optional(),
  durationMinutes: z.coerce.number().int().min(15).max(120).optional(),
});

export const consultationBookingSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please provide a valid email address."),
  phone: z.string().optional(),
  company: z.string().optional(),
  websiteUrl: z.string().url("Website URL must include https://").optional(),
  timezone: z.string().min(1, "Timezone is required."),
  startIso: z.string().datetime(),
  durationMinutes: z.number().int().min(15).max(120).default(DEFAULT_CONSULTATION_DURATION),
  topic: z.string().min(5, "Topic must be at least 5 characters.").max(160),
  notes: z.string().max(4000).optional(),
  consent: z
    .boolean()
    .refine((value) => value === true, "You must agree before scheduling."),
});

export type ConsultationBookingRequest = z.infer<typeof consultationBookingSchema>;
