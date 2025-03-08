import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { useAuth, AuthProvider } from "../context/authContext"; // Import AuthProvider
import { PaperProvider } from "react-native-paper"; // 🎨 Theme Provider
import { ActivityIndicator, View } from "react-native";

function LayoutContent() {
  const { isLoggedIn } = useAuth(); // Get auth state
  const router = useRouter();

  // // 🔄 Redirect User Based on Auth State
  // useEffect(() => {
  //   if (isLoggedIn === false) {
  //     router.replace("/login");
  //   } else if (isLoggedIn === true) {
  //     router.push("/imageAskingScreen"); // 👈 Use push() instead of replace()
  //   }
  // }, [isLoggedIn]);


  // ⏳ Show a loading indicator while checking auth state
  if (isLoggedIn === null) {
    return (
      <PaperProvider>
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
          <ActivityIndicator size="large" color="#6200EE" />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider>
      <Stack screenOptions={{
        headerShown: false,
        animation: "slide_from_right", // 👈 Default slide-in transition
        gestureEnabled: true, // 👈 Allow swipe-back gestures
      }}>
        {isLoggedIn ? (
          <>
            <Stack.Screen name="index" options={{ title: "Home" }} />
            <Stack.Screen name="profile" options={{ title: "Profile Setup" }} />
            <Stack.Screen name="ListScreen" options={{ title: "Partner List" }} />
            <Stack.Screen name="matches" options={{ title: "Find Matches" }} />
            <Stack.Screen name="blindChatRoom" options={{ title: "Blind Chat Room" }} />
            <Stack.Screen name="NotificationsScreen" options={{ title: "Notifications" }} />
            <Stack.Screen name="chat" options={{ title: "Chat" }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="partnersProfile" options={{ title: "Partner Profile" }} />
            <Stack.Screen name="RecievedBlindMessageList" />
            
            <Stack.Screen name="mainHome" />
            <Stack.Screen name="myProfile" />
            <Stack.Screen name="imageAskingScreen" options={{
              animation: "slide_from_left", // ImageAskingScreen slides in from right
              gestureEnabled: false,
            }} />
          </>
        ) : (
          <>
            <Stack.Screen name="login" options={{
              title: "Login",
              animation: "slide_from_right", //Login slides out to the left
              gestureEnabled: false
            }} />
            <Stack.Screen name="register" options={{ title: "Register" }} />
          </>
        )}
      </Stack>
    </PaperProvider>
  );
}

// ✅ Wrap entire app with AuthProvider
export default function Layout() {
  return (
    <AuthProvider>
      <LayoutContent />
    </AuthProvider>
  );
}
