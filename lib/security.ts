import { createHash, createHmac, randomUUID, timingSafeEqual } from "node:crypto";

const PASSWORD_SALT = "arena-ca-local-salt";
const SESSION_SECRET =
  process.env.SESSION_SECRET ?? "arena-ca-local-session-secret-change-me";
const SESSION_VERSION = "v1";

export function hashPassword(password: string) {
  return createHash("sha256")
    .update(`${PASSWORD_SALT}:${password}`)
    .digest("hex");
}

export function verifyPassword(password: string, passwordHash: string) {
  return hashPassword(password) === passwordHash;
}

export function signSession(userId: string) {
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(`${SESSION_VERSION}:${userId}`)
    .digest("hex");

  return `${SESSION_VERSION}.${userId}.${signature}`;
}

export function verifySignedSession(sessionValue: string) {
  const [version, userId, signature] = sessionValue.split(".");

  if (!version || !userId || !signature || version !== SESSION_VERSION) {
    return null;
  }

  const expected = createHmac("sha256", SESSION_SECRET)
    .update(`${version}:${userId}`)
    .digest("hex");

  const signatureBuffer = Buffer.from(signature, "hex");
  const expectedBuffer = Buffer.from(expected, "hex");

  if (signatureBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!timingSafeEqual(signatureBuffer, expectedBuffer)) {
    return null;
  }

  return userId;
}

export function makeId(prefix: string) {
  const raw = randomUUID().replaceAll("-", "").slice(0, 10);
  return `${prefix}_${raw}`;
}

export function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}
