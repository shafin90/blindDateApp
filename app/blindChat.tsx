import { useEffect, useState } from "react";
import { View, Text, Button, ActivityIndicator, Alert } from "react-native";
import { auth, db } from "../config/firebase";
import { collection, addDoc, getDocs, query, where, doc, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";

export default function BlindChatScreen() {
  const [chatId, setChatId] = useState(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (timeLeft <= 0 && chatId) {
      endChat();
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const findChatPartner = async () => {
    setLoading(true);
    const user = auth.currentUser;
    if (!user) {
      Alert.alert("Error", "User not logged in.");
      setLoading(false);
      return;
    }

    console.log("Finding a chat partner for user:", user.uid);

    try {
      const chatRef = collection(db, "blindChats");

      // Check if the user is already in an active chat
      const existingChatQuery = query(chatRef, where("users", "array-contains", user.uid), where("status", "==", "active"));
      const existingChatSnap = await getDocs(existingChatQuery);

      if (!existingChatSnap.empty) {
        console.log("User is already in an active chat.");
        setChatId(existingChatSnap.docs[0].id);
        setLoading(false);
        return;
      }

      // Find an open chat where someone is waiting
      const openChatQuery = query(chatRef, where("status", "==", "waiting"));
      const openChatSnap = await getDocs(openChatQuery);

      if (!openChatSnap.empty) {
        // Join the first open chat
        const chatDoc = openChatSnap.docs[0];
        const chatData = chatDoc.data();

        console.log("Joining existing chat:", chatDoc.id);

        await updateDoc(doc(db, "blindChats", chatDoc.id), {
          users: [...chatData.users, user.uid],
          status: "active",
        });

        setChatId(chatDoc.id);
      } else {
        // Create a new blind chat and wait for a partner
        console.log("Creating a new blind chat...");

        const newChat = await addDoc(chatRef, {
          users: [user.uid],
          status: "waiting",
          createdAt: new Date(),
        });

        console.log("New chat created with ID:", newChat.id);
        setChatId(newChat.id);
      }
    } catch (error) {
      console.error("Error finding a chat partner:", error);
      Alert.alert("Error", "Could not find a chat partner.");
    }

    setLoading(false);
  };

  const endChat = async () => {
    if (!chatId) return;
    console.log("Ending chat:", chatId);
    await updateDoc(doc(db, "blindChats", chatId), { status: "ended" });
    setChatId(null);
    setTimeLeft(600);
    Alert.alert("Chat ended", "You can start a new blind chat.");
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: "center", alignItems: "center" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold" }}>Blind Chat</Text>

      {loading && <ActivityIndicator size="large" color="blue" />}

      {!chatId ? (
        <Button title="Find a Chat Partner" onPress={findChatPartner} />
      ) : (
        <>
          <Text style={{ fontSize: 18, marginTop: 20 }}>Time Left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, "0")}</Text>
          <Button title="End Chat" onPress={endChat} color="red" />
          <Button title="Go to Chat" onPress={() => router.push(`/blindChatRoom?chatId=${chatId}`)} />
        </>
      )}
    </View>
  );
}
