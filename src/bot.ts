import TelegramBot = require('node-telegram-bot-api');
import { FirestoreUserRepository, FirestoreDatesRepository, User } from "./firestore";

import { validatedEnv } from "./settings";
import {
    ENTRY_URL_NORD,
    SUGGEST_URL_NORD,
    ENTRY_URL_MITTE,
    SUGGEST_URL_MITTE,
    SUGGEST_URL_POLIZEI,
    ENTRY_URL_POLIZEI,
    KeineTermineFreiBurgerError,
    NORD_PAYLOAD,
    MITTE_PAYLOAD,
    POLIZEI_PAYLOAD,
} from './fetcher';
import { fetchData } from './fetcher';
import moment from 'moment';
import { dictionaryToText } from './cron';

// To disable a stupid deprecation warning on the side of the node telegram library
process.env.NTBA_FIX_350 = "true";

class DataSet {
    constructor(
        public title: "mitte" | "nord" | "polizei",
        public url1: string,
        public url2: string,
        public payload: any,
        public contentType: "formdata" | "urlencoded"
    ) { }
}

export class TelegramConnection {
    private bot: TelegramBot;
    private userRepository: FirestoreUserRepository;
    private datesRepository: FirestoreDatesRepository;

    constructor(token: string, userRepository: FirestoreUserRepository) {
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

    private async broadcastToUsers(data: any, title: 'nord' | 'mitte' | 'polizei') {
        const today_date = moment().toDate();
        const today = moment().format('YYYY-MM-DD');
        const users = await this.userRepository.getAllUsers();

        console.log("The broadcast function is being initiated")
        console.log(`users ${JSON.stringify(users)}`)

        for (const user of users) {
            // TODO: Does this actually work? last_update is a string
            // if (user.id && (!user.last_update || user.last_update < today)) {
            if (true) {
                await this.sendMessageWithImage(user.id, dictionaryToText(title, data))
                // Update the user's last_update field to today's date
                await this.userRepository.updateUser(user.id, today_date);
            }
        }
    }

    private sendFormattedDates(chat_id: number, title: "mitte" | "nord" | "polizei", data: { [date: string]: string[] }) {
        this.bot.sendMessage(chat_id, dictionaryToText(title, data));
        // this.bot.sendMessage(chat_id, "blyad");
    }

    private async broadcastAll() {
        const dataSets = [
            new DataSet("nord", ENTRY_URL_NORD, SUGGEST_URL_NORD, NORD_PAYLOAD, "formdata"),
            new DataSet("mitte", ENTRY_URL_MITTE, SUGGEST_URL_MITTE, MITTE_PAYLOAD, "formdata"),
            // new DataSet("polizei", ENTRY_URL_POLIZEI, SUGGEST_URL_POLIZEI, POLIZEI_PAYLOAD, "formdata"),
        ];

        console.log("Got into setupbotListeners()")

        for (const dataSet of dataSets) {
            let data: any

            // TODO: finish making empty date lists more apparent to the end users

            try {
                data = await fetchData(dataSet.url1, dataSet.url2, dataSet.payload, dataSet.contentType);
            } catch (error) {

                if (error instanceof KeineTermineFreiBurgerError) {
                    console.log(`No slots for ${dataSet.title}`)
                    await this.broadcastToUsers({}, dataSet.title)
                    continue
                }

                console.log(`Error ${error.message}}`)
                throw error
            }

            // Check if dates are different
            // TODO: remove true
            if (await this.areDatesDifferent(data, dataSet.title) || true) {
                await this.broadcastToUsers(data, dataSet.title);
            } else {
                console.log(`Dates for ${dataSet.title} have not changed.`);
            }
        }
    }


    private async setupBotListeners() {
        this.bot.onText(/\/start/, async (msg) => {
            const [isCreated, user] = await this.userRepository.getOrCreate({ id: msg.chat.id.toString(), firstName: msg.chat.first_name });
            if (isCreated) {
                this.bot.sendMessage(msg.chat.id, `You are now subscribed, ${user.firstName}!`);
            } else {
                this.bot.sendMessage(msg.chat.id, `Welcome back, ${user.firstName}!`);
            }
        });

        this.bot.onText(/\/nord/, async (msg) => {
            console.log("Requested crawling for nord")
            let data: any;

            try {
                data = await fetchData(ENTRY_URL_NORD, SUGGEST_URL_NORD, NORD_PAYLOAD, "formdata");

            } catch (error) {
                if (error instanceof KeineTermineFreiBurgerError) {
                    this.bot.sendMessage(msg.chat.id, "No dates.")
                } else {
                    this.sendFormattedDates(msg.chat.id, "nord", data)
                }
            }

        });

        this.bot.onText(/\/mitte/, async (msg) => {
            console.log("Requested crawling for mitte")
            let data: any

            try {
                data = await fetchData(ENTRY_URL_MITTE, SUGGEST_URL_MITTE, MITTE_PAYLOAD, "formdata");
            } catch (error) {
                if (error instanceof KeineTermineFreiBurgerError) {
                    this.bot.sendMessage(msg.chat.id, "No dates.")
                } else {
                    this.sendFormattedDates(msg.chat.id, "mitte", data)
                }
            }

        });

        this.bot.onText(/\/polizei/, async (msg) => {
            console.log("Requested crawling for polizei")
            let data;

            try {
                data = await fetchData(ENTRY_URL_POLIZEI, SUGGEST_URL_POLIZEI, POLIZEI_PAYLOAD, "formdata");
            } catch (error) {
                if (error instanceof KeineTermineFreiBurgerError) {
                    this.bot.sendMessage(msg.chat.id, "No dates.")
                } else {
                    this.sendFormattedDates(msg.chat.id, "polizei", data)
                }
            }
        });

        this.bot.onText(/\/broadcast/, async (msg) => {
            console.log("Requested broadcast")
            await this.broadcastAll()
        })

        this.bot.on('text', async (msg) => {
            this.bot.sendMessage(msg.chat.id, "I am online!");
        });

        this.bot.on('polling_error', (error) => {
            console.error(`Telegram polling error: ${error.message || error}`);
        });

        console.log('Telegram bot is running...');
    }

    async sendMessage(chatId: string, message: string, opts: any = { parse_mode: "markdown" }) {
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
            await this.bot.sendPhoto(
                chatId,
                'media/hamburger-cropped.png',
                {},
                { contentType: 'image/x-png', }
            ).catch(error => {
                console.error(`Error sending message to ${chatId}: ${error.message || error}`);
            });
            this.sendMessage(chatId, message)
        } else {
            console.warn(`User ${chatId} does not exist or has blocked the bot. Skipping.`);
        }
    }
}

export function startTelegramBot(): void {
    console.log("GOOGLE_CREDENTIALS", validatedEnv.GOOGLE_CREDENTIALS)
    console.log("TELEGRAM_BOT_ACCESS_TOKEN", validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN)

    const userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS);
    new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);
}