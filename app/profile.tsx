import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, TextInput, Alert, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, BackHandler } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { auth, db } from "../config/firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import axios from "axios";
import LottieView from "lottie-react-native";

const { width } = Dimensions.get("window");

// Interests list with icons
const interestsList = [
  { name: "Music", icon: "musical-notes" },
  { name: "Movies", icon: "film-outline" },
  { name: "Sports", icon: "football-outline" },
  { name: "Books", icon: "book-outline" },
  { name: "Travel", icon: "airplane-outline" },
  { name: "Gaming", icon: "game-controller-outline" },
  { name: "Cooking", icon: "restaurant-outline" },
  { name: "Fitness", icon: "barbell-outline" },
];

export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true); // 🔥 Add loading state
  const router = useRouter();


  // to trigger back to the home screen smoothly
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
  // to trigger back to the home screen smoothly

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const userRef = doc(db, "users", user?.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          const data = userSnap.data();
          setName(data.name || "");
          setBio(data.bio || "");
          setSelectedInterests(data.interests || []);
          setProfilePic(data.profilePic || null);
        }
      } else {
        router.replace("/login");
      }
      setTimeout(() => setLoading(false), 2000); // Simulate loading for 2 sec
    });

    return unsubscribe;
  }, []);

  const handleSaveProfile = async () => {
    if (!user) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    try {
      setLoading(true); // ✅ Start loading before update

      const userRef = doc(db, "users", user?.uid);
      await setDoc(
        userRef,
        { name, bio, interests: selectedInterests, email: user?.email, profilePic },
        { merge: true }
      );


    } catch (error) {
      console.error("Error saving profile:", error);
      Alert.alert("Update Failed", "Could not save profile.");
    } finally {
      setLoading(false); // ✅ Stop loading after update
    }
  };


  const handleLogout = async () => {
    await auth.signOut();
    router.replace("/login");
  };

  const toggleInterest = (interest: string) => {
    if (selectedInterests.includes(interest)) {
      setSelectedInterests(selectedInterests.filter((i) => i !== interest));
    } else if (selectedInterests.length < 5) {
      setSelectedInterests([...selectedInterests, interest]);
    } else {
      Alert.alert("Limit Reached", "You can select up to 5 interests.");
    }
  };



  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        {/* ❤️ Heart-shaped Loader */}
        <LottieView
          source={require("../assets/heart-loading.json")} // Ensure the file exists in assets folder
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }






  const pickImage = async () => {
    // Request permission
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "You need to allow access to photos.");
      return;
    }

    // Open Image Picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets.length > 0) {
      const imageUri = result.assets[0].uri;
      uploadImage(imageUri); // Call the upload function
    }
  };



  const uploadImage = async (uri: string) => {
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcmrm7taq/image/upload";
    const UPLOAD_PRESET = "blindChatApp"; // Set from Cloudinary Dashboard

    try {
      setLoading(true); // ✅ Start loading when upload begins

      const formData = new FormData();
      formData.append("file", { uri, type: "image/jpeg", name: "upload.jpg" });
      formData.append("upload_preset", UPLOAD_PRESET); // Required for unsigned uploads

      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = response.data.secure_url;
      
      // Save Image in Firestore
      await saveProfileImage(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Upload Failed", "Something went wrong.");
    } finally {
      setLoading(false); // ✅ Stop loading when upload completes (even if failed)
    }
  };




  const saveProfileImage = async (imageUrl: string) => {
    if (!user) {
      Alert.alert("Error", "User not logged in.");
      return;
    }

    try {
      setLoading(true); // ✅ Start loading when updating Firestore

      const userRef = doc(db, "users", user?.uid);
      await updateDoc(userRef, { profilePic: imageUrl });

      setProfilePic(imageUrl); // ✅ Update UI with new image
    } catch (error) {
      console.error("Error saving image:", error);
      Alert.alert("Update Failed", "Could not save profile picture.");
    } finally {
      setLoading(false); // ✅ Stop loading after update
    }
  };



  return (
    <LinearGradient colors={["#0D0D1A", "#1B133B"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Profile Picture */}
        <TouchableOpacity onPress={pickImage}>
          {profilePic ? (
            <Image source={{ uri: profilePic }} style={styles.profileImage} />
          ) : (
            <Ionicons name="person-circle" size={100} color="#E94057" />
          )}
        </TouchableOpacity>
        <Text style={styles.tapText}>Tap to change profile picture</Text>

        {/* Name & Bio */}
        <Text style={styles.title}>{name || "Your Name"}</Text>
        {user && (
          <Text style={styles.emailText}>{`Email: ${user?.email}\nBio: ${bio}`}</Text>
        )}



        <TextInput
          placeholder="Your Name"
          value={name}
          onChangeText={setName}
          style={styles.input}
        />
        <TextInput
          placeholder="Your Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          style={[styles.input, { height: 80 }]}
        />

        {/* Interests Grid */}
        <Text style={styles.sectionTitle}>Select Interests:</Text>
        <FlatList
          key={`flatlist-${3}`} // Ensures fresh render
          data={interestsList}
          numColumns={3}
          keyExtractor={(item) => item.name}
          style={styles.interestList}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggleInterest(item.name)}
              style={[
                styles.interestButton,
                selectedInterests.includes(item.name) && styles.selectedInterest
              ]}
            >
              <Ionicons
                name={item.icon}
                size={24}
                color={selectedInterests.includes(item.name) ? "white" : "#ddd"}
              />
              <Text style={{ color: selectedInterests.includes(item.name) ? "white" : "#ddd", marginTop: 5 }}>
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
        />

        {/* Buttons */}
        <TouchableOpacity onPress={handleSaveProfile} style={styles.button}>
          <Ionicons name="save" size={20} color="white" />
          <Text style={styles.buttonText}>Save Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={[styles.button, { backgroundColor: "#8A56AC" }]}>
          <Ionicons name="log-out" size={20} color="white" />
          <Text style={styles.buttonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

// **Styles**
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { alignItems: "center", paddingVertical: 20 },
  profileImage: { width: 110, height: 110, borderRadius: 55, borderWidth: 3, borderColor: "#E94057", marginTop: 20 },
  tapText: { color: "#FFC0CB", fontSize: 10, marginBottom: 10, marginTop: 5 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFC0CB", marginBottom: 5, marginTop: 15 },
  emailText: { color: "#ddd", fontSize: 14, marginBottom: 15 },
  input: { width: "90%", backgroundColor: "#2B2B41", color: "white", padding: 12, borderRadius: 10, marginBottom: 10 },
  sectionTitle: { color: "#FFC0CB", fontSize: 18, marginTop: 20 },
  interestList: { maxHeight: "auto", width: "95%", marginBottom: 30 }, // Limits height
  interestButton: { backgroundColor: "#2B2B41", padding: 15, margin: 5, borderRadius: 10, alignItems: "center", width: width / 3.5 },
  selectedInterest: { backgroundColor: "#E94057" },
  button: { backgroundColor: "#E94057", paddingVertical: 12, paddingHorizontal: 20, borderRadius: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", width: "90%", marginBottom: 10 },
  buttonText: { color: "white", fontSize: 18, marginLeft: 10 },



  // ❤️ Loading Animation Styles
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#0D0D1A" },
  lottie: { width: 150, height: 150 },
  loadingText: { color: "#FFC0CB", fontSize: 18, fontWeight: "bold", marginTop: 10 },
});
