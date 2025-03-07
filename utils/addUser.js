import { db } from '../config/firebase';
import { collection, addDoc } from "firebase/firestore";

export const addUser = async (addingObject) => {
  try {
    await addDoc(collection(db, "users"), addingObject);
  } catch (error) {
    console.error("Error adding user:", error);
  }
};




