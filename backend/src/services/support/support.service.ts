import {
  SupportTicketCategory,
  SupportTicketStatus,
} from '../../generated/prisma/client';
import { prisma } from '../../lib/prisma';
import {
  invalidSupportCategoryError,
  invalidSupportDescriptionError,
  invalidSupportReferenceIdError,
  invalidSupportReferenceTypeError,
  supportUserNotFoundError,
} from './support.errors';

export type ReportAbuseInput = {
  userId: string;
  category: unknown;
  description: unknown;
  referenceId?: unknown;
  referenceType?: unknown;
};

const SUPPORT_TICKET_CATEGORIES: readonly SupportTicketCategory[] = [
  SupportTicketCategory.spam,
  SupportTicketCategory.hate,
  SupportTicketCategory.violence,
  SupportTicketCategory.nudity,
  SupportTicketCategory.other,
];

function hasValidCategory(
  category: unknown,
): category is SupportTicketCategory {
  return (
    typeof category === 'string' &&
    SUPPORT_TICKET_CATEGORIES.includes(category as SupportTicketCategory)
  );
}

function normalizeOptionalString(
  value: unknown,
  onInvalid: () => never,
): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  if (typeof value !== 'string') {
    onInvalid();
  }

  return value.trim() || null;
}

export async function reportAbuse(input: ReportAbuseInput) {
  const userId = input.userId;

  if (!userId) {
    supportUserNotFoundError();
  }

  if (!hasValidCategory(input.category)) {
    invalidSupportCategoryError();
  }

  if (typeof input.description !== 'string') {
    invalidSupportDescriptionError();
  }

  const description = input.description.trim();

  if (description.length < 10) {
    invalidSupportDescriptionError();
  }

  const referenceId = normalizeOptionalString(
    input.referenceId,
    invalidSupportReferenceIdError,
  );
  const referenceType = normalizeOptionalString(
    input.referenceType,
    invalidSupportReferenceTypeError,
  );

  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    supportUserNotFoundError();
  }

  const ticket = await prisma.supportTicket.create({
    data: {
      userId,
      category: input.category,
      description,
      referenceId,
      referenceType,
      status: SupportTicketStatus.open,
    },
    select: {
      id: true,
      userId: true,
      category: true,
      description: true,
      referenceId: true,
      referenceType: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    ticket,
  };
}
