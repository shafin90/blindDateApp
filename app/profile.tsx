import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, FlatList, TouchableOpacity, Image, StyleSheet, Dimensions, Alert, Modal, ActivityIndicator } from "react-native";
import { auth, db } from "../config/firebase";
import { doc, getDoc, onSnapshot, updateDoc } from "firebase/firestore";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as ImagePicker from "expo-image-picker";
import axios from "axios";
import LottieView from "lottie-react-native";
import Block from "@/components/block";
import { MaterialIcons } from "@expo/vector-icons";
import { TextInput } from "react-native";
import { signOut } from "firebase/auth";
import * as FileSystem from "expo-file-system";
import { Linking } from "react-native";




const { width } = Dimensions.get("window");


export default function ProfileScreen() {
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [email, setEmail] = useState("");
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [profilePic, setProfilePic] = useState<string | null>(null);
  const [gallery, setGallery] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [myInterest, setMyInterest] = useState([])
  const [modalVisible, setModalVisible] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      router.replace("/login");
      return;
    }

    const userRef = doc(db, "users", user.uid);

    // Listen for real-time updates
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setName(data.name || "No name provided");
        setBio(data.bio || "No bio available");
        setEmail(data.email || "No email available");
        setSelectedInterests(data.interests || []);
        setProfilePic(data.profilePic || null);
        setGallery(data.gallery || []); // Fetch user gallery
      }
      setLoading(false);
    });

    return () => unsubscribe(); // Cleanup listener on unmount
  }, []);

  const pickImage = async () => {
    if (gallery.length >= 5) {
      Alert.alert("Limit Reached", "You can upload up to 5 images.");
      return;
    }

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
      uploadImage(result.assets[0].uri);
    }
  };

  const uploadImage = async (uri: string) => {
    const CLOUDINARY_URL = "https://api.cloudinary.com/v1_1/dcmrm7taq/image/upload";
    const UPLOAD_PRESET = "blindChatApp";

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("file", { uri, type: "image/jpeg", name: "upload.jpg" });
      formData.append("upload_preset", UPLOAD_PRESET);

      const response = await axios.post(CLOUDINARY_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const imageUrl = response.data.secure_url;
      saveImageToFirestore(imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      Alert.alert("Upload Failed", "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const saveImageToFirestore = async (imageUrl: string) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      const updatedGallery = [...gallery, imageUrl];
      await updateDoc(userRef, { gallery: updatedGallery });

      setGallery(updatedGallery);
    } catch (error) {
      console.error("Error saving image:", error);
    }
  };


  const deleteImage = async (imageUrl: string) => {
    Alert.alert("Delete Image", "Are you sure you want to delete this image?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const user = auth.currentUser;
          if (!user) return;

          try {
            const userRef = doc(db, "users", user.uid);
            const updatedGallery = gallery.filter((img) => img !== imageUrl);
            await updateDoc(userRef, { gallery: updatedGallery });

            setGallery(updatedGallery);
          } catch (error) {
            console.error("Error deleting image:", error);
          }
        },
      },
    ]);
  };


  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { name, email, bio });
      setModalVisible(false);
      Alert.alert("Success", "Profile updated successfully!");
    } catch (error) {
      console.error("Error updating profile:", error);
      Alert.alert("Error", "Could not update profile.");
    }
  };


  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFC0CB" />
      </View>
    );
  }



  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace("/login"); // Redirect to login page
    } catch (error) {
      console.error("Logout Failed:", error);
      Alert.alert("Error", "Could not log out. Try again!");
    }
  };




  const downloadImage = (imageUrl: string) => {
    Linking.openURL(imageUrl);
  };


  return (
    <LinearGradient colors={["#371f7d", "#371f7d"]} style={styles.container}>
      {/* Header with Back & Edit Buttons */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={30} color="white" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Ionicons name="create-outline" size={30} color="white" />
        </TouchableOpacity>
      </View>


      <ScrollView contentContainerStyle={styles.scrollContainer}>

        {/* Profile Picture */}
        <TouchableOpacity onPress={() => setZoomImage(profilePic)}>
          <View style={styles.profileImageContainer}>
            {profilePic ? (
              <Image source={{ uri: profilePic }} style={styles.profileImage} />
            ) : (
              <Ionicons name="person-circle" size={100} color="#E94057" />
            )}
          </View>
        </TouchableOpacity>


        {/* Profile Details */}
        <Block title="Name" details={name} />
        <Block title="Email" details={email} />
        <Block title="Bio" details={bio} />

        {/* Image Gallery */}
        <Text style={styles.sectionTitle}>Gallery</Text>
        <FlatList
          data={[...gallery, "upload"]}
          keyExtractor={(item, index) => index.toString()}
          numColumns={2}
          style={styles.galleryContainer}
          renderItem={({ item }) =>
            item === "upload" && gallery.length < 5 ? (
              <TouchableOpacity onPress={pickImage} style={styles.uploadBox}>
                <Ionicons name="cloud-upload-outline" size={40} color="#ddd" />
                <Text style={styles.uploadText}>Upload</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity

                onPress={() => downloadImage(item)} onLongPress={() => deleteImage(item)}>
                <Image source={{ uri: item }} style={styles.galleryImage} />
              </TouchableOpacity>

            )
          }
        />

        {/* Interests Grid */}
        <Text style={styles.sectionTitle}>{selectedInterests.length ? "Interests" : ""}</Text>
        <FlatList
          key={`flatlist-2`}
          data={selectedInterests}
          numColumns={2}
          keyExtractor={(item) => item.name}
          style={styles.interestList}
          renderItem={({ item }) => (
            <View style={[styles.interestButton, selectedInterests.includes(item.name) && styles.selectedInterest]}>
              <MaterialIcons name={item.icon} size={44} color="white" />
              <Text style={styles.interestText}>{item.name}</Text>
            </View>
          )}
        />

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>





      {/* Slide-Up Modal */}
      <Modal animationType="slide" transparent={true} visible={modalVisible}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>

            {/* Profile Picture Update */}
            <TouchableOpacity style={styles.profilePicContainer} onPress={() => {
              setModalVisible(false)
              router.push("/imageAskingScreen")
            }}>
              {profilePic ? (
                <Image source={{ uri: profilePic }} style={styles.editProfileImage} />
              ) : (
                <Ionicons name="camera" size={40} color="white" />
              )}
              <Ionicons name="camera" size={24} color="white" style={styles.cameraIcon} />
            </TouchableOpacity>

            {/* Editable Fields */}
            <TextInput style={styles.input} value={name} onChangeText={setName} placeholder="Name" placeholderTextColor="#999" />
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="Email" placeholderTextColor="#999" keyboardType="email-address" />
            <TextInput style={styles.input} value={bio} onChangeText={setBio} placeholder="Bio" placeholderTextColor="#999" multiline />

            {/* Interests Edit */}
            <TouchableOpacity style={styles.interestEditButton} onPress={() => router.push("/interestAskingScreen")}>
              <Text style={styles.editInterestText}>Edit Interests</Text>
              <Ionicons name="chevron-forward" size={20} color="white" />
            </TouchableOpacity>

            {/* Buttons */}
            <View style={styles.buttonRow}>
              <TouchableOpacity style={[styles.button, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>




      <Modal visible={!!zoomImage} transparent={true}>
        <View style={styles.fullScreenContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={() => setZoomImage(null)}>
            <Ionicons name="close" size={35} color="white" />
          </TouchableOpacity>
          {zoomImage && (
            <Image source={{ uri: zoomImage }} style={styles.fullScreenImage} resizeMode="contain" />
          )}
          <TouchableOpacity style={styles.downloadButton} onPress={() => downloadImage(zoomImage)}>
            <Ionicons name="download-outline" size={35} color="white" />
          </TouchableOpacity>
        </View>
      </Modal>
    </LinearGradient>
  );
}

// Styles
const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: { alignItems: "center", paddingVertical: 20 },
  profileImageContainer: { marginTop: 40, marginBottom: 20 },
  profileImage: { width: 250, height: 250, borderRadius: 150, borderWidth: 3, borderColor: "#567E4A" },
  sectionTitle: { fontSize: 22, fontWeight: "bold", color: "#FFC0CB", marginTop: 30, marginBottom: 10 },
  galleryContainer: { width: "95%", marginBottom: 20 },
  galleryImage: { width: width * 0.44, height: width * 0.44, margin: 5, borderRadius: 10 },
  uploadBox: { width: width * 0.44, height: width * 0.44, margin: 5, borderWidth: 2, borderColor: "#ddd", borderStyle: "dashed", justifyContent: "center", alignItems: "center", borderRadius: 10 },
  uploadText: { color: "#ddd", marginTop: 5 },
  interestList: { width: "95%", marginBottom: 30 },
  interestButton: { backgroundColor: "#567E4A", paddingVertical: 60, margin: 5, borderRadius: 10, alignItems: "center", width: "46%" },
  selectedInterest: { backgroundColor: "#567E4A" },
  interestText: { fontSize: 20, color: "white", marginTop: 5 },



  header: { flexDirection: "row", justifyContent: "space-between", padding: 20, width: "100%" },



  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#371f7d", // Match theme
  },


  // Modal Styles
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.6)", // Darker overlay for a sleek effect
  },
  modalContent: {
    backgroundColor: "#322169", // A slightly lighter shade of your main theme color
    padding: 25,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: "center",
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFC0CB", // Soft pink to match your theme
    marginBottom: 20,
  },

  input: {
    width: "100%",
    padding: 15,

    // Pink border to match theme
    backgroundColor: "#5A3EAB", // Darker shade for a cohesive feel
    borderRadius: 10,
    marginBottom: 8,
    color: "white", // White text for contrast
    fontSize: 16,
  },

  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },

  button: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 5
  },

  cancelButton: {
    backgroundColor: "#A00B0D", // Pink for a soft exit button
  },

  saveButton: {
    backgroundColor: "#567E4A", // Your main pink theme for CTA
  },

  buttonText: {
    color: "white",
    fontSize: 15,
    fontWeight: "bold",
  },



  profilePicContainer: {
    alignSelf: "center",
    marginBottom: 15,
    position: "relative",
  },

  editProfileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#FFC0CB",
  },

  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#E94057",
    borderRadius: 20,
    padding: 5,
  },

  interestEditButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#5A3EAB",
    padding: 15,
    borderRadius: 10,
    width: "100%",
    marginBottom: 15,
  },

  editInterestText: {
    fontSize: 16,
    color: "white",
    fontWeight: "bold",
  },



  logoutButton: {
    backgroundColor: "#A00B0D", // Red for logout (matches theme)
    paddingVertical: 15,
    width: "90%",
    borderRadius: 12,
    alignItems: "center",
    marginTop: 0,
    marginBottom: 80
  },

  logoutText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },





  fullScreenContainer: {
    flex: 1,
    backgroundColor: "black",
    justifyContent: "center",
    alignItems: "center",
  },
  fullScreenImage: {
    width: "100%",
    height: "100%",
  },
  closeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    zIndex: 1,
  },
  downloadButton: {
    position: "absolute",
    bottom: 50,
    right: 20,
    zIndex: 1,
  }

});

