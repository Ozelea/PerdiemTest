import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import AuthStack from './src/navigation/authStack/AuthStack';
import Storage from './src/utils/Storage';
import {useMMKVStorage} from 'react-native-mmkv-storage';
import AppStack from './src/navigation/appStack/AppStack';

export default function App() {
  const [user] = useMMKVStorage('user', Storage);

  return (
    <NavigationContainer>
      {user ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
