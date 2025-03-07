import React, { useState, useEffect, useRef } from "react";
import { 
    View, Text, Image, TouchableOpacity, 
    StyleSheet, Alert, ActivityIndicator, Animated 
} from "react-native";
import { ProgressBar } from "react-native-paper";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { auth } from "../config/firebase"; 
import InterestSelectionScreen from "./interestAskingScreen";

const db = getFirestore();

export default function ImageAskingScreen() {
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [step, setStep] = useState<number>(1); // Step (1 = Upload Photo, 2 = Interests)
    const router = useRouter();

    // Animation for image movement
    const position = useRef(new Animated.Value(1000)).current; // Start from below screen

    useEffect(() => {
        Animated.timing(position, {
            toValue: 0,  // Move to center
            duration: 1200,
            useNativeDriver: true,
        }).start();
    }, []);

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") {
            Alert.alert("Permission Denied", "You need to allow access to photos.");
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
        });

        if (!result.canceled && result.assets.length > 0) {
            const imageUri = result.assets[0].uri;
            setImageUri(imageUri);
            uploadImage(imageUri);
        }
    };

    const uploadImage = async (uri: string) => {
        const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcmrm7taq/image/upload";
        const UPLOAD_PRESET = "blindChatApp";

        try {
            setLoading(true);
            const formData = new FormData();
            formData.append("file", { uri, type: "image/jpeg", name: "upload.jpg" } as any);
            formData.append("upload_preset", UPLOAD_PRESET);

            const response = await axios.post(CLOUDINARY_URL, formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            const imageUrl = response.data.secure_url;
            setImageUri(imageUrl);
            await saveProfileImage(imageUrl);

            Alert.alert("✅ Upload Successful", "Your profile picture has been updated.");
            
            // Move to next step
            setStep(2);
        } catch (error) {
            console.error("Error uploading image:", error);
            Alert.alert("❌ Upload Failed", "Something went wrong.");
        } finally {
            setLoading(false);
        }
    };

    const saveProfileImage = async (imageUrl: string) => {
        if (!auth.currentUser) return;

        try {
            await setDoc(doc(db, "users", auth.currentUser.uid), { profilePic: imageUrl }, { merge: true });
        } catch (error) {
            console.error("Error saving image URL:", error);
        }
    };

    return (
        <View style={styles.container}>
            {/* Progress Indicator (Top Bar) */}
            <View style={styles.progressBarContainer}>
                <ProgressBar 
                    progress={step === 1 ? 0.5 : 1} 
                    color="#bc96ff" 
                    style={styles.progressBar} 
                />
            </View>

            {/* Title Based on Step */}
            <Text style={styles.title}>{step === 1 ? "Upload Your Photo" : ""}</Text>

            {/* Animated Image Picker (Moving from bottom to center) */}
            {step === 1 ? (
                <Animated.View style={{ transform: [{ translateY: position }] }}>
                    <TouchableOpacity onPress={pickImage} style={styles.imageContainer} disabled={loading}>
                        {imageUri ? (
                            <Image source={{ uri: imageUri }} style={styles.image} />
                        ) : (
                            <Text style={styles.uploadText}>Tap to Upload</Text>
                        )}
                    </TouchableOpacity>
                </Animated.View>
            ) : (
                <InterestSelectionScreen/>
            )}

            {/* Uploading Indicator */}
            {loading && <ActivityIndicator size="large" color="#bc96ff" />}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#371f7d", // Dark theme
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
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
    title: {
        fontSize: 28,
        fontWeight: "bold",
        color: "#d7ff81",
        marginBottom: 20,
        textAlign: "center",
    },
    imageContainer: {
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: "rgba(255, 255, 255, 0.1)", // Glass effect
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 20,
        overflow: "hidden",
        borderWidth: 2,
        borderColor: "#bc96ff",
    },
    image: {
        width: "100%",
        height: "100%",
        borderRadius: 90,
    },
    uploadText: {
        color: "#bc96ff",
        fontSize: 16,
    },
    interestsContainer: {
        alignItems: "center",
        justifyContent: "center",
        marginTop: 20,
    },
    interestText: {
        fontSize: 18,
        color: "#ddd",
        textAlign: "center",
        marginBottom: 20,
    },
    continueButton: {
        backgroundColor: "#bc96ff",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        marginTop: 10,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#371f7d",
        textAlign: "center",
    },
});
