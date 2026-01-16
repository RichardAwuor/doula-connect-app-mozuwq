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
import { initializePayPal, getPayPalStatus } from './services/paypal-service.js';

// Create application with schema for full database type support
export const app = await createApplication(schema);

// Export App type for use in route files
export type App = typeof app;

// Initialize PayPal before starting server
app.logger.info('Initializing PayPal payment service...');
const paypalInit = initializePayPal(app.logger);

if (paypalInit.success) {
  app.logger.info('✓ PayPal payment service initialized successfully - Payment processing is ENABLED');
} else {
  app.logger.error(`✗ PayPal initialization failed: ${paypalInit.error}`);
  app.logger.warn('⚠ Payment processing features will be UNAVAILABLE until PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET are configured');
}

// Log PayPal status
const paypalStatus = getPayPalStatus();
app.logger.debug({ paypalStatus }, 'PayPal initialization details');

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
