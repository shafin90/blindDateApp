import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../context/authContext";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../config/firebase"; // Firebase config
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native"; // Import this
import { BackHandler } from "react-native";

const BlindMessagesScreen = () => {
    const { user, setBlindMessageReciever } = useAuth();
    const [messages, setMessages] = useState<{ senderId: string; chatId: string; texts: string[] }[]>([]);
    const [loading, setLoading] = useState(true);



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


    useEffect(() => {
        const fetchMessages = async () => {
            if (!user || !user.uid) return; // Ensure user exists

            try {
                const q = query(collection(db, "blindMessages"), where("receiver", "==", user.uid));
                const querySnapshot = await getDocs(q);

                const groupedMessages: { [key: string]: { chatId: string; texts: string[] } } = {};

                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    if (!data.senderId || !data.chatId || !data.text) return; // Ensure required fields exist

                    if (!groupedMessages[data.senderId]) {
                        groupedMessages[data.senderId] = { chatId: data.chatId, texts: [] };
                    }
                    groupedMessages[data.senderId].texts.push(data.text);
                });

                const messageArray = Object.keys(groupedMessages).map((senderId) => ({
                    senderId,
                    chatId: groupedMessages[senderId].chatId,
                    texts: groupedMessages[senderId].texts,
                }));

                setMessages(messageArray);
            } catch (error) {
                console.error("Error fetching messages:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [user]);

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200EE" />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.header}>Blind Messages</Text>
            <FlatList
                data={messages}
                keyExtractor={(item) => item.senderId}
                renderItem={({ item, index }) => (
                    <TouchableOpacity
                        onPress={() => {
                            console.log("Selected Item:", item);
                            setBlindMessageReciever(item);
                            router.push(`/blindChatRoom?chatId=${item.chatId}`);
                        }}
                        style={styles.card}
                    >
                        <Text style={styles.senderName}>Sender {index + 1}</Text>
                        <Text numberOfLines={1} style={styles.previewText}>
                            {item.texts.length > 0 ? item.texts[item.texts.length - 1] : "No messages"} {/* Fix */}
                        </Text>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
};

export default BlindMessagesScreen;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: "#f5f5f5",
    },
    header: {
        fontSize: 22,
        fontWeight: "bold",
        marginBottom: 10,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    card: {
        backgroundColor: "white",
        padding: 15,
        marginVertical: 8,
        borderRadius: 10,
        elevation: 3,
    },
    senderName: {
        fontSize: 18,
        fontWeight: "bold",
    },
    previewText: {
        fontSize: 14,
        color: "gray",
    },
});
