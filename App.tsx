import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from './src/screens/Login';
import Home from './src/screens/Home';
import { getAuth, onAuthStateChanged } from '@react-native-firebase/auth';
import { ActivityIndicator, View } from 'react-native';
import CallScreen from './src/screens/CallScreen';

const Stack = createNativeStackNavigator();

const App = () => {
  const [initializing, setInitializing] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setCurrentUser(firebaseUser);
      if (initializing) {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, [initializing]);

  if (initializing) {
    return (
      React.createElement(View, { style: { flex: 1, justifyContent: 'center', alignItems: 'center' } },
        React.createElement(ActivityIndicator, { size: 'large', color: '#007AFF' })
      )
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={currentUser ? 'Home' : 'Login'}>
        <Stack.Screen name="Login" component={Login} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
        <Stack.Screen name="Call" component={CallScreen} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
