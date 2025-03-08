import React, { useState, useEffect, useRef } from "react";
import {
    View, Text, TouchableOpacity, StyleSheet, Animated, FlatList
} from "react-native";
import { useRouter } from "expo-router";
import { ProgressBar } from "react-native-paper";
import { MaterialIcons } from "@expo/vector-icons";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/config/firebase";

// Proper Interest categories with correct icons
const INTEREST_CATEGORIES = {
    Music: [
        { name: "Rock", icon: "audiotrack" },
        { name: "Jazz", icon: "music-note" },
        { name: "Hip-Hop", icon: "headset" },
        { name: "Classical", icon: "library-music" },
        { name: "Pop", icon: "queue-music" },
        { name: "Electronic", icon: "graphic-eq" },
        { name: "Live Concerts", icon: "album" },
        { name: "K-Pop", icon: "music-video" },
    ],
    Sports: [
        { name: "Football", icon: "sports-soccer" },
        { name: "Basketball", icon: "sports-basketball" },
        { name: "Tennis", icon: "sports-tennis" },
        { name: "Cricket", icon: "sports-cricket" },
        { name: "Swimming", icon: "pool" },
        { name: "Cycling", icon: "pedal-bike" },
        { name: "Gym & Fitness", icon: "fitness-center" },
        { name: "Running", icon: "directions-run" },
    ],
    Food: [
        { name: "Pizza", icon: "local-pizza" },
        { name: "Sushi", icon: "set-meal" },
        { name: "Burgers", icon: "fastfood" },
        { name: "Vegan", icon: "eco" },
        { name: "Ice Cream", icon: "icecream" },
        { name: "BBQ", icon: "outdoor-grill" },
        { name: "Seafood", icon: "restaurant-menu" },
        { name: "Street Food", icon: "ramen-dining" },
    ],
    Travel: [
        { name: "Mountains", icon: "terrain" },
        { name: "Beaches", icon: "beach-access" },
        { name: "Road Trips", icon: "directions-car" },
        { name: "Camping", icon: "hiking" },
        { name: "City Tours", icon: "location-city" },
        { name: "Cruises", icon: "directions-boat" },
        { name: "Historical Sites", icon: "account-balance" },
        { name: "Backpacking", icon: "travel-explore" },
    ],
};

export default function InterestSelectionScreen() {
    const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
    const [activeCategory, setActiveCategory] = useState<keyof typeof INTEREST_CATEGORIES>("Music");
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const router = useRouter();


    console.log(selectedInterests)

    // Fade-in animation when changing category
    useEffect(() => {
        fadeAnim.setValue(0);
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
        }).start();
    }, [activeCategory]);

    // Toggle interest selection
    const handleSelectInterest = (interest) => {
        setSelectedInterests(prev => {
            const exists = prev.some(i => i.name === interest.name);
            const updatedInterests = exists
                ? prev.filter(i => i.name !== interest.name)
                : [...prev, interest];

            // Update Firestore AFTER updating state
            updateUserInterests(updatedInterests);
            return updatedInterests;
        });
    };

    const updateUserInterests = async (updatedInterests) => {
        if (!auth?.currentUser?.uid) return;
        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), { interests: updatedInterests }, { merge: true });
        } catch (error) {
            console.error("Error updating interests:", error);
        }
    };



    return (
        <View style={styles.container}>

            {/* Category Tabs */}
            <View style={styles.categoryContainer}>
                {Object.keys(INTEREST_CATEGORIES).map(category => (
                    <TouchableOpacity
                        key={category}
                        onPress={() => setActiveCategory(category as keyof typeof INTEREST_CATEGORIES)}
                        style={[styles.categoryButton, activeCategory === category && styles.activeCategory]}
                    >
                        <Text style={styles.categoryText}>{category}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Animated Interests Grid */}
            <Animated.View style={{ opacity: fadeAnim }}>
                <FlatList
                    data={INTEREST_CATEGORIES[activeCategory]}
                    keyExtractor={(item) => item.name}
                    numColumns={2}
                    contentContainerStyle={styles.gridContainer}
                    renderItem={({ item }) => (
                        <TouchableOpacity
                            style={[
                                styles.interestBox,
                                selectedInterests.some(i => i.name === item.name) && styles.selectedBox
                            ]}
                            onPress={() => handleSelectInterest(item)}
                        >
                            <MaterialIcons
                                name={item.icon}
                                size={40}
                                color={selectedInterests.some(i => i.name === item.name) ? "white" : "#bc96ff"}
                            />
                            <Text style={{
                                ...styles.interestText,
                                color: selectedInterests.some(i => i.name === item.name) ? "white" : "#bc96ff"
                            }}>
                                {item.name}
                            </Text>
                        </TouchableOpacity>

                    )}
                />
            </Animated.View>

            {/* Continue Button */}
            <TouchableOpacity
                style={[styles.continueButton, selectedInterests.length > 0 ? styles.activeButton : styles.disabledButton]}
                disabled={selectedInterests.length === 0}
                onPress={() => router.replace("/mainHome")}
            >
                <Text style={styles.buttonText}>Continue</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#371f7d",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
        paddingBottom: 85,
        marginTop: 70,
    },
    progressBarContainer: {
        position: "absolute",
        top: 40,
        left: 20,
        right: 20,
    },
    progressBar: {
        height: 6,
        borderRadius: 5,
        backgroundColor: "#522e99",
    },
    subtitle: {
        fontSize: 16,
        color: "#ddd",
        marginBottom: 20,
        textAlign: "center",
    },
    categoryContainer: {
        flexDirection: "row",
        justifyContent: "center",
        flexWrap: "wrap",
        marginBottom: 15,
        width: "120%",
        right: 16,
        backgroundColor: "#371f7d"
    },
    categoryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginHorizontal: 5,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: "#bc96ff",
        marginBottom: 5,
    },
    activeCategory: {
        backgroundColor: "#bc96ff",
    },
    categoryText: {
        fontSize: 16,
        color: "#fff",
    },
    gridContainer: {
        alignItems: "center",
        justifyContent: "center",
    },
    interestBox: {
        width: 140,
        height: 140,
        borderRadius: 10,
        backgroundColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 2,
        borderColor: "#bc96ff",
        alignItems: "center",
        justifyContent: "center",
        margin: 10,
    },
    selectedBox: {
        backgroundColor: "#567E4A",
        borderWidth: 0
    },
    interestText: {
        fontSize: 16,
        marginTop: 5,
    },
    continueButton: {
        marginTop: 20,
        width: "80%",
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: "center",
    },
    activeButton: {
        backgroundColor: "#bc96ff",
        paddingHorizontal: 50,
    },
    disabledButton: {
        backgroundColor: "gray",
        paddingHorizontal: 50,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#371f7d",
    },
});
