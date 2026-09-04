// src/__tests__/jobs/sync/provider-registry.test.ts

import { describe, it, expect, vi, afterEach } from "vitest";
import { getAvailableJobAdapters } from "@/services/jobs/registry/provider-registry";
import { MockJobAdapter } from "@/services/jobs/adapters/mock-adapter";
import { RemotiveAdapter } from "@/services/jobs/adapters/remotive-adapter";
import { ArbeitnowAdapter } from "@/services/jobs/adapters/arbeitnow-adapter";
import { AdzunaAdapter } from "@/services/jobs/adapters/adzuna-adapter";
import { GreenhouseAdapter } from "@/services/jobs/adapters/greenhouse-adapter";
import { LeverAdapter } from "@/services/jobs/adapters/lever-adapter";

function mockAvailability(adapterClass: any, available: boolean) {
  vi.spyOn(adapterClass.prototype, "isAvailable" as any).mockResolvedValue(
    available
  );
}

describe("Provider Registry", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    vi.restoreAllMocks();
    (process.env as any).NODE_ENV = originalEnv;
  });

  it("includes all real adapters when available", async () => {
    (process.env as any).NODE_ENV = "production";
    mockAvailability(RemotiveAdapter, true);
    mockAvailability(ArbeitnowAdapter, true);
    mockAvailability(AdzunaAdapter, true);
    mockAvailability(GreenhouseAdapter, true);
    mockAvailability(LeverAdapter, true);

    const adapters = await getAvailableJobAdapters();
    const names = adapters.map((a) => a.sourceName);

    expect(names).toContain("remotive");
    expect(names).toContain("arbeitnow");
    expect(names).toContain("adzuna-in");
    expect(names.some((n) => n.startsWith("greenhouse:"))).toBe(true);
    expect(names.some((n) => n.startsWith("lever:"))).toBe(true);
    expect(names).not.toContain("mock");
  });

  it("excludes unavailable adapters", async () => {
    mockAvailability(RemotiveAdapter, false);
    const adapters = await getAvailableJobAdapters();
    const names = adapters.map((a) => a.sourceName);
    expect(names).not.toContain("remotive");
  });

  it("includes MockJobAdapter only when not production", async () => {
    (process.env as any).NODE_ENV = "development";
    mockAvailability(MockJobAdapter, true);
    const adapters = await getAvailableJobAdapters();
    const names = adapters.map((a) => a.sourceName);
    expect(names).toContain("mock");
  });

  it("never includes MockJobAdapter in production", async () => {
    (process.env as any).NODE_ENV = "production";
    mockAvailability(MockJobAdapter, true);
    const adapters = await getAvailableJobAdapters();
    const names = adapters.map((a) => a.sourceName);
    expect(names).not.toContain("mock");
  });
});
