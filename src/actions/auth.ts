"use server";

import bcrypt from "bcryptjs";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { registerSchema, loginSchema } from "@/lib/validators/auth";
import type { ApiResponse } from "@/types";

const BCRYPT_ROUNDS = 12;

/**
 * Register a new user with STUDENT role.
 * Role is always forced to STUDENT — never client-controlled.
 */
export async function registerUser(
  formData: FormData
): Promise<ApiResponse<{ userId: string }>> {
  try {
    const raw = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
      confirmPassword: formData.get("confirmPassword") as string,
    };

    const validated = registerSchema.safeParse(raw);
    if (!validated.success) {
      const fieldErrors = validated.error.flatten().fieldErrors;
      const firstError =
        Object.values(fieldErrors).flat()[0] ?? "Invalid input";
      return { success: false, error: firstError };
    }

    const { name, email, password } = validated.data;

    // Check for existing user
    const existing = await db.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (existing) {
      // Generic message — do not reveal whether email exists
      return {
        success: false,
        error: "An account with this email already exists",
      };
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create user with STUDENT role — never allow client to set role
    const user = await db.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "STUDENT",
        profile: {
          create: {},
        },
      },
      select: { id: true },
    });

    return { success: true, data: { userId: user.id } };
  } catch (error) {
    console.error("[registerUser]", error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}

/**
 * Login using Auth.js credentials provider.
 */
export async function loginUser(
  formData: FormData
): Promise<ApiResponse> {
  try {
    const raw = {
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    const validated = loginSchema.safeParse(raw);
    if (!validated.success) {
      const firstError =
        Object.values(validated.error.flatten().fieldErrors).flat()[0] ??
        "Invalid input";
      return { success: false, error: firstError };
    }

    await signIn("credentials", {
      email: validated.data.email,
      password: validated.data.password,
      redirect: false,
    });

    return { success: true };
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return { success: false, error: "Invalid email or password" };
      }
    }
    // Re-throw redirect errors from Auth.js (these are expected)
    throw error;
  }
}

/**
 * Sign out the current user.
 */
export async function logoutUser(): Promise<void> {
  await signOut({ redirect: false });
}
