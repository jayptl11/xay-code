import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  const ref = request.nextUrl.searchParams.get("ref");
  if (!ref || !/^[\w-]{1,48}$/.test(ref)) return NextResponse.next();
  return NextResponse.redirect(new URL("/r/" + encodeURIComponent(ref), request.url));
}

export const config = { matcher: "/" };
