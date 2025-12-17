/**
 * CORS Middleware
 * 
 * Phase 6: Production-ready CORS configuration
 */

import type { Context, Next } from "hono";
import { isProduction } from "../lib/config";

/**
 * CORS middleware for Hono
 * 
 * Allows requests from mobile app and configured origins
 */
export async function corsMiddleware(c: Context, next: Next) {
  const origin = c.req.header("Origin");
  
  // In production, check against allowed origins
  // In development, allow all origins
  if (isProduction()) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [];
    
    if (origin && allowedOrigins.includes(origin)) {
      c.header("Access-Control-Allow-Origin", origin);
    }
  } else {
    // Development: allow all origins
    if (origin) {
      c.header("Access-Control-Allow-Origin", origin);
    }
  }
  
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  c.header("Access-Control-Allow-Credentials", "true");
  
  // Handle preflight requests
  if (c.req.method === "OPTIONS") {
    return new Response(null, { status: 204 });
  }
  
  await next();
}

