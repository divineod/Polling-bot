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
            const [isCreated, user] = yield this.userRepository.getOrCreate({ chatId: msg.chat.id.toString() });
            console.log(`Got or created user ${isCreated} ${user}`);
            if (isCreated) {
                this.bot.sendMessage(msg.chat.id, `You are now subscribed, ${user.chatId}!`);
            }
            else {
                this.bot.sendMessage(msg.chat.id, `Welcome back, ${user.chatId}!`);
            }
        }));
        this.bot.on('text', (msg) => __awaiter(this, void 0, void 0, function* () {
            this.bot.sendMessage(msg.chat.id, "I am online!");
        }));
        this.bot.on('polling_error', (error) => {
            console.error(`Telegram polling error: ${error}`);
        });
        console.log('Telegram bot is running...');
    }
}
exports.TelegramConnection = TelegramConnection;
//# sourceMappingURL=bot.js.map