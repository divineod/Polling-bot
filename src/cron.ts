import { TelegramConnection } from "./bot"
import { fetchData, fetchPolizei } from "./fetcher"
import { FirestoreUserRepository, User } from "./firestore"
import { validatedEnv } from "./settings"

export function runCronJob(req: any, res: any) {
    let userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS)
    let tgConnection = new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository)

    fetchPolizei().then((timeTable: any) => {
        userRepository.mapAll((user: User) => {
            tgConnection.sendMessage(user.id, JSON.stringify(timeTable, undefined, 4))
        })
    })
}