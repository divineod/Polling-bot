import * as admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';
import { createTraverser } from 'firewalk';


interface BaseEntity {
    id: string
}

export class FirestoreRepository<T extends BaseEntity> {
    protected collection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

    private static isInitialized: boolean = false;


    constructor(credential: string, collectionPath: string) {

        if (!FirestoreRepository.isInitialized) {
            FirestoreRepository.isInitialized = true;
            admin.initializeApp({ credential: cert(credential) }); // Initialize Firebase Admin SDK
        }

        // Get a reference to the Firestore collection
        this.collection = admin.firestore().collection(collectionPath);
    }

    // Create a new document with an automatically generated ID
    async create(data: T): Promise<T> {
        if ('firstName' in data) {
            (data as any).last_update = "2023-09-01";
        }

        const docRef = await this.collection.doc(data.id);
        docRef.set(data);
        return data;
    }

    // Read a document by ID
    async getById(id: string): Promise<T | undefined> {
        const docSnapshot = await this.collection.doc(id).get();
        if (docSnapshot.exists) {
            return docSnapshot.data() as T;
        } else {
            return undefined;
        }
    }

    // Update an existing document by ID
    async update(id: string, data: Partial<T>): Promise<void> {
        await this.collection.doc(id).update(data);
    }

    // Delete a document by ID
    async delete(id: string): Promise<void> {
        await this.collection.doc(id).delete();
    }

    // Query documents based on a specific field and value
    async getByField(fieldName: string, value: any): Promise<T[]> {
        const querySnapshot = await this.collection.where(fieldName, '==', value).get();
        const documents: T[] = [];

        querySnapshot.forEach((doc) => {
            documents.push(doc.data() as T);
        });

        return documents;
    }

    async mapAll(func: CallableFunction): Promise<any> {

        let traverser = createTraverser(this.collection);
        const { batchCount, docCount } = await traverser.traverse(async (batchDocs, batchIndex) => {
            const batchSize = batchDocs.length;

            await Promise.all(
                batchDocs.map(async (doc) => {
                    const { email, firstName } = doc.data();
                    await func(doc);
                })
            );
            console.log(`Batch ${batchIndex} done! We executed ${func} ${batchSize} users in this batch.`);
        });

    }
}

export interface User extends BaseEntity {
    firstName: string,
    last_update?: string;
}

export interface BurgerDate extends BaseEntity {

}

export class FirestoreUserRepository extends FirestoreRepository<User> {

    constructor(credential: string) {
        super(credential, "users2")
    }

    async getOrCreate(data: User): Promise<[boolean, User]> {
        const user = await this.getById(data.id)

        if (user === undefined) {
            return [true, await this.create(data)]
        } else {
            return [false, user]
        }
    }

    async userExists(userId: string): Promise<boolean> {
        const user = await this.getById(userId);
        return user !== undefined;
    }

    async getAllUsers(): Promise<User[]> {
        const usersSnapshot = await this.collection.get();
        const users: User[] = [];

        usersSnapshot.forEach(doc => {
            users.push(doc.data() as User);
        });

        return users;
    }

    async updateUser(userId: string, lastUpdateDate: Date): Promise<void> {
        const dateStr = lastUpdateDate.toISOString().split('T')[0];
        await this.update(userId, { last_update: dateStr });
    }
}


export class FirestoreDatesRepository extends FirestoreRepository<BurgerDate> {

    constructor(credential: string) {
        super(credential, "fetched_dates")
    }

    async addDates(site: 'mitte' | 'nord' | 'polizei', dates: { [date: string]: string[] }): Promise<void> {
        // Extract the dates from the dictionary keys
        const dateKeys = Object.keys(dates);

        // Get a reference to the Firestore document where we want to add these dates
        const docRef = this.collection.doc('fetched_dates');

        // Update the site field with the extracted dates
        await docRef.set({ [site]: dateKeys });
    }

    async getDates(site: 'mitte' | 'nord' | 'polizei'): Promise<string[] | undefined> {
        const docSnapshot = await this.collection.doc('fetched_dates').get();

        if (docSnapshot.exists) {
            const data = docSnapshot.data() as { [key: string]: string[] };
            console.log(data)
            return data[site];
        } else {
            return undefined;
        }
    }

}
