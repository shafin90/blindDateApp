import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  StyleSheet,
  BackHandler,
} from "react-native";
import { auth, db } from "../config/firebase";
import { collection, query, getDocs } from "firebase/firestore";
import { useFocusEffect, useRouter } from "expo-router";
import { useAuth } from "@/context/authContext";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { set } from "date-fns";

export default function ListScreen() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  const { user, setMessageReciever } = useAuth();
  const [allUserList, setAllUserList] = useState([])
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
    const fetchPartners = async () => {
      try {
        const q = query(collection(db, "users"));
        const querySnapShot = await getDocs(q);
        const partnerUsers = querySnapShot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setLoading(false);
        setMatches(partnerUsers.find((item) => item.id == user.uid)?.partnerList || []);
        setAllUserList(partnerUsers)
      } catch (error) {
        console.error("Error fetching partners:", error);
      }
    };

    fetchPartners();
  }, [user?.uid]);



  return (
    <LinearGradient colors={["#497D74", "#f5f7fa"]} style={styles.container}>

      {loading ? <ActivityIndicator size="large" color="white" /> : null}

      {matches.length === 0 && !loading ? <Text style={styles.noMatches}>No matches found.</Text> : null}

      <FlatList
        data={matches}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => {

              setMessageReciever(item.id || item.uid);
              router.push(`/chat?userId=${item.id || item.uid}`);
            }}
            style={styles.card}
          >
            <Image
              source={{ uri: item.profilePic || "../assets/dummy-profile.png" }}
              style={styles.avatar}
            />
            {/* <View style={styles.textContainer}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.email}>{item.email}</Text>
              {item.bio ? <Text style={styles.bio}>{item.bio}</Text> : null}
            </View> */}



            <View style={styles.textContainer}>
              <Text style={styles.name}>{allUserList.find(i=>i.id === item.uid)?.name}</Text>
              <Text style={styles.email}>{allUserList.find(i=>i.id === item.uid)?.email}</Text>
              {allUserList.find(i=>i.id === item.uid)?.interests.length > 0 && (
                <Text style={styles.interests}>
                  Interests: {allUserList.find(i=>i.id === item.uid)?.interests.join(", ")}
                </Text>
              )}

            </View>


            {/* Chat Icon */}
            <Ionicons name="chatbubbles-outline" size={24} color="#497D74" />
          </TouchableOpacity>
        )}
      />
    </LinearGradient>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    paddingTop: 50,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 20,
  },
  noMatches: {
    fontSize: 18,
    textAlign: "center",
    color: "#ffffff",
    marginTop: 20,
  },
  card: {
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
  bio: {
    fontSize: 12,
    color: "#626F47",
    marginTop: 5,
  },
});

