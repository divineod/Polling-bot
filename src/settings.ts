import { z } from "zod";


export const env = z.object({
  TELEGRAM_BOT_ACCESS_TOKEN: z.string().min(1),
  GOOGLE_CREDENTIALS: z.string().min(1)
    .transform((str, ctx) => {
      try {
        return JSON.parse(str)
      } catch (e) {
        ctx.addIssue({ code: 'custom', message: 'Invalid JSON' })
        return z.NEVER
      }
    }),
  ENABLE_MITM: z.coerce.boolean()
});

export const validatedEnv = env.parse(process.env);
