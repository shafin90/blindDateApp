import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Alert, FlatList, TouchableOpacity, BackHandler, Image } from "react-native";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/context/authContext";

export default function FriendProfileScreen() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [selectedInterests, setSelectedInterests] = useState([]); // Fetch interests from DB
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");
  const router = useRouter();
  const { partnersId } = useAuth();




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



  // Fetch user data when authenticated
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        fetchUserData(user.uid);
      } else {
        router.replace("/login");
      }
    });

    return unsubscribe;
  }, []);

  // Function to fetch user data from Firestore
  const fetchUserData = async (userId) => {
    try {
      const userRef = doc(db, "users", partnersId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {

        const userData = userSnap.data();
        setName(userData.name || "No Name");
        setBio(userData.bio || "No bio available");
        setEmail(userData.email || "No email available");
        setSelectedInterests(userData.interests || []); // Fetch and set interests
        setProfilePicture(userData.profilePic || ""); // Fetch and set profile picture
        
      } else {
        Alert.alert("User not found");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };


  return (
    <View style={{ flex: 1, padding: 20, backgroundColor: "#f5f5f5", alignItems: "center" }}>
      <Image
        source={{ uri: profilePicture || "../assets/dummy-profile.png" }}
        style={{ width: 100, height: 100, borderRadius: 50, marginBottom: 10 }} // Default profile picture
      />    
      <Text style={{ fontSize: 28, fontWeight: "bold", color: "#333", marginBottom: 5 }}>{name || "Name is not available"}</Text>
      {user && <Text style={{ fontSize: 16, color: "#555", marginBottom: 15 }}> {email || "Not Aavailable"}</Text>}

      <Text style={{ fontSize: 16, color: "#555", marginBottom: 15 }}> {bio || "Not Aavailable"}</Text>





      <Text style={{ fontSize: 18, fontWeight: "bold", marginVertical: 10 }}>Interests:</Text>

      <View style={{ flex: 1, width: "100%" }}>
        <FlatList
          data={selectedInterests} // Fetch dynamic interests
          numColumns={2}
          keyExtractor={(item) => item}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.interestButton, styles.selectedInterest]}
              disabled={true} // Prevent clicks (unchangeable)
            >
              <Text style={{ color: "white" }}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ paddingBottom: 20 }}
        />
      </View>
    </View>
  );
}

// Styles
const styles = {
  input: {
    width: "90%",
    backgroundColor: "#ddd", // Greyed out input for uneditable fields
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#aaa",
    marginBottom: 10,
  },
  interestButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    margin: 5,
    borderWidth: 1,
    borderColor: "#4d79ff",
    borderRadius: 10,
    backgroundColor: "#4d79ff", // Keep interests selected by default
  },
  selectedInterest: {
    backgroundColor: "#4d79ff",
    borderColor: "#4d79ff",
  }
};
