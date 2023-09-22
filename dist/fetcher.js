"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
exports.fetchBremenPolizei = exports.fetchBremenMitte = exports.fetchBremenNord = exports.fetchData = exports.SUGGEST_URL_3 = exports.ENTRY_URL_3 = exports.SUGGEST_URL_2 = exports.ENTRY_URL_2 = exports.SUGGEST_URL_1 = exports.ENTRY_URL_1 = void 0;
const axios = require('axios');
const cookieParser = require('cookie');
const cheerio = __importStar(require("cheerio"));
exports.ENTRY_URL_1 = "https://termin.bremen.de/termine/select2?md=13";
exports.SUGGEST_URL_1 = "https://termin.bremen.de/termine/suggest?mdt=704&select_cnc=1&cnc-8662=1&Strafanzeige+erstatten+=Next+1";
exports.ENTRY_URL_2 = 'https://termin.bremen.de/termine/select2?md=6';
exports.SUGGEST_URL_2 = 'https://termin.bremen.de/termine/suggest?cnc-8793=1&loc=681';
exports.ENTRY_URL_3 = 'https://termin.bremen.de/termine/select2?md=5';
exports.SUGGEST_URL_3 = 'https://termin.bremen.de/termine/suggest?cnc-8790=1&loc=680';
function fetchData(entryURL, suggestURL) {
    return __awaiter(this, void 0, void 0, function* () {
        const rawCookies = (yield axios.get(entryURL)).headers['set-cookie'];
        const cookies = cookieParser.parse(rawCookies[1]);
        const timeSlotsHTML = (yield axios.get(suggestURL, {
            headers: {
                Cookie: `cookie_accept=1; TVWebSession=${cookies.TVWebSession}`
            }
        })).data;
        const $ = cheerio.load(timeSlotsHTML);
        const scheduleByDay = {};
        $('h3[title]').each((index, element) => {
            const title = $(element).attr('title');
            const dateMatch = /(\d{2}\.\d{2}.\d{4})/.exec(title);
            if (dateMatch) {
                const date = dateMatch[0];
                const timeSlots = [];
                const table = $(element).next('div').find('table.sugg_table');
                table.find('tr').each((index, row) => {
                    const timeSlot = $(row).find('th span[aria-hidden]').text();
                    timeSlots.push(timeSlot);
                });
                scheduleByDay[date] = timeSlots;
            }
        });
        return scheduleByDay;
    });
}
exports.fetchData = fetchData;
function fetchBremenNord() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchData(exports.ENTRY_URL_2, exports.SUGGEST_URL_2);
    });
}
exports.fetchBremenNord = fetchBremenNord;
function fetchBremenMitte() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchData(exports.ENTRY_URL_3, exports.SUGGEST_URL_3);
    });
}
exports.fetchBremenMitte = fetchBremenMitte;
function fetchBremenPolizei() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchData(exports.ENTRY_URL_1, exports.SUGGEST_URL_1);
    });
}
exports.fetchBremenPolizei = fetchBremenPolizei;
//# sourceMappingURL=fetcher.js.map