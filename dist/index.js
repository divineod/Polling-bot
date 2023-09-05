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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const entryURL = 'https://termin.bremen.de/termine/select2?md=13';
const axios = require('axios');
const cookieParser = require('cookie');
const cheerio = __importStar(require("cheerio"));
const app = (0, express_1.default)();
const port = process.env.PORT || 8080;
function fetchData() {
    return __awaiter(this, void 0, void 0, function* () {
        const rawCookies = (yield axios.get(entryURL)).headers['set-cookie'];
        const cookies = cookieParser.parse(rawCookies[1]);
        const timeSlotsHTML = (yield axios.get('https://termin.bremen.de/termine/suggest?mdt=704&select_cnc=1&cnc-8662=1&Strafanzeige+erstatten+=Weiter+1', {
            headers: {
                Cookie: `cookie_accept=1; TVWebSession=${cookies.TVWebSession}`
            }
        })).data;
        const $ = cheerio.load(timeSlotsHTML);
        // Create a dictionary to store the data aggregated by day
        const scheduleByDay = {};
        // Iterate through each 'h3' element with a title attribute containing the date
        $('h3[title]').each((index, element) => {
            const title = $(element).attr('title');
            const dateMatch = /(\d{2}\.\d{2}.\d{4})/.exec(title); // Match the date format
            if (dateMatch) {
                const date = dateMatch[0];
                const timeSlots = [];
                // Find the associated 'table' element with class 'sugg_table'
                const table = $(element).next('div').find('table.sugg_table');
                // Iterate through each 'tr' element in the table to extract the time slots
                table.find('tr').each((index, row) => {
                    const timeSlot = $(row).find('th span[aria-hidden]').text(); // Extract time slot
                    timeSlots.push(timeSlot);
                });
                // Store the time slots for this date in the dictionary
                scheduleByDay[date] = timeSlots;
            }
        });
        return scheduleByDay;
    });
}
app.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const data = yield fetchData();
        res.status(200).send(data);
    }
    catch (error) {
        res.status(500).send('Error fetching data.');
    }
}));
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
//# sourceMappingURL=index.js.map