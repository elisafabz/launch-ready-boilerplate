// Client IP extraction for rate limiting on unauthenticated endpoints.
//
// Trust model on hosted Supabase (*.supabase.co): requests pass through
// Cloudflare and then Supabase's gateway, which forward headers as-is.
//   1. cf-connecting-ip   set by Cloudflare, overwrites any client value -> trusted
//   2. x-real-ip          set by the gateway's real-IP config (not documented) -> fallback
//   3. x-forwarded-for    the FIRST entry is attacker-controlled; proxies append.
//                         We take the LAST public entry and ignore private/internal hops.
//   4. "unknown"          all headerless requests share one bucket (fail-safe, not fail-open)
//
// Normalisation: port and IPv6 zone stripped, IPv6 bucketed to its /64 (an
// attacker gets a whole /64 for free, per-address keys would be useless),
// length capped so the rate_limits.key column can never be abused.
//
// Pure module (no Deno APIs) so it is unit-tested with vitest in tests/unit.

const MAX_LEN = 64;

export function getClientIp(headers: Headers): string {
  const cf = normalizeIp(headers.get("cf-connecting-ip"));
  if (cf) return cf;

  const real = normalizeIp(headers.get("x-real-ip"));
  if (real) return real;

  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const entries = forwarded.split(",").map((e) => normalizeIp(e));
    for (let i = entries.length - 1; i >= 0; i--) {
      const ip = entries[i];
      if (ip && !isPrivate(ip)) return ip;
    }
  }
  return "unknown";
}

/** Returns a canonical IP string or null if the value is not a valid IP. */
export function normalizeIp(raw: string | null): string | null {
  if (!raw) return null;
  let v = raw.trim();
  if (!v || v.length > 128) return null;

  // [v6]:port or [v6]
  const bracket = v.match(/^\[([^\]]+)\](?::\d{1,5})?$/);
  if (bracket) v = bracket[1];
  // strip IPv6 zone id (fe80::1%eth0)
  v = v.replace(/%.*$/, "");

  if (isIpv4WithOptionalPort(v)) {
    return v.split(":")[0].slice(0, MAX_LEN);
  }
  const v6 = expandIpv6(v);
  if (v6) return bucketIpv6(v6).slice(0, MAX_LEN);
  return null;
}

function isIpv4WithOptionalPort(v: string): boolean {
  const m = v.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})(?::\d{1,5})?$/);
  if (!m) return false;
  return m.slice(1, 5).every((o) => Number(o) <= 255);
}

/** Expands an IPv6 address to 8 hextets, or null if malformed. */
function expandIpv6(v: string): string[] | null {
  if (!v.includes(":") || v.includes(":::")) return null;
  // IPv4-mapped tail (::ffff:1.2.3.4) -> treat as IPv4 for bucketing purposes
  const mapped = v.match(/^(.*:)(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/);
  if (mapped) {
    const [a, b, c, d] = mapped[2].split(".").map(Number);
    if ([a, b, c, d].some((n) => n > 255)) return null;
    v = `${mapped[1]}${((a << 8) | b).toString(16)}:${((c << 8) | d).toString(16)}`;
  }
  const parts = v.split("::");
  if (parts.length > 2) return null;
  const head = parts[0] ? parts[0].split(":") : [];
  const tail = parts.length === 2 && parts[1] ? parts[1].split(":") : [];
  const hex = /^[0-9a-fA-F]{1,4}$/;
  if (![...head, ...tail].every((h) => hex.test(h))) return null;
  let full: string[];
  if (parts.length === 2) {
    const fill = 8 - head.length - tail.length;
    if (fill < 1) return null;
    full = [...head, ...Array(fill).fill("0"), ...tail];
  } else {
    if (head.length !== 8) return null;
    full = head;
  }
  return full.map((h) => h.toLowerCase().replace(/^0+(?=.)/, ""));
}

/** Keeps the first 4 hextets (/64) and marks the bucket explicitly. */
function bucketIpv6(hextets: string[]): string {
  return `${hextets.slice(0, 4).join(":")}::/64`;
}

/** Private, loopback, link-local and CGNAT ranges: never a real client behind a proxy. */
export function isPrivate(ip: string): boolean {
  if (ip.includes(":")) {
    const first = ip.split(":")[0];
    if (first === "" || first === "0") return true; // ::1, ::
    const n = parseInt(first, 16);
    return (n & 0xfe00) === 0xfc00 || (n & 0xffc0) === 0xfe80; // fc00::/7, fe80::/10
  }
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 10 ||
    a === 127 ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 169 && b === 254) ||
    (a === 100 && b >= 64 && b <= 127) ||
    a === 0
  );
}
