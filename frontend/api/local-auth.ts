import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";
import * as LocalAuthentication from "expo-local-authentication";

const PASSWORD_HASH_KEY = "password_hash_v1";
const PASSWORD_SALT_KEY = "password_salt_v1";
const FAILED_ATTEMPTS_KEY = "password_failed_attempts_v1";
const LOCKOUT_UNTIL_KEY = "password_lockout_until_v1";

const MAX_FAILED_ATTEMPTS = 3;
const LOCKOUT_MS = 30_000;

type VerifyPasswordResult =
  | { ok: true }
  | { ok: false; reason: "incorrect" }
  | { ok: false; reason: "not-configured" }
  | { ok: false; reason: "locked"; remainingLockoutMs: number };

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256(value: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    value
  );
}

async function hashPin(pin: string, salt: string): Promise<string> {
  return sha256(`${salt}:${pin}`);
}

async function getFailedAttempts(): Promise<number> {
  const value = await SecureStore.getItemAsync(FAILED_ATTEMPTS_KEY);
  return value ? Number(value) || 0 : 0;
}

async function setFailedAttempts(value: number): Promise<void> {
  await SecureStore.setItemAsync(FAILED_ATTEMPTS_KEY, String(value));
}

async function clearFailedAttempts(): Promise<void> {
  await SecureStore.deleteItemAsync(FAILED_ATTEMPTS_KEY);
}

async function getLockoutUntil(): Promise<number> {
  const value = await SecureStore.getItemAsync(LOCKOUT_UNTIL_KEY);
  return value ? Number(value) || 0 : 0;
}

async function setLockoutUntil(timestampMs: number): Promise<void> {
  await SecureStore.setItemAsync(LOCKOUT_UNTIL_KEY, String(timestampMs));
}

async function clearLockout(): Promise<void> {
  await SecureStore.deleteItemAsync(LOCKOUT_UNTIL_KEY);
}

export async function hasPassword(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PASSWORD_HASH_KEY);
  const salt = await SecureStore.getItemAsync(PASSWORD_SALT_KEY);

  return (
    typeof hash === "string" &&
    hash.length > 0 &&
    typeof salt === "string" &&
    salt.length > 0
  );
}

export async function setPassword(pin: string): Promise<void> {
  if (!/^\d{4}$/.test(pin)) {
    throw new Error("PIN must be exactly 4 digits.");
  }

  const salt = bytesToHex(Crypto.getRandomBytes(16));
  const hash = await hashPin(pin, salt);

  await SecureStore.setItemAsync(PASSWORD_SALT_KEY, salt);
  await SecureStore.setItemAsync(PASSWORD_HASH_KEY, hash);
  await clearFailedAttempts();
  await clearLockout();
}

export async function verifyPassword(pin: string): Promise<VerifyPasswordResult> {
  const configured = await hasPassword();

  if (!configured) {
    return { ok: false, reason: "not-configured" };
  }

  const now = Date.now();
  const lockoutUntil = await getLockoutUntil();

  if (lockoutUntil > now) {
    return {
      ok: false,
      reason: "locked",
      remainingLockoutMs: lockoutUntil - now,
    };
  }

  if (!/^\d{4}$/.test(pin)) {
    return { ok: false, reason: "incorrect" };
  }

  const salt = await SecureStore.getItemAsync(PASSWORD_SALT_KEY);
  const storedHash = await SecureStore.getItemAsync(PASSWORD_HASH_KEY);

  if (!salt || !storedHash) {
    return { ok: false, reason: "not-configured" };
  }

  const candidateHash = await hashPin(pin, salt);

  if (candidateHash === storedHash) {
    await clearFailedAttempts();
    await clearLockout();
    return { ok: true };
  }

  const attempts = (await getFailedAttempts()) + 1;
  await setFailedAttempts(attempts);

  if (attempts >= MAX_FAILED_ATTEMPTS) {
    const until = Date.now() + LOCKOUT_MS;
    await setLockoutUntil(until);
    await clearFailedAttempts();

    return {
      ok: false,
      reason: "locked",
      remainingLockoutMs: LOCKOUT_MS,
    };
  }

  return { ok: false, reason: "incorrect" };
}

export async function clearPassword(): Promise<void> {
  await SecureStore.deleteItemAsync(PASSWORD_HASH_KEY);
  await SecureStore.deleteItemAsync(PASSWORD_SALT_KEY);
  await clearFailedAttempts();
  await clearLockout();
}

export async function authenticateBiometrics(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  if (!hasHardware) return false;

  const isEnrolled = await LocalAuthentication.isEnrolledAsync();
  if (!isEnrolled) return false;

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Authenticate to continue",
    fallbackLabel: "Use PIN",
    disableDeviceFallback: true, // set false to allow passcode fallback
  });

  return result.success;
}