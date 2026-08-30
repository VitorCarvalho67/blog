import "server-only";
import { createHash, randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { cache } from "react";
import { prisma } from "@/lib/db";

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  keylen: number,
) => Promise<Buffer>;

const COOKIE = "sid";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 dias

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const key = await scryptAsync(password, salt, 64);
  return `${salt}:${key.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string) {
  const [salt, hex] = stored.split(":");
  if (!salt || !hex) return false;
  const key = await scryptAsync(password, salt, 64);
  const expected = Buffer.from(hex, "hex");
  return key.length === expected.length && timingSafeEqual(key, expected);
}

const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");

export async function createSession(userId: string) {
  const token = randomBytes(32).toString("base64url");
  await prisma.session.create({
    data: {
      tokenHash: digest(token),
      userId,
      expiresAt: new Date(Date.now() + MAX_AGE * 1000),
    },
  });
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: digest(token) } });
  }
  jar.delete(COOKIE);
}

/** Usuário da requisição atual, ou null. Deduplicado por request. */
export const getUser = cache(async () => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  const session = await prisma.session.findUnique({
    where: { tokenHash: digest(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  const { passwordHash: _omit, ...user } = session.user;
  return user;
});
