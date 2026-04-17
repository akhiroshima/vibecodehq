/**
 * Server-side allowlist for Deloitte (and regional) domains.
 * Set `ALLOWED_EMAIL_DOMAINS` to a comma-separated list (e.g. `deloitte.com,deloitte.co.uk`).
 */
export function getAllowedEmailDomains(): string[] {
  const raw = process.env.ALLOWED_EMAIL_DOMAINS;
  if (raw && raw.trim().length > 0) {
    return raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
  }
  return ["deloitte.com"];
}

export function isAllowedEmailDomain(email: string): boolean {
  const at = email.lastIndexOf("@");
  if (at < 0) return false;
  const domain = email.slice(at + 1).toLowerCase();
  const allowed = getAllowedEmailDomains();
  return allowed.some((d) => domain === d || domain.endsWith(`.${d}`));
}
