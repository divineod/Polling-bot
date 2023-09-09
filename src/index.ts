import { time } from 'console'
import express, { Request, Response } from 'express'
const entryURL = 'https://termin.bremen.de/termine/select2?md=13'
const axios = require('axios')
const cookieParser = require('cookie')
import * as cheerio from 'cheerio';



const app = express()
const port = process.env.PORT || 8080

const ENTRY_URL_1 = 'https://termin.bremen.de/termine/select2?md=13';
const SUGGEST_URL_1 = 'https://termin.bremen.de/termine/suggest?mdt=704&select_cnc=1&cnc-8662=1&Strafanzeige+erstatten+=Weiter+1';

const ENTRY_URL_2 = 'https://termin.bremen.de/termine/select2?md=6';
const SUGGEST_URL_2 = 'https://termin.bremen.de/termine/suggest?cnc-8793=1&loc=681';

async function fetchData(entryURL: string, suggestURL: string): Promise<{ [date: string]: string[] }> {
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

app.get('/Bremen-mitte', async (req: Request, res: Response) => {
    try {
        const data = await fetchData(ENTRY_URL_1, SUGGEST_URL_1);
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data from Bremen-mitte.');
    }
});

app.get('/Bremen-nord', async (req: Request, res: Response) => {
    try {
        const data = await fetchData(ENTRY_URL_2, SUGGEST_URL_2);
        res.json(data);
    } catch (error) {
        res.status(500).send('Error fetching data from /Bremen-nord.');
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});




