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
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramConnection = void 0;
const TelegramBot = require("node-telegram-bot-api");
const fetcher_1 = require("./fetcher");
class TelegramConnection {
    constructor(token, userRepository) {
        this.previousData = {};
        this.bot = new TelegramBot(token, { polling: true });
        this.userRepository = userRepository;
        this.setupBotListeners();
        this.broadcastToUsers();
    }
    broadcastToUsers(data, title) {
        return __awaiter(this, void 0, void 0, function* () {
            if (JSON.stringify(data) !== JSON.stringify(this.previousData[title]) && Object.keys(data).length > 0) {
                const users = yield this.userRepository.getAllUsers();
                for (const user of users) {
                    if (user.id) {
                        this.bot.sendMessage(user.id, `These are the dates from ${title}, ${user.firstName}!`);
                        this.bot.sendMessage(user.id, JSON.stringify(data, undefined, 4));
                    }
                }
                this.previousData[title] = data;
            }
        });
    }
    setupBotListeners() {
        return __awaiter(this, void 0, void 0, function* () {
            const dataSets = [
                { url1: fetcher_1.ENTRY_URL_1, url2: fetcher_1.SUGGEST_URL_1, title: "Polizei" },
                { url1: fetcher_1.ENTRY_URL_2, url2: fetcher_1.SUGGEST_URL_2, title: "Nord" },
                { url1: fetcher_1.ENTRY_URL_3, url2: fetcher_1.SUGGEST_URL_3, title: "Mitte" }
            ];
            for (const dataSet of dataSets) {
                const data = yield (0, fetcher_1.fetchData)(dataSet.url1, dataSet.url2);
                yield this.broadcastToUsers(data, dataSet.title);
            }
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
                const data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_2, fetcher_1.SUGGEST_URL_2);
                if (Object.keys(data).length > 0) {
                    this.bot.sendMessage(msg.chat.id, JSON.stringify(data, undefined, 4));
                }
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
    sendMessage(chatId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            const userExists = yield this.userRepository.userExists(chatId);
            if (userExists) {
                this.bot.sendMessage(chatId, message).catch(error => {
                    console.error(`Error sending message to ${chatId}: ${error.message || error}`);
                });
            }
            else {
                console.warn(`User ${chatId} does not exist or has blocked the bot. Skipping.`);
            }
        });
    }
}
exports.TelegramConnection = TelegramConnection;
//# sourceMappingURL=bot.js.map