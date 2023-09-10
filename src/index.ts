import express, { Request, Response } from 'express'

import { TelegramConnection } from './bot'
import { FirestoreUserRepository } from './firestore'
import { credential } from 'firebase-admin'
import { fetchData, ENTRY_URL_1, SUGGEST_URL_1, ENTRY_URL_2, SUGGEST_URL_2 } from './fetcher';

const serviceAccount = require('../google.json');


const app = express()
const port = process.env.PORT || 8080


app.get('/', async (req: Request, res: Response) => {
    let key = "[redacted]"

    let userRepository = new FirestoreUserRepository(serviceAccount)
    let tgConnection = new TelegramConnection(key, userRepository)
})

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});


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
