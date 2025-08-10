import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import LandingScreen from '../screens/LandingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ProviderRegisterScreen from '../screens/ProviderRegisterScreen';
import ProviderDashboardScreen from '../screens/ProviderDashboardScreen';
import ChatListScreen from '../screens/ChatListScreen';
import ChatScreen from '../screens/ChatScreen';
import CompanyRegisterScreen from '../screens/CompanyRegisterScreen';
import CompanyDashboardScreen from '../screens/CompanyDashboardScreen';
import EmployeeDashboardScreen from '../screens/EmployeeDashboardScreen';
const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">

        <Stack.Screen name="Home" component={LandingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Dashboard" component={DashboardScreen} />
        <Stack.Screen name="ProviderRegister" component={ProviderRegisterScreen} />
        <Stack.Screen name="ProviderDashboard" component={ProviderDashboardScreen} />
        <Stack.Screen name="ChatList" component={ChatListScreen} options={{ headerShown: false }} />
        <Stack.Screen name="ChatScreen" component={ChatScreen} options={{ headerShown: false }} />
        <Stack.Screen name="CompanyRegister" component={CompanyRegisterScreen} />
        <Stack.Screen name="CompanyDashboard" component={CompanyDashboardScreen} />
        <Stack.Screen name="EmployeeDashboard" component={EmployeeDashboardScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
