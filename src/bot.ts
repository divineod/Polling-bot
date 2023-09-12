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

    private async setupBotListeners() {

        // Fetch all users
        const users = await this.userRepository.getAllUsers();

        // Loop over all users and send them the data
        for (const user of users) {

            if (user.id) {
                console.log(`Sending data to user ${user.firstName}`);

                let data = await fetchData(ENTRY_URL_1, SUGGEST_URL_1);
                this.bot.sendMessage(user.id, `These are the dates from Polizei, ${user.firstName}!`)
                this.bot.sendMessage(user.id, JSON.stringify(data, undefined, 4));

                let data2 = await fetchData(ENTRY_URL_2, SUGGEST_URL_2);
                this.bot.sendMessage(user.id, `These are the dates from nord, ${user.firstName}!`)
                this.bot.sendMessage(user.id, JSON.stringify(data2, undefined, 4));
            } else {
                console.log(`Skipping user ${user.firstName} because they don't have not initiated a chat with the bot.`);
            }
        }


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

        this.bot.onText(/\/nord/, async (msg) => {

            const [isCreated, user] = await this.userRepository.getOrCreate({ id: msg.chat.id.toString(), firstName: msg.chat.first_name })

            console.log(`Got or created user ${isCreated} ${user}`)

            let data = await fetchData(ENTRY_URL_2, SUGGEST_URL_2)
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
    // Check if the user exists in the repository before sending a message
    const userExists = await this.userRepository.userExists(chatId);
    if (userExists) {
        this.bot.sendMessage(chatId, message).catch(error => {
            console.error(`Error sending message to ${chatId}: ${error.message || error}`);
        });
    } else {
        console.warn(`User ${chatId} does not exist or has blocked the bot. Skipping.`);
    }
}
}