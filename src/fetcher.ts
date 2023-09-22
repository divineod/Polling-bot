const axios = require('axios')
const cookieParser = require('cookie')
import * as cheerio from 'cheerio'


export const ENTRY_URL_1 = "https://termin.bremen.de/termine/select2?md=13"
export const SUGGEST_URL_1 = "https://termin.bremen.de/termine/suggest?mdt=704&select_cnc=1&cnc-8662=1&Strafanzeige+erstatten+=Next+1"

export const ENTRY_URL_2 = 'https://termin.bremen.de/termine/select2?md=6';
export const SUGGEST_URL_2 = 'https://termin.bremen.de/termine/suggest?cnc-8793=1&loc=681';

export const ENTRY_URL_3 = 'https://termin.bremen.de/termine/select2?md=5';
export const SUGGEST_URL_3 = 'https://termin.bremen.de/termine/suggest?cnc-8790=1&loc=680'

export async function fetchData(entryURL: string, suggestURL: string): Promise<{ [date: string]: string[] }> {
    const rawCookies = (await axios.get(entryURL)).headers['set-cookie'];
    const cookies = cookieParser.parse(rawCookies[1]);
    const timeSlotsHTML = (await axios.get(suggestURL, {
        headers: {
            Cookie: `cookie_accept=1; TVWebSession=${cookies.TVWebSession}`
        }
    })).data;

    const $ = cheerio.load(timeSlotsHTML);
    const scheduleByDay: { [date: string]: string[] } = {};

    $('h3[title]').each((index, element) => {
        const title = $(element).attr('title');
        const dateMatch = /(\d{2}\.\d{2}.\d{4})/.exec(title);
        if (dateMatch) {
            const date = dateMatch[0];
            const timeSlots: string[] = [];
            const table = $(element).next('div').find('table.sugg_table');
            table.find('tr').each((index, row) => {
                const timeSlot = $(row).find('th span[aria-hidden]').text();
                timeSlots.push(timeSlot);
            });
            scheduleByDay[date] = timeSlots;
        }
    });
    return scheduleByDay;
}


export async function fetchBremenNord(): Promise<{ [date: string]: string[] }> {
    return await fetchData(ENTRY_URL_2, SUGGEST_URL_2)
}

export async function fetchBremenMitte(): Promise<{ [date: string]: string[] }> {
    return await fetchData(ENTRY_URL_3, SUGGEST_URL_3)
}

export async function fetchBremenPolizei(): Promise<{ [date: string]: string[] }> {
    return await fetchData(ENTRY_URL_1, SUGGEST_URL_1)
}
