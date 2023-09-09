"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirestoreUserRepository = exports.FirestoreRepository = void 0;
const admin = __importStar(require("firebase-admin"));
const app_1 = require("firebase-admin/app");
class FirestoreRepository {
    constructor(credential, collectionPath) {
        admin.initializeApp({ credential: (0, app_1.cert)(credential) }); // Initialize Firebase Admin SDK
        // Get a reference to the Firestore collection
        this.collection = admin.firestore().collection(collectionPath);
    }
    // Create a new document with an automatically generated ID
    create(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const docRef = yield this.collection.add(data);
            return data;
        });
    }
    // Read a document by ID
    getById(id) {
        return __awaiter(this, void 0, void 0, function* () {
            const docSnapshot = yield this.collection.doc(id).get();
            if (docSnapshot.exists) {
                return docSnapshot.data();
            }
            else {
                return undefined;
            }
        });
    }
    // Update an existing document by ID
    update(id, data) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.doc(id).update(data);
        });
    }
    // Delete a document by ID
    delete(id) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.collection.doc(id).delete();
        });
    }
    // Query documents based on a specific field and value
    getByField(fieldName, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const querySnapshot = yield this.collection.where(fieldName, '==', value).get();
            const documents = [];
            querySnapshot.forEach((doc) => {
                documents.push(doc.data());
            });
            return documents;
        });
    }
}
exports.FirestoreRepository = FirestoreRepository;
class FirestoreUserRepository extends FirestoreRepository {
    constructor(credential) {
        super(credential, "users");
    }
    getOrCreate(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.getById(data.chatId);
            if (user === undefined) {
                return [true, yield this.create(data)];
            }
            else {
                return [false, user];
            }
        });
    }
}
exports.FirestoreUserRepository = FirestoreUserRepository;
//# sourceMappingURL=firestore.js.map