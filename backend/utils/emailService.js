// backend/utils/emailService.js

import sendEmail from "./sendEmail.js";
import EmailLog from "../models/EmailLog.js";

/**
 * Send a transactional email and log it.
 * Never throws — always returns { success, error }.
 */
export const sendTransactionalEmail = async ({
  to,
  subject,
  html,
  type,
  userId = null,
  refId = null,
  refType = null,
}) => {
  try {
    await sendEmail({ email: to, subject, html });

    await EmailLog.create({
      user: userId,
      email: to,
      type,
      subject,
      refId,
      refType,
      status: "sent",
    });

    return { success: true };
  } catch (error) {
    console.error(`[EMAIL] Failed (${type} -> ${to}):`, error.message);

    try {
      await EmailLog.create({
        user: userId,
        email: to,
        type,
        subject,
        refId,
        refType,
        status: "failed",
        error: error.message,
      });
    } catch {}

    return { success: false, error: error.message };
  }
};

/**
 * Check if a specific transactional email type has already been sent
 * for a given reference (e.g. a specific cart stage).
 */
export const hasEmailBeenSent = async ({ email, type, refId }) => {
  const existing = await EmailLog.findOne({
    email: email.toLowerCase(),
    type,
    refId,
    status: "sent",
  });
  return !!existing;
};
