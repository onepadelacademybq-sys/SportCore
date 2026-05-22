import dotenv from "dotenv";
import { defineConfig } from "prisma/config";

// .env.local tiene prioridad (desarrollo local)
// .env sirve de fallback para CI/CD
dotenv.config({ path: ".env.local", override: true });
dotenv.config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma 7: usa DIRECT_URL para migraciones (conexión directa, sin pgBouncer)
    // El cliente en runtime usa DATABASE_URL (pooled) pasado al constructor de PrismaClient
    url: process.env["DIRECT_URL"],
  },
});
