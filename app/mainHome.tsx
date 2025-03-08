import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { NavigationContainer } from "@react-navigation/native";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur"; // For Glass Effect
import { TouchableOpacity } from "react-native-gesture-handler";
import ProfileScreen from "./profile";
import MatchesScreen from "./matches";



// Get screen width
const { width } = Dimensions.get("window");

// Screens
const HomeScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>🏠 Home Screen</Text>
    </View>
);



const FriendsListScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>👥 Friends List</Text>
    </View>
);

const PeopleNearYouScreen = () => (
    <View style={styles.screen}>
        <Text style={styles.text}>📍 People Near You</Text>
    </View>
);

// Bottom Tab Navigator
const Tab = createBottomTabNavigator();

export default function App() {
    return (

        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: false, // Hide tab text
                tabBarStyle: styles.tabBarStyle,
                tabBarIcon: ({ color, size, focused }) => {
                    let iconName;
                    if (route.name === "Home") iconName = "home";
                    else if (route.name === "Profile") iconName = "person";
                    else if (route.name === "Friends List") iconName = "group";
                    else if (route.name === "People Near You") iconName = "location-on";

                    return (
                        <View style={[styles.tabIconContainer, focused && styles.activeTab]}>
                            <MaterialIcons name={iconName} size={37} color={color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: "#bc96ff", // White for active icon
                tabBarInactiveTintColor: "#371f7d", // Gray for inactive
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} />
            <Tab.Screen name="Profile" component={ProfileScreen} />
            <Tab.Screen name="Friends List" component={FriendsListScreen} />
            <Tab.Screen name="People Near You" component={MatchesScreen} />
        </Tab.Navigator>

    );
}

// Styles
const styles = StyleSheet.create({
    screen: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#371f7d",
    },
    text: {
        fontSize: 24,
        fontWeight: "bold",
    },
    tabBarStyle: {
        width: "73%",
        position: "absolute",
        bottom: 20,
        marginLeft:"13%",
        height: 70,
        paddingTop:15,
        borderRadius: 33, // Oval shape
        backgroundColor: "#bc96ff",
    },
    tabIconContainer: {
        width:60,
        height:60,
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 30, // Round buttons
    },
    activeTab: {
        backgroundColor: "#371f7d", // Highlight active tab
    },
});
