import { TelegramConnection } from "./bot"
import { fetchData, fetchBremenMitte, fetchBremenNord } from "./fetcher"
import { FirestoreUserRepository, User } from "./firestore"
import { validatedEnv } from "./settings"

var days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];


// Convert the dictionary to a human-readable text
export function dictionaryToText(site: 'nord' | 'mitte' | 'polizei', dictionary: { [date: string]: string[] }): string {
    let text = `🍔 🤖\n\n${site.toUpperCase()}` + '\n\n\n';

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
        text += '\n\n'
    }
    return text;
}

export function runCronJob(): void {
    const userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS);
    const tgConnection = new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);

    fetchBremenMitte().then((timeTable) => {
        const output = dictionaryToText('mitte', timeTable);
        userRepository.mapAll((user: User) => {
            tgConnection.sendMessageWithImage(user.id, output);
        });
    });

    fetchBremenNord().then((timeTableNord) => {
        const output = dictionaryToText('nord', timeTableNord);
        userRepository.mapAll((user: User) => {
            tgConnection.sendMessageWithImage(user.id, output);
        });
    });
}