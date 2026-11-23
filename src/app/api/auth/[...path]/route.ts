import { auth } from "@/lib/auth";

export function GET(request: Request) {
  if (new URL(request.url).pathname !== "/api/auth/get-session") return new Response(null, { status: 404 });
  return auth.handler(request);
}
