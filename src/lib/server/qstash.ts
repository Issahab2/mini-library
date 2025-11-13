import { Client } from "@upstash/qstash";
import { QSTASH_TOKEN, QSTASH_URL, APP_URL } from "./constants/env";

// Initialize QStash client only if token is available
const qstash = QSTASH_TOKEN
  ? new Client({
      token: QSTASH_TOKEN,
      ...(QSTASH_URL && { baseUrl: QSTASH_URL }),
    })
  : null;

/**
 * Checks if QStash service is available
 */
export function isQStashAvailable(): boolean {
  return qstash !== null;
}

/**
 * Logs a warning if QStash service is not available
 */
function logQStashUnavailable(): void {
  if (!isQStashAvailable()) {
    console.warn(
      "[QStash Service] QSTASH_TOKEN not configured. QStash service is disabled. Reminders will not be scheduled."
    );
  }
}

/**
 * Schedule a reminder for a checkout 1 day before the due date
 * @param checkoutId - The checkout ID
 * @param dueDate - The due date of the checkout
 * @returns The QStash message ID if successful, null if service unavailable
 */
export async function scheduleCheckoutReminder(checkoutId: string, dueDate: Date): Promise<string | null> {
  if (!isQStashAvailable()) {
    logQStashUnavailable();
    return null;
  }

  try {
    // Calculate reminder time: 1 day before due date
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(reminderDate.getDate() - 1);
    reminderDate.setHours(9, 0, 0, 0); // Set to 9 AM on the reminder day

    // Don't schedule if reminder time is in the past
    if (reminderDate < new Date()) {
      console.warn(
        `[QStash Service] Cannot schedule reminder for checkout ${checkoutId}: reminder date is in the past`
      );
      return null;
    }

    const webhookUrl = `${APP_URL}/api/qstash/reminder`;

    const result = await qstash!.publishJSON({
      url: webhookUrl,
      body: {
        checkoutId,
        type: "overdue_reminder",
      },
      schedule: reminderDate.toISOString(),
    });

    const messageId = typeof result === "string" ? result : result.messageId;

    console.log(`[QStash Service] Scheduled reminder for checkout ${checkoutId} at ${reminderDate.toISOString()}`);

    return messageId;
  } catch (error) {
    console.error("[QStash Service] Error scheduling reminder:", error);
    // Return null to not block application flow
    return null;
  }
}

/**
 * Cancel a scheduled QStash reminder
 * @param messageId - The QStash message ID to cancel
 */
export async function cancelCheckoutReminder(messageId: string): Promise<boolean> {
  if (!isQStashAvailable()) {
    logQStashUnavailable();
    return false;
  }

  try {
    await qstash!.messages.delete(messageId);
    console.log(`[QStash Service] Cancelled reminder with message ID: ${messageId}`);
    return true;
  } catch (error) {
    console.error("[QStash Service] Error cancelling reminder:", error);
    // Return false but don't throw - graceful degradation
    return false;
  }
}
