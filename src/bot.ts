import TelegramBot = require('node-telegram-bot-api')
import { FirestoreUserRepository, User } from "./firestore"


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

            const [isCreated, user] = await this.userRepository.getOrCreate({ chatId: msg.chat.id.toString() })

            console.log(`Got or created user ${isCreated} ${user}`)

            if (isCreated) {
                this.bot.sendMessage(msg.chat.id, `You are now subscribed, ${user.chatId}!`)
            } else {
                this.bot.sendMessage(msg.chat.id, `Welcome back, ${user.chatId}!`)
            }

        })

        this.bot.on('text', async (msg) => {
            this.bot.sendMessage(msg.chat.id, "I am online!")
        })

        this.bot.on('polling_error', (error) => {
            console.error(`Telegram polling error: ${error}`)
        })

        console.log('Telegram bot is running...')
    }
}