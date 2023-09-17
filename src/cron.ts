import { TelegramConnection } from "./bot"
import { fetchData, fetchBremenMitte, fetchBremenNord } from "./fetcher"
import { FirestoreUserRepository, User } from "./firestore"
import { validatedEnv } from "./settings"

export function runCronJob(): void {
    const userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS);
    const tgConnection = new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);

    fetchBremenMitte().then((timeTable) => {
        userRepository.mapAll((user: User) => {
            tgConnection.sendMessage(user.id, JSON.stringify(timeTable, undefined, 4));
        });
    });

    fetchBremenNord().then((timeTableNord) => {
        userRepository.mapAll((user: User) => {
            tgConnection.sendMessage(user.id, JSON.stringify(timeTableNord, undefined, 4));
        });
    });
}