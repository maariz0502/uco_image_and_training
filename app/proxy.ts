import { NextResponse, NextRequest } from "next/server";

const ipMap = new Map<string, { count: number; lastReset: number }>();

// Config: Allow 10 requests per 10 seconds per IP
const WINDOW_SIZE_MS = 10 * 1000; 
const MAX_REQUESTS = 10;

export function proxy(request: NextRequest) {
  // Only protect the upload endpoint
  if (request.method === "POST") {
    const ip = request.headers.get("x-forwarded-for") || "unknown";
    const now = Date.now();
    
    const record = ipMap.get(ip) || { count: 0, lastReset: now };

    // Reset window if time passed
    if (now - record.lastReset > WINDOW_SIZE_MS) {
      record.count = 0;
      record.lastReset = now;
    }

    // Block if limit exceeded
    if (record.count >= MAX_REQUESTS) {
      return new NextResponse(JSON.stringify({ error: "Too many requests" }), {
        status: 429,
        headers: { "Content-Type": "application/json" },
      });
    }

    record.count++;
    ipMap.set(ip, record);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/((?!_next/static|_next/image|favicon.ico).*)',
};