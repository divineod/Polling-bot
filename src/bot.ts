import TelegramBot = require('node-telegram-bot-api');
import { FirestoreUserRepository, FirestoreDatesRepository, User } from "./firestore";

import { validatedEnv } from "./settings";
import { ENTRY_URL_2, SUGGEST_URL_2, ENTRY_URL_3, SUGGEST_URL_3, fetchData } from './fetcher';
import moment from 'moment';
import { dictionaryToText } from './cron';


class DataSet {
    constructor(
        public title: "mitte" | "nord" | "polizei",
        public url1: string,
        public url2: string
    ) { }
}

export class TelegramConnection {
    private bot: TelegramBot;
    private userRepository: FirestoreUserRepository;
    private datesRepository: FirestoreDatesRepository;

    constructor(token: string, userRepository: FirestoreUserRepository) {
        console.log('Got here.')
        this.bot = new TelegramBot(token, { polling: true });
        this.userRepository = userRepository;
        this.datesRepository = new FirestoreDatesRepository(validatedEnv.GOOGLE_CREDENTIALS);
        this.setupBotListeners();
    }

    private async areDatesDifferent(data: any, title: "mitte" | "nord" | "polizei"): Promise<boolean> {
        const storedDates = await this.datesRepository.getDates(title);

        if (!storedDates || JSON.stringify(storedDates) !== JSON.stringify(data)) {
            // Update Firestore with the new dates
            await this.datesRepository.addDates(title, data);
            return true;
        }
        return false;
    }

    private async broadcastToUsers(data: any, title: string) {
        const today_date = moment().toDate();
        const today = moment().format('YYYY-MM-DD');

        const users = await this.userRepository.getAllUsers();
        for (const user of users) {
            if (user.id && (!user.last_update || user.last_update < today)) {
                this.sendMessageWithImage(user.id, data)

                // Update the user's last_update field to today's date
                await this.userRepository.updateUser(user.id, today_date);
            }
        }
    }


    private sendFormattedDates(chat_id: number, data: { [date: string]: string[] }) {
        // this.bot.sendMessage(chat_id, dictionaryToText(data));
        this.bot.sendMessage(chat_id, "blyad");
    }


    private async setupBotListeners() {

        const dataSets = [
            new DataSet("nord", ENTRY_URL_2, SUGGEST_URL_2),
            new DataSet("mitte", ENTRY_URL_3, SUGGEST_URL_3)
        ];

        for (const dataSet of dataSets) {
            const data = await fetchData(dataSet.url1, dataSet.url2);

            // Check if dates are different
            if (await this.areDatesDifferent(data, dataSet.title)) {
                await this.broadcastToUsers(data, dataSet.title);
            } else {
                console.log(`Dates for ${dataSet.title} have not changed.`);
            }
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
                this.sendFormattedDates(msg.chat.id, data)
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

    async sendMessage(chatId: string, message: string, opts: any = {parse_mode: "markdown"}) {
        const userExists = await this.userRepository.userExists(chatId);
        if (userExists) {
            this.bot.sendMessage(chatId, message, opts).catch(error => {
                console.error(`Error sending message to ${chatId}: ${error.message || error}`);
            });
        } else {
            console.warn(`User ${chatId} does not exist or has blocked the bot. Skipping.`);
        }
    }

    async sendMessageWithImage(chatId: string, message: string) {
        const userExists = await this.userRepository.userExists(chatId);

        if (userExists) {
            await this.bot.sendPhoto(chatId, 'media/DALL·E_2023_10_28_16_48_23_Illustration_of_the_robot_hamburger.png').catch(error => {
                console.error(`Error sending message to ${chatId}: ${error.message || error}`);
            });
            this.sendMessage(chatId, message)
        } else {
            console.warn(`User ${chatId} does not exist or has blocked the bot. Skipping.`);
        }
    }
}

export function startTelegramBot(): void {
    const userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS);
    new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);
}