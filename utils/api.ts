
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
 *
 * Usage:
 * 1. Import BACKEND_URL or helper functions
 * 2. Use apiCall() for basic requests
 * 3. Use apiGet(), apiPost(), etc. for convenience
 * 4. Backend URL is automatically configured in app.json when backend deploys
 *
 * ============================================================================
 * BACKEND API ENDPOINTS - INTEGRATED
 * ============================================================================
 * 
 * Authentication (OTP-based):
 * - POST /auth/send-otp
 * - POST /auth/verify-otp
 * - DELETE /auth/cleanup-otps
 * 
 * User Registration:
 * - POST /auth/register-parent
 * - POST /auth/register-doula
 * 
 * Profile Management:
 * - GET /parents/{userId}
 * - PUT /parents/{userId}
 * - GET /doulas/{userId}
 * - PUT /doulas/{userId}
 * 
 * Matching System:
 * - GET /matching/doulas/{userId} - Get matching doulas for a parent
 * - GET /matching/parents/{userId} - Get matching parents for a doula
 * 
 * Contract Management:
 * - POST /contracts
 * - GET /contracts/{contractId}
 * - PUT /contracts/{contractId}
 * - GET /users/{userId}/contracts
 * 
 * Comments & Reviews:
 * - POST /comments
 * - GET /doulas/{doulaId}/comments
 * 
 * Payment Processing (Stripe):
 * - POST /payments/create-session
 * - POST /payments/webhook
 * - GET /subscriptions/{userId}
 * - PUT /subscriptions/{userId}
 * 
 * ============================================================================
 */

import Constants from "expo-constants";

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
 * Check if backend is properly configured
 */
export const isBackendConfigured = (): boolean => {
  return !!BACKEND_URL && BACKEND_URL.length > 0;
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
