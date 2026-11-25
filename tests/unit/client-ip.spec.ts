import { getClientIp, normalizeIp, isPrivate } from "../../supabase/functions/_shared/client-ip";

const h = (o: Record<string, string>) => new Headers(o);

describe("getClientIp", () => {
  it("prefers cf-connecting-ip over everything", () => {
    expect(
      getClientIp(h({ "cf-connecting-ip": "203.0.113.9", "x-forwarded-for": "1.1.1.1", "x-real-ip": "2.2.2.2" })),
    ).toBe("203.0.113.9");
  });

  it("falls back to x-real-ip", () => {
    expect(getClientIp(h({ "x-real-ip": "198.51.100.4", "x-forwarded-for": "1.1.1.1" }))).toBe("198.51.100.4");
  });

  it("ignores the attacker-controlled first XFF entry and takes the last public one", () => {
    expect(getClientIp(h({ "x-forwarded-for": "6.6.6.6, 203.0.113.9" }))).toBe("203.0.113.9");
  });

  it("skips private/internal hops at the end of XFF", () => {
    expect(getClientIp(h({ "x-forwarded-for": "6.6.6.6, 203.0.113.9, 10.0.0.5, 172.18.0.3" }))).toBe("203.0.113.9");
  });

  it("does not let a spoofed entry create a bucket when a trusted header exists", () => {
    const spoof = h({ "x-forwarded-for": "9.9.9.9", "cf-connecting-ip": "203.0.113.9" });
    expect(getClientIp(spoof)).toBe("203.0.113.9");
  });

  it("returns unknown when nothing usable is present", () => {
    expect(getClientIp(h({}))).toBe("unknown");
    expect(getClientIp(h({ "x-forwarded-for": "garbage, <script>, 999.1.1.1" }))).toBe("unknown");
    expect(getClientIp(h({ "x-forwarded-for": "10.0.0.1, 192.168.1.1" }))).toBe("unknown");
  });

  it("caps attacker-supplied length", () => {
    expect(getClientIp(h({ "cf-connecting-ip": "a".repeat(500) }))).toBe("unknown");
  });
});

describe("normalizeIp", () => {
  it("strips ports and brackets", () => {
    expect(normalizeIp("203.0.113.9:4432")).toBe("203.0.113.9");
    expect(normalizeIp("[2001:db8:1:2:3:4:5:6]:443")).toBe("2001:db8:1:2::/64");
  });

  it("buckets IPv6 to /64 so a free /64 is one bucket", () => {
    expect(normalizeIp("2001:db8:1:2:aaaa::1")).toBe("2001:db8:1:2::/64");
    expect(normalizeIp("2001:db8:1:2:bbbb::9")).toBe("2001:db8:1:2::/64");
    expect(normalizeIp("2001:DB8:0001:0002::1%eth0")).toBe("2001:db8:1:2::/64");
  });

  it("handles IPv4-mapped IPv6", () => {
    expect(normalizeIp("::ffff:203.0.113.9")).toBe("0:0:0:0::/64");
  });

  it("rejects malformed input", () => {
    for (const bad of ["", "1.2.3", "1.2.3.4.5", "256.1.1.1", "2001:::1", "::ffff:300.1.1.1", "abc", "1:2:3:4:5:6:7:8:9"]) {
      expect(normalizeIp(bad)).toBeNull();
    }
  });
});

describe("isPrivate", () => {
  it("classifies ranges", () => {
    for (const p of ["10.1.2.3", "127.0.0.1", "172.16.0.1", "172.31.255.255", "192.168.0.1", "169.254.1.1", "100.64.0.1", "fe80:0:0:0::/64", "fc00:1:2:3::/64", "fd12:1:2:3::/64", "0:0:0:0::/64"]) {
      expect(isPrivate(p)).toBe(true);
    }
    for (const p of ["203.0.113.9", "172.32.0.1", "100.128.0.1", "2001:db8:1:2::/64"]) {
      expect(isPrivate(p)).toBe(false);
    }
  });
});
