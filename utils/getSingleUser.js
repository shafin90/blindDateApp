import { db } from '@/config/firebase';
import { doc, getDoc } from "firebase/firestore";

export const getUserById = async (userId, collectionName) => {
  try {
    const userRef = doc(db, collectionName, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {


      console.log(userSnap.exists())
      return userSnap.data();
    } else {
      console.log("No such user found!");
    }
  } catch (error) {
    console.error("Error fetching user:", error);
  }
};
