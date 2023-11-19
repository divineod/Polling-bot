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
exports.fetchBremenPolizei = exports.fetchBremenMitte = exports.fetchBremenNord = exports.fetchData = exports.KeineTermineFreiBurgerError = exports.SUGGEST_URL_MITTE = exports.ENTRY_URL_MITTE = exports.SUGGEST_URL_NORD = exports.ENTRY_URL_NORD = exports.SUGGEST_URL_POLIZEI = exports.ENTRY_URL_POLIZEI = void 0;
const axios = require('axios');
const cookieParser = require('cookie');
const cheerio = __importStar(require("cheerio"));
// import * as repl from 'repl';
const settings_1 = require("./settings");
exports.ENTRY_URL_POLIZEI = "https://termin.bremen.de/termine/select2?md=13";
exports.SUGGEST_URL_POLIZEI = "https://termin.bremen.de/termine/suggest?mdt=704&select_cnc=1&cnc-8662=1&Strafanzeige+erstatten+=Next+1";
exports.ENTRY_URL_NORD = 'https://termin.bremen.de/termine/select2?md=6';
exports.SUGGEST_URL_NORD = 'https://termin.bremen.de/termine/suggest?cnc-8793=1&loc=681';
exports.ENTRY_URL_MITTE = 'https://termin.bremen.de/termine/select2?md=5';
exports.SUGGEST_URL_MITTE = "https://termin.bremen.de/termine/suggest?mdt=701&select_cnc=1&cnc-8790=1";
class UnexpectedBurgerResponseError extends Error {
    constructor(message, response) {
        super(message);
        this.response = response;
        this.name = "UnexpectedBurgerResponse";
    }
    toString() {
        return `${this.name}: ${this.message} – ${this.response}`;
    }
}
class KeineTermineFreiBurgerError extends Error {
    constructor(message) {
        super(message);
        this.name = "KeineTermineFreiBurgerError";
    }
}
exports.KeineTermineFreiBurgerError = KeineTermineFreiBurgerError;
function fetchData(entryURL, suggestURL) {
    return __awaiter(this, void 0, void 0, function* () {
        let proxy;
        if (settings_1.validatedEnv.ENABLE_MITM) {
            proxy = {
                protocol: 'http',
                host: 'localhost',
                port: 1337
            };
        }
        else {
            proxy = {};
        }
        const rawCookies = (yield axios.get(entryURL, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
            },
            proxy: proxy
        })).headers['set-cookie'];
        console.log(`rawCookies ${rawCookies}`);
        const cookies = cookieParser.parse(rawCookies[0]);
        // const r = repl.start({
        //     prompt: 'Node Shell> ',
        //     useGlobal: true
        // })
        // r.context.rawCookies = rawCookies
        // r.context.cookies = cookies
        // const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
        // await sleep(2_000_000)
        // todo: finish sending the form data
        let MITTE_FORM_DATA = new FormData();
        MITTE_FORM_DATA.append("loc", "680");
        MITTE_FORM_DATA.append("gps_lat", "999");
        MITTE_FORM_DATA.append("gps_long", "999");
        MITTE_FORM_DATA.append("select_location", "BürgerServiceCenter-Mitte auswählen");
        const timeSlotsHTML = (yield axios.post(suggestURL, {
            headers: {
                Cookie: `cookie_accept=1; tvo_session=${cookies.tvo_session}`,
                "Content-Type": "multipart/form-data"
            },
            proxy: proxy,
            data: MITTE_FORM_DATA,
        })).data;
        if (!timeSlotsHTML.includes("Bitte wählen Sie den gewünschten Standort für Ihren Termin aus")) {
            console.warn("The response HTML does not contain expected text. Either we fail, or the page was slightly changed.");
        }
        if (timeSlotsHTML.includes("Kein gültiger Mandant gefunden.")) {
            throw new UnexpectedBurgerResponseError("Note! No client found. Perhaps, the session has expired.", timeSlotsHTML);
        }
        if (timeSlotsHTML.includes("Aktuell sind leider keine Termine frei")) {
            throw new KeineTermineFreiBurgerError("No available slots.");
        }
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
        // console.log(`${entryURL}: scheduleByDay = ${scheduleByDay}`)
        return scheduleByDay;
    });
}
exports.fetchData = fetchData;
function fetchBremenNord() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchData(exports.ENTRY_URL_NORD, exports.SUGGEST_URL_NORD);
    });
}
exports.fetchBremenNord = fetchBremenNord;
function fetchBremenMitte() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchData(exports.ENTRY_URL_MITTE, exports.SUGGEST_URL_MITTE);
    });
}
exports.fetchBremenMitte = fetchBremenMitte;
function fetchBremenPolizei() {
    return __awaiter(this, void 0, void 0, function* () {
        return yield fetchData(exports.ENTRY_URL_POLIZEI, exports.SUGGEST_URL_POLIZEI);
    });
}
exports.fetchBremenPolizei = fetchBremenPolizei;
//# sourceMappingURL=fetcher.js.map