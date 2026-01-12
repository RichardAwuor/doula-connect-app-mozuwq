import { pgTable, text, timestamp, integer, boolean, index } from 'drizzle-orm/pg-core';

/**
 * OTP storage table for email-based one-time password authentication
 */
export const emailOtps = pgTable('email_otps', {
  id: text('id').primaryKey(),
  email: text('email').notNull(),
  otpCode: text('otp_code').notNull(), // 6-digit code (000000-999999)
  createdAt: timestamp('created_at').notNull().defaultNow(),
  expiresAt: timestamp('expires_at').notNull(), // 10-minute expiration window
  verified: boolean('verified').notNull().default(false),
  attemptCount: integer('attempt_count').notNull().default(0), // 5 max attempts per OTP
}, (table) => [
  index('email_idx').on(table.email),
]);
