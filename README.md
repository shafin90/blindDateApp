# BlindDate - A Blind Dating App

## 📌 Overview
BlindDate is an interactive and secure dating application that allows users to connect anonymously before revealing their identities. The app provides a unique chat experience with real-time messaging, anonymous conversations, and friend request functionalities.

## 🚀 Features
- 🔒 **Anonymous Chat** - Connect with potential matches while staying anonymous.
- 💬 **Real-time Messaging** - Powered by Firebase Firestore.
- 🕒 **Timed Chats** - Conversations disappear after a set period.
- 📸 **Image Uploads** - Share images with matches.
- 👤 **User Profiles** - Set up profiles with images and interests.
- 🔔 **Notifications** - Stay updated with chat and friend request alerts.
- 📍 **Expo-based** - Optimized for both iOS and Android.

## 🛠️ Tech Stack
- **React Native** (v0.76.7)
- **Expo SDK** (v52.0.37)
- **Firebase** (v11.4.0) - Firestore, Authentication, Storage
- **React Navigation** - Stack & Bottom Tabs
- **Axios** - API requests
- **Date-fns** - Date formatting
- **Lottie Animations** - Animated UI elements

## 📥 Installation
1. **Clone the repository:**
   ```sh
   git clone https://github.com/your-username/BlindDatingApp.git
   cd BlindDatingApp
   ```

2. **Install dependencies:**
   ```sh
   npm install  # or yarn install
   ```

3. **Start the Expo development server:**
   ```sh
   npm start  # or expo start
   ```

## 📱 Running on Device
- **Android:**
  ```sh
  npm run android
  ```
- **iOS:** (MacOS + Xcode required)
  ```sh
  npm run ios
  ```
- **Web:**
  ```sh
  npm run web
  ```

## 📦 Building APK (for Android)
To generate an APK for direct installation:
```sh
expo build:android -t apk
```

## 🔥 Building Production Release (for Play Store)
To generate an **AAB** file for Google Play:
```sh
expo build:android -t app-bundle
```

## 🚀 Deployment
This project is set up for **Expo EAS Build**:
```sh
eas build -p android  # Android
```
```sh
eas build -p ios  # iOS
```
Ensure you have configured **eas.json** before running the above commands.

## 🔍 Known Issues & Fixes
- **App icon not appearing properly?** Ensure your `icon.png` is correctly placed in `assets/` and referenced in `app.json`.
- **Dark overlay after navigating back?** Try handling `focus` state to reset UI when returning to the HomeScreen.

## 📝 Author & Credits
- 👤 **Shafin12** (Owner & Developer)
- 🚀 **Contributors welcome!** Feel free to fork and improve.

## 📜 License
This project is licensed under the MIT License.

