import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MatchesScreen from '../screens/Main/MatchesScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import ProfileEditScreen from '../screens/Main/ProfileEditScreen';
import DiscoverScreen from '../screens/Main/DiscoverScreen'; // Add DiscoverScreen later
// Import icons library e.g., @expo/vector-icons
import { Ionicons } from '@expo/vector-icons';
import { User } from '../types'; // For ProfileEdit params

// --- Define Param Lists ---

// Params for screens accessible via bottom tabs directly
export type MainTabParamList = {
  Discover: undefined;
  MatchesList: undefined; // Changed name to avoid conflict
  ProfileTab: undefined; // Changed name to avoid conflict with ProfileScreen in stack
};

// Params for the stack navigator that includes tabs and other screens
export type MainStackParamList = {
    MainTabs: undefined; // Route to show the tab navigator
    Chat: { matchId: string };
    Profile: undefined; // Profile screen within the stack
    ProfileEdit: { profileData: User }; // Pass current profile data
    // Add other screens reachable from within the main app flow
};

const Tab = createBottomTabNavigator<MainTabParamList>();
const Stack = createNativeStackNavigator<MainStackParamList>();

// --- Bottom Tab Navigator Component ---
const MainTabNavigator = () => {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap | undefined;

                    if (route.name === 'Discover') {
                        iconName = focused ? 'search' : 'search-outline';
                    } else if (route.name === 'MatchesList') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'ProfileTab') {
                        iconName = focused ? 'person-circle' : 'person-circle-outline';
                    }
                    // You can return any component that you like here!
                     if (!iconName) return null; // Handle case where iconName is undefined
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: 'dodgerblue',
                tabBarInactiveTintColor: 'gray',
                headerShown: false, // Hide header for tabs, stack navigator will handle it
            })}
        >
            <Tab.Screen name="Discover" component={DiscoverScreen} />
            <Tab.Screen name="MatchesList" component={MatchesScreen} options={{ title: 'Matches' }} />
            <Tab.Screen name="ProfileTab" component={ProfileScreen} options={{ title: 'Profile' }}/>
        </Tab.Navigator>
    );
}


// --- Main Stack Navigator (Includes Tabs) ---
const MainNavigator = () => {
  return (
    <Stack.Navigator>
       {/* The Tab Navigator is nested inside the Stack Navigator */}
       <Stack.Screen
            name="MainTabs"
            component={MainTabNavigator}
            options={{ headerShown: false }} // Hide header for the tab container itself
        />
      {/* Screens outside the tabs */}
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({ title: `Chat ${route.params.matchId.substring(0,5)}...` })} // Dynamic title
      />
       <Stack.Screen
            name="Profile" // Make Profile screen accessible in the stack (e.g., from settings?)
            component={ProfileScreen}
        />
       <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{ title: "Edit Profile" }}
      />
    </Stack.Navigator>
  );
};

export default MainNavigator;