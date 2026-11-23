import "dotenv/config";
import { betterAuth } from "better-auth";
import { prismaAdapter } from "@better-auth/prisma-adapter";
import { admin } from "better-auth/plugins";
import { adminAc, userAc } from "better-auth/plugins/admin/access";
import { nextCookies } from "better-auth/next-js";
import { db } from "./db";

export const auth = betterAuth({
  appName: "Xây Code",
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  database: prismaAdapter(db, { provider: "postgresql", transaction: true }),
  emailAndPassword: { enabled: true, disableSignUp: true, minPasswordLength: 12 },
  user: {
    additionalFields: {
      phone: { type: "string", required: false, input: false },
      affiliateCode: { type: "string", required: false, input: false },
      mustChange: { type: "boolean", required: false, input: false, defaultValue: false },
    },
  },
  advanced: { ipAddress: { ipAddressHeaders: ["x-real-ip"] } },
  rateLimit: { enabled: true, storage: "memory" },
  plugins: [admin({ defaultRole: "affiliate", roles: { admin: adminAc, affiliate: userAc } }), nextCookies()],
});
