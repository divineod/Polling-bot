import { TelegramConnection } from "./bot"
import { fetchData, fetchPolizei } from "./fetcher"
import { FirestoreUserRepository, User } from "./firestore"
import { validatedEnv } from "./settings"

export function runCronJob(): void {
    const userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS);
    const tgConnection = new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);

    fetchPolizei().then((timeTable) => {
        userRepository.mapAll((user: User) => {
            tgConnection.sendMessage(user.id, JSON.stringify(timeTable, undefined, 4));
        });
    });
}