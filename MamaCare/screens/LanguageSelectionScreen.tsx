import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Image,
    SafeAreaView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { authService } from '../services';

interface LanguageSelectionScreenProps {
  onLanguageSelected: () => void;
}

interface Language {
  code: string;
  name: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'sn', name: 'ChiShona', flag: '🇿🇼' },
  { code: 'nd', name: 'IsiNdebele', flag: '🇿🇼' },
];

export default function LanguageSelectionScreen({ onLanguageSelected }: LanguageSelectionScreenProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageSelect = (languageCode: string) => {
    setSelectedLanguage(languageCode);
  };

  const handleContinue = async () => {
    setIsLoading(true);
    try {
      // Change language
      await i18n.changeLanguage(selectedLanguage);
      
      // Mark onboarding as started
      await authService.setOnboardingCompleted();
      
      // Navigate to welcome screen
      onLanguageSelected();
    } catch (error) {
      console.error('Error setting language:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/images/Logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.title}>{t('language.title')}</Text>
        <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

        {/* Language Options */}
        <View style={styles.languageContainer}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.code}
              style={[
                styles.languageOption,
                selectedLanguage === language.code && styles.selectedLanguage,
              ]}
              onPress={() => handleLanguageSelect(language.code)}
            >
              <Text style={styles.flag}>{language.flag}</Text>
              <Text
                style={[
                  styles.languageName,
                  selectedLanguage === language.code && styles.selectedLanguageName,
                ]}
              >
                {language.name}
              </Text>
              {selectedLanguage === language.code && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue Button */}
        <TouchableOpacity
          style={[styles.continueButton, isLoading && styles.disabledButton]}
          onPress={handleContinue}
          disabled={isLoading}
        >
          <Text style={styles.continueButtonText}>
            {isLoading ? 'Loading...' : t('language.continue')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e9f8e7',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#023337',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#023337',
    textAlign: 'center',
    marginBottom: 40,
    opacity: 0.8,
  },
  languageContainer: {
    marginBottom: 40,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    marginBottom: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  selectedLanguage: {
    borderColor: '#4ea674',
    backgroundColor: '#c0e6b9',
  },
  flag: {
    fontSize: 32,
    marginRight: 15,
  },
  languageName: {
    fontSize: 18,
    color: '#023337',
    flex: 1,
    fontWeight: '500',
  },
  selectedLanguageName: {
    color: '#023337',
    fontWeight: '600',
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ea674',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#4ea674',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  disabledButton: {
    opacity: 0.6,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});