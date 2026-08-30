import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "thiqti_session";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev_secret_change_me");
}

async function hasValidSession(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, getSecret());
    return true;
  } catch {
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Bloquer les pages de véhicule si l'utilisateur n'est pas connecté.
  if (!(await hasValidSession(request))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Gating des pages de détail véhicule (et comparaison/favoris peuvent être
  // ajoutés ici : "/vehicle/:path*" uniquement pour l'instant).
  matcher: ["/vehicle/:path*"],
};
