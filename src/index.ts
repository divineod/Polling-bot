import express, { Request, Response } from 'express'

import { ENTRY_URL_NORD, SUGGEST_URL_NORD, ENTRY_URL_MITTE, SUGGEST_URL_MITTE} from './fetcher';
import { fetchData } from './fetchData';
import { dictionaryToText } from './cron';

const app = express()
const port = process.env.PORT || 8080

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/Bremen-mitte', async (req: Request, res: Response) => {
    try {
        const data = await fetchData(ENTRY_URL_MITTE, SUGGEST_URL_MITTE);
        res.json(dictionaryToText('mitte', data));
    } catch (error) {
        res.status(500).send('Error fetching data from Bremen-mitte.');
    }
});

app.get('/Bremen-nord', async (req: Request, res: Response) => {
    try {
        const data = await fetchData(ENTRY_URL_NORD, SUGGEST_URL_NORD);
        res.json(dictionaryToText('nord', data));
    } catch (error) {
        res.status(500).send('Error fetching data from /Bremen-nord.');
    }
});
