import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
  Alert,
  AppState,
  BackHandler
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Audio } from "expo-av";
import { auth, db } from "../config/firebase";
import { collection, addDoc, query, orderBy, onSnapshot, doc, getDoc, getDocs, updateDoc, setDoc, serverTimestamp, onDisconnect } from "firebase/firestore";
import { useAuth } from "@/context/authContext";
import { format } from "date-fns";
import axios from "axios";
import { router, useFocusEffect } from "expo-router";

import { Keyboard } from "react-native";


export default function ChatScreen() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [userName, setUserName] = useState("Anonymous"); // Default name
  const [userProfilePic, setUserProfilePic] = useState(null); // Default profile pic
  const [image, setImage] = useState(null);
  const flatListRef = useRef(null);
  const { setPartnersId, messageReciever } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [isTyping, setIsTyping] = useState(false);
  const [isOnline, setIsOnline] = useState(false);


  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMessages = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      const lastMessage = newMessages[0];
      if (lastMessage && lastMessage?.senderId !== auth?.currentUser?.uid) {
        playReceiveSound();
      }

      setMessages(newMessages);





      // ✅ Mark messages as "seen" if they are sent to the current user
      const user = auth.currentUser;
      if (user) {
        newMessages.forEach(async (msg) => {
          if (msg?.recieverId === user?.uid && msg?.seen === false) {
            const messageRef = doc(db, "messages", msg.id);
            await updateDoc(messageRef, { seen: true });
          }
        });
      }
    });

    return () => unsubscribe();
  }, []);


  useFocusEffect(
    React.useCallback(() => {
      const handleBackPress = () => {
        router.push("/ListScreen"); // Force user to go home
        return true; // Prevent default back action
      };

      BackHandler.addEventListener("hardwareBackPress", handleBackPress);

      return () => {
        BackHandler.removeEventListener("hardwareBackPress", handleBackPress);
      };
    }, [])
  );

  const handleTyping = async (typing) => {
    setIsTyping(typing); // ✅ Update isTyping state

    const user = auth.currentUser;
    if (!user) return;

    const typingRef = doc(db, "typingStatus", user?.uid || user?.id);
    await setDoc(typingRef, {
      senderId: user?.uid,
      receiverId: messageReciever,
      typing: typing, // ✅ Set true when keyboard up, false when keyboard down
      updatedAt: serverTimestamp(),
    });
  };





  const sendMessage = async () => {
    setNewMessage("");
    if (!newMessage?.trim() && !image) return;

    const user = auth?.currentUser;
    if (user) {
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImage(image);
      }

      await addDoc(collection(db, "messages"), {
        text: newMessage || null,
        senderId: user?.uid,
        recieverId: messageReciever,
        imageUrl: imageUrl || null,
        createdAt: new Date(),
        seen: false
      });

      playSendSound();
      startAnimation();
      setImage(null); // Clear image after sending
    }
  };

  // ✅ Pick an Image from Gallery
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
      setImage(result.assets[0].uri);
    }
  };

  // ✅ Upload Image to Cloudinary
  const uploadImage = async (uri) => {
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcmrm7taq/image/upload";
    const UPLOAD_PRESET = "blindChatApp";

    try {
      const formData = new FormData();
      formData.append("file", {
        uri,
        type: "image/jpeg",
        name: "upload.jpg",
      });
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      return response.data.secure_url; // Return uploaded image URL
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Upload Failed", "Something went wrong.");
      return null;
    }
  };

  // ✅ Format Date for Display
  const formatDate = (date) => {
    if (!date) return "";
    return format(new Date(date.seconds * 1000), "MMM d, yyyy h:mm a");
  };

  // ✅ Play Send Sound
  const playSendSound = async () => {
    const { sound } = await Audio.Sound.createAsync(require("../assets/send.mp3"));
    await sound.playAsync();
  };

  // ✅ Play Receive Sound
  const playReceiveSound = async () => {
    const { sound } = await Audio.Sound.createAsync(require("../assets/receive.mp3"));
    await sound.playAsync();
  };

  // ✅ Start Animation on Message Send
  const startAnimation = () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };




  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      try {
        const userRef = doc(db, "users", messageReciever);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const data = userSnap.data();
          setUserName(data.name || "Anonymous"); // Fallback to "Anonymous" if no name
          setUserProfilePic(data.profilePic || "https://www.w3schools.com/howto/img_avatar.png"); // Default avatar if no pic
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);


  // for "Type Indicator" feature
  useEffect(() => {
    const typingRef = doc(db, "typingStatus", messageReciever);
    const unsubscribe = onSnapshot(typingRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setIsTyping(data.typing && data.senderId === messageReciever);
      }
    });


    return () => unsubscribe();
  }, [messageReciever]);


  // ✅ Step 1: Update Firestore When a User is Online
  useEffect(() => {
    const user = auth.currentUser;
    if (!user) return;

    const userRef = doc(db, "users", user?.uid);

    const setUserOnline = async () => {
      await updateDoc(userRef, { online: true });
    };

    const setUserOffline = async () => {
      await updateDoc(userRef, { online: false });
    };

    // ✅ Track app state changes
    const handleAppStateChange = (nextAppState) => {
      if (nextAppState === "active") {
        setUserOnline();  // App is in the foreground
      } else {
        setUserOffline(); // App is in the background or closed
      }
    };

    // ✅ Initial online status
    setUserOnline();

    // ✅ Listen for app state changes
    const subscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      setUserOffline(); // Set offline when component unmounts
      subscription.remove(); // Remove listener
    };
  }, []);

  // ✅ Step 2: Listen for Online Status
  useEffect(() => {
    const userRef = doc(db, "users", messageReciever);
    const unsubscribe = onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        setIsOnline(doc.data().online);
      }
    });

    return () => unsubscribe();
  }, [messageReciever]);




  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener("keyboardDidShow", () => {
      handleTyping(true); // ✅ User started typing when keyboard is up
    });

    const keyboardDidHideListener = Keyboard.addListener("keyboardDidHide", () => {
      handleTyping(false); // ✅ User stopped typing when keyboard is down
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);



  return (
    <LinearGradient colors={["#f5f7fa", "#497D74"]} style={styles.container}>

      {/* 🔹 Profile Section */}
      <TouchableOpacity
        style={styles.profileContainer}
        onPress={() => {
          setPartnersId(messageReciever);
          router.push("/partnersProfile");
        }}
      >
        <Image
          source={{ uri: userProfilePic }}
          style={styles.profileImage}
        />
        <View>
          <Text style={styles.profileName}>
        {userName} <Text style={styles.onlineStatus}>{isOnline ? "🟢 Online" : "🔴 Offline"}</Text>
          </Text>
          {(isTyping && isOnline) && <Text style={styles.typingIndicator}>Typing...</Text>}
        </View>
      </TouchableOpacity>



      {/* 🔹 Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item?.id}
        extraData={messages}  // 👈 Forces FlatList to re-render when messages change
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageContainer,
              item?.senderId === auth.currentUser?.uid ? styles.sent : styles?.received,
            ]}
          >
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.chatImage} />
            ) : (
              <Text style={styles.messageText}>{item?.text}</Text>
            )}
            <Text style={styles.timestamp}>{formatDate(item?.createdAt)}</Text>

            {item?.senderId === auth.currentUser?.uid && (
              <Text style={styles.seenStatus}>
                {item?.seen ? "Seen ✅" : "Delivered 📩"}
              </Text>
            )}
          </View>
        )}
        inverted
      />


      {/* 🔹 Input & Image Picker */}
      <View style={styles.inputContainer}>
        <TouchableOpacity onPress={pickImage} style={styles.imageButton}>
          <Ionicons name="image" size={24} color="white" />
        </TouchableOpacity>

        <TextInput
          placeholder="Type a message..."
          placeholderTextColor="#999"
          value={newMessage}
          onChangeText={setNewMessage}
          style={styles.input}
        />

        <TouchableOpacity onPress={sendMessage} style={styles.sendButton}>
          <Ionicons name="send" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 🔹 Preview Selected Image */}
      {image && (
        <View style={styles.imagePreview}>
          <Image source={{ uri: image }} style={styles.previewImage} />
          <TouchableOpacity onPress={() => setImage(null)}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: { flex: 1, padding: 15, backgroundColor: "#F5F5F5" },
  messageContainer: { maxWidth: "80%", padding: 12, marginVertical: 5, borderRadius: 18 },
  sent: { alignSelf: "flex-end", backgroundColor: "#007AFF", borderTopRightRadius: 0 },
  received: { alignSelf: "flex-start", backgroundColor: "#626F47", borderTopLeftRadius: 0 },
  messageText: { fontSize: 16, color: "#FFF" },
  chatImage: { width: 200, height: 200, borderRadius: 10, marginBottom: 5 },
  timestamp: { fontSize: 12, color: "#DDD", textAlign: "right", marginTop: 5 },
  inputContainer: { flexDirection: "row", alignItems: "center", padding: 10 },
  input: { flex: 1, fontSize: 16, paddingVertical: 10, paddingHorizontal: 15 },
  sendButton: { padding: 10, backgroundColor: "#007AFF", borderRadius: 50 },
  imageButton: { padding: 10, backgroundColor: "#4CAF50", borderRadius: 50 },
  imagePreview: { flexDirection: "row", alignItems: "center", padding: 5 },
  previewImage: { width: 50, height: 50, borderRadius: 10, marginRight: 5 },

  profileContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 5,
    paddingHorizontal: 8,
    backgroundColor: "rgba(255, 255, 255, 0.5)", // 50% transparent white background
    borderBottomWidth: 1,
    borderBottomColor: "#DDD",
    borderRadius: 10,
    marginBottom: 0,
  },


  profileImage: {
    width: 45,
    height: 45,
    borderRadius: 25, // Makes it circular
    marginRight: 10,
  },

  profileName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },


  seenStatus: {
    fontSize: 10,
    color: "#ccc",
    textAlign: "right",
    marginTop: 5,
  },

  onlineStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2ecc71", // Green color for online
    marginTop: 2,
  },

  offlineStatus: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#e74c3c", // Red color for offline
    marginTop: 2,
  },

  typingIndicator: {
    fontSize: 14,
    fontStyle: "italic",
    color: "#999",
    marginTop: 2,
  }




});
