/**
 * Registration constants
 */

// Password configuration
export const PASSWORD_SALT_ROUNDS = 10;

// OTP configuration
export const OTP_LENGTH = 6;
export const OTP_EXPIRY_MINUTES = 15;
export const SESSION_EXPIRY_HOURS = 24;
export const OTP_MAX_ATTEMPTS = 5;
export const OTP_LOCK_DURATION_MINUTES = 15;

// Resend configuration
export const MAX_RESENDS = 5;
export const RESEND_COOLDOWN_SECONDS = 60;

// Login configuration
export const MAX_LOGIN_ATTEMPTS = 5;
export const SESSION_EXPIRY_DAYS = 30;

// Session token configuration
export const SESSION_TOKEN_BYTES = 32;
export const AUTH_COOKIE_NAME = "sessionToken";

// Session activity tracking
export const SESSION_ACTIVITY_UPDATE_THRESHOLD_MINUTES = 5;

// Slug generation
export const SLUG_MAX_ATTEMPTS = 5;
export const SLUG_RANDOM_SUFFIX_LENGTH = 4;
