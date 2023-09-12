import TelegramBot = require('node-telegram-bot-api')
import { FirestoreUserRepository, User } from "./firestore"
import { ENTRY_URL_1, ENTRY_URL_2, SUGGEST_URL_1, SUGGEST_URL_2, fetchData } from './fetcher'


export class TelegramConnection {
    private bot: TelegramBot
    private userRepository: FirestoreUserRepository

    constructor(token: string, userRepository: FirestoreUserRepository) {
        // Initialize the Telegram Bot
        this.bot = new TelegramBot(token, { polling: true })

        // Initialize Firestore repository
        this.userRepository = userRepository

        this.setupBotListeners()
    }

    private setupBotListeners() {
        this.bot.onText(/\/start/, async (msg) => {

            const [isCreated, user] = await this.userRepository.getOrCreate({ id: msg.chat.id.toString(), firstName: msg.chat.first_name })

            console.log(`Got or created user ${isCreated} ${user}`)

            if (isCreated) {
                this.bot.sendMessage(msg.chat.id, `You are now subscribed, ${user.firstName}!`)
            } else {
                this.bot.sendMessage(msg.chat.id, `Welcome back, ${user.firstName}!`)
            }

            let data = await fetchData(ENTRY_URL_1, SUGGEST_URL_1)
            this.bot.sendMessage(msg.chat.id, JSON.stringify(data, undefined, 4))
        })

        this.bot.on('text', async (msg) => {
            this.bot.sendMessage(msg.chat.id, "I am online!")
        })

        this.bot.on('polling_error', (error) => {
            console.error(`Telegram polling error: ${error.message || error}`);
        });


        console.log('Telegram bot is running...')
    }

    async sendMessage(chatId: string, message: string) {
        this.bot.sendMessage(chatId, message)
    }
}