import { db } from '../firebase.config';
import { doc, setDoc } from "firebase/firestore";

export const updateUser = async (userId, collectionName) => {
  try {
    await setDoc(doc(db, "users", userId), collectionName, { merge: false });  // This will overwrite the entire document

    console.log("User updated successfully!");
  } catch (error) {
    console.error("Error updating user:", error);
  }
};
