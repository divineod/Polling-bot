"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCronJob = exports.dictionaryToText = void 0;
const bot_1 = require("./bot");
// import { fetchData } from './fetchData';
const firestore_1 = require("./firestore");
const settings_1 = require("./settings");
var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
// Convert the dictionary to a human-readable text
function dictionaryToText(site, dictionary) {
    let text = `${site.toUpperCase()}` + ' 🍔🤖' + '\n\n';
    console.log(`Date dictionary for ${site} is ${JSON.stringify(dictionary)}`);
    if (Object.keys(dictionary).length == 0) {
        return text + "No dates available.";
    }
    for (const date in dictionary) {
        const parts = date.split("."); // Split the date string by hyphens
        const day = parseInt(parts[0], 10); // Parse the day as an integer
        const month = parseInt(parts[1], 10) - 1; // Parse the month as an integer (subtract 1 as months are 0-based)
        const year = parseInt(parts[2], 10); // Parse the year as an integer
        const dateObject = new Date(year, month, day);
        text += `  *${days[dateObject.getDay()]} ${date}*\n`;
        for (const time of dictionary[date]) {
            text += `    ${time}\n`;
        }
        text += '\n\n';
    }
    return text;
}
exports.dictionaryToText = dictionaryToText;
function runCronJob() {
    const userRepository = new firestore_1.FirestoreUserRepository(settings_1.validatedEnv.GOOGLE_CREDENTIALS);
    const tgConnection = new bot_1.TelegramConnection(settings_1.validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);
    // TODO: rewrite to use fetchData
    // fetchBremenMitte().then((timeTable) => {
    //     const output = dictionaryToText('mitte', timeTable);
    //     userRepository.mapAll((user: User) => {
    //         tgConnection.sendMessageWithImage(user.id, output);
    //     });
    // });
    // fetchBremenNord().then((timeTableNord) => {
    //     const output = dictionaryToText('nord', timeTableNord);
    //     userRepository.mapAll((user: User) => {
    //         tgConnection.sendMessageWithImage(user.id, output);
    //     });
    // });
}
exports.runCronJob = runCronJob;
//# sourceMappingURL=cron.js.map