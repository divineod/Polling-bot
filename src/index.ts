import { time } from 'console'
import express, { Request, Response } from 'express'
const entryURL = 'https://termin.bremen.de/termine/select2?md=13'
const axios = require('axios')
const cookieParser = require('cookie')
import * as cheerio from 'cheerio';



const app = express()
const port = process.env.PORT || 8080

async function fetchData() {
    const rawCookies = (await axios.get(entryURL)).headers['set-cookie']
    const cookies = cookieParser.parse(rawCookies[1])

    const timeSlotsHTML = (await axios.get('https://termin.bremen.de/termine/suggest?mdt=704&select_cnc=1&cnc-8662=1&Strafanzeige+erstatten+=Weiter+1', {
        headers: {
            Cookie: `cookie_accept=1; TVWebSession=${cookies.TVWebSession}`
        }
    })).data


    const $ = cheerio.load(timeSlotsHTML);
    // Create a dictionary to store the data aggregated by day
    const scheduleByDay: { [date: string]: string[] } = {};

    // Iterate through each 'h3' element with a title attribute containing the date
    $('h3[title]').each((index, element) => {
        const title = $(element).attr('title');
        const dateMatch = /(\d{2}\.\d{2}.\d{4})/.exec(title); // Match the date format
        if (dateMatch) {
            const date = dateMatch[0];
            const timeSlots: string[] = [];

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

    return scheduleByDay
}

app.get('/', async (req, res) => {
    try {
        const data = await fetchData()
        res.json(data)
    } catch (error) {
        res.status(500).send('Error fetching data.')
    }
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
});