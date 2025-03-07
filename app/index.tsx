import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, Animated, StyleSheet, Dimensions, BackHandler } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { LinearGradient } from "expo-linear-gradient";
import { Easing } from "react-native-reanimated";
import { useAuth } from "@/context/authContext";

const { width, height } = Dimensions.get("window");

export default function HomeScreen() {
  const router = useRouter();
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);
  const [hearts] = useState(new Array(10).fill(0).map(() => new Animated.Value(0))); // Floating hearts
  const { user } = useAuth();
  

  

  // Handle Back Button to Exit App
  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp(); // Exits the app
      return true; // Prevents default back behavior
    };

    const backHandler = BackHandler.addEventListener("hardwareBackPress", backAction);

    return () => backHandler.remove(); // Cleanup
  }, []);

  // ❤️ Floating Hearts Animation
  useEffect(() => {
    hearts.forEach((heart, index) => {
      Animated.loop(
        Animated.timing(heart, {
          toValue: -height,
          duration: 8000 + index * 500, // Staggered effect
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    });
  }, []);

  // 🔥 Smooth Entry Animation
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 1000,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={["#0D0D1A", "#1B133B"]} style={styles.container}>

      {/* ❤️ Floating Hearts */}
      {hearts.map((heart, index) => (
        <Animated.View
          key={index}
          style={[
            styles.heart,
            {
              transform: [
                { translateY: heart },
                { translateX: Math.random() * width - width / 2 }, // Random horizontal position
              ],
            },
          ]}
        >
          <Ionicons name="heart" size={30} color="#E94057" />
        </Animated.View>
      ))}

      {/* 🔔 Notification Button */}
      <TouchableOpacity onPress={() => router.push("/NotificationsScreen")} style={styles.notificationButton}>
        <Ionicons name="notifications" size={30} color="#FFC0CB" />
      </TouchableOpacity>

      {/* 🌟 Animated Welcome Text */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
        <Text style={styles.title}>Love in the Shadows 💜</Text>
      </Animated.View>

      {/* 🚀 Buttons Section */}
      <Animated.View style={[styles.buttonContainer, { opacity: fadeAnim }]}>
        <TouchableOpacity onPress={() => router.push("/profile")} style={[styles.button, styles.primaryButton]}>
          <Ionicons name="person" size={24} color="white" />
          <Text style={styles.buttonText}>My Profile</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/ListScreen")} style={[styles.button, styles.secondaryButton]}>
          <Ionicons name="chatbubbles" size={24} color="white" />
          <Text style={styles.buttonText}>Partner List</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/matches")} style={[styles.button, styles.primaryButton]}>
          <Ionicons name="heart" size={24} color="white" />
          <Text style={styles.buttonText}>Find Matches</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push("/RecievedBlindMessageList")} style={[styles.button, styles.primaryButton]}>
          <MaterialCommunityIcons name="cellphone-message" size={24} color="white" />
          <Text style={styles.buttonText}>Anonymous Messages</Text>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

// 🎨 Dark Romantic Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 50,
    position: "relative",
  },
  notificationButton: {
    position: "absolute",
    top: 40,
    right: 20,
    zIndex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFC0CB", // Soft pink
    textAlign: "center",
    marginBottom: 30,
  },
  buttonContainer: {
    width: "85%",
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 30,
    marginBottom: 15,
    width: "100%",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
  },
  primaryButton: {
    backgroundColor: "#8A56AC", // Deep purple
  },
  secondaryButton: {
    backgroundColor: "#E94057", // Romantic red-pink
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 10,
  },
  heart: {
    position: "absolute",
    bottom: -20,
    left: "50%",
  },
});

