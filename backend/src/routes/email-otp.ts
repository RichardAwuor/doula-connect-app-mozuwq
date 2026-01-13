import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { eq, and, lt } from 'drizzle-orm';
import { Resend } from 'resend';
import * as schema from '../db/schema.js';
import type { App } from '../index.js';

// Email configuration - lazy initialized to allow optional RESEND_API_KEY
let resend: Resend | null = null;

function getResendClient(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      throw new Error('RESEND_API_KEY environment variable is not set');
    }
    resend = new Resend(apiKey);
  }
  return resend;
}

// Constants
const OTP_EXPIRATION_MINUTES = 10;
const OTP_MAX_ATTEMPTS = 5;
const OTP_LENGTH = 6;

/**
 * Generate a random 6-digit OTP code
 */
function generateOtpCode(): string {
  const min = 0;
  const max = Math.pow(10, OTP_LENGTH) - 1;
  const code = Math.floor(Math.random() * (max - min + 1)) + min;
  return code.toString().padStart(OTP_LENGTH, '0');
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);
  return Array.from(randomBytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Send OTP email using Resend
 * Falls back to console logging if RESEND_API_KEY is not configured (for testing)
 */
async function sendOtpEmail(email: string, otpCode: string): Promise<void> {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin-bottom: 20px; text-align: center; }
          .header h2 { margin: 0; color: #333; }
          .otp-code {
            font-size: 48px;
            font-weight: bold;
            letter-spacing: 8px;
            text-align: center;
            background-color: #e3f2fd;
            padding: 30px;
            border-radius: 5px;
            margin: 30px 0;
            font-family: 'Courier New', monospace;
            color: #1976d2;
          }
          .content { color: #555; }
          .footer { color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; }
          .security-notice { background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #ffc107; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h2>🔐 Doula Connect Verification</h2>
          </div>
          <div class="content">
            <p>Hello,</p>
            <p>Your verification code for Doula Connect is:</p>
            <div class="otp-code">${otpCode}</div>
            <p><strong>This code will expire in 10 minutes.</strong></p>
            <div class="security-notice">
              <p><strong>⚠️ Security Notice:</strong> If you did not request this verification code, please ignore this email. Your account remains secure. Never share this code with anyone.</p>
            </div>
            <p>Thank you for using Doula Connect.</p>
          </div>
          <div class="footer">
            <p>© Doula Connect. All rights reserved.</p>
            <p>This is an automated security email. Please do not reply to this message.</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const apiKey = process.env.RESEND_API_KEY;

    // If no API key is configured, log for testing purposes
    if (!apiKey) {
      console.log('=== OTP EMAIL SIMULATION (RESEND_API_KEY not configured) ===');
      console.log(`To: ${email}`);
      console.log(`Subject: Your Doula Connect Verification Code`);
      console.log(`OTP Code: ${otpCode}`);
      console.log(`HTML Content Length: ${htmlContent.length} characters`);
      console.log('===========================================================');
      return;
    }

    const client = getResendClient();
    const senderEmail = process.env.RESEND_FROM || 'noreply@doulaconnect.com';

    const result = await client.emails.send({
      from: senderEmail,
      to: email,
      subject: 'Your Doula Connect Verification Code',
      html: htmlContent,
    });

    if (result.error) {
      throw new Error(`Email service error: ${result.error.message}`);
    }

    // Check if response has data and id (successful response)
    if (!result.data || !result.data.id) {
      throw new Error('Email sent but no confirmation ID received from email service');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Email delivery failed: ${error.message}`);
    }
    throw new Error('Email delivery failed: Unknown error');
  }
}

export function register(app: App, fastify: FastifyInstance) {
  /**
   * Send OTP endpoint
   * Generates and sends a 6-digit OTP code to the provided email address
   */
  fastify.post('/auth/send-otp', {
    schema: {
      description: 'Send OTP code to email address',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email address to send OTP to' },
        },
      },
      response: {
        200: {
          description: 'OTP sent successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            expiresIn: { type: 'number', description: 'Seconds until OTP expires' },
          },
        },
        400: {
          description: 'Invalid request',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        500: {
          description: 'Failed to send email',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { email: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { email } = request.body;

    // Validate email format using a more robust pattern
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      await reply.status(400).send({ error: 'Invalid email address format' });
      return;
    }

    try {
      // Generate OTP and expiration time
      const otpCode = generateOtpCode();
      const otpId = generateId();
      const now = new Date();
      const expiresAt = new Date(now.getTime() + OTP_EXPIRATION_MINUTES * 60 * 1000);

      app.logger.debug(`Generating OTP for ${email}. OTP Code: ${otpCode}`);

      // Delete any existing OTPs for this email to keep it clean
      await app.db.delete(schema.emailOtps).where(eq(schema.emailOtps.email, email));

      // Store OTP in database
      await app.db.insert(schema.emailOtps).values({
        id: otpId,
        email,
        otpCode,
        createdAt: now,
        expiresAt,
        verified: false,
        attemptCount: 0,
      });

      app.logger.debug(`OTP stored in database for ${email} with ID ${otpId}`);

      // Send OTP via email
      try {
        await sendOtpEmail(email, otpCode);
        app.logger.info(`OTP email sent successfully to ${email}`);
      } catch (emailError) {
        // Log the specific email error for debugging
        const errorMessage = emailError instanceof Error ? emailError.message : String(emailError);
        app.logger.error(`Email sending failed for ${email}: ${errorMessage}`);

        // Check if it's an API key issue
        if (errorMessage.includes('RESEND_API_KEY') || errorMessage.includes('Missing API key')) {
          await reply.status(503).send({
            error: 'Email service is not configured. Please contact support.',
            debug: 'RESEND_API_KEY environment variable is missing',
          });
          return;
        }

        // Re-throw for general error handling
        throw emailError;
      }

      await reply.status(200).send({
        success: true,
        message: 'OTP sent successfully',
        expiresIn: OTP_EXPIRATION_MINUTES * 60,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      app.logger.error(`Failed to send OTP to ${email}: ${errorMessage}`);

      await reply.status(500).send({
        error: 'Unable to send verification email. Please try again later.',
        details: errorMessage,
      });
    }
  });

  /**
   * Verify OTP endpoint
   * Validates the OTP code against the stored code for the email
   */
  fastify.post('/auth/verify-otp', {
    schema: {
      description: 'Verify OTP code',
      tags: ['auth'],
      body: {
        type: 'object',
        required: ['email', 'code'],
        properties: {
          email: { type: 'string', format: 'email', description: 'Email address' },
          code: { type: 'string', description: '6-digit OTP code' },
        },
      },
      response: {
        200: {
          description: 'OTP verified successfully',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
        400: {
          description: 'Invalid request or OTP validation failed',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        401: {
          description: 'Invalid or expired OTP',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
        429: {
          description: 'Too many verification attempts',
          type: 'object',
          properties: {
            error: { type: 'string' },
          },
        },
      },
    },
  }, async (
    request: FastifyRequest<{ Body: { email: string; code: string } }>,
    reply: FastifyReply
  ): Promise<void> => {
    const { email, code } = request.body;

    // Validate input
    if (!email || !code) {
      await reply.status(400).send({ error: 'Email and code are required' });
      return;
    }

    try {
      // Find OTP record
      const otps = await app.db
        .select()
        .from(schema.emailOtps)
        .where(eq(schema.emailOtps.email, email));

      const otp = otps[0];

      if (!otp) {
        app.logger.warn(`OTP not found for email: ${email}`);
        await reply.status(401).send({ error: 'Invalid or expired OTP' });
        return;
      }

      // Check if OTP has already been verified
      if (otp.verified) {
        await reply.status(401).send({ error: 'OTP has already been verified' });
        return;
      }

      // Check if OTP has expired
      const now = new Date();
      if (now > otp.expiresAt) {
        app.logger.warn(`OTP expired for email: ${email}`);
        await reply.status(401).send({ error: 'OTP has expired' });
        return;
      }

      // Check attempt limit
      if (otp.attemptCount >= OTP_MAX_ATTEMPTS) {
        app.logger.warn(`OTP max attempts exceeded for email: ${email}`);
        await reply.status(429).send({ error: 'Too many verification attempts. Please request a new OTP.' });
        return;
      }

      // Increment attempt counter
      const updatedAttempts = otp.attemptCount + 1;
      await app.db
        .update(schema.emailOtps)
        .set({ attemptCount: updatedAttempts })
        .where(eq(schema.emailOtps.id, otp.id));

      // Verify OTP code (case-insensitive and trim whitespace)
      const normalizedCode = code.trim();
      if (normalizedCode !== otp.otpCode) {
        app.logger.warn(`Invalid OTP code for email: ${email}`);
        await reply.status(401).send({ error: 'Invalid OTP code' });
        return;
      }

      // Mark OTP as verified
      await app.db
        .update(schema.emailOtps)
        .set({ verified: true })
        .where(eq(schema.emailOtps.id, otp.id));

      app.logger.info(`OTP verified successfully for email: ${email}`);

      await reply.status(200).send({
        success: true,
        message: 'OTP verified successfully',
      });
    } catch (error) {
      app.logger.error(`Error verifying OTP for ${email}: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({
        error: 'Internal server error',
      });
    }
  });

  /**
   * Cleanup endpoint (optional)
   * Deletes expired OTP records from the database
   * Can be called periodically via a cron job
   */
  fastify.delete('/auth/cleanup-otps', {
    schema: {
      description: 'Clean up expired OTP records',
      tags: ['auth'],
      response: {
        200: {
          description: 'Cleanup completed',
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    try {
      const now = new Date();

      // Delete expired OTPs using lt operator for less than comparison
      await app.db
        .delete(schema.emailOtps)
        .where(lt(schema.emailOtps.expiresAt, now));

      app.logger.info(`Cleaned up expired OTP records`);

      await reply.status(200).send({
        success: true,
        message: 'Expired OTP records cleaned up',
      });
    } catch (error) {
      app.logger.error(`Error during OTP cleanup: ${error instanceof Error ? error.message : String(error)}`);
      await reply.status(500).send({
        error: 'Cleanup failed',
      });
    }
  });
}
