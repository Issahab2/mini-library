import type { Checkout } from "@prisma/client";
import { createBookAlreadyCheckedOutError, createCheckoutLimitExceededError } from "./errors";
import { prisma } from "./prisma";
import { cancelCheckoutReminder, scheduleCheckoutReminder } from "./qstash";
import type { CheckoutValidationResult, CreateCheckoutInput } from "./types/checkout";

/**
 * Validates if a user can checkout a book
 * Checks: user checkout limit, book availability
 */
export async function validateCheckout(userId: string, bookId: string): Promise<CheckoutValidationResult> {
  // Get user with their current checkouts
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      checkouts: {
        where: {
          returnedDate: null, // Only count active checkouts
        },
      },
    },
  });

  if (!user) {
    return {
      valid: false,
      error: "User not found",
    };
  }

  // Check email verification for customers (staff bypass this check)
  if (!user.isStaff && !user.emailVerified) {
    return {
      valid: false,
      error: "Please verify your email address before checking out books. Check your email for a verification link.",
    };
  }

  // Check checkout limit
  const currentCheckouts = user.checkouts.length;
  if (currentCheckouts >= user.maxCheckoutLimit) {
    return {
      valid: false,
      error: createCheckoutLimitExceededError(currentCheckouts, user.maxCheckoutLimit).message,
      currentCheckouts,
      maxCheckouts: user.maxCheckoutLimit,
    };
  }

  // Check if book exists and is available
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      checkouts: {
        where: {
          returnedDate: null, // Check for active checkouts
        },
      },
    },
  });

  if (!book) {
    return {
      valid: false,
      error: "Book not found",
    };
  }

  // Check if book is already checked out
  if (book.status === "CHECKED_OUT" || book.checkouts.length > 0) {
    return {
      valid: false,
      error: createBookAlreadyCheckedOutError(bookId).message,
    };
  }

  // Check if user already has this book checked out
  const userHasBook = user.checkouts.some((checkout) => checkout.bookId === bookId);
  if (userHasBook) {
    return {
      valid: false,
      error: "You already have this book checked out",
    };
  }

  return {
    valid: true,
    currentCheckouts,
    maxCheckouts: user.maxCheckoutLimit,
  };
}

/**
 * Calculates the due date based on checkout date and max duration
 */
export function calculateDueDate(checkoutDate: Date, maxDurationDays: number): Date {
  const dueDate = new Date(checkoutDate);
  dueDate.setDate(dueDate.getDate() + maxDurationDays);
  return dueDate;
}

/**
 * Calculates late fees for an overdue checkout
 */
export function calculateLateFees(
  dueDate: Date,
  lateFeePerDay: number,
  returnDate?: Date | null
): {
  isOverdue: boolean;
  overdueDays: number;
  lateFeeAmount: number;
} {
  const now = returnDate || new Date();
  const daysDiff = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));

  if (daysDiff <= 0) {
    return {
      isOverdue: false,
      overdueDays: 0,
      lateFeeAmount: 0,
    };
  }

  const lateFeeAmount = daysDiff * lateFeePerDay;

  return {
    isOverdue: true,
    overdueDays: daysDiff,
    lateFeeAmount: Number(lateFeeAmount.toFixed(2)),
  };
}

/**
 * Checks and updates overdue status for a checkout
 */
export async function checkOverdueStatus(checkoutId: string): Promise<Checkout | null> {
  const checkout = await prisma.checkout.findUnique({
    where: { id: checkoutId },
  });

  if (!checkout || checkout.returnedDate) {
    return checkout;
  }

  const { isOverdue, overdueDays, lateFeeAmount } = calculateLateFees(checkout.dueDate, Number(checkout.lateFeePerDay));

  // Only update if status changed
  if (isOverdue !== checkout.isOverdue || overdueDays !== checkout.overdueDays) {
    return await prisma.checkout.update({
      where: { id: checkoutId },
      data: {
        isOverdue,
        overdueDays,
        lateFeeAmount: isOverdue ? lateFeeAmount : null,
      },
    });
  }

  return checkout;
}

/**
 * Updates overdue status for all active checkouts
 */
export async function updateAllOverdueStatuses(): Promise<number> {
  const activeCheckouts = await prisma.checkout.findMany({
    where: {
      returnedDate: null,
    },
  });

  let updatedCount = 0;

  for (const checkout of activeCheckouts) {
    const { isOverdue, overdueDays, lateFeeAmount } = calculateLateFees(
      checkout.dueDate,
      Number(checkout.lateFeePerDay)
    );

    if (isOverdue !== checkout.isOverdue || overdueDays !== checkout.overdueDays) {
      await prisma.checkout.update({
        where: { id: checkout.id },
        data: {
          isOverdue,
          overdueDays,
          lateFeeAmount: isOverdue ? lateFeeAmount : null,
        },
      });
      updatedCount++;
    }
  }

  return updatedCount;
}

/**
 * Creates a new checkout with validation
 */
export async function createCheckout(input: CreateCheckoutInput) {
  const userId = input.userId;
  if (!userId) {
    throw new Error("User ID is required");
  }
  const validation = await validateCheckout(userId, input.bookId);

  if (!validation.valid) {
    throw new Error(validation.error);
  }

  const checkoutDate = new Date();
  const maxDurationDays = input.maxDurationDays || 14;
  const lateFeePerDay = input.lateFeePerDay || 0.5;
  const dueDate = calculateDueDate(checkoutDate, maxDurationDays);

  // Create checkout and update book status in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const checkout = await tx.checkout.create({
      data: {
        bookId: input.bookId,
        userId: userId,
        checkoutDate,
        dueDate,
        maxDurationDays,
        lateFeePerDay,
        isOverdue: false,
        overdueDays: 0,
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update book status
    await tx.book.update({
      where: { id: input.bookId },
      data: { status: "CHECKED_OUT" },
    });

    return checkout;
  });

  // Schedule QStash reminder 1 day before due date (non-blocking - graceful degradation)
  scheduleCheckoutReminder(result.id, result.dueDate)
    .then((messageId) => {
      if (messageId) {
        // Update checkout with QStash message ID
        prisma.checkout
          .update({
            where: { id: result.id },
            data: { qstashMessageId: messageId },
          })
          .catch((error) => {
            console.error("Failed to update checkout with QStash message ID:", error);
            // Don't fail if this update fails
          });
      }
    })
    .catch((error) => {
      console.error("Failed to schedule checkout reminder:", error);
      // Don't fail the checkout creation if reminder scheduling fails
    });

  return result;
}

/**
 * Returns a book (marks checkout as returned)
 */
export async function returnCheckout(checkoutId: string) {
  const checkout = await prisma.checkout.findUnique({
    where: { id: checkoutId },
    include: { book: true },
  });

  if (!checkout) {
    throw new Error("Checkout not found");
  }

  if (checkout.returnedDate) {
    throw new Error("Book has already been returned");
  }

  const returnDate = new Date();
  const { lateFeeAmount } = calculateLateFees(checkout.dueDate, Number(checkout.lateFeePerDay), returnDate);

  // Return checkout and update book status in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const updatedCheckout = await tx.checkout.update({
      where: { id: checkoutId },
      data: {
        returnedDate: returnDate,
        isOverdue: lateFeeAmount > 0,
        overdueDays:
          lateFeeAmount > 0
            ? Math.floor((returnDate.getTime() - checkout.dueDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0,
        lateFeeAmount: lateFeeAmount > 0 ? lateFeeAmount : null,
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Update book status to available
    await tx.book.update({
      where: { id: checkout.bookId },
      data: { status: "AVAILABLE" },
    });

    return updatedCheckout;
  });

  // Cancel QStash reminder if one was scheduled (non-blocking - graceful degradation)
  if (checkout.qstashMessageId) {
    cancelCheckoutReminder(checkout.qstashMessageId).catch((error) => {
      console.error("Failed to cancel checkout reminder:", error);
      // Don't fail the return operation if cancellation fails
    });
  }

  return result;
}
