const axios = require('axios')
const cookieParser = require('cookie')
import * as cheerio from 'cheerio'
// import * as repl from 'repl';
import { validatedEnv } from './settings';


export const ENTRY_URL_POLIZEI = "https://termin.bremen.de/termine/select2?md=13"
export const SUGGEST_URL_POLIZEI = "https://termin.bremen.de/termine/suggest?mdt=704&select_cnc=1&cnc-8662=1&Strafanzeige+erstatten+=Weiter+mit+1"

// mdt: 704
// select_cnc: 1
// cnc-8662: 1
// Strafanzeige erstatten : Weiter mit 1

export const ENTRY_URL_NORD = 'https://termin.bremen.de/termine/select2?md=6';
export const SUGGEST_URL_NORD = 'https://termin.bremen.de/termine/suggest?cnc-8793=1&loc=681';

export const ENTRY_URL_MITTE = 'https://termin.bremen.de/termine/select2?md=5';
export const SUGGEST_URL_MITTE = "https://termin.bremen.de/termine/suggest?mdt=701&select_cnc=1&cnc-8790=1"


export const POLIZEI_PAYLOAD: [string, string][] = [
    ["loc", "698"],
    ["gps_lat", "999"],
    ["gps_long", "999"],
    ["select_location", "Polizeipräsidium Vahr auswählen"]
]
export const NORD_PAYLOAD: [string, string][] = [
    ["loc", "680"],
    ["gps_lat", "999"],
    ["gps_long", "999"],
    ["select_location", "BürgerServiceCenter-Nord auswählen"]

]
export const MITTE_PAYLOAD: [string, string][] = [
    ["loc", "680"],
    ["gps_lat", "999"],
    ["gps_long", "999"],
    ["select_location", "BürgerServiceCenter-Mitte auswählen"]
]

class UnexpectedBurgerResponseError extends Error {
    response: string

    constructor(message: string, response: string) {
        super(message)
        this.response = response
    }

    toString(): string {
        return `${this.name}: ${this.message} – ${this.response}`
    }
}

class SessionExpiredBurgerError extends UnexpectedBurgerResponseError {

}

export class KeineTermineFreiBurgerError extends Error {
    constructor(message: string) {
        super(message)
        this.name = "KeineTermineFreiBurgerError";
    }
}

let proxyConfig: object | undefined;

if (validatedEnv.ENABLE_MITM) {
    console.log("MITM ENABLED!")
    proxyConfig = {
        protocol: 'http',
        host: 'localhost',
        port: 1337
    }
} else {
    console.log("MITM DISABLED!")
    proxyConfig = undefined
}

const axiosInstance = axios.create({
    // Set the proxy configuration
    proxy: proxyConfig,
});

export async function fetchData(
    entryURL: string,
    suggestURL: string,
    payloadArray: [string, string][],
    contentType: 'formdata' | 'urlencoded'
): Promise<{ [date: string]: string[] }> {

    console.log(`Proxy ${JSON.stringify(proxyConfig)}`)

    const rawCookies = (await axiosInstance.get(entryURL, {
        headers: {
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36"
        },
    })).headers['set-cookie'];

    console.log(`rawCookies ${rawCookies}`)

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


    let payload: any;
    let contentTypeString: string


    if (contentType == "formdata") {
        payload = new FormData();
        contentTypeString = "multipart/form-data"

        for (const row of payloadArray) {
            payload.append(row[0].toString(), row[1].toString())
        }
        console.log(`FormData content:`);
        for (const entry of payload.entries()) {
            console.log(entry[0], entry[1]);
        }
    } else {
        contentTypeString = "application/x-www-form-urlencoded"
        payload = {}

        for (const row of payloadArray) {
            payload[row[0]] = row[1]
        }
        console.log(`payload ${JSON.stringify(payload)}`)
    }
    console.log(`payload array ${JSON.stringify(payloadArray)}`)

    const timeSlotsHTML = (await axiosInstance(
        {
            method: "post",
            url: suggestURL,
            headers: {
                Cookie: `cookie_accept=1; tvo_session=${cookies.tvo_session}`,
                "Content-Type": contentTypeString
            },
            data: payload,
        })).data;

    if (timeSlotsHTML.includes("Aktuell sind leider keine Termine frei")) {
        throw new KeineTermineFreiBurgerError("No available slots.")
    }

    if (!timeSlotsHTML.includes("Bitte wählen Sie den gewünschten Standort für Ihren Termin aus")) {
        console.warn("The response HTML does not contain expected text. Either we fail, or the page was slightly changed.")
    }

    // This check always gives a positive on success
    // if (timeSlotsHTML.includes("Ihre Sitzung läuft in")) {
    //     throw new SessionExpiredBurgerError("Session expired. Check your form data payload and cookies.", timeSlotsHTML)
    // }

    if (timeSlotsHTML.includes("Kein gültiger Mandant gefunden.")) {
        throw new UnexpectedBurgerResponseError("Note! No client found. Perhaps, the session has expired.", timeSlotsHTML);
    }

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

    // console.log(`${entryURL}: scheduleByDay = ${scheduleByDay}`)
    return scheduleByDay;
}


// export async function fetchBremenNord(): Promise<{ [date: string]: string[] }> {
//     return await fetchData(ENTRY_URL_NORD, SUGGEST_URL_NORD)
// }

// export async function fetchBremenMitte(): Promise<{ [date: string]: string[] }> {
//     return await fetchData(ENTRY_URL_MITTE, SUGGEST_URL_MITTE)
// }

// export async function fetchBremenPolizei(): Promise<{ [date: string]: string[] }> {
//     return await fetchData(ENTRY_URL_POLIZEI, SUGGEST_URL_POLIZEI)
// }
