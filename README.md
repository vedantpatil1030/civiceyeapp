# 🏛️ CivicEye - Civic Issue Reporting App

A full-stack React Native application for reporting and tracking civic issues like infrastructure problems, safety concerns, and environmental issues in your community.

## 📱 Features

- **User Authentication** - Secure registration and login system
- **Issue Reporting** - Report civic issues with photos, location, and detailed descriptions
- **Real-time Feed** - View all reported issues from the community
- **Interactive Map** - See issues on a map with status-based color coding
- **Image Upload** - Attach photos to issue reports
- **Category Filtering** - Filter issues by category (Infrastructure, Safety, Environment, Traffic)
- **Status Tracking** - Track issue status (Open, In Progress, Resolved)
- **Cross-platform** - Works on both Android and iOS devices

## 🛠️ Tech Stack

### Frontend (React Native)
- React Native 0.73+
- React Navigation 6
- React Native Maps (with OpenStreetMap fallback)
- React Native Image Picker
- React Native WebView
- AsyncStorage for local data

### Backend (Node.js)
- Node.js & Express.js
- MongoDB with Mongoose
- JWT Authentication
- Multer for file uploads
- bcryptjs for password hashing
- CORS enabled

### Database
- MongoDB Atlas (Cloud Database)
- Local MongoDB (Development)

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**
- **React Native CLI**
- **Android Studio** (for Android development)
- **Xcode** (for iOS development - macOS only)
- **MongoDB Atlas Account** (for cloud database)

### 📦 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/civiceyeapp.git
   cd civiceyeapp
   ```

2. **Install dependencies**
   ```bash
   # Install React Native dependencies
   npm install
   
   # Install iOS dependencies (macOS only)
   cd ios && pod install && cd ..
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   ```

3. **Set up MongoDB Atlas**
   - Create a free account at [MongoDB Atlas](https://cloud.mongodb.com/)
   - Create a new cluster
   - Get your connection string
   - Create a database user

4. **Configure Backend Environment**
   ```bash
   # Create backend/.env file
   cd backend
   cp .env.example .env
   ```
   
   Edit `backend/.env` with your configuration:
   ```env
   # Database Configuration
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/civiceye_db?retryWrites=true&w=majority
   
   # JWT Configuration
   JWT_SECRET=your_super_secret_jwt_key_change_in_production
   JWT_EXPIRES_IN=7d
   
   # Server Configuration
   PORT=3000
   NODE_ENV=development
   
   # File Upload Configuration
   MAX_FILE_SIZE=10485760
   UPLOAD_PATH=uploads/
   ```

5. **Configure API Endpoints**
   
   Edit `src/services/api.js` to set your backend URL:
   ```javascript
   // For development - choose one:
   const API_BASE_URL = 'http://localhost:3000/api';        // Local development
   const API_BASE_URL = 'http://10.0.2.2:3000/api';        // Android Emulator
   const API_BASE_URL = 'http://YOUR_IP:3000/api';         // Physical device
   const API_BASE_URL = 'https://your-app.herokuapp.com/api'; // Production
   ```

## 🖥️ Running the Application

### Backend Server

1. **Start the backend server**
   ```bash
   cd backend
   npm start
   ```
   
   The server will start on `http://localhost:3000`

2. **Verify database connection**
   - Look for "✅ Connected to MongoDB" in the console
   - The server should show network URLs for mobile access

### React Native App

> **Note**: Make sure you have completed the [Set Up Your Environment](https://reactnative.dev/docs/set-up-your-environment) guide before proceeding.

#### For Android Emulator

1. **Start Metro bundler**
   ```bash
   npx react-native start
   ```

2. **Run on Android emulator**
   ```bash
   npx react-native run-android
   ```

3. **Update API URL** in `src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://10.0.2.2:3000/api'; // For Android Emulator
   ```

#### For Physical Android Device

1. **Enable Developer Options & USB Debugging** on your device

2. **Connect device via USB** and verify:
   ```bash
   adb devices
   ```

3. **Find your computer's IP address**:
   ```bash
   # Windows
   ipconfig
   
   # macOS/Linux
   ifconfig
   ```

4. **Update API URL** in `src/services/api.js`:
   ```javascript
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api'; // Replace with your IP
   ```

5. **Make sure backend binds to all interfaces**:
   ```bash
   cd backend
   # Start server accessible from network
   npm start
   ```

6. **Run the app**:
   ```bash
   npx react-native run-android
   ```

#### For iOS (macOS only)

For iOS, remember to install CocoaPods dependencies (this only needs to be run on first clone or after updating native deps).

The first time you create a new project, run the Ruby bundler to install CocoaPods itself:

```bash
bundle install
```

Then, and every time you update your native dependencies, run:

```bash
bundle exec pod install
```

1. **Run on iOS simulator**:
   ```bash
   npx react-native run-ios
   ```

2. **For physical iOS device**, update API URL to your computer's IP:
   ```javascript
   const API_BASE_URL = 'http://YOUR_COMPUTER_IP:3000/api';
   ```

## 📱 App Usage

### 1. **Register/Login**
- Create a new account or login with existing credentials
- All user data is securely stored with JWT authentication

### 2. **Report an Issue**
- Tap "Report Issue" 
- Add photos, description, category, and priority
- Location is automatically captured (with permission)
- Submit to share with the community

### 3. **Browse Issues**
- View all reported issues in the feed
- Filter by category or status
- See issue details, photos, and reporter information

### 4. **Map View**
- Interactive map showing all issues
- Color-coded markers by status (Red: Open, Orange: In Progress, Green: Resolved)
- Toggle between Native Map and Web Map (OpenStreetMap)
- Tap markers for details

## 🔧 Development

### Project Structure
```
civiceyeapp/
├── src/                    # React Native source code
│   ├── screens/           # App screens
│   ├── contexts/          # React contexts (Auth)
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── backend/               # Node.js backend
│   ├── models/           # MongoDB schemas
│   ├── routes/           # API routes
│   ├── middleware/       # Express middleware
│   └── uploads/          # File uploads (gitignored)
├── android/              # Android-specific code
├── ios/                  # iOS-specific code
└── __tests__/           # Test files
```

### API Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/issues/feed` - Get issues feed
- `POST /api/issues` - Create new issue
- `POST /api/issues/:id/upvote` - Upvote an issue
- `GET /api/users/profile` - Get user profile

## 📱 Device Testing

### Android Emulator
✅ **Recommended for development**
- Easy setup and debugging
- Consistent environment
- Fast development cycle

### Physical Device
✅ **Required for final testing**
- Real-world performance testing
- Camera and GPS functionality
- Network conditions testing
- App store deployment preparation

## 🚀 Deployment

### Backend Deployment
1. **Deploy to Railway.app, Render.com, or Heroku**
2. **Set environment variables** in the hosting platform
3. **Update MongoDB whitelist** to allow all IPs (0.0.0.0/0) for production
4. **Update API_BASE_URL** in React Native app

### Mobile App Deployment
1. **Android**: Build APK/AAB and deploy to Google Play Store
2. **iOS**: Build IPA and deploy to Apple App Store

## 🆘 Support

### Common Issues

**"Network request failed"**
- Check if backend server is running
- Verify API_BASE_URL is correct for your setup
- Ensure device/emulator can reach the backend

**"Map not loading"**
- Try switching between Native Map and Web Map
- Check internet connection
- Web Map uses OpenStreetMap (no API key required)

**"Camera permission denied"**
- Enable camera permissions in device settings
- Restart the app after granting permissions

**"Unable to connect to database"**
- Verify MongoDB Atlas connection string
- Check database user credentials
- Ensure IP address is whitelisted in Atlas

### Getting Help
- Check the [Issues](https://github.com/yourusername/civiceyeapp/issues) page
- Review the [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for detailed setup instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- React Native community for excellent documentation
- MongoDB Atlas for free cloud database hosting
- OpenStreetMap for free map tiles
- All contributors who helped improve this project

---

**Built with ❤️ for civic engagement and community improvement**

For more information, please visit [CocoaPods Getting Started guide](https://guides.cocoapods.org/using/getting-started.html).

```sh
# Using npm
npm run ios

# OR using Yarn
yarn ios
```

If everything is set up correctly, you should see your new app running in the Android Emulator, iOS Simulator, or your connected device.

This is one way to run your app — you can also build it directly from Android Studio or Xcode.

## Step 3: Modify your app

Now that you have successfully run the app, let's make changes!

Open `App.tsx` in your text editor of choice and make some changes. When you save, your app will automatically update and reflect these changes — this is powered by [Fast Refresh](https://reactnative.dev/docs/fast-refresh).

When you want to forcefully reload, for example to reset the state of your app, you can perform a full reload:

- **Android**: Press the <kbd>R</kbd> key twice or select **"Reload"** from the **Dev Menu**, accessed via <kbd>Ctrl</kbd> + <kbd>M</kbd> (Windows/Linux) or <kbd>Cmd ⌘</kbd> + <kbd>M</kbd> (macOS).
- **iOS**: Press <kbd>R</kbd> in iOS Simulator.

## Congratulations! :tada:

You've successfully run and modified your React Native App. :partying_face:

### Now what?

- If you want to add this new React Native code to an existing application, check out the [Integration guide](https://reactnative.dev/docs/integration-with-existing-apps).
- If you're curious to learn more about React Native, check out the [docs](https://reactnative.dev/docs/getting-started).

# Troubleshooting

If you're having issues getting the above steps to work, see the [Troubleshooting](https://reactnative.dev/docs/troubleshooting) page.

# Learn More

To learn more about React Native, take a look at the following resources:

- [React Native Website](https://reactnative.dev) - learn more about React Native.
- [Getting Started](https://reactnative.dev/docs/environment-setup) - an **overview** of React Native and how setup your environment.
- [Learn the Basics](https://reactnative.dev/docs/getting-started) - a **guided tour** of the React Native **basics**.
- [Blog](https://reactnative.dev/blog) - read the latest official React Native **Blog** posts.
- [`@facebook/react-native`](https://github.com/facebook/react-native) - the Open Source; GitHub **repository** for React Native.
