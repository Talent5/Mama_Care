import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text } from 'react-native';
import DashboardScreen from '../screens/DashboardScreen';
import HealthTipsScreen from '../screens/HealthTipsScreen';
import PregnancyTrackerScreen from '../screens/PregnancyTrackerScreen';
import AppointmentsScreen from '../screens/AppointmentsScreen';
import AuthGuard from '../components/AuthGuard';
import SymptomReportingScreen from '../screens/SymptomReportingScreen';

const Tab = createBottomTabNavigator();

interface MainTabNavigatorProps {
  onLogout: () => void;
}

function DashboardTab({ onLogout }: { onLogout: () => void }) {
  return (
    <AuthGuard onAuthFailure={onLogout}>
      <DashboardScreen onLogout={onLogout} />
    </AuthGuard>
  );
}

function PregnancyTab({ onLogout }: { onLogout: () => void }) {
  return (
    <AuthGuard onAuthFailure={onLogout}>
      <PregnancyTrackerScreen onBack={() => {}} />
    </AuthGuard>
  );
}

function HealthTab({ onLogout }: { onLogout: () => void }) {
  return (
    <AuthGuard onAuthFailure={onLogout}>
      <HealthTipsScreen onBack={() => {}} />
    </AuthGuard>
  );
}

function AppointmentsTab({ onLogout }: { onLogout: () => void }) {
  return (
    <AuthGuard onAuthFailure={onLogout}>
      <AppointmentsScreen onBack={() => {}} />
    </AuthGuard>
  );
}

function SymptomsTab({ onLogout }: { onLogout: () => void }) {
  return (
    <AuthGuard onAuthFailure={onLogout}>
      <SymptomReportingScreen />
    </AuthGuard>
  );
}

export default function MainTabNavigator({ onLogout }: MainTabNavigatorProps) {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: '#4ea674',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: styles.tabBarLabel,
        headerStyle: styles.header,
        headerTintColor: '#023337',
        headerTitleStyle: styles.headerTitle,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
        tabBarItemStyle: {},
      }}
    >
      <Tab.Screen
        name="Home"
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={[styles.tabIcon, { color, fontSize: focused ? 24 : 20 }]}>🏠</Text>
          ),
          title: 'Home',
          headerShown: false,
          tabBarLabel: 'Home',
        }}
      >
        {() => <DashboardTab onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="Pregnancy"
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={[styles.tabIcon, { color, fontSize: focused ? 24 : 20 }]}>🤰</Text>
          ),
          title: 'Pregnancy',
          headerShown: false,
          tabBarLabel: 'Pregnancy',
        }}
      >
        {() => <PregnancyTab onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="Health"
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={[styles.tabIcon, { color, fontSize: focused ? 24 : 20 }]}>💊</Text>
          ),
          title: 'Health',
          headerShown: false,
          tabBarLabel: 'Health',
        }}
      >
        {() => <HealthTab onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="Appointments"
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={[styles.tabIcon, { color, fontSize: focused ? 24 : 20 }]}>📅</Text>
          ),
          title: 'Appointments',
          headerShown: false,
          tabBarLabel: 'Appointments',
        }}
      >
        {() => <AppointmentsTab onLogout={onLogout} />}
      </Tab.Screen>

      <Tab.Screen
        name="Symptoms"
        options={{
          tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
            <Text style={[styles.tabIcon, { color, fontSize: focused ? 24 : 20 }]}>💬</Text>
          ),
          title: 'Symptoms',
          headerShown: false,
          tabBarLabel: 'Symptoms',
        }}
      >
        {() => <SymptomsTab onLogout={onLogout} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 12,
    paddingBottom: 12,
    height: 75,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
  },
  tabIcon: {
    marginBottom: 2,
  },
  header: {
    backgroundColor: '#e9f8e7',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#023337',
  },
});
