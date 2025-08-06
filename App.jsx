import React, {useEffect} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AuthStack from './src/navigation/authStack/AuthStack';
import Storage from './src/utils/Storage';
import {useMMKVStorage} from 'react-native-mmkv-storage';
import AppStack from './src/navigation/appStack/AppStack';
import NotificationService from './src/utils/NotificationService';

export default function App() {
  const [user] = useMMKVStorage('user', Storage);

  useEffect(() => {
    // Initialize notification service when app starts
    NotificationService.initializeNotifications();
  }, []);

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
