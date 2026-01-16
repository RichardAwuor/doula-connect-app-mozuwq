import { pgTable, text, timestamp, integer, boolean, index, uuid, decimal, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

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

/**
 * Users table - stores user account information
 */
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  userType: text('user_type').notNull(), // 'parent' or 'doula'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  uniqueIndex('email_unique_idx').on(table.email),
]);

/**
 * Parent profiles table - stores parent-specific information
 */
export const parentProfiles = pgTable('parent_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  state: text('state').notNull(),
  town: text('town').notNull(),
  zipCode: text('zip_code').notNull(),
  serviceCategories: jsonb('service_categories').notNull(), // ['birth', 'postpartum']
  financingType: jsonb('financing_type').notNull(), // ['self', 'carrot', 'medicaid']
  servicePeriodStart: timestamp('service_period_start'),
  servicePeriodEnd: timestamp('service_period_end'),
  preferredLanguages: jsonb('preferred_languages'), // ['English', 'Spanish']
  desiredDays: jsonb('desired_days'), // ['Monday', 'Tuesday']
  desiredStartTime: timestamp('desired_start_time'),
  desiredEndTime: timestamp('desired_end_time'),
  acceptedTerms: boolean('accepted_terms').notNull().default(false),
  subscriptionActive: boolean('subscription_active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('parent_user_id_idx').on(table.userId),
  index('parent_state_town_idx').on(table.state, table.town),
]);

/**
 * Doula profiles table - stores doula-specific information
 */
export const doulaProfiles = pgTable('doula_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  state: text('state').notNull(),
  town: text('town').notNull(),
  zipCode: text('zip_code').notNull(),
  paymentPreferences: jsonb('payment_preferences').notNull(), // ['self', 'carrot', 'medicaid']
  driveDistance: integer('drive_distance').notNull(), // in miles
  spokenLanguages: jsonb('spoken_languages').notNull(), // ['English', 'Spanish']
  hourlyRateMin: decimal('hourly_rate_min', { precision: 10, scale: 2 }).notNull(),
  hourlyRateMax: decimal('hourly_rate_max', { precision: 10, scale: 2 }).notNull(),
  serviceCategories: jsonb('service_categories').notNull(), // ['birth', 'postpartum']
  certifications: jsonb('certifications').notNull(), // ['DONA', 'CBED']
  profilePictureUrl: text('profile_picture_url'),
  certificationDocuments: jsonb('certification_documents'), // [{ url: string, type: string }]
  referees: jsonb('referees'), // [{ firstName: string, lastName: string, email: string }]
  acceptedTerms: boolean('accepted_terms').notNull().default(false),
  subscriptionActive: boolean('subscription_active').notNull().default(false),
  rating: decimal('rating', { precision: 3, scale: 2 }).default('0'),
  reviewCount: integer('review_count').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('doula_user_id_idx').on(table.userId),
  index('doula_state_town_idx').on(table.state, table.town),
  index('doula_subscription_idx').on(table.subscriptionActive),
]);

/**
 * Contracts table - tracks parent-doula service agreements
 */
export const contracts = pgTable('contracts', {
  id: uuid('id').primaryKey().defaultRandom(),
  parentId: uuid('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  doulaId: uuid('doula_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date'),
  status: text('status').notNull(), // 'active', 'completed', 'cancelled'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('contract_parent_id_idx').on(table.parentId),
  index('contract_doula_id_idx').on(table.doulaId),
  index('contract_status_idx').on(table.status),
]);

/**
 * Comments table - stores parent reviews on completed contracts
 */
export const comments = pgTable('comments', {
  id: uuid('id').primaryKey().defaultRandom(),
  contractId: uuid('contract_id').notNull().references(() => contracts.id, { onDelete: 'cascade' }),
  parentId: uuid('parent_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  doulaId: uuid('doula_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  parentName: text('parent_name').notNull(),
  comment: text('comment').notNull(), // max 160 characters
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => [
  index('comment_contract_id_idx').on(table.contractId),
  index('comment_doula_id_idx').on(table.doulaId),
  uniqueIndex('comment_contract_parent_idx').on(table.contractId, table.parentId), // Prevent duplicate reviews
]);

/**
 * Subscriptions table - tracks user subscriptions and payments
 */
export const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
  paypalCustomerId: text('paypal_customer_id'),
  paypalOrderId: text('paypal_order_id'),
  paypalSubscriptionId: text('paypal_subscription_id'),
  status: text('status').notNull(), // 'active', 'cancelled', 'expired'
  planType: text('plan_type').notNull(), // 'annual', 'monthly'
  amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow().$onUpdate(() => new Date()),
}, (table) => [
  index('subscription_user_id_idx').on(table.userId),
  index('subscription_status_idx').on(table.status),
]);
