import { z } from "zod/v4";
import { config as dotenv } from "dotenv";

dotenv();

const envSchema = z.object({
  PORT: z.coerce.number().int(),
  HOST: z.string(),
  DATABASE_URL: z.string(),
  CORS_ORIGIN: z.url(),
});

export const config = envSchema.parse(process.env);
