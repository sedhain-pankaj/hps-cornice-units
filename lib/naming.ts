/**
 * Owner-name rules: letters only (A–Z, a–z), 1–10 characters, no spaces or
 * other characters. The name is embedded in export filenames, so it's kept to
 * the safest possible character set.
 */
export function isValidOwnerName(name: string): boolean {
  return /^[A-Za-z]{1,10}$/.test(name);
}
