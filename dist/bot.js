"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startTelegramBot = exports.TelegramConnection = void 0;
const TelegramBot = require("node-telegram-bot-api");
const firestore_1 = require("./firestore");
const settings_1 = require("./settings");
const fetcher_1 = require("./fetcher");
const moment_1 = __importDefault(require("moment"));
const cron_1 = require("./cron");
class DataSet {
    constructor(title, url1, url2) {
        this.title = title;
        this.url1 = url1;
        this.url2 = url2;
    }
}
class TelegramConnection {
    constructor(token, userRepository) {
        this.bot = new TelegramBot(token, { polling: true });
        this.userRepository = userRepository;
        this.datesRepository = new firestore_1.FirestoreDatesRepository(settings_1.validatedEnv.GOOGLE_CREDENTIALS);
        this.setupBotListeners();
    }
    areDatesDifferent(data, title) {
        return __awaiter(this, void 0, void 0, function* () {
            const storedDates = yield this.datesRepository.getDates(title);
            if (!storedDates || JSON.stringify(storedDates) !== JSON.stringify(data)) {
                // Update Firestore with the new dates
                yield this.datesRepository.addDates(title, data);
                return true;
            }
            return false;
        });
    }
    broadcastToUsers(data, title) {
        return __awaiter(this, void 0, void 0, function* () {
            const today_date = (0, moment_1.default)().toDate();
            const today = (0, moment_1.default)().format('YYYY-MM-DD');
            const users = yield this.userRepository.getAllUsers();
            console.log("The broadcast function is being initiated");
            console.log(`users ${JSON.stringify(users)}`);
            for (const user of users) {
                // if (user.id && (!user.last_update || user.last_update < today)) {
                if (true) {
                    yield this.sendMessageWithImage(user.id, (0, cron_1.dictionaryToText)(title, data));
                    // Update the user's last_update field to today's date
                    yield this.userRepository.updateUser(user.id, today_date);
                }
            }
        });
    }
    sendFormattedDates(chat_id, title, data) {
        this.bot.sendMessage(chat_id, (0, cron_1.dictionaryToText)(title, data));
        // this.bot.sendMessage(chat_id, "blyad");
    }
    broadcastAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSets = [
                // new DataSet("nord", ENTRY_URL_NORD, SUGGEST_URL_NORD),
                new DataSet("mitte", fetcher_1.ENTRY_URL_MITTE, fetcher_1.SUGGEST_URL_MITTE),
                // new DataSet("polizei", ENTRY_URL_POLIZEI, SUGGEST_URL_POLIZEI),
            ];
            console.log("Got into setupbotListeners()");
            for (const dataSet of dataSets) {
                let data;
                // TODO: finish making empty date lists more apparent to the end users
                try {
                    data = yield (0, fetcher_1.fetchData)(dataSet.url1, dataSet.url2);
                }
                catch (error) {
                    if (error instanceof fetcher_1.KeineTermineFreiBurgerError) {
                        console.log(`No slots for ${dataSet.title}`);
                        yield this.broadcastToUsers({}, dataSet.title);
                        continue;
                    }
                    console.log(`Error ${error.message}}`);
                    throw error;
                }
                // Check if dates are different
                if ((yield this.areDatesDifferent(data, dataSet.title)) || true) {
                    yield this.broadcastToUsers(data, dataSet.title);
                }
                else {
                    console.log(`Dates for ${dataSet.title} have not changed.`);
                }
            }
        });
    }
    setupBotListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            this.bot.onText(/\/start/, (msg) => __awaiter(this, void 0, void 0, function* () {
                const [isCreated, user] = yield this.userRepository.getOrCreate({ id: msg.chat.id.toString(), firstName: msg.chat.first_name });
                if (isCreated) {
                    this.bot.sendMessage(msg.chat.id, `You are now subscribed, ${user.firstName}!`);
                }
                else {
                    this.bot.sendMessage(msg.chat.id, `Welcome back, ${user.firstName}!`);
                }
            }));
            this.bot.onText(/\/nord/, (msg) => __awaiter(this, void 0, void 0, function* () {
                console.log("Requested crawling for nord");
                const data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_NORD, fetcher_1.SUGGEST_URL_NORD);
                if (Object.keys(data).length > 0) {
                    this.sendFormattedDates(msg.chat.id, "nord", data);
                }
                else {
                    this.bot.sendMessage(msg.chat.id, "No dates.");
                }
            }));
            this.bot.onText(/\/mitte/, (msg) => __awaiter(this, void 0, void 0, function* () {
                console.log("Requested crawling for mitte");
                const data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_MITTE, fetcher_1.SUGGEST_URL_MITTE);
                if (Object.keys(data).length > 0) {
                    this.sendFormattedDates(msg.chat.id, "mitte", data);
                }
                else {
                    this.bot.sendMessage(msg.chat.id, "No dates.");
                }
            }));
            this.bot.onText(/\/polizei/, (msg) => __awaiter(this, void 0, void 0, function* () {
                console.log("Requested crawling for polizei");
                const data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_POLIZEI, fetcher_1.SUGGEST_URL_POLIZEI);
                if (Object.keys(data).length > 0) {
                    this.sendFormattedDates(msg.chat.id, "polizei", data);
                }
                else {
                    this.bot.sendMessage(msg.chat.id, "No dates.");
                }
            }));
            this.bot.onText(/\/broadcast/, (msg) => __awaiter(this, void 0, void 0, function* () {
                console.log("Requested broadcast");
                yield this.broadcastAll();
            }));
            this.bot.on('text', (msg) => __awaiter(this, void 0, void 0, function* () {
                this.bot.sendMessage(msg.chat.id, "I am online!");
            }));
            this.bot.on('polling_error', (error) => {
                console.error(`Telegram polling error: ${error.message || error}`);
            });
            console.log('Telegram bot is running...');
        });
    }
    sendMessage(chatId, message, opts = { parse_mode: "markdown" }) {
        return __awaiter(this, void 0, void 0, function* () {
            const userExists = yield this.userRepository.userExists(chatId);
            if (userExists) {
                this.bot.sendMessage(chatId, message, opts).catch(error => {
                    console.error(`Error sending message to ${chatId}: ${error.message || error}`);
                });
            }
            else {
                console.warn(`User ${chatId} does not exist or has blocked the bot. Skipping.`);
            }
        });
    }
    sendMessageWithImage(chatId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const userExists = yield this.userRepository.userExists(chatId);
            if (userExists) {
                yield this.bot.sendPhoto(chatId, 'media/DALL·E_2023_10_28_16_48_23_Illustration_of_the_robot_hamburger.png').catch(error => {
                    console.error(`Error sending message to ${chatId}: ${error.message || error}`);
                });
                this.sendMessage(chatId, message);
            }
            else {
                console.warn(`User ${chatId} does not exist or has blocked the bot. Skipping.`);
            }
        });
    }
}
exports.TelegramConnection = TelegramConnection;
function startTelegramBot() {
    console.log("GOOGLE_CREDENTIALS", settings_1.validatedEnv.GOOGLE_CREDENTIALS);
    console.log("TELEGRAM_BOT_ACCESS_TOKEN", settings_1.validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN);
    const userRepository = new firestore_1.FirestoreUserRepository(settings_1.validatedEnv.GOOGLE_CREDENTIALS);
    new TelegramConnection(settings_1.validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);
}
exports.startTelegramBot = startTelegramBot;
//# sourceMappingURL=bot.js.map