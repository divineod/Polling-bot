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
        // Initialize the Telegram Bot
        this.bot = new TelegramBot(token, { polling: true });
        // Initialize Firestore repository
        this.userRepository = userRepository;
        this.setupBotListeners();
    }
    setupBotListeners() {
        this.bot.onText(/\/start/, (msg) => __awaiter(this, void 0, void 0, function* () {
            const [isCreated, user] = yield this.userRepository.getOrCreate({ id: msg.chat.id.toString(), firstName: msg.chat.first_name });
            console.log(`Got or created user ${isCreated} ${user}`);
            if (isCreated) {
                this.bot.sendMessage(msg.chat.id, `You are now subscribed, ${user.firstName}!`);
            }
            else {
                this.bot.sendMessage(msg.chat.id, `Welcome back, ${user.firstName}!`);
            }
            let data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_1, fetcher_1.SUGGEST_URL_1);
            this.bot.sendMessage(msg.chat.id, JSON.stringify(data, undefined, 4));
        }));
        this.bot.onText(/\/nord/, (msg) => __awaiter(this, void 0, void 0, function* () {
            const [isCreated, user] = yield this.userRepository.getOrCreate({ id: msg.chat.id.toString(), firstName: msg.chat.first_name });
            console.log(`Got or created user ${isCreated} ${user}`);
            let data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_2, fetcher_1.SUGGEST_URL_2);
            this.bot.sendMessage(msg.chat.id, JSON.stringify(data, undefined, 4));
        }));
        this.bot.on('text', (msg) => __awaiter(this, void 0, void 0, function* () {
            this.bot.sendMessage(msg.chat.id, "I am online!");
        }));
        this.bot.on('polling_error', (error) => {
            console.error(`Telegram polling error: ${error.message || error}`);
        });
        console.log('Telegram bot is running...');
    }
    sendMessage(chatId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            this.bot.sendMessage(chatId, message);
        });
    }
}
exports.TelegramConnection = TelegramConnection;
//# sourceMappingURL=bot.js.map