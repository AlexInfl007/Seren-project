import { NextResponse, type NextRequest } from "next/server";

const localeSet = new Set(["en", "ru", "es", "zh", "hi", "ar", "fr", "pt"]);

export function middleware(request: NextRequest) {
  const firstSegment = request.nextUrl.pathname.split("/").filter(Boolean)[0] || "en";
  const headers = new Headers(request.headers);
  headers.set("x-seren-locale", localeSet.has(firstSegment) ? firstSegment : "en");
  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.png|assets/|og-card.png).*)"],
};
