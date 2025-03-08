import { db } from './firebase.config';
import { doc, deleteDoc } from "firebase/firestore";

export const deleteUser = async (userId, collectionName) => {
    try {
        await deleteDoc(doc(db, collectionName, userId));
        console.log("User deleted successfully!");
    } catch (error) {
        console.error("Error deleting user:", error);
    }
};
