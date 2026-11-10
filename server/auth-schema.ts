/**
 * Better Auth's tables for this setup (authOptions in auth.ts), from its own migration planner
 * (`getMigrations(...).compileMigrations()`), made safe to run on every cold start. test/auth.test.ts
 * checks this against the planner, so a Better Auth upgrade that needs new columns fails a test.
 */
export const AUTH_SCHEMA = [
  `CREATE TABLE IF NOT EXISTS "auth_user" ("id" text not null primary key, "name" text not null, "email" text not null unique, "emailVerified" boolean not null, "image" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null)`,
  `CREATE TABLE IF NOT EXISTS "auth_session" ("id" text not null primary key, "expiresAt" timestamptz not null, "token" text not null unique, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null, "ipAddress" text, "userAgent" text, "userId" text not null references "auth_user" ("id") on delete cascade, "linkedDevice" boolean, "diaryId" text)`,
  // Added for linked iPads after the first tables went out, so older tables get them too.
  `ALTER TABLE "auth_session" ADD COLUMN IF NOT EXISTS "linkedDevice" boolean`,
  `ALTER TABLE "auth_session" ADD COLUMN IF NOT EXISTS "diaryId" text`,
  `CREATE TABLE IF NOT EXISTS "auth_account" ("id" text not null primary key, "accountId" text not null, "providerId" text not null, "userId" text not null references "auth_user" ("id") on delete cascade, "accessToken" text, "refreshToken" text, "idToken" text, "accessTokenExpiresAt" timestamptz, "refreshTokenExpiresAt" timestamptz, "scope" text, "password" text, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz not null)`,
  `CREATE TABLE IF NOT EXISTS "auth_verification" ("id" text not null primary key, "identifier" text not null, "value" text not null, "expiresAt" timestamptz not null, "createdAt" timestamptz default CURRENT_TIMESTAMP not null, "updatedAt" timestamptz default CURRENT_TIMESTAMP not null)`,
  `CREATE TABLE IF NOT EXISTS "auth_device_code" ("id" text not null primary key, "deviceCode" text not null, "userCode" text not null, "userId" text, "expiresAt" timestamptz not null, "status" text not null, "lastPolledAt" timestamptz, "pollingInterval" integer, "clientId" text, "scope" text)`,
  `CREATE INDEX IF NOT EXISTS "auth_session_userId_idx" on "auth_session" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "auth_account_userId_idx" on "auth_account" ("userId")`,
  `CREATE INDEX IF NOT EXISTS "auth_verification_identifier_idx" on "auth_verification" ("identifier")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "auth_device_code_deviceCode_uidx" on "auth_device_code" ("deviceCode")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "auth_device_code_userCode_uidx" on "auth_device_code" ("userCode")`,
]

/**
 * True once everything in AUTH_SCHEMA is in place: the columns added after the first tables went
 * out, and the last index. One query on a cold start instead of running every statement. When
 * AUTH_SCHEMA grows, check for the new piece here too.
 */
export const AUTH_SCHEMA_READY = `SELECT to_regclass('"auth_device_code_userCode_uidx"') IS NOT NULL AND (
  SELECT count(*) FROM information_schema.columns
  WHERE table_schema = current_schema() AND table_name = 'auth_session' AND column_name IN ('linkedDevice', 'diaryId')) = 2 AS ready`
