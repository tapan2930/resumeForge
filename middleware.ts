import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest } from "next/server";

export default function middleware(req: NextRequest) {
  return withAuth(req);
}

export const config = {
  matcher: [
    "/dashboard",
    "/resume/:path*",
    "/templates/:path*",
    "/settings/:path*",
  ],
};
