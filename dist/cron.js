"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCronJob = void 0;
const bot_1 = require("./bot");
const fetcher_1 = require("./fetcher");
const firestore_1 = require("./firestore");
const settings_1 = require("./settings");
function runCronJob(req, res) {
    let userRepository = new firestore_1.FirestoreUserRepository(settings_1.validatedEnv.GOOGLE_CREDENTIALS);
    let tgConnection = new bot_1.TelegramConnection(settings_1.validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);
    (0, fetcher_1.fetchPolizei)().then((timeTable) => {
        userRepository.mapAll((user) => {
            tgConnection.sendMessage(user.id, JSON.stringify(timeTable, undefined, 4));
        });
    });
}
exports.runCronJob = runCronJob;
//# sourceMappingURL=cron.js.map