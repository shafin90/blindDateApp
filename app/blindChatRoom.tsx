import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    Modal,
    BackHandler
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
    updateDoc
} from "firebase/firestore";
import { format } from "date-fns";
import { useAuth } from "@/context/authContext";


export default function BlindChatRoom() {

    // ✅ FlatList-এর রেফারেন্স তৈরি করুন
    const flatListRef = useRef(null);

    const { chatId } = useLocalSearchParams();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [remainingTime, setRemainingTime] = useState(600); // Default 10 min
    const [requestSent, setRequestSent] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [chatUsers, setChatUsers] = useState([]); // Store user IDs before deleting chat
    const router = useRouter();
    const { user, blindMessageReciever } = useAuth();



    useFocusEffect(
        React.useCallback(() => {
            const handleBackPress = () => {
                router.push("/"); // Force user to go home
                return true; // Prevent default back action
            };

            BackHandler.addEventListener("hardwareBackPress", handleBackPress);

            return () => {
                BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
            };
        }, [])
    );


    // ✅ Step 1: Store or Fetch Chat Start Time from Firestore
    useEffect(() => {
        if (!chatId) return;

        const fetchChatStartTime = async () => {
            const chatRef = doc(db, "chats", chatId);
            const chatDoc = await getDoc(chatRef);

            if (!chatDoc.exists()) {
                // Chat doesn't exist, create it and set start time
                await setDoc(chatRef, { chatId, chatStartTime: new Date() });
                setRemainingTime(600);
            } else {
                // Chat exists, calculate remaining time
                const chatData = chatDoc.data();
                const startTime = chatData.chatStartTime?.toDate();
                if (startTime) {
                    const now = new Date();
                    const elapsedSeconds = Math.floor((now - startTime) / 1000);
                    setRemainingTime(Math.max(600 - elapsedSeconds, 0)); // Max to avoid negatives
                }
            }
        };

        fetchChatStartTime();
    }, [chatId]);

    // ✅ Step 2: Real-time Countdown Timer
    useEffect(() => {
        if (!chatId || remainingTime <= 0) return;

        const interval = setInterval(() => {
            setRemainingTime((prev) => {
                if (prev <= 1) {
                    clearInterval(interval);
                    clearChatHistory(); // Delete chat when timer reaches 0
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [chatId, remainingTime]);

    // ✅ Step 3: Real-time Message Fetching
    useEffect(() => {
        if (!chatId) return;

        const q = query(
            collection(db, "blindMessages"),
            where("chatId", "==", chatId),
            orderBy("createdAt", "asc")
        );

        // const unsubscribe = onSnapshot(q, (snapshot) => {
        //     setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        // });

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newMessages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setMessages(newMessages);

            // ✅ নতুন মেসেজ আসলে নিচে স্ক্রল হবে
            if (flatListRef.current) {
                setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
            }
        });

        return () => unsubscribe();
    }, [chatId]);

    // ✅ Step 4: Delete Chat Messages when Timer Ends
    const clearChatHistory = async () => {
        if (!chatId) return;

        try {
            const messagesQuery = query(
                collection(db, "blindMessages"),
                where("chatId", "==", chatId)
            );
            const messagesSnap = await getDocs(messagesQuery);

            const deletePromises = messagesSnap.docs.map(async (msgDoc) => {
                await deleteDoc(doc(db, "blindMessages", msgDoc.id));
            });

            await Promise.all(deletePromises);
            await deleteDoc(doc(db, "chats", chatId)); // Delete chat metadata
            setMessages([]);
        } catch (error) {
            console.error("Error clearing chat history:", error);
        }
    };

    // ✅ Step 5: Send Messages
    const sendMessage = async () => {
        if (!newMessage.trim() || !chatId) return;
        const user = auth.currentUser;
        if (!user) return;

        await addDoc(collection(db, "blindMessages"), {
            chatId,
            text: newMessage,
            senderId: user.uid,
            receiver: blindMessageReciever.id || blindMessageReciever.senderId,
            createdAt: new Date(),
        });

        setNewMessage("");

        if (flatListRef.current) {
            setTimeout(() => flatListRef.current.scrollToEnd({ animated: true }), 100);
        }
    };


    const sendFriendRequest = async () => {
        if (!user) {
            Alert.alert("Error", "You need to be logged in to send a request.");
            return;
        }

        try {
            // ✅ Sender er reference (Current user)
            const senderRef = doc(db, "users", user.uid);
            const senderSnap = await getDoc(senderRef);
            if (!senderSnap.exists()) {
                Alert.alert("Error", "Your profile is incomplete.");
                return;
            }
            const senderData = senderSnap.data();

            // ✅ Receiver er reference (Blind Message Receiver)
            const receiverId = blindMessageReciever.id || blindMessageReciever.senderId;
            const receiverRef = doc(db, "users", receiverId);
            const receiverSnap = await getDoc(receiverRef);

            if (!receiverSnap.exists()) {
                Alert.alert("Error", "Receiver profile not found.");
                router.push("/");
                return;
            }
            const receiverData = receiverSnap.data();

            // ✅ Check if request already exists
            if (receiverData.friendRequests?.some(req => req.uid === user.uid)) {
                Alert.alert("Pending", "You have already sent a request to this user.");
                router.push("/");
                return;
            }

            // ✅ Update receiver's friendRequests array
            await updateDoc(receiverRef, {
                friendRequests: [
                    ...(receiverData.friendRequests || []), // Previous requests
                    {
                        uid: user.uid,
                        name: senderData.name,
                        email: senderData.email,
                        profilePic: senderData.profilePic || null, // If profilePic exists
                        interests: senderData.interests || [],
                        timestamp: new Date() // Store request time
                    }
                ],
            });

            Alert.alert("Success", "Friend request sent successfully!");
            router.push("/");
        } catch (error) {
            console.error("Error sending friend request:", error);
            Alert.alert("Error", "Could not send the friend request. Try again.");
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
                renderItem={({ item }) => {
                    const messageTime = item.createdAt?.toDate
                        ? format(item.createdAt.toDate(), "MMM d, h:mm a")
                        : "Unknown time";

                    return (
                        <View style={{
                            padding: 10,
                            marginVertical: 5,
                            borderRadius: 10,
                            alignSelf: item.senderId === auth.currentUser?.uid ? "flex-end" : "flex-start",
                            backgroundColor: item.senderId === auth.currentUser?.uid ? "#d1e7ff" : "#f0f0f0",
                            maxWidth: "75%"
                        }}>
                            <Text style={{ fontSize: 16 }}>{item.text}</Text>
                            <Text style={{ fontSize: 10, color: "gray", marginTop: 5 }}>{messageTime}</Text>
                        </View>
                    );
                }}

                inverted={false}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            />

            {remainingTime > 0 && (
                <TextInput
                    placeholder="Type a message..."
                    value={newMessage}
                    onChangeText={setNewMessage}
                    style={{
                        borderWidth: 1,
                        borderColor: "#ddd",
                        backgroundColor: "white",
                        borderRadius: 10,
                        padding: 12,
                        marginBottom: 10
                    }}
                />
            )}


            {remainingTime > 0 && (
                <TouchableOpacity
                    onPress={sendMessage}
                    style={{
                        backgroundColor: "#4CAF50",
                        padding: 15,
                        borderRadius: 10,
                        alignItems: "center",
                        marginBottom: 10
                    }}>
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>Send</Text>
                </TouchableOpacity>
            )}

            {remainingTime <= 0 && !requestSent ? (
                <TouchableOpacity style={{
                    backgroundColor: "#4CAF50",
                    padding: 15,
                    borderRadius: 10,
                    alignItems: "center",
                    marginBottom: 10
                }} onPress={sendFriendRequest} >
                    <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }} >Send Friend Request</Text>
                </TouchableOpacity>

            ) : null}
        </View>
    );
}
