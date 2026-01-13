
/**
 * API Utilities for Doula Connect
 *
 * Provides utilities for making API calls to the backend.
 * Automatically reads backend URL from app.json configuration.
 *
 * Features:
 * - Automatic backend URL configuration
 * - Error handling with proper logging
 * - Type-safe request/response handling
 * - Helper functions for common HTTP methods
 * - Automatic bearer token management for authenticated requests
 *
 * Usage:
 * 1. Import BACKEND_URL or helper functions
 * 2. Use apiCall() for basic requests
 * 3. Use apiGet(), apiPost(), etc. for convenience
 * 4. Use authenticatedApiCall() for requests requiring auth (token auto-retrieved)
 * 5. Backend URL is automatically configured in app.json when backend deploys
 *
 * ============================================================================
 * BACKEND API ENDPOINTS - IMPLEMENTATION STATUS
 * ============================================================================
 * 
 * ✅ IMPLEMENTED (Working):
 * 
 * Authentication (OTP-based):
 * - POST /auth/send-otp
 *   Body: { email: string }
 *   Response: { success: boolean, message: string, expiresIn: number }
 * 
 * - POST /auth/verify-otp
 *   Body: { email: string, code: string }
 *   Response: { success: boolean, message: string }
 * 
 * - DELETE /auth/cleanup-otps
 *   Response: { success: boolean, message: string }
 * 
 * ============================================================================
 * ❌ NOT IMPLEMENTED (Required for full functionality):
 * ============================================================================
 * 
 * User Registration & Profile Management:
 * 
 * - POST /api/users/parent
 *   Body: {
 *     email: string,
 *     firstName: string,
 *     lastName: string,
 *     state: string,
 *     town: string,
 *     zipCode: string,
 *     serviceCategories: Array<'birth' | 'postpartum'>,
 *     financingType: Array<'self' | 'carrot' | 'medicaid'>,
 *     servicePeriodStart?: string (ISO date),
 *     servicePeriodEnd?: string (ISO date),
 *     preferredLanguages?: Array<string>,
 *     desiredDays?: Array<string>,
 *     desiredStartTime?: string (ISO date),
 *     desiredEndTime?: string (ISO date),
 *     acceptedTerms: boolean
 *   }
 *   Response: { success: boolean, userId: string, profile: ParentProfile }
 * 
 * - POST /api/users/doula
 *   Body: {
 *     email: string,
 *     firstName: string,
 *     lastName: string,
 *     state: string,
 *     town: string,
 *     zipCode: string,
 *     paymentPreferences: Array<'self' | 'carrot' | 'medicaid'>,
 *     driveDistance: number,
 *     spokenLanguages: Array<string>,
 *     hourlyRateMin: number,
 *     hourlyRateMax: number,
 *     serviceCategories: Array<'birth' | 'postpartum'>,
 *     certifications: Array<string>,
 *     profilePictureUrl: string,
 *     certificationDocuments?: Array<string>,
 *     referees?: Array<{ firstName: string, lastName: string, email: string }>,
 *     acceptedTerms: boolean
 *   }
 *   Response: { success: boolean, userId: string, profile: DoulaProfile }
 * 
 * - PUT /api/users/profile/:id
 *   Body: Partial profile update data (varies by user type)
 *   Response: { success: boolean, profile: UserProfile }
 * 
 * File Upload:
 * 
 * - POST /api/upload/profile-picture
 *   Body: multipart/form-data with 'image' field
 *   Response: { success: boolean, url: string }
 * 
 * - POST /api/upload/certification
 *   Body: multipart/form-data with 'document' field
 *   Response: { success: boolean, url: string }
 * 
 * Matching System:
 * 
 * - GET /api/matches?userId={userId}&userType={userType}
 *   Query params: userId (string), userType ('parent' | 'doula')
 *   Response: { success: boolean, matches: Array<DoulaProfile | ParentProfile> }
 *   Note: Should implement matching algorithm based on:
 *     - Location (state, town, drive distance for doulas)
 *     - Service categories (birth/postpartum)
 *     - Languages
 *     - Financing/payment preferences
 *     - Availability (for parents)
 * 
 * Contract Management:
 * 
 * - POST /api/contracts
 *   Body: { parentId: string, doulaId: string, startDate: string }
 *   Response: { success: boolean, contract: Contract }
 * 
 * - GET /api/contracts/user/:userId
 *   Response: { success: boolean, contracts: Array<Contract> }
 *   Note: Contract should have status field: 'active' | 'completed' | 'cancelled'
 * 
 * Comments & Reviews:
 * 
 * - POST /api/comments
 *   Body: { contractId: string, doulaId: string, parentId: string, comment: string }
 *   Response: { success: boolean, comment: DoulaComment }
 *   Note: Should validate that:
 *     - Contract exists and is completed
 *     - Parent hasn't already commented on this contract
 *     - Comment is <= 160 characters
 * 
 * - GET /api/comments/doula/:doulaId
 *   Response: { success: boolean, comments: Array<DoulaComment> }
 *   Note: DoulaComment should include:
 *     - id, contractId, doulaId, parentId, parentName, comment, createdAt
 * 
 * Payment Processing (Stripe Integration):
 * 
 * - POST /api/payments/create-checkout-session
 *   Body: { userId: string, userType: string, email: string }
 *   Response: { success: boolean, checkoutUrl: string, sessionId: string }
 *   Note: Should create Stripe Checkout session with:
 *     - Amount: $99.00 USD
 *     - Period: Annual for parents, Monthly for doulas
 *     - Success URL: {frontend_url}/payment-success?session_id={CHECKOUT_SESSION_ID}
 *     - Cancel URL: {frontend_url}/payment
 * 
 * - GET /api/payments/status/:sessionId
 *   Response: { success: boolean, status: 'pending' | 'completed' | 'failed' }
 * 
 * - PUT /api/users/subscription
 *   Body: { userId: string, subscriptionActive: boolean }
 *   Response: { success: boolean }
 * 
 * ============================================================================
 * DATABASE SCHEMA RECOMMENDATIONS:
 * ============================================================================
 * 
 * Tables needed:
 * 1. users - Base user info (id, email, userType, createdAt)
 * 2. parent_profiles - Parent-specific data
 * 3. doula_profiles - Doula-specific data
 * 4. contracts - Parent-doula contracts
 * 5. comments - Doula reviews/comments
 * 6. subscriptions - Payment/subscription status
 * 7. otp_codes - Already implemented for OTP auth
 * 
 * ============================================================================
 */

import Constants from "expo-constants";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

/**
 * Backend URL is configured in app.json under expo.extra.backendUrl
 * It is set automatically when the backend is deployed
 */
export const BACKEND_URL = Constants.expoConfig?.extra?.backendUrl || "";

// Log backend URL for debugging
if (__DEV__) {
  console.log('[API] Backend URL configured:', BACKEND_URL || 'NOT SET');
}

/**
 * Bearer token storage key
 * Matches the app name "doulaconnect" from app.json scheme
 */
const BEARER_TOKEN_KEY = "doulaconnect_bearer_token";

/**
 * Check if backend is properly configured
 */
export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
};

/**
 * Get bearer token from platform-specific storage
 * Web: localStorage
 * Native: SecureStore
 *
 * @returns Bearer token or null if not found
 */
export const getBearerToken = async (): Promise<string | null> => {
  try {
    if (Platform.OS === "web") {
      return localStorage.getItem(BEARER_TOKEN_KEY);
    } else {
      return await SecureStore.getItemAsync(BEARER_TOKEN_KEY);
    }
  } catch (error) {
    console.error("[API] Error retrieving bearer token:", error);
    return null;
  }
};

/**
 * Generic API call helper with error handling
 *
 * @param endpoint - API endpoint path (e.g., '/users', '/auth/login')
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error if backend is not configured or request fails
 */
export const apiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  if (!isBackendConfigured()) {
    throw new Error("Backend URL not configured. Please rebuild the app.");
  }

  const url = `${BACKEND_URL}${endpoint}`;
  console.log("[API] Calling:", url, options?.method || "GET");

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });

    const text = await response.text();
    console.log("[API] Response status:", response.status);
    console.log("[API] Response text:", text);

    if (!response.ok) {
      // Try to parse as JSON first
      let errorMessage = text;
      try {
        const errorData = JSON.parse(text);
        errorMessage = errorData.error || errorData.message || text;
      } catch (e) {
        // If not JSON, check if it's HTML error page
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          errorMessage = 'Server error occurred. Please try again later.';
        }
      }
      
      console.error("[API] Error response:", response.status, errorMessage);
      throw new Error(errorMessage);
    }

    // Parse successful response
    try {
      const data = JSON.parse(text);
      console.log("[API] Success:", data);
      return data;
    } catch (e) {
      console.error("[API] Failed to parse response as JSON:", text);
      throw new Error("Invalid response from server");
    }
  } catch (error) {
    console.error("[API] Request failed:", error);
    throw error;
  }
};

/**
 * GET request helper
 */
export const apiGet = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: "GET" });
};

/**
 * POST request helper
 */
export const apiPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * PUT request helper
 */
export const apiPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * PATCH request helper
 */
export const apiPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return apiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * DELETE request helper
 */
export const apiDelete = async <T = any>(endpoint: string): Promise<T> => {
  return apiCall<T>(endpoint, { method: "DELETE" });
};

/**
 * Authenticated API call helper
 * Automatically retrieves bearer token from storage and adds to Authorization header
 *
 * @param endpoint - API endpoint path
 * @param options - Fetch options (method, headers, body, etc.)
 * @returns Parsed JSON response
 * @throws Error if token not found or request fails
 */
export const authenticatedApiCall = async <T = any>(
  endpoint: string,
  options?: RequestInit
): Promise<T> => {
  const token = await getBearerToken();

  if (!token) {
    throw new Error("Authentication token not found. Please sign in.");
  }

  return apiCall<T>(endpoint, {
    ...options,
    headers: {
      ...options?.headers,
      Authorization: `Bearer ${token}`,
    },
  });
};

/**
 * Authenticated GET request
 */
export const authenticatedGet = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "GET" });
};

/**
 * Authenticated POST request
 */
export const authenticatedPost = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated PUT request
 */
export const authenticatedPut = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated PATCH request
 */
export const authenticatedPatch = async <T = any>(
  endpoint: string,
  data: any
): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
};

/**
 * Authenticated DELETE request
 */
export const authenticatedDelete = async <T = any>(endpoint: string): Promise<T> => {
  return authenticatedApiCall<T>(endpoint, { method: "DELETE" });
};
