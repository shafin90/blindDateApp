import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity, ImageBackground, StyleSheet } from "react-native";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import { auth } from "../config/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { addUser } from "../utils/addUser"
import { useAuth } from "@/context/authContext";
import { getUsers } from "../utils/getUser"



const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [secureText, setSecureText] = useState<boolean>(true);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true); // Toggle between Login & Sign Up
  const { setUser } = useAuth()

  const router = useRouter();


  const handleAuth = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const registeringUser = await createUserWithEmailAndPassword(auth, email, password);
        setUser(registeringUser)
      }
      const getUser = await getUsers(auth?.currentUser?.uid, "users");
      const isAlreadyProfileImageExist = getUser?.profilePic;
      const isAlreadyInterestExist = getUser?.interests;

      if (isAlreadyProfileImageExist && isAlreadyInterestExist) {
        router.push("/")
      }
      else if (isAlreadyProfileImageExist && !isAlreadyInterestExist) {
        router.push("/interestAskingScreen")
      }
      else if (!isAlreadyProfileImageExist && isAlreadyInterestExist) {
        router.push("/imageAskingScreen")
      }
      else{
       router.push("/imageAskingScreen") 
      }


    } catch (error: any) {
      Alert.alert("❌ Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#371f7d", "#371f7d"]} style={styles.background}>
      <View style={styles.container}>
        {/* App Logo / Title */}
        <Text style={styles.title}>blindDatE</Text>
        <Text style={styles.subtitle}>Connect through personality!</Text>

        {/* Email Input */}
        <TextInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          mode="outlined"
          keyboardType="email-address"
          autoCapitalize="none"
          style={[styles.input, { color: "white" }]}
          left={<TextInput.Icon name="email" />}
          theme={{ colors: { primary: "#bc96ff" } }}
        />

        {/* Password Input with Toggle */}
        <TextInput
          label="Password"
          value={password}
          onChangeText={setPassword}
          mode="outlined"
          secureTextEntry={secureText}
          style={[styles.input, { color: "white" }]}
          left={<TextInput.Icon name="lock" />}
          right={
            <TextInput.Icon
              name={secureText ? "eye-off" : "eye"}
              onPress={() => setSecureText(!secureText)}
            />
          }
          theme={{ colors: { primary: "#bc96ff" } }}
        />

        {/* Auth Button */}
        <Button
          mode="contained"
          onPress={handleAuth}
          loading={loading}
          style={styles.button}
          disabled={loading}
          labelStyle={styles.buttonText} // Add this line
        >
          {loading ? "Processing..." : isLoginMode ? "Login" : "Sign Up"}
        </Button>

        {/* Toggle Between Login & Sign Up */}
        <TouchableOpacity onPress={() => setIsLoginMode(!isLoginMode)} disabled={loading}>
          <Text style={styles.toggleText}>
            {isLoginMode ? "New here? " : "Already have an account? "}
            <Text style={styles.toggleHighlight}>{isLoginMode ? "Sign Up" : "Login"}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

// 🎨 **Dark Romantic Styles**
const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20
  },
  container: {
    width: "100%",
    backgroundColor: "transparent", // Dark Semi-Transparent Background
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    shadowOffset: { width: 0, height: 5 },
  },
  title: {
    fontSize: 40,
    fontWeight: "bold",
    color: "#bc96ff",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 18,
    fontFamily: "Roboto",
    color: "#ddd",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginBottom: 15,
    backgroundColor: "#522e99",
    color: "white",
  },
  button: {
    backgroundColor: "#bc96ff",
    width: "100%",
    padding: 8,
    marginBottom: 15,
    borderRadius: 8
  },
  buttonText: {
    fontSize: 18, // Adjust size as needed
    fontWeight: "bold",
    color: "#371f7d", // Change text color if needed
  },
  toggleText: {
    fontSize: 16,
    color: "#ddd",
    marginTop: 10,
  },
  toggleHighlight: {
    color: "#bc96ff",
    fontWeight: "bold",
  },
});

export default LoginScreen;
