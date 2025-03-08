import { db } from '../config/firebase';
import { collection, getDocs } from "firebase/firestore";

export const getUsers = async (collectionName) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    const usersList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    console.log("this is collection", usersList, "this is db ", collectionName)
    return usersList
  } catch (error) {
    console.error("Error fetching users:", error);
  }
};
