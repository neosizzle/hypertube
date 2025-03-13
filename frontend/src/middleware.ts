import { NextResponse } from "next/server";
import { NextRequest } from "next/server";

export const config = {
  matcher: [
    '/account',
    '/users/:path*',
    '/search',
    '/watch/:path*'
  ]
}

export function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  // console.log("Token:", token);

  const response = (!token) ? NextResponse.redirect(new URL("/login", request.url)) : NextResponse.next()
  response.headers.set("x-middleware-cache", "no-cache");

  return response;
}
