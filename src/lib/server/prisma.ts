import { PrismaClient } from "@prisma/client";
import { IS_DEVELOPMENT, IS_PRODUCTION } from "./constants/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: IS_DEVELOPMENT ? ["query", "error", "warn"] : ["error"],
  });

if (!IS_PRODUCTION) globalForPrisma.prisma = prisma;
