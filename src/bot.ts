import TelegramBot = require('node-telegram-bot-api')
import { FirestoreUserRepository, User } from "./firestore"
import { ENTRY_URL_1, ENTRY_URL_2, SUGGEST_URL_1, SUGGEST_URL_2, ENTRY_URL_3, SUGGEST_URL_3, fetchData } from './fetcher'

export class TelegramConnection {
    private bot: TelegramBot;
    private userRepository: FirestoreUserRepository;
    private previousData: { [key: string]: any } = {};

    constructor(token: string, userRepository: FirestoreUserRepository) {
        this.bot = new TelegramBot(token, { polling: true });
        this.userRepository = userRepository;
        this.setupBotListeners();
    }

    private async broadcastToUsers(data: any, title: string) {
        if (JSON.stringify(data) !== JSON.stringify(this.previousData[title]) && Object.keys(data).length > 0) {
            const users = await this.userRepository.getAllUsers();
            for (const user of users) {
                if (user.id) {
                    this.bot.sendMessage(user.id, `These are the dates from ${title}, ${user.firstName}!`);
                    this.bot.sendMessage(user.id, JSON.stringify(data, undefined, 4));
                }
            }
            this.previousData[title] = data;
        }
    }

    private async setupBotListeners() {
        const dataSets = [
            { url1: ENTRY_URL_2, url2: SUGGEST_URL_2, title: "Nord" },
            { url1: ENTRY_URL_3, url2: SUGGEST_URL_3, title: "Mitte" }
        ];

        for (const dataSet of dataSets) {
            const data = await fetchData(dataSet.url1, dataSet.url2);
            await this.broadcastToUsers(data, dataSet.title);
        }

        this.bot.onText(/\/start/, async (msg) => {
            const [isCreated, user] = await this.userRepository.getOrCreate({ id: msg.chat.id.toString(), firstName: msg.chat.first_name });
            if (isCreated) {
                this.bot.sendMessage(msg.chat.id, `You are now subscribed, ${user.firstName}!`);
            } else {
                this.bot.sendMessage(msg.chat.id, `Welcome back, ${user.firstName}!`);
            }
        });

        this.bot.onText(/\/nord/, async (msg) => {
            const data = await fetchData(ENTRY_URL_2, SUGGEST_URL_2);
            if (Object.keys(data).length > 0) {
                this.bot.sendMessage(msg.chat.id, JSON.stringify(data, undefined, 4));
            }
        });

        this.bot.on('text', async (msg) => {
            this.bot.sendMessage(msg.chat.id, "I am online!");
        });

        this.bot.on('polling_error', (error) => {
            console.error(`Telegram polling error: ${error.message || error}`);
        });

        console.log('Telegram bot is running...');
    }

    async sendMessage(chatId: string, message: string) {
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
