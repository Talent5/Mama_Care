import { useTranslation } from 'react-i18next';
import {
    Image,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface WelcomeScreenProps {
  onRegister: () => void;
  onLogin: () => void;
}

export default function WelcomeScreen({ onRegister, onLogin }: WelcomeScreenProps) {
  const { t } = useTranslation();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Welcome Content */}
        <View style={styles.content}>
          <Text style={styles.title}>{t('welcome.title')}</Text>
          <Text style={styles.subtitle}>{t('welcome.subtitle')}</Text>
          <Text style={styles.description}>{t('welcome.description')}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.registerButton} 
            onPress={onRegister}
            activeOpacity={0.8}
            delayPressIn={0}
          >
            <Text style={styles.registerButtonText}>{t('welcome.registerButton')}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.loginButton} 
            onPress={onLogin}
            activeOpacity={0.8}
            delayPressIn={0}
          >
            <Text style={styles.loginButtonText}>{t('welcome.loginButton')}</Text>
          </TouchableOpacity>
        </View>

        {/* Decorative Elements */}
        <View style={styles.decorativeContainer}>
          <View style={styles.decorativeCircle1} />
          <View style={styles.decorativeCircle2} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f8e7',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 140,
    height: 140,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#023337',
    textAlign: 'center',
    marginBottom: 15,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 20,
    color: '#4ea674',
    textAlign: 'center',
    marginBottom: 20,
    fontWeight: '500',
  },
  description: {
    fontSize: 16,
    color: '#023337',
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.8,
    paddingHorizontal: 10,
  },
  buttonContainer: {
    gap: 15,
    marginBottom: 20,
  },
  registerButton: {
    backgroundColor: '#4ea674',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#4ea674',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  registerButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  loginButton: {
    backgroundColor: 'white',
    paddingVertical: 18,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4ea674',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  loginButtonText: {
    color: '#4ea674',
    fontSize: 18,
    fontWeight: '600',
  },
  decorativeContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: -1,
  },
  decorativeCircle1: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#c0e6b9',
    opacity: 0.3,
  },
  decorativeCircle2: {
    position: 'absolute',
    bottom: 200,
    left: -60,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#4ea674',
    opacity: 0.1,
  },
});
