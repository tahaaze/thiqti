import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "thiqti_session";

function getSecret(): Uint8Array {
  return new TextEncoder().encode(process.env.JWT_SECRET || "dev_secret_change_me");
}

async function getSessionPayload(request: NextRequest): Promise<{ sub?: string; emailVerified?: boolean } | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return { sub: payload.sub as string | undefined, emailVerified: payload.emailVerified as boolean | undefined };
  } catch {
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const session = await getSessionPayload(request);

  // Pages publiques accessibles sans connexion ni vérification
  const isPublicPage = pathname === "/" || pathname === "/login" || pathname.startsWith("/api/auth/");

  if (!session) {
    // Non connecté : bloquer les pages protégées
    if (!isPublicPage) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/login";
      loginUrl.search = "";
      loginUrl.searchParams.set("next", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
    return NextResponse.next();
  }

  // Connecté mais email non vérifié : rediriger vers /login (qui affichera l'écran de vérification)
  if (session.emailVerified === false && !isPublicPage) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("verify", "1");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth/).*)"],
};
