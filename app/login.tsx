import React, { useState, useEffect } from "react";
import { View, Text, Alert, TouchableOpacity, ImageBackground, StyleSheet } from "react-native";
import { TextInput, Button, ActivityIndicator } from "react-native-paper";
import { auth } from "../config/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, User } from "firebase/auth";
import { useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";

const LoginScreen: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [secureText, setSecureText] = useState<boolean>(true);
  const [isLoginMode, setIsLoginMode] = useState<boolean>(true); // Toggle between Login & Sign Up
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (user) {
        router.replace("/");
      }
    });

    return () => unsubscribe();
  }, []);

  const handleAuth = async (): Promise<void> => {
    setLoading(true);
    try {
      if (isLoginMode) {
        await signInWithEmailAndPassword(auth, email, password);
        Alert.alert("🎉 Login Successful!");
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
        Alert.alert("✅ Account Created Successfully!");
      }
      router.replace("/");
    } catch (error: any) {
      Alert.alert("❌ Error", error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0D0D1A", "#1B133B"]} style={styles.background}>
      <View style={styles.container}>
        {/* App Logo / Title */}
        <Text style={styles.title}>💖 Blind Dating</Text>
        <Text style={styles.subtitle}>Connect through personality, not just looks.</Text>

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
          theme={{ colors: { primary: "#E94057" } }}
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
          theme={{ colors: { primary: "#E94057" } }}
        />

        {/* Auth Button */}
        <Button
          mode="contained"
          onPress={handleAuth}
          loading={loading}
          style={styles.button}
          disabled={loading}
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
    padding: 20,
  },
  container: {
    width: "100%",
    backgroundColor: "rgba(30,30,45,0.95)", // Dark Semi-Transparent Background
    padding: 25,
    borderRadius: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFC0CB",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#ddd",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    width: "100%",
    marginBottom: 15,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "white",
  },
  button: {
    backgroundColor: "#E94057",
    width: "100%",
    padding: 8,
    marginBottom: 15,
    borderRadius: 8,
  },
  toggleText: {
    fontSize: 16,
    color: "#ddd",
    marginTop: 10,
  },
  toggleHighlight: {
    color: "#E94057",
    fontWeight: "bold",
  },
});

export default LoginScreen;
