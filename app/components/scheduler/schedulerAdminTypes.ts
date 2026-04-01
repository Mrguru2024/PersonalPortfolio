/** Client-safe shapes returned by GET /api/admin/scheduler/appointments/[id] */

export type SchedulerAppointmentDetailClient = {
  appointment: {
    id: number;
    bookingTypeId: number;
    hostUserId: number | null;
    guestName: string;
    guestEmail: string;
    guestPhone: string | null;
    guestCompany: string | null;
    startAt: string;
    endAt: string;
    status: string;
    guestToken: string;
    contactId: number | null;
    guestNotes: string | null;
    internalNotes: string | null;
    bookingPageId: number | null;
    leadScoreTier: string | null;
    intentClassification: string | null;
    noShowRiskTier: string | null;
    paymentStatus: string;
    estimatedValueCents: number | null;
    bookingSource: string | null;
    formAnswersJson: Record<string, unknown> | null;
    cancelledAt: string | null;
    completedAt: string | null;
    createdAt: string;
    updatedAt: string;
  };
  bookingTypeName: string | null;
  bookingTypeSlug: string | null;
  bookingTypeColor: null;
  contactCompany: string | null;
  contactName: string | null;
  hostDisplay: string | null;
  bookingPageSlug: string | null;
  crmContact: Record<string, unknown> | null;
  priorAppointments: Array<{
    id: number;
    startAt: string;
    endAt: string;
    status: string;
    bookingTypeId: number;
  }>;
};
