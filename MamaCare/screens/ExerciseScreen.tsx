import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ExerciseScreenProps {
  onBack: () => void;
}

interface ExerciseItem {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  category: 'prenatal' | 'meditation' | 'breathing' | 'stretching';
  icon: string;
  benefits: string[];
}

const ExerciseScreen: React.FC<ExerciseScreenProps> = ({ onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'prenatal' | 'meditation' | 'breathing' | 'stretching'>('all');

  const exercises: ExerciseItem[] = [
    {
      id: '1',
      title: 'Prenatal Yoga Flow',
      description: 'Gentle yoga movements designed for pregnant women',
      duration: '15 min',
      difficulty: 'beginner',
      category: 'prenatal',
      icon: '🧘‍♀️',
      benefits: ['Reduces back pain', 'Improves flexibility', 'Promotes relaxation']
    },
    {
      id: '2',
      title: 'Deep Breathing Exercise',
      description: 'Breathing techniques to reduce stress and anxiety',
      duration: '5 min',
      difficulty: 'beginner',
      category: 'breathing',
      icon: '🫁',
      benefits: ['Reduces stress', 'Improves oxygen flow', 'Calms mind']
    },
    {
      id: '3',
      title: 'Guided Meditation',
      description: 'Mindfulness meditation for expectant mothers',
      duration: '10 min',
      difficulty: 'beginner',
      category: 'meditation',
      icon: '🧘',
      benefits: ['Reduces anxiety', 'Improves sleep', 'Mental clarity']
    },
    {
      id: '4',
      title: 'Gentle Stretching',
      description: 'Light stretches to relieve tension and improve circulation',
      duration: '12 min',
      difficulty: 'beginner',
      category: 'stretching',
      icon: '🤸‍♀️',
      benefits: ['Relieves tension', 'Improves circulation', 'Reduces swelling']
    },
    {
      id: '5',
      title: 'Walking Workout',
      description: 'Low-impact cardio perfect for pregnancy',
      duration: '20 min',
      difficulty: 'beginner',
      category: 'prenatal',
      icon: '🚶‍♀️',
      benefits: ['Cardiovascular health', 'Weight management', 'Energy boost']
    },
    {
      id: '6',
      title: 'Pelvic Floor Exercises',
      description: 'Strengthen your pelvic floor muscles',
      duration: '8 min',
      difficulty: 'intermediate',
      category: 'prenatal',
      icon: '💪',
      benefits: ['Prepares for birth', 'Prevents incontinence', 'Faster recovery']
    },
  ];

  const categories = [
    { id: 'all', name: 'All', icon: '🏃‍♀️' },
    { id: 'prenatal', name: 'Prenatal', icon: '🤰' },
    { id: 'meditation', name: 'Meditation', icon: '🧘' },
    { id: 'breathing', name: 'Breathing', icon: '🫁' },
    { id: 'stretching', name: 'Stretching', icon: '🤸‍♀️' },
  ];

  const filteredExercises = selectedCategory === 'all' 
    ? exercises 
    : exercises.filter(exercise => exercise.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return '#4ea674';
      case 'intermediate': return '#ffd93d';
      case 'advanced': return '#ff4757';
      default: return '#4ea674';
    }
  };

  const handleStartExercise = (exercise: ExerciseItem) => {
    Alert.alert(
      exercise.title,
      `Ready to start your ${exercise.duration} ${exercise.title.toLowerCase()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start',
          onPress: () => {
            Alert.alert(
              'Exercise Started',
              `${exercise.title} is now playing. Follow along with the guided instructions.`,
              [{ text: 'OK' }]
            );
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header */}
      <LinearGradient
        colors={['#74b9ff', '#0984e3', '#6c5ce7']}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            onPress={onBack} 
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Text style={styles.backIcon}>‹</Text>
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Exercise & Meditation</Text>
            <Text style={styles.headerSubtitle}>Stay healthy and relaxed</Text>
          </View>
          
          <View style={styles.headerRight} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Welcome Card */}
        <View style={styles.welcomeCard}>
          <LinearGradient
            colors={['#a8e6cf', '#7fcdcd', '#74b9ff']}
            style={styles.welcomeGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.welcomeIcon}>🌟</Text>
            <Text style={styles.welcomeTitle}>Stay Active & Mindful</Text>
            <Text style={styles.welcomeText}>
              Gentle exercises and meditation designed specifically for pregnancy
            </Text>
          </LinearGradient>
        </View>

        {/* Category Filter */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContainer}
          >
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryCard,
                  selectedCategory === category.id && styles.categoryCardSelected
                ]}
                onPress={() => setSelectedCategory(category.id as any)}
                activeOpacity={0.8}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={[
                  styles.categoryName,
                  selectedCategory === category.id && styles.categoryNameSelected
                ]}>
                  {category.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>
            {selectedCategory === 'all' ? 'All Exercises' : `${categories.find(c => c.id === selectedCategory)?.name} Exercises`}
          </Text>
          
          {filteredExercises.map((exercise) => (
            <View key={exercise.id} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIconContainer}>
                  <Text style={styles.exerciseIcon}>{exercise.icon}</Text>
                </View>
                
                <View style={styles.exerciseInfo}>
                  <Text style={styles.exerciseTitle}>{exercise.title}</Text>
                  <Text style={styles.exerciseDescription}>{exercise.description}</Text>
                  
                  <View style={styles.exerciseMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaIcon}>⏱️</Text>
                      <Text style={styles.metaText}>{exercise.duration}</Text>
                    </View>
                    
                    <View style={[
                      styles.difficultyBadge,
                      { backgroundColor: getDifficultyColor(exercise.difficulty) }
                    ]}>
                      <Text style={styles.difficultyText}>
                        {exercise.difficulty.charAt(0).toUpperCase() + exercise.difficulty.slice(1)}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              
              {/* Benefits */}
              <View style={styles.benefitsSection}>
                <Text style={styles.benefitsTitle}>Benefits:</Text>
                <View style={styles.benefitsList}>
                  {exercise.benefits.map((benefit, index) => (
                    <View key={index} style={styles.benefitItem}>
                      <Text style={styles.benefitBullet}>•</Text>
                      <Text style={styles.benefitText}>{benefit}</Text>
                    </View>
                  ))}
                </View>
              </View>
              
              {/* Action Button */}
              <TouchableOpacity
                style={styles.startButton}
                onPress={() => handleStartExercise(exercise)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#74b9ff', '#0984e3']}
                  style={styles.startButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.startButtonIcon}>▶️</Text>
                  <Text style={styles.startButtonText}>Start Exercise</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Tips Section */}
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Exercise Tips</Text>
          <View style={styles.tipsCard}>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>💧</Text>
              <Text style={styles.tipText}>Stay hydrated during exercise</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🛑</Text>
              <Text style={styles.tipText}>Stop if you feel dizzy or uncomfortable</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>👥</Text>
              <Text style={styles.tipText}>Consult your doctor before starting new exercises</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipIcon}>🎯</Text>
              <Text style={styles.tipText}>Listen to your body and exercise at your own pace</Text>
            </View>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fdf9',
  },
  
  // Header styles
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 8,
    shadowColor: '#74b9ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    marginLeft: -2,
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginTop: 2,
  },
  headerRight: {
    width: 44,
  },
  
  // Content styles
  content: {
    flex: 1,
  },
  
  // Welcome card
  welcomeCard: {
    margin: 20,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  welcomeGradient: {
    padding: 20,
    alignItems: 'center',
  },
  welcomeIcon: {
    fontSize: 32,
    marginBottom: 12,
  },
  welcomeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 8,
    textAlign: 'center',
  },
  welcomeText: {
    fontSize: 14,
    color: '#023337',
    textAlign: 'center',
    opacity: 0.8,
  },
  
  // Categories section
  categoriesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 15,
  },
  categoriesScroll: {
    marginHorizontal: -20,
  },
  categoriesContainer: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    minWidth: 80,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  categoryCardSelected: {
    borderColor: '#74b9ff',
    backgroundColor: '#f0f7ff',
  },
  categoryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  categoryName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  categoryNameSelected: {
    color: '#74b9ff',
  },
  
  // Exercises section
  exercisesSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  exerciseCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  exerciseHeader: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  exerciseIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f0f7ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  exerciseIcon: {
    fontSize: 28,
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 6,
  },
  exerciseDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  exerciseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  metaText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  difficultyText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  
  // Benefits section
  benefitsSection: {
    marginBottom: 15,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 8,
  },
  benefitsList: {
    gap: 4,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  benefitBullet: {
    fontSize: 16,
    color: '#74b9ff',
    marginRight: 8,
    marginTop: -2,
  },
  benefitText: {
    fontSize: 12,
    color: '#666',
    flex: 1,
  },
  
  // Start button
  startButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#74b9ff',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
  },
  startButtonIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  startButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Tips section
  tipsSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  tipsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipIcon: {
    fontSize: 20,
    marginRight: 12,
    width: 24,
  },
  tipText: {
    fontSize: 14,
    color: '#023337',
    flex: 1,
  },
  
  bottomSpacing: {
    height: 30,
  },
});

export default ExerciseScreen;
