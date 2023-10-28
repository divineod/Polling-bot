import express, { Request, Response } from 'express'

import { TelegramConnection } from './bot'
import { FirestoreUserRepository, User } from './firestore'
import { fetchData, ENTRY_URL_1, SUGGEST_URL_1, ENTRY_URL_2, SUGGEST_URL_2, fetchBremenPolizei } from './fetcher';
import { validatedEnv } from './settings';

const app = express()
const port = process.env.PORT || 8080


app.get('/', async (req: Request, res: Response) => {
    let userRepository = new FirestoreUserRepository(validatedEnv.GOOGLE_CREDENTIALS)
    let _ = new TelegramConnection(validatedEnv.TELEGRAM_BOT_ACCESS_TOKEN, userRepository)
    fetchBremenPolizei().then((timeTable: any) => {
        userRepository.mapAll((user: User) => {
            _.sendMessage(user.id, JSON.stringify(timeTable, undefined, 4))
        })
    })
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
