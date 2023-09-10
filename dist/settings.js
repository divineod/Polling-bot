"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validatedEnv = exports.env = void 0;
const zod_1 = require("zod");
exports.env = zod_1.z.object({
    TELEGRAM_BOT_ACCESS_TOKEN: zod_1.z.string().min(1),
    GOOGLE_CREDENTIALS: zod_1.z.string().min(1)
        .transform((str, ctx) => {
        try {
            return JSON.parse(str);
        }
        catch (e) {
            ctx.addIssue({ code: 'custom', message: 'Invalid JSON' });
            return zod_1.z.NEVER;
        }
    }),
});
exports.validatedEnv = exports.env.parse(process.env);
//# sourceMappingURL=settings.js.map