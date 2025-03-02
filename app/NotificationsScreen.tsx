import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, Alert, ActivityIndicator, BackHandler, StyleSheet } from "react-native";
import { auth, db } from "../config/firebase";
import { collection, getDocs, doc, getDoc, updateDoc } from "firebase/firestore";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/authContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import LottieView from "lottie-react-native";

export default function NotificationsScreen() {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const { user, setNotificationCount, setPartnersId } = useAuth();

    // Handle back button to return to home screen
    useFocusEffect(
        React.useCallback(() => {
            const handleBackPress = () => {
                router.push("/"); // Go back to home
                return true;
            };

            BackHandler.addEventListener("hardwareBackPress", handleBackPress);
            return () => {
                BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
            };
        }, [])
    );

    useEffect(() => {
        const fetchRequests = async () => {
            if (!user) {
                console.log("User is not logged in.");
                return;
            }

            try {
                setLoading(true);
                const querySnapShot = await getDocs(collection(db, "users"));
                const currentUser = querySnapShot.docs.map(doc => doc.data()).find(userData => userData.email === user.email);

                if (currentUser) {
                    setRequests(currentUser.friendRequests || []);
                    setNotificationCount(currentUser.friendRequests ? currentUser.friendRequests.length : 0);
                }
            } catch (error) {
                console.error("Error fetching requests:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, []);

    const acceptRequest = async (request) => {
        try {
        
            console.log(request)
            const userRef = doc(db, "users", user?.uid);
            const docSnap = await getDoc(userRef);

            const requestUserRef = doc(db, "users", request?.id || request?.uid);
            const docSnap2 = await getDoc(requestUserRef);

            await updateDoc(userRef, {
                friendRequests: requests.filter(req => req.uid !== request?.uid),
                partnerList: [...(docSnap?.data().partnerList || []), request]
            });

            await updateDoc(requestUserRef, {
                partnerList: [...(docSnap2?.data()?.partnerList || []), {...docSnap?.data(),uid: user?.uid}]
            });

            setPartnersId(request?.id || request?.uid);
            Alert.alert("Success", "Friend request accepted.");
            router.push("/partnersProfile");
        } catch (error) {
            console.error("Error accepting request:", error);
            Alert.alert("Error", "Failed to accept friend request. Try again.");
        }
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <LottieView
                    source={require("../assets/heart-loading.json")}
                    autoPlay
                    loop
                    style={styles.lottie}
                />
                <Text style={styles.loadingText}>Checking Requests...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={["#0D0D1A", "#1B133B"]} style={styles.container}>
            <Text style={styles.title}>Friend Requests ({requests.length})</Text>

            {requests.length === 0 ? (
                <Text style={styles.noRequestsText}>No friend requests.</Text>
            ) : (
                <FlatList
                    data={requests}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <View style={styles.requestCard}>
                            <View style={styles.userInfo}>
                                <Ionicons name="person-circle" size={40} color="#FFC0CB" />
                                <View style={{ marginLeft: 10 }}>
                                    <Text style={styles.userName}>{item.name || "Unknown"}</Text>
                                    <Text style={styles.userEmail}>{item.email}</Text>
                                </View>
                            </View>
                            <TouchableOpacity onPress={() => acceptRequest(item)} style={styles.acceptButton}>
                                <Text style={styles.acceptButtonText}>Accept</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                />
            )}
        </LinearGradient>
    );
}

// **💜 Styles**
const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 24, fontWeight: "bold", color: "#FFC0CB", textAlign: "center", marginBottom: 10 },
    noRequestsText: { textAlign: "center", fontSize: 16, color: "#ddd", marginTop: 20 },
    requestCard: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        padding: 15,
        marginVertical: 5,
        borderRadius: 12,
        shadowColor: "#000",
        shadowOpacity: 0.3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    userInfo: { flexDirection: "row", alignItems: "center" },
    userName: { fontSize: 16, fontWeight: "bold", color: "#FFC0CB" },
    userEmail: { color: "#ddd", fontSize: 14 },
    acceptButton: {
        backgroundColor: "#E94057",
        paddingVertical: 10,
        paddingHorizontal: 15,
        borderRadius: 8,
        shadowColor: "#E94057",
        shadowOpacity: 0.6,
        shadowOffset: { width: 0, height: 3 },
        elevation: 5,
    },
    acceptButtonText: { color: "white", fontWeight: "bold" },
    
    // ❤️ Loading Animation Styles
    loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0D1A" },
    lottie: { width: 150, height: 150 },
    loadingText: { color: "#FFC0CB", fontSize: 18, fontWeight: "bold", marginTop: 10 },
});

// export default NotificationsScreen;
