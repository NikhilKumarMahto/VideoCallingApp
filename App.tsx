import React from 'react';
import Home from './src/screens/Home.tsx';
import firebase from "@react-native-firebase/app";

function App(): React.JSX.Element {
  // const isDarkMode = useColorScheme() === 'dark';
  //
  // const backgroundStyle = {
  //   backgroundColor: isDarkMode ? Colors.darker : Colors.lighter,
  // };
  //
  // const safePadding = '5%';

  const firebaseConfig = {
    apiKey: 'AIzaSyDDgvvRhu83MfHME74t7ItqfnRlUxAwmuI',
    authDomain: 'nikconnects-74cc5.firebaseapp.com',
    projectId: 'nikconnects-74cc5',
    storageBucket: 'nikconnects-74cc5.firebasestorage.app',
    messagingSenderId: '293416345590',
    appId: '1:293416345590:android:bd841861f7264ea6c631d7',
    measurementId: 'G-491092997',
    databaseURL: 'https://nikconnects-74cc5.firebaseio.com'
  };

  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig)
  }

  return (
   <Home />
  );
}
export default App;
