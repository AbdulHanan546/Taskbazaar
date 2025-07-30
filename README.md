# 🧰 TaskBazaar (Mobile App Version)

**TaskBazaar** is a full-stack MERN (MongoDB, Express.js, React Native, Node.js) mobile application that connects users with local service providers for home, business, and personal tasks.

---

## 📦 Project Structure

taskbazaar/
├── taskbazaar-backend # Express.js + MongoDB backend
└── taskbazaar-app # React Native frontend using Expo



---

## 🧑‍💻 1. Clone and Setup the Project


git clone https://github.com/AbdulHanan546/taskbazaar.git
cd taskbazaar
⚙️ 2. Backend Setup
📂 Navigate:

cd taskbazaar-backend
📥 Install dependencies:

npm install
🔧 Required libraries:
express

mongoose

cors

dotenv

jsonwebtoken

bcryptjs

nodemon (for development)

npm install express mongoose cors dotenv jsonwebtoken bcryptjs

npm install --save-dev nodemon
🔐 Create .env file
The .env file is not pushed to GitHub (it's in .gitignore). Create it manually inside taskbazaar-backend/.

Example:


PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_secret_key

▶️ Run Backend Server:

npm run dev
📱 3. React Native App Setup (Frontend)
📂 Navigate:

cd taskbazaar-app
✅ Prerequisites
Node.js (v16+)

Expo CLI:


npm install -g expo-cli

Expo Go App installed on your Android/iOS device

📥 Install dependencies:

npm install
📚 Required libraries:
axios

@react-navigation/native

@react-navigation/native-stack

@react-native-async-storage/async-storage

react-native-screens, react-native-safe-area-context, react-native-vector-icons (auto-installed via Expo)

expo, react-native, expo-status-bar

Install navigation-related dependencies:



npm install @react-navigation/native @react-navigation/native-stack

npm install @react-native-async-storage/async-storage

▶️ Run Frontend (Expo):


npm start
You will see a QR code in the terminal. Scan it with the Expo Go app on your phone.

If you're on Android: Use Expo Go App
If you're on iOS: Use the Camera app to scan

🚧 Trouble Connecting Backend with Mobile?
If the app hangs on loading:

✅ Make sure both devices are on the same WiFi network.
✅ Replace all instances of localhost or 127.0.0.1 in frontend API calls with your machine’s local IP address (e.g., 192.168.10.13):


// Example
axios.post('http://192.168.10.13:5000/api/auth/login', { ... });
🔥 Disable Public Network Firewall (Windows)
If you’re on Windows, disable Public Network firewall:

Open Windows Security

Go to Firewall & Network Protection

Click Public Network

Turn firewall OFF (temporarily for testing)

🌟 Features Implemented
✅ User Registration and Login using JWT
✅ Tasks: Create task (title, description, location)
✅ Dashboard: View greeting and create tasks
✅ Modular backend using Express.js + MongoDB
✅ Secure routes with JWT token stored using AsyncStorage
✅ Styled UI with basic component layout for mobile
