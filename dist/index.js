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
const express_1 = __importDefault(require("express"));
const bot_1 = require("./bot");
const firestore_1 = require("./firestore");
const fetcher_1 = require("./fetcher");
const settings_1 = require("./settings");
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    let userRepository = new firestore_1.FirestoreUserRepository(settings_1.validatedEnv.GOOGLE_CREDENTIALS);
    let _ = new bot_1.TelegramConnection(settings_1.validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository);
    (0, fetcher_1.fetchBremenPolizei)().then((timeTable) => {
        userRepository.mapAll((user) => {
            _.sendMessage(user.id, JSON.stringify(timeTable, undefined, 4));
        });
    });
}));
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
app.get('/Bremen-mitte', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_1, fetcher_1.SUGGEST_URL_1);
        res.json(data);
    }
    catch (error) {
        res.status(500).send('Error fetching data from Bremen-mitte.');
    }
}));
app.get('/Bremen-nord', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield (0, fetcher_1.fetchData)(fetcher_1.ENTRY_URL_2, fetcher_1.SUGGEST_URL_2);
        res.json(data);
    }
    catch (error) {
        res.status(500).send('Error fetching data from /Bremen-nord.');
    }
}));
//# sourceMappingURL=index.js.map