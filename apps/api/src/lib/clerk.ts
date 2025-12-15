/**
 * Clerk Authentication Integration
 * 
 * Phase 6.1: Clerk backend SDK integration
 * 
 * To use:
 * 1. Install: pnpm add @clerk/backend
 * 2. Set environment variables:
 *    - CLERK_SECRET_KEY=sk_...
 * 3. Update getUserId() in auth.ts to use verifyToken()
 */

// TODO: Uncomment when @clerk/backend is installed
// import { clerkClient } from "@clerk/backend";

/**
 * Verify Clerk JWT token and extract user ID
 * 
 * @param token - JWT token from Authorization header
 * @returns User ID if token is valid, null otherwise
 */
export async function verifyClerkToken(token: string): Promise<string | null> {
  // TODO: Uncomment when @clerk/backend is installed
  // try {
  //   const { userId } = await clerkClient.verifyToken(token);
  //   return userId;
  // } catch (error) {
  //   console.error("[Clerk] Token verification failed:", error);
  //   return null;
  // }
  
  // Placeholder: return null until Clerk is configured
  return null;
}

/**
 * Get Clerk client instance
 * 
 * @returns Clerk client (or null if not configured)
 */
export function getClerkClient() {
  // TODO: Uncomment when @clerk/backend is installed
  // const secretKey = process.env.CLERK_SECRET_KEY;
  // if (!secretKey) {
  //   throw new Error("CLERK_SECRET_KEY environment variable is required");
  // }
  // return clerkClient;
  
  return null;
}

/**
 * Check if Clerk is configured
 * 
 * @returns true if CLERK_SECRET_KEY is set
 */
export function isClerkConfigured(): boolean {
  return !!process.env.CLERK_SECRET_KEY;
}

