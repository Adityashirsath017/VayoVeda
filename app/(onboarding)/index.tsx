import { Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Index() {
  clearStorage();
  return <Redirect href="/onboarding" />;
} 
const clearStorage = async () => {
  try {
    await AsyncStorage.clear();
    console.log('AsyncStorage has been cleared!');
  } catch (e) {
    console.error('Error clearing AsyncStorage:', e);
  }
};