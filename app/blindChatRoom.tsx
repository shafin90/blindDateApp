import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  BackHandler,
} from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { auth, db } from "../config/firebase";
import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { format } from "date-fns";
import { useAuth } from "@/context/authContext";

// ✅ Define Message Type
interface Message {
  id: string;
  chatId: string;
  text: string;
  senderId: string;
  receiver: string;
  createdAt: { toDate: () => Date };
}

export default function BlindChatRoom() {
  const flatListRef = useRef<FlatList>(null);
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [remainingTime, setRemainingTime] = useState(600); // 10 min
  const [requestSent, setRequestSent] = useState(false);
  const router = useRouter();
  const { user, blindMessageReciever } = useAuth();

  // ✅ Prevent Back Button from Exiting Chat
  useFocusEffect(
    useCallback(() => {
      const handleBackPress = () => {
        router.push("/");
        return true;
      };

      BackHandler.addEventListener("hardwareBackPress", handleBackPress);
      return () => BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
    }, [router])
  );

  // ✅ Fetch Chat Start Time
  useEffect(() => {
    if (!chatId) return;

    const fetchChatStartTime = async () => {
      const chatRef = doc(db, "chats", chatId);
      const chatDoc = await getDoc(chatRef);

      if (!chatDoc.exists()) {
        await setDoc(chatRef, { chatId, chatStartTime: new Date() });
        setRemainingTime(600);
      } else {
        const chatData = chatDoc.data();
        const startTime = chatData.chatStartTime?.toDate();
        if (startTime) {
          const now = new Date();
          const elapsedSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
          setRemainingTime(Math.max(600 - elapsedSeconds, 0));
        }
      }
    };

    fetchChatStartTime();
  }, [chatId]);

  // ✅ Countdown Timer
  useEffect(() => {
    if (!chatId || remainingTime <= 0) return;

    const timer = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          clearChatHistory();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [chatId, remainingTime]);

  // ✅ Fetch Messages in Real-Time
  useEffect(() => {
    if (!chatId) return;

    const q = query(
      collection(db, "blindMessages"),
      where("chatId", "==", chatId),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Message[];

      setMessages(newMessages);

      // ✅ Scroll to the bottom when a new message arrives
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => unsubscribe();
  }, [chatId]);

  // ✅ Delete Chat History After Timer Ends
  const clearChatHistory = async () => {
    if (!chatId) return;

    try {
      const messagesQuery = query(collection(db, "blindMessages"), where("chatId", "==", chatId));
      const messagesSnap = await getDocs(messagesQuery);

      const deletePromises = messagesSnap.docs.map((msgDoc) => deleteDoc(doc(db, "blindMessages", msgDoc.id)));
      await Promise.all(deletePromises);
      await deleteDoc(doc(db, "chats", chatId));
      setMessages([]);
    } catch (error) {
      console.error("Error clearing chat history:", error);
    }
  };

  // ✅ Send Message
  const sendMessage = async () => {
    if (!newMessage.trim() || !chatId || !user) return;

    await addDoc(collection(db, "blindMessages"), {
      chatId,
      text: newMessage,
      senderId: user.uid,
      receiver: blindMessageReciever.id || blindMessageReciever.senderId,
      createdAt: new Date(),
    });

    setNewMessage("");

    // ✅ Scroll to the bottom after sending message
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  // ✅ Send Friend Request
  const sendFriendRequest = async () => {
    if (!user) {
      Alert.alert("Error", "You need to be logged in to send a request.");
      return;
    }

    try {
      const senderRef = doc(db, "users", user.uid);
      const senderSnap = await getDoc(senderRef);
      if (!senderSnap.exists()) {
        Alert.alert("Error", "Your profile is incomplete.");
        return;
      }

      const senderData = senderSnap.data();
      const receiverId = blindMessageReciever.id || blindMessageReciever.senderId;
      const receiverRef = doc(db, "users", receiverId);
      const receiverSnap = await getDoc(receiverRef);

      if (!receiverSnap.exists()) {
        Alert.alert("Error", "Receiver profile not found.");
        router.push("/");
        return;
      }

      const receiverData = receiverSnap.data();
      if (receiverData.friendRequests?.some((req: { uid: string }) => req.uid === user.uid)) {
        Alert.alert("Pending", "You have already sent a request.");
        return;
      }

      await updateDoc(receiverRef, {
        friendRequests: [
          ...(receiverData.friendRequests || []),
          {
            uid: user.uid,
            name: senderData.name,
            email: senderData.email,
            profilePic: senderData.profilePic || null,
            interests: senderData.interests || [],
            timestamp: new Date(),
          },
        ],
      });

      Alert.alert("Success", "Friend request sent!");
      router.push("/");
    } catch (error) {
      console.error("Error sending friend request:", error);
      Alert.alert("Error", "Could not send request.");
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5" }}>
      <Text style={{ fontSize: 24, fontWeight: "bold", textAlign: "center", marginBottom: 10 }}>
        Blind Chat
      </Text>
      <Text style={{ fontSize: 16, color: "red", textAlign: "center", marginBottom: 10 }}>
        Time Left: {Math.floor(remainingTime / 60)}:{(remainingTime % 60).toString().padStart(2, "0")}
      </Text>

      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={{
              padding: 10,
              marginVertical: 5,
              borderRadius: 10,
              alignSelf: item.senderId === user?.uid ? "flex-end" : "flex-start",
              backgroundColor: item.senderId === user?.uid ? "#d1e7ff" : "#f0f0f0",
              maxWidth: "75%",
            }}
          >
            <Text>{item.text}</Text>
            <Text style={{ fontSize: 10, color: "gray", marginTop: 5 }}>
              {format(item.createdAt.toDate(), "MMM d, h:mm a")}
            </Text>
          </View>
        )}
      />
    </View>
  );
}
