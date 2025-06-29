/**
 * CivicEye React Native App with Navigation
 * 
 * @format
 */

import React, { useEffect } from 'react';
import { Text, ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { PermissionUtils } from './src/utils/permissions';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';

// Import screens
import LoginScreen from './src/screens/LoginScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import HomeScreen from './src/screens/HomeScreen';
import ReportScreen from './src/screens/ReportScreen';
import MapScreen from './src/screens/MapScreen';
import StatusScreen from './src/screens/StatusScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Icon Component
const TabIcon = ({ emoji, color, size }) => {
  return <Text style={{ fontSize: size, color }}>{emoji}</Text>;
};

// Bottom Tab Navigator for main app screens
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#8E8E93',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: 1,
          borderTopColor: '#e1e8ed',
          height: 90,
          paddingTop: 8,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginTop: 4,
        },
        headerShown: false,
      }}
    >
      <Tab.Screen 
        name="Feed" 
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🏠" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Report" 
        component={ReportScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="📝" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Map" 
        component={MapScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="🗺️" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen 
        name="Status" 
        component={StatusScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <TabIcon emoji="📊" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Authentication Stack
function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
}

// Main App Navigator
function AppNavigator() {
  const { isLoggedIn, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

// Main App Component
function App() {
  useEffect(() => {
    // Request permissions on app startup
    PermissionUtils.requestAllPermissions()
      .then((permissionStatus) => {
        console.log('App permissions requested:', permissionStatus);
      })
      .catch((error) => {
        console.error('Permission request failed:', error);
      });
  }, []);

  return (
    <AuthProvider>
      <AppNavigator />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});

export default App;
