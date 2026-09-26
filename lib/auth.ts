// Admin gate. The app is fully static (no server), so the password is
// verified client-side against its SHA-256 hash. Note: the hash ships in the
// client bundle, so this is a deterrent gate ("Unauthorised Access
// Restricted"), not real security.
export const ADMIN_PASSWORD_HASH =
  "74327943f791e17b6081b590be47d518d885b79972d37087df480448e0672094";

export async function verifyAdminPassword(
  password: string
): Promise<boolean> {
  try {
    const buf = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(password)
    );
    const hex = Array.from(new Uint8Array(buf))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return hex === ADMIN_PASSWORD_HASH;
  } catch {
    // crypto.subtle needs a secure context (https/localhost).
    return false;
  }
}
