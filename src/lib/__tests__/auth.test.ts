// @vitest-environment node
import { test, expect, vi, beforeEach } from "vitest";
import { SignJWT } from "jose";
import { NextRequest } from "next/server";

const { mockGet, mockSet, mockDelete } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockSet: vi.fn(),
  mockDelete: vi.fn(),
}));

vi.mock("server-only", () => ({}));

vi.mock("next/headers", () => ({
  cookies: vi.fn().mockResolvedValue({
    get: mockGet,
    set: mockSet,
    delete: mockDelete,
  }),
}));

import { createSession, getSession, deleteSession, verifySession } from "@/lib/auth";

const SECRET = Buffer.from("development-secret-key");
const COOKIE_NAME = "auth-token";

async function makeToken(payload: Record<string, unknown>, expiresIn = "7d") {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresIn)
    .setIssuedAt()
    .sign(SECRET);
}

beforeEach(() => {
  vi.clearAllMocks();
});

// --- createSession ---

test("createSession sets an httpOnly cookie", async () => {
  await createSession("user-1", "test@example.com");

  expect(mockSet).toHaveBeenCalledOnce();
  const [name, , options] = mockSet.mock.calls[0];
  expect(name).toBe(COOKIE_NAME);
  expect(options.httpOnly).toBe(true);
  expect(options.sameSite).toBe("lax");
  expect(options.path).toBe("/");
});

test("createSession stores a valid JWT", async () => {
  await createSession("user-1", "test@example.com");

  const token = mockSet.mock.calls[0][1];
  expect(typeof token).toBe("string");
  expect(token.split(".")).toHaveLength(3);
});

test("createSession sets cookie expiry ~7 days from now", async () => {
  await createSession("user-1", "test@example.com");

  const options = mockSet.mock.calls[0][2];
  const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
  const delta = options.expires.getTime() - Date.now();
  expect(delta).toBeGreaterThan(sevenDaysMs - 5000);
  expect(delta).toBeLessThanOrEqual(sevenDaysMs);
});

// --- getSession ---

test("getSession returns null when no cookie is present", async () => {
  mockGet.mockReturnValue(undefined);

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns null for an invalid token", async () => {
  mockGet.mockReturnValue({ value: "not.a.valid.token" });

  const session = await getSession();
  expect(session).toBeNull();
});

test("getSession returns the session payload for a valid token", async () => {
  const token = await makeToken({ userId: "user-1", email: "test@example.com", expiresAt: new Date() });
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session?.userId).toBe("user-1");
  expect(session?.email).toBe("test@example.com");
});

test("getSession returns null for a token signed with a different secret", async () => {
  const wrongSecret = Buffer.from("wrong-secret");
  const token = await new SignJWT({ userId: "user-1", email: "test@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(wrongSecret);
  mockGet.mockReturnValue({ value: token });

  const session = await getSession();
  expect(session).toBeNull();
});

// --- deleteSession ---

test("deleteSession removes the auth cookie", async () => {
  await deleteSession();

  expect(mockDelete).toHaveBeenCalledOnce();
  expect(mockDelete).toHaveBeenCalledWith(COOKIE_NAME);
});

// --- verifySession ---

test("verifySession returns null when no cookie in request", async () => {
  const request = new NextRequest("http://localhost/api/test");

  const session = await verifySession(request);
  expect(session).toBeNull();
});

test("verifySession returns null for an invalid token in request", async () => {
  const request = new NextRequest("http://localhost/api/test", {
    headers: { cookie: `${COOKIE_NAME}=bad-token` },
  });

  const session = await verifySession(request);
  expect(session).toBeNull();
});

test("verifySession returns session payload for a valid token in request", async () => {
  const token = await makeToken({ userId: "user-2", email: "hello@example.com", expiresAt: new Date() });
  const request = new NextRequest("http://localhost/api/test", {
    headers: { cookie: `${COOKIE_NAME}=${token}` },
  });

  const session = await verifySession(request);
  expect(session?.userId).toBe("user-2");
  expect(session?.email).toBe("hello@example.com");
});

test("verifySession returns null for a token signed with a different secret", async () => {
  const wrongSecret = Buffer.from("wrong-secret");
  const token = await new SignJWT({ userId: "user-1", email: "test@example.com" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(wrongSecret);
  const request = new NextRequest("http://localhost/api/test", {
    headers: { cookie: `${COOKIE_NAME}=${token}` },
  });

  const session = await verifySession(request);
  expect(session).toBeNull();
});
