import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface HealthTipsScreenProps {
  onBack: () => void;
}

interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: string;
  icon: string;
  readTime: string;
  difficulty: 'Easy' | 'Medium' | 'Advanced';
  tips: string[];
  warning?: string;
  benefits: string[];
}

export default function HealthTipsScreen({ onBack }: HealthTipsScreenProps) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTip, setSelectedTip] = useState<HealthTip | null>(null);
  const [showTipDetail, setShowTipDetail] = useState(false);

  const categories = ['All', 'Nutrition', 'Exercise', 'Wellness', 'Sleep', 'Mental Health'];

  const healthTips: HealthTip[] = [
    {
      id: '1',
      title: 'Prenatal Nutrition Essentials',
      content: 'Proper nutrition during pregnancy is crucial for both you and your baby\'s health. Focus on getting essential nutrients like folic acid, iron, calcium, and protein.',
      category: 'Nutrition',
      icon: '🥗',
      readTime: '5 min read',
      difficulty: 'Easy',
      tips: [
        'Take 400-800 mcg of folic acid daily',
        'Include iron-rich foods like lean meat, spinach, and beans',
        'Consume 1000mg of calcium through dairy or fortified foods',
        'Eat colorful fruits and vegetables for vitamins',
        'Choose whole grains over refined carbs'
      ],
      benefits: [
        'Reduces risk of birth defects',
        'Supports baby\'s brain development',
        'Prevents pregnancy anemia',
        'Maintains maternal bone health'
      ]
    },
    {
      id: '2',
      title: 'Safe Exercise During Pregnancy',
      content: 'Regular moderate exercise during pregnancy can help reduce discomfort, boost energy, and prepare your body for labor and delivery.',
      category: 'Exercise',
      icon: '🏃‍♀️',
      readTime: '7 min read',
      difficulty: 'Medium',
      tips: [
        'Aim for 150 minutes of moderate exercise weekly',
        'Try walking, swimming, or prenatal yoga',
        'Avoid contact sports and high-risk activities',
        'Stay hydrated before, during, and after exercise',
        'Listen to your body and rest when needed'
      ],
      warning: 'Consult your doctor before starting any exercise program',
      benefits: [
        'Improves cardiovascular health',
        'Reduces back pain and swelling',
        'Boosts mood and energy',
        'May ease labor and delivery'
      ]
    },
    {
      id: '3',
      title: 'Quality Sleep for Expecting Mothers',
      content: 'Getting adequate, quality sleep during pregnancy is essential for your health and your baby\'s development. Learn how to sleep better as your body changes.',
      category: 'Sleep',
      icon: '😴',
      readTime: '4 min read',
      difficulty: 'Easy',
      tips: [
        'Sleep on your left side for better blood flow',
        'Use a pregnancy pillow for support',
        'Establish a consistent bedtime routine',
        'Avoid caffeine and large meals before bed',
        'Keep your bedroom cool and dark'
      ],
      benefits: [
        'Supports baby\'s growth and development',
        'Improves immune function',
        'Reduces pregnancy fatigue',
        'Better emotional regulation'
      ]
    },
    {
      id: '4',
      title: 'Managing Morning Sickness',
      content: 'Morning sickness affects many pregnant women. While unpleasant, there are natural ways to manage nausea and maintain proper nutrition.',
      category: 'Wellness',
      icon: '🤢',
      readTime: '6 min read',
      difficulty: 'Easy',
      tips: [
        'Eat small, frequent meals throughout the day',
        'Try ginger tea or ginger candies',
        'Keep crackers by your bedside',
        'Avoid strong smells and spicy foods',
        'Stay hydrated with small sips of water'
      ],
      benefits: [
        'Maintains proper nutrition',
        'Prevents dehydration',
        'Reduces discomfort',
        'Improves daily functioning'
      ]
    },
    {
      id: '5',
      title: 'Mental Health & Emotional Wellness',
      content: 'Pregnancy brings emotional changes. Taking care of your mental health is just as important as physical health for you and your baby.',
      category: 'Mental Health',
      icon: '🧘‍♀️',
      readTime: '8 min read',
      difficulty: 'Medium',
      tips: [
        'Practice mindfulness and meditation',
        'Connect with other expectant mothers',
        'Communicate openly with your partner',
        'Consider prenatal counseling if needed',
        'Maintain social connections and hobbies'
      ],
      warning: 'Seek professional help if you experience persistent sadness or anxiety',
      benefits: [
        'Reduces stress and anxiety',
        'Improves bonding with baby',
        'Better relationship health',
        'Prepares for parenthood challenges'
      ]
    },
    {
      id: '6',
      title: 'Hydration & Healthy Drinks',
      content: 'Staying properly hydrated is crucial during pregnancy. Learn what to drink, how much, and what to avoid for optimal health.',
      category: 'Wellness',
      icon: '💧',
      readTime: '3 min read',
      difficulty: 'Easy',
      tips: [
        'Drink 8-10 glasses of water daily',
        'Try fruit-infused water for variety',
        'Limit caffeine to 200mg per day',
        'Avoid alcohol completely',
        'Include milk or fortified plant-based alternatives'
      ],
      benefits: [
        'Prevents dehydration and constipation',
        'Supports increased blood volume',
        'Helps regulate body temperature',
        'Aids nutrient transport to baby'
      ]
    }
  ];

  const filteredTips = selectedCategory === 'All' 
    ? healthTips 
    : healthTips.filter(tip => tip.category === selectedCategory);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return '#4CAF50';
      case 'Medium': return '#FF9800';
      case 'Advanced': return '#F44336';
      default: return '#757575';
    }
  };

  const openTipDetail = (tip: HealthTip) => {
    setSelectedTip(tip);
    setShowTipDetail(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#4ea674', '#3d8f5f', '#2d6e47']}
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
            <Text style={styles.headerTitle}>Health Tips</Text>
            <Text style={styles.headerSubtitle}>Expert advice for your pregnancy journey</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.searchButton}
            activeOpacity={0.8}
          >
            <Text style={styles.searchIcon}>🔍</Text>
          </TouchableOpacity>
        </View>

        {/* Health Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{healthTips.length}</Text>
            <Text style={styles.statLabel}>Tips Available</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>6</Text>
            <Text style={styles.statLabel}>Categories</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>📚</Text>
            <Text style={styles.statLabel}>Expert Verified</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Category Filter */}
        <View style={styles.categoryContainer}>
          <Text style={styles.sectionTitle}>Categories</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Tip */}
        {selectedCategory === 'All' && (
          <View style={styles.featuredSection}>
            <Text style={styles.sectionTitle}>💡 Featured Tip</Text>
            <TouchableOpacity 
              style={styles.featuredCard}
              onPress={() => openTipDetail(healthTips[0])}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#e8f5e8', '#f0f9f0']}
                style={styles.featuredGradient}
              >
                <View style={styles.featuredHeader}>
                  <Text style={styles.featuredIcon}>{healthTips[0].icon}</Text>
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredTitle}>{healthTips[0].title}</Text>
                    <Text style={styles.featuredMeta}>
                      {healthTips[0].readTime} • {healthTips[0].category}
                    </Text>
                  </View>
                  <View style={styles.featuredBadge}>
                    <Text style={styles.featuredBadgeText}>FEATURED</Text>
                  </View>
                </View>
                <Text style={styles.featuredContent} numberOfLines={2}>
                  {healthTips[0].content}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* Health Tips Grid */}
        <View style={styles.tipsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {selectedCategory === 'All' ? 'All Tips' : `${selectedCategory} Tips`}
            </Text>
            <View style={styles.tipsCountBadge}>
              <Text style={styles.tipsCountText}>{filteredTips.length}</Text>
            </View>
          </View>
          
          <View style={styles.tipsGrid}>
            {filteredTips.map((tip) => (
              <TouchableOpacity
                key={tip.id}
                style={styles.tipCard}
                onPress={() => openTipDetail(tip)}
                activeOpacity={0.9}
              >
                <View style={styles.tipHeader}>
                  <View style={styles.tipIconContainer}>
                    <Text style={styles.tipIcon}>{tip.icon}</Text>
                  </View>
                  <View style={styles.tipBadges}>
                    <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(tip.difficulty) }]}>
                      <Text style={styles.difficultyText}>{tip.difficulty}</Text>
                    </View>
                  </View>
                </View>
                
                <Text style={styles.tipTitle}>{tip.title}</Text>
                <Text style={styles.tipPreview} numberOfLines={2}>
                  {tip.content}
                </Text>
                
                <View style={styles.tipFooter}>
                  <Text style={styles.tipMeta}>{tip.readTime}</Text>
                  <Text style={styles.tipCategory}>{tip.category}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
              <Text style={styles.quickActionIcon}>🩺</Text>
              <Text style={styles.quickActionText}>Ask Doctor</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
              <Text style={styles.quickActionIcon}>📖</Text>
              <Text style={styles.quickActionText}>Pregnancy Guide</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
              <Text style={styles.quickActionIcon}>👥</Text>
              <Text style={styles.quickActionText}>Community</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Tip Detail Modal */}
      <Modal
        visible={showTipDetail}
        animationType="slide"
        onRequestClose={() => setShowTipDetail(false)}
        transparent={false}
      >
        {selectedTip && (
          <SafeAreaView style={styles.modalContainer}>
            <StatusBar barStyle="light-content" />
            
            {/* Modal Header */}
            <LinearGradient
              colors={['#4ea674', '#3d8f5f']}
              style={styles.modalHeader}
            >
              <TouchableOpacity 
                onPress={() => setShowTipDetail(false)}
                style={styles.modalBackButton}
                activeOpacity={0.8}
              >
                <Text style={styles.modalBackIcon}>‹</Text>
              </TouchableOpacity>
              
              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalHeaderIcon}>{selectedTip.icon}</Text>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>{selectedTip.title}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedTip.readTime} • {selectedTip.category}
                  </Text>
                </View>
              </View>
              
              <View style={[styles.modalDifficultyBadge, { backgroundColor: getDifficultyColor(selectedTip.difficulty) }]}>
                <Text style={styles.modalDifficultyText}>{selectedTip.difficulty}</Text>
              </View>
            </LinearGradient>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Warning */}
              {selectedTip.warning && (
                <View style={styles.warningContainer}>
                  <Text style={styles.warningIcon}>⚠️</Text>
                  <Text style={styles.warningText}>{selectedTip.warning}</Text>
                </View>
              )}

              {/* Overview */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Overview</Text>
                <Text style={styles.modalDescription}>{selectedTip.content}</Text>
              </View>

              {/* Practical Tips */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Practical Tips</Text>
                {selectedTip.tips.map((tip, index) => (
                  <View key={index} style={styles.tipListItem}>
                    <Text style={styles.tipListNumber}>{index + 1}</Text>
                    <Text style={styles.tipListText}>{tip}</Text>
                  </View>
                ))}
              </View>

              {/* Benefits */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Benefits</Text>
                {selectedTip.benefits.map((benefit, index) => (
                  <View key={index} style={styles.benefitItem}>
                    <Text style={styles.benefitIcon}>✅</Text>
                    <Text style={styles.benefitText}>{benefit}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalBottomSpacing} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
    </SafeAreaView>
  );
}

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
    shadowColor: '#4ea674',
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
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginLeft: -2, // Slight adjustment for visual centering
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
  searchButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchIcon: {
    fontSize: 20,
  },
  
  // Stats card styles
  statsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  
  // Content styles
  content: {
    flex: 1,
    paddingBottom: 20,
  },
  
  // Category styles
  categoryContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  categoryScroll: {
    marginTop: 12,
  },
  categoryButton: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#4ea674',
    borderColor: '#4ea674',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  
  // Section styles
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  
  // Featured tip styles
  featuredSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  featuredCard: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginTop: 12,
  },
  featuredGradient: {
    padding: 20,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  featuredIcon: {
    fontSize: 32,
    marginRight: 12,
  },
  featuredInfo: {
    flex: 1,
  },
  featuredTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 4,
  },
  featuredMeta: {
    fontSize: 12,
    color: '#4ea674',
    fontWeight: '600',
  },
  featuredBadge: {
    backgroundColor: '#FFD700',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  featuredBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#023337',
  },
  featuredContent: {
    fontSize: 14,
    color: '#023337',
    lineHeight: 20,
  },
  
  // Tips section styles
  tipsSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  tipsCountBadge: {
    backgroundColor: '#4ea674',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  tipsCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tipsGrid: {
    gap: 12,
  },
  
  // Tip card styles
  tipCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  tipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  tipIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f9f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipIcon: {
    fontSize: 24,
  },
  tipBadges: {
    alignItems: 'flex-end',
  },
  difficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  difficultyText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 8,
  },
  tipPreview: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  tipFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tipMeta: {
    fontSize: 12,
    color: '#4ea674',
    fontWeight: '600',
  },
  tipCategory: {
    fontSize: 12,
    color: '#999',
  },
  
  // Quick actions styles
  quickActionsSection: {
    paddingHorizontal: 20,
    marginTop: 25,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  quickActionCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#023337',
    textAlign: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fdf9',
  },
  modalHeader: {
    paddingTop: StatusBar.currentHeight || 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  modalBackButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 20,
  },
  modalBackIcon: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginLeft: -2, // Slight adjustment for visual centering
  },
  modalHeaderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalHeaderIcon: {
    fontSize: 40,
    marginRight: 16,
  },
  modalHeaderText: {
    flex: 1,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  modalDifficultyBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  modalDifficultyText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  
  // Modal content styles
  modalContent: {
    flex: 1,
    padding: 20,
  },
  warningContainer: {
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    fontWeight: '500',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#023337',
    marginBottom: 12,
  },
  modalDescription: {
    fontSize: 16,
    color: '#023337',
    lineHeight: 24,
  },
  tipListItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 12,
  },
  tipListNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4ea674',
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  tipListText: {
    flex: 1,
    fontSize: 14,
    color: '#023337',
    lineHeight: 20,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: '#e8f5e8',
    borderRadius: 8,
    padding: 12,
  },
  benefitIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#023337',
    fontWeight: '500',
  },
  
  // Spacing
  bottomSpacing: {
    height: 30,
  },
  modalBottomSpacing: {
    height: 40,
  },
});
