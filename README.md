# 🧰 TaskBazaar

TaskBazaar is a full-stack MERN application that connects users with local service providers for home, business, and personal tasks.

---

## 📁 Project Structure

taskbazaar/
├── taskbazaar-backend # Express.js + MongoDB backend
└── taskbazaar-client # React (Vite) + Tailwind frontend



---

## 🧑‍💻 1. Clone and Setup the Project

git clone https://github.com/AbdulHanan546/taskbazaar.git

cd taskbazaar
⚙️ 2. Backend Setup
Navigate:

cd taskbazaar-backend
Install dependencies:

npm install

Required libraries:
express
mongoose
cors
dotenv
jsonwebtoken
bcryptjs

nodemon (for dev)

Install all with:


npm install express mongoose cors dotenv jsonwebtoken bcryptjs
npm install --save-dev nodemon

Add your .env file:
🔐 Note: .env is ignored in .gitignore. You need to create your own.

Create a .env file in taskbazaar-backend/ and add:


PORT=5000

MONGO_URI=your_mongodb_uri

JWT_SECRET=your_jwt_secret

Run backend:

npm run dev

💻 3. Frontend Setup
Navigate:

cd taskbazaar-client

Install dependencies:

npm install

Required libraries:
react-router-dom
axios
framer-motion
tailwindcss

Install all with:

for tailwindcss visit their official site and follow the steps to install it

npm install react-router-dom axios framer-motion


Run frontend:

npm run dev
✅ Run Both Together

Make sure both backend and frontend are running in their respective folders:



🌙 Features So Far
🔐 Login / Register pages

🎨 Tailwind CSS-based UI with Dark Mode toggle

🚀 API connected to MongoDB

📦 JWT authentication

🧩 Modular structure for scaling

The creation of tasks is happening at backend but it not at frontend for now
