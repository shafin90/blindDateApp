import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  RefreshControl,
  BackHandler,
} from "react-native";
import { auth, db } from "../config/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/authContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

export default function MatchesScreen() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const { setBlindMessageReciever } = useAuth();



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


  // ✅ Fetch Matches
  // const fetchMatches = async () => {
  //   const user = auth.currentUser;
  //   if (!user) return;

  //   try {
  //     setLoading(true);
  //     const usersRef = collection(db, "users");

  //     // 🔹 Get logged-in user's interests
  //     const userSnap = await getDocs(query(usersRef, where("email", "==", user.email)));
  //     if (userSnap.empty) {
  //       Alert.alert("Error", "User not found in database.");
  //       return;
  //     }

  //     const userData = userSnap.docs[0].data();
  //     const userId = userSnap.docs[0].id;
  //     const interests = userData.interests || [];

  //     if (interests.length === 0) {
  //       Alert.alert("Select Interests", "Please select at least one interest to find matches.");
  //       return;
  //     }

  //     // 🔹 Find users with shared interests
  //     const q = query(usersRef, where("interests", "array-contains-any", interests));
  //     const querySnapshot = await getDocs(q);

  //     let matchedUsers = [];
  //     querySnapshot.forEach((doc) => {
  //       if (doc.id !== userId) {
  //         matchedUsers.push({ id: doc.id, ...doc.data() });
  //       }
  //     });

  //     setMatches(matchedUsers);
  //   } catch (error) {
  //     console.error("Error fetching matches:", error);
  //     Alert.alert("Error", "Could not fetch matches.");
  //   } finally {
  //     setLoading(false);
  //     setRefreshing(false);
  //   }
  // };

  const fetchMatches = async () => {
    const user = auth.currentUser;
    if (!user) return;

    try {
        setLoading(true);
        const usersRef = collection(db, "users");

        // 🔹 Get logged-in user's data
        const userSnap = await getDocs(query(usersRef, where("email", "==", user.email)));
        if (userSnap.empty) {
            Alert.alert("Error", "User not found in database.");
            return;
        }

        const userData = userSnap.docs[0].data();
        const userId = userSnap.docs[0].id;
        const interests = userData.interests || [];

        if (interests.length === 0) {
            Alert.alert("Select Interests", "Please select at least one interest to find matches.");
            return;
        }

        // 🔹 Extract partnerList UIDs (যাদের বাদ দিতে হবে)
        const partners = userData.partnerList?.map(partner => partner.uid) || [];

        // 🔹 Find users with shared interests
        const q = query(usersRef, where("interests", "array-contains-any", interests));
        const querySnapshot = await getDocs(q);

        let matchedUsers = [];
        querySnapshot.forEach((doc) => {
            if (doc.id !== userId && !partners.includes(doc.id)) {  // 🔥 যাদের সাথে আগের সম্পর্ক আছে, তারা বাদ যাবে
                matchedUsers.push({ id: doc.id, ...doc.data() });
            }
        });

        setMatches(matchedUsers);
    } catch (error) {
        console.error("Error fetching matches:", error);
        Alert.alert("Error", "Could not fetch matches.");
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
};


  // ✅ Fetch matches on mount
  useEffect(() => {
    fetchMatches();
  }, []);

  // ✅ Pull-to-Refresh Handler
  const onRefresh = () => {
    setRefreshing(true);
    fetchMatches();
  };





  const generateRandomName = () => {
    const adjectives = ["Mysterious", "Secret", "Hidden", "Dark", "Masked", "Anonymous", "Unknown", "Shadow"];
    const nouns = ["Lover", "Dreamer", "Phantom", "Heart", "Ghost", "Soul", "Night", "Stranger"];

    const randomAdjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const randomNoun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${randomAdjective} ${randomNoun}`;
  };

  return (
    <LinearGradient colors={["#497D74", "#f5f7fa"]} style={styles.container}>

      {/* 🔹 Loading State */}
      {loading && <ActivityIndicator size="large" color="white" style={{ marginTop: 20 }} />}

      {/* 🔹 Matches List */}
      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          !loading && <Text style={styles.noMatchesText}>No matches found.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {
              setBlindMessageReciever(item);
              router.push(`/blindChatRoom?chatId=${item.id}`);
            }}
            style={styles.matchCard}
          >
            {/* Profile Picture */}
            <Image source={require("../assets/dummy-profile.png")} style={styles.avatar} />


            {/* Name & Interests */}
            <View style={styles.textContainer}>
              <Text style={styles.name}>{generateRandomName()}</Text>
              <Text style={styles.email}>be friend first to know details</Text>
              {/* {item.interests?.length > 0 && (
                <Text style={styles.interests}>
                  Interests: {item.interests.join(", ")}
                </Text>
              )} */}
            </View>

            {/* Chat Icon */}
            <Ionicons name="chatbubbles-outline" size={24} color="#497D74" />
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

// ✅ Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  matchCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginVertical: 8,
    borderRadius: 15,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  email: {
    fontSize: 14,
    color: "gray",
  },
  interests: {
    fontSize: 12,
    color: "#497D74",
    marginTop: 5,
  },
  noMatchesText: {
    fontSize: 18,
    textAlign: "center",
    color: "white",
    marginTop: 20,
  },
});

