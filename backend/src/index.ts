import { createApplication } from "@specific-dev/framework";
import * as schema from './db/schema.js';
import * as emailOtpRoutes from './routes/email-otp.js';
import * as authRoutes from './routes/auth.js';
import * as parentProfileRoutes from './routes/parent-profiles.js';
import * as doulaProfileRoutes from './routes/doula-profiles.js';
import * as matchingRoutes from './routes/matching.js';
import * as contractRoutes from './routes/contracts.js';
import * as commentRoutes from './routes/comments.js';
import * as paymentRoutes from './routes/payments.js';
import * as healthRoutes from './routes/health.js';
import { initializeStripe, getStripeStatus } from './services/stripe-service.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Initialize Stripe before starting server
app.logger.info('Initializing Stripe payment service...');
const stripeInit = initializeStripe();

if (stripeInit.success) {
  app.logger.info('✓ Stripe payment service initialized successfully');
} else {
  app.logger.warn(`⚠ Stripe initialization warning: ${stripeInit.error}`);
  app.logger.warn('Payment processing features will be unavailable');
}

// Log Stripe status
const stripeStatus = getStripeStatus();
app.logger.debug(`Stripe status: ${JSON.stringify(stripeStatus)}`);

// Register routes - add your route modules here
// IMPORTANT: Always use registration functions to avoid circular dependency issues
healthRoutes.register(app, app.fastify);
emailOtpRoutes.register(app, app.fastify);
authRoutes.register(app, app.fastify);
parentProfileRoutes.register(app, app.fastify);
doulaProfileRoutes.register(app, app.fastify);
matchingRoutes.register(app, app.fastify);
contractRoutes.register(app, app.fastify);
commentRoutes.register(app, app.fastify);
paymentRoutes.register(app, app.fastify);

await app.run();
app.logger.info('Application running');
