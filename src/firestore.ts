import * as admin from 'firebase-admin';
import { cert } from 'firebase-admin/app';

export class FirestoreRepository<T> {
    private collection: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;

    constructor(credential: string, collectionPath: string) {
        admin.initializeApp({ credential: cert(credential) }); // Initialize Firebase Admin SDK

        // Get a reference to the Firestore collection
        this.collection = admin.firestore().collection(collectionPath);
    }

    // Create a new document with an automatically generated ID
    async create(data: T): Promise<T> {
        const docRef = await this.collection.add(data);
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
}

export type User = {
    chatId: string
}

export class FirestoreUserRepository extends FirestoreRepository<User> {

    constructor(credential: string) {
        super(credential, "users")
    }

    async getOrCreate(data: User): Promise<[boolean, User]> {
        const user = await this.getById(data.chatId)
        if (user === undefined) {
            return [true, await this.create(data)]
        } else {
            return [false, user]
        }
    }
}
