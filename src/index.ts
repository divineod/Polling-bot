import express, { Request, Response } from 'express'

import { TelegramConnection, startTelegramBot } from './bot'
import { FirestoreUserRepository, User } from './firestore'
import { fetchData, ENTRY_URL_1, SUGGEST_URL_1, ENTRY_URL_2, SUGGEST_URL_2, fetchBremenPolizei } from './fetcher';
import { validatedEnv } from './settings';
import { dictionaryToText } from './cron';

const app = express()
const port = process.env.PORT || 8080


app.get('/', async (req: Request, res: Response) => {
    let userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS)
    let _ = new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository)
    fetchBremenPolizei().then((timeTable: any) => {
        userRepository.mapAll((user: User) => {
            _.sendMessageWithImage(user.id, dictionaryToText('polizei', timeTable))
        })
    })
})


app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

app.get('/Bremen-mitte', async (req: Request, res: Response) => {
    try {
        const data = await fetchData(ENTRY_URL_1, SUGGEST_URL_1);
        res.json(dictionaryToText('mitte', data));
    } catch (error) {
        res.status(500).send('Error fetching data from Bremen-mitte.');
    }
});

app.get('/Bremen-nord', async (req: Request, res: Response) => {
    try {
        const data = await fetchData(ENTRY_URL_2, SUGGEST_URL_2);
        res.json(dictionaryToText('nord', data));
    } catch (error) {
        res.status(500).send('Error fetching data from /Bremen-nord.');
    }
});
