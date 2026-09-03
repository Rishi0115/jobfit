import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "@/lib/validators/auth";

describe("loginSchema", () => {
  it("accepts valid credentials", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "password123",
    });
    expect(result.success).toBe(true);
  });

  it("normalizes email to lowercase", () => {
    const result = loginSchema.safeParse({
      email: "  User@EXAMPLE.COM  ",
      password: "password123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("user@example.com");
    }
  });

  it("rejects invalid email", () => {
    const result = loginSchema.safeParse({
      email: "not-an-email",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty password", () => {
    const result = loginSchema.safeParse({
      email: "user@example.com",
      password: "",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty email", () => {
    const result = loginSchema.safeParse({
      email: "",
      password: "password123",
    });
    expect(result.success).toBe(false);
  });
});

describe("registerSchema", () => {
  const validInput = {
    name: "John Doe",
    email: "john@example.com",
    password: "StrongPass1",
    confirmPassword: "StrongPass1",
  };

  it("accepts valid registration input", () => {
    const result = registerSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it("normalizes email to lowercase", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      email: "  JOHN@Example.COM  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.email).toBe("john@example.com");
    }
  });

  it("trims name whitespace", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      name: "  John Doe  ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("John Doe");
    }
  });

  it("rejects short name", () => {
    const result = registerSchema.safeParse({ ...validInput, name: "J" });
    expect(result.success).toBe(false);
  });

  it("rejects short password", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "Ab1",
      confirmPassword: "Ab1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "alllowercase1",
      confirmPassword: "alllowercase1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without lowercase", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "ALLUPPERCASE1",
      confirmPassword: "ALLUPPERCASE1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      password: "NoNumberHere",
      confirmPassword: "NoNumberHere",
    });
    expect(result.success).toBe(false);
  });

  it("rejects mismatched passwords", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      confirmPassword: "DifferentPass1",
    });
    expect(result.success).toBe(false);
  });

  it("does NOT accept a role field (role escalation prevention)", () => {
    // The schema should not include a 'role' field at all.
    // Even if someone passes one, it should be stripped.
    const result = registerSchema.safeParse({
      ...validInput,
      role: "ADMIN",
    });
    // The parse still succeeds because unknown keys are stripped by default,
    // but the output must NOT contain a role field.
    if (result.success) {
      expect("role" in result.data).toBe(false);
    }
    // Either way, an ADMIN role must not leak through
  });

  it("rejects invalid email", () => {
    const result = registerSchema.safeParse({
      ...validInput,
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = registerSchema.safeParse({ ...validInput, name: "" });
    expect(result.success).toBe(false);
  });
});
