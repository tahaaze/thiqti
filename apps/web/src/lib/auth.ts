import { NextRequest, NextResponse } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { Pool } from "pg";

const JWT_SECRET = () => new TextEncoder().encode(process.env.JWT_SECRET || "dev_secret_change_me");
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "30d";
const COOKIE_NAME = "thiqti_session";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string | null;
  emailVerified: boolean;
}

export interface AuthCookie {
  session: SessionUser | null;
  userId: string | null;
}

let pool: Pool | null = null;

export function getAuthPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    pool = new Pool(
      connectionString
        ? {
            connectionString,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
          }
        : {
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || "thiqti",
            password: process.env.DB_PASSWORD || "thiqti_secret",
            database: process.env.DB_NAME || "thiqti",
            connectionTimeoutMillis: 3000,
          }
    );
  }
  return pool;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function generateVerificationCode(length = 6): string {
  const digits = "0123456789";
  let code = "";
  for (let i = 0; i < length; i++) {
    code += digits[Math.floor(Math.random() * digits.length)];
  }
  return code;
}

export async function signSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    emailVerified: user.emailVerified,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(EXPIRES_IN)
    .sign(JWT_SECRET());
}

export async function verifySessionToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      email: (payload.email as string) || "",
      fullName: (payload.fullName as string) || null,
      emailVerified: Boolean(payload.emailVerified),
    };
  } catch {
    return null;
  }
}

/** Lit et décode l'utilisateur depuis le cookie de session (sans toucher au serveur). */
export async function getSessionUser(request: NextRequest): Promise<SessionUser | null> {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

/** Renvoie l'utilisateur à partir des cookies de la requête ; null si non connecté. */
export async function getAuth(request: NextRequest): Promise<AuthCookie> {
  const session = await getSessionUser(request);
  return { session, userId: session?.id || null };
}

export function attachSessionCookie(response: NextResponse, token: string): NextResponse {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return response;
}

export function clearSessionCookie(response: NextResponse): NextResponse {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

export function authFromRequest(user: SessionUser | null, error?: string): NextResponse {
  if (!user) {
    return NextResponse.json({ error: error || "Non connecté" }, { status: 401 });
  }
  return NextResponse.json({ message: "OK" });
}

export async function findUserByEmail(email: string): Promise<SessionUser | null> {
  const p = getAuthPool();
  const res = await p.query(
    "SELECT id, email, full_name, email_verified FROM auth.users WHERE lower(email) = lower($1) LIMIT 1",
    [email]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    emailVerified: row.email_verified,
  };
}

export async function getUserById(id: string): Promise<SessionUser | null> {
  const p = getAuthPool();
  const res = await p.query(
    "SELECT id, email, full_name, email_verified FROM auth.users WHERE id = $1 LIMIT 1",
    [id]
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    emailVerified: row.email_verified,
  };
}
