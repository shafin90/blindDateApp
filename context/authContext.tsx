import { auth } from "../config/firebase";
import { useRouter } from "expo-router";
import { onAuthStateChanged, User } from "firebase/auth";
import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";

// Define AuthContext types
interface AuthContextProps {
    user: User | null;
    isLoggedIn: boolean;
    setUser: (user: User | null) => void;
    logout: () => void;
}

// Create AuthContext with default values
const AuthContext = createContext<AuthContextProps | undefined>(undefined);

// AuthProvider Component
interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState(null);
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [blindMessageReciever, setBlindMessageReciever] = useState<string | null>(null);
    const [messageReciever, setMessageReciever] = useState<string | null>(null);
    const [notificationCount, setNotificationCount] = useState<number>(0);
    const [partnersId, setPartnersId] = useState<string | null>(null); // will need to fetch partners data while visiting his/her profile
    const router = useRouter();


    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                setIsLoggedIn(true);
            } else {
                setUser(null);
                setIsLoggedIn(false);
                router.replace("/login"); // Redirect to login if not authenticated
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await auth.signOut();
            setUser(null);
            setIsLoggedIn(false);
            router.replace("/login"); // Redirect to login on logout
        } catch (error) {
            console.error("Logout error:", error);
        }
    };


    return (
        <AuthContext.Provider value={{
            user,
            isLoggedIn,
            setUser,
            logout,
            userId,
            setUserId,
            blindMessageReciever,
            setBlindMessageReciever,
            messageReciever,
            setMessageReciever,
            notificationCount, 
            setNotificationCount,
            partnersId, 
            setPartnersId
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use the AuthContext
export const useAuth = (): AuthContextProps => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
