import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const languages: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'sn', name: 'Shona', nativeName: 'ChiShona', flag: '🇿🇼' },
  { code: 'nd', name: 'Ndebele', nativeName: 'IsiNdebele', flag: '🇿🇼' },
];

interface LanguageSelectorProps {
  visible: boolean;
  onClose: () => void;
  onLanguageChange: (languageCode: string) => void;
}

export default function LanguageSelector({ visible, onClose, onLanguageChange }: LanguageSelectorProps) {
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language);

  const handleLanguageSelect = async (languageCode: string) => {
    try {
      setSelectedLanguage(languageCode);
      await i18n.changeLanguage(languageCode);
      onLanguageChange(languageCode);
      onClose();
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('language.title')}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>{t('language.subtitle')}</Text>

          <View style={styles.languageList}>
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
                <View style={styles.languageInfo}>
                  <Text
                    style={[
                      styles.languageName,
                      selectedLanguage === language.code && styles.selectedLanguageName,
                    ]}
                  >
                    {language.name}
                  </Text>
                  <Text
                    style={[
                      styles.languageNative,
                      selectedLanguage === language.code && styles.selectedLanguageNative,
                    ]}
                  >
                    {language.nativeName}
                  </Text>
                </View>
                {selectedLanguage === language.code && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Language changes will apply immediately
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    backgroundColor: 'white',
    borderRadius: 20,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#023337',
  },
  closeButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  languageList: {
    paddingHorizontal: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginBottom: 8,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedLanguage: {
    borderColor: '#4ea674',
    backgroundColor: '#e9f8e7',
  },
  flag: {
    fontSize: 28,
    marginRight: 15,
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#023337',
    marginBottom: 2,
  },
  selectedLanguageName: {
    color: '#023337',
  },
  languageNative: {
    fontSize: 14,
    color: '#666',
  },
  selectedLanguageNative: {
    color: '#4ea674',
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
    fontSize: 14,
    fontWeight: 'bold',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    marginTop: 10,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
