import React, { useState, useEffect, useMemo } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    Modal,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import dashboardService from '../services/dashboardService';
import apiService from '../services/apiService';

interface PregnancyTrackerScreenProps {
  onBack: () => void;
}

interface WeekInfo {
  week: number;
  trimester: number;
  babySize: {
    comparison: string;
    length: string;
    weight: string;
    emoji: string;
  };
  development: string[];
  motherChanges: string[];
  tips: string[];
  dueDate?: string;
}

interface Milestone {
  week: number;
  title: string;
  description: string;
  type: 'development' | 'appointment' | 'preparation';
  completed: boolean;
  emoji: string;
}

export default function PregnancyTrackerScreen({ onBack }: PregnancyTrackerScreenProps) {
  const [currentWeek, setCurrentWeek] = useState(1);
  const [showWeekDetail, setShowWeekDetail] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<WeekInfo | null>(null);
  const [selectedTrimester, setSelectedTrimester] = useState(1);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [lastSyncedWeek, setLastSyncedWeek] = useState<number | null>(null);
  const [syncTimer, setSyncTimer] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPregnant, setIsPregnant] = useState<boolean>(false);
  const [estimatedDueDate, setEstimatedDueDate] = useState<string | null>(null); // YYYY-MM-DD
  const [lmpDate, setLmpDate] = useState<string | null>(null); // YYYY-MM-DD
  const [showSettings, setShowSettings] = useState(false);
  const [saving, setSaving] = useState(false);

  // Comprehensive week data
  const weekData: { [key: number]: WeekInfo } = {
    4: {
      week: 4,
      trimester: 1,
      babySize: { comparison: 'Poppy seed', length: '2mm', weight: '<1g', emoji: '🌱' },
      development: ['Neural tube begins to form', 'Heart starts to develop', 'Basic body structure forming'],
      motherChanges: ['Missed period', 'Possible implantation bleeding', 'Early pregnancy hormones rising'],
      tips: ['Take folic acid supplements', 'Avoid alcohol and smoking', 'Schedule first prenatal appointment']
    },
    8: {
      week: 8,
      trimester: 1,
      babySize: { comparison: 'Raspberry', length: '16mm', weight: '1g', emoji: '🫐' },
      development: ['All major organs forming', 'Arms and legs developing', 'Facial features becoming distinct'],
      motherChanges: ['Morning sickness may begin', 'Breast tenderness', 'Increased urination'],
      tips: ['Eat small, frequent meals', 'Stay hydrated', 'Get plenty of rest']
    },
    12: {
      week: 12,
      trimester: 1,
      babySize: { comparison: 'Lime', length: '5.4cm', weight: '14g', emoji: '🍋' },
      development: ['Reflexes developing', 'Fingernails forming', 'Sex organs developing'],
      motherChanges: ['Morning sickness may improve', 'Energy levels increasing', 'Uterus expanding'],
      tips: ['Consider genetic testing', 'Start prenatal exercise', 'Share pregnancy news']
    },
    16: {
      week: 16,
      trimester: 2,
      babySize: { comparison: 'Avocado', length: '11.6cm', weight: '100g', emoji: '🥑' },
      development: ['Hearing developing', 'Limbs more proportional', 'Skeleton hardening'],
      motherChanges: ['May feel first movements', 'Skin changes possible', 'Energy returning'],
      tips: ['Consider maternity clothes', 'Plan second trimester screening', 'Stay active']
    },
    20: {
      week: 20,
      trimester: 2,
      babySize: { comparison: 'Banana', length: '16.4cm', weight: '300g', emoji: '🍌' },
      development: ['Digestive system working', 'Hair and nails growing', 'Brain developing rapidly'],
      motherChanges: ['Belly clearly showing', 'Feeling regular movements', 'Possible backaches'],
      tips: ['Schedule anatomy scan', 'Start thinking about nursery', 'Practice good posture'],
      dueDate: 'December 15, 2025'
    },
    24: {
      week: 24,
      trimester: 2,
      babySize: { comparison: 'Corn', length: '21cm', weight: '600g', emoji: '🌽' },
      development: ['Lungs developing', 'Taste buds forming', 'Hearing sounds outside womb'],
      motherChanges: ['Glucose screening test', 'Possible stretch marks', 'Increased appetite'],
      tips: ['Take glucose tolerance test', 'Monitor weight gain', 'Practice relaxation techniques']
    },
    28: {
      week: 28,
      trimester: 3,
      babySize: { comparison: 'Eggplant', length: '25cm', weight: '1kg', emoji: '🍆' },
      development: ['Eyes can open and close', 'Brain tissue increasing', 'Can respond to sounds'],
      motherChanges: ['Start seeing doctor more often', 'Possible heartburn', 'Difficulty sleeping'],
      tips: ['Start childbirth classes', 'Consider baby registry', 'Monitor baby movements']
    },
    32: {
      week: 32,
      trimester: 3,
      babySize: { comparison: 'Jicama', length: '28cm', weight: '1.7kg', emoji: '🥥' },
      development: ['Bones hardening', 'Practicing breathing movements', 'Gaining weight rapidly'],
      motherChanges: ['Frequent urination returns', 'Possible swelling', 'Braxton Hicks contractions'],
      tips: ['Prepare hospital bag', 'Finalize birth plan', 'Rest when possible']
    },
    36: {
      week: 36,
      trimester: 3,
      babySize: { comparison: 'Romaine lettuce', length: '32cm', weight: '2.6kg', emoji: '🥬' },
      development: ['Lungs nearly mature', 'Immune system developing', 'Getting into birth position'],
      motherChanges: ['Weekly doctor visits', 'Increased fatigue', 'Nesting instinct'],
      tips: ['Install car seat', 'Pack hospital bag', 'Practice breathing exercises']
    },
    40: {
      week: 40,
      trimester: 3,
      babySize: { comparison: 'Watermelon', length: '36cm', weight: '3.4kg', emoji: '🍉' },
      development: ['Fully developed', 'Ready for birth', 'Strong grip and reflexes'],
      motherChanges: ['Regular contractions may start', 'Cervix preparing for labor', 'Excitement and anxiety'],
      tips: ['Watch for labor signs', 'Stay close to hospital', 'Trust your body']
    }
  };

  useEffect(() => {
    const pregnancyMilestones: Milestone[] = [
      { week: 4, title: 'Pregnancy Confirmed', description: 'Positive pregnancy test', type: 'development', completed: true, emoji: '✅' },
      { week: 8, title: 'First Prenatal Visit', description: 'Initial doctor appointment', type: 'appointment', completed: true, emoji: '🩺' },
      { week: 12, title: 'First Trimester Complete', description: 'Risk of miscarriage decreases', type: 'development', completed: true, emoji: '🎉' },
      { week: 16, title: 'Genetic Testing', description: 'Optional screening tests', type: 'appointment', completed: true, emoji: '🧬' },
      { week: 20, title: 'Anatomy Scan', description: 'Detailed ultrasound', type: 'appointment', completed: false, emoji: '📷' },
      { week: 24, title: 'Glucose Test', description: 'Gestational diabetes screening', type: 'appointment', completed: false, emoji: '🩸' },
      { week: 28, title: 'Third Trimester', description: 'Final stretch begins', type: 'development', completed: false, emoji: '🤱' },
      { week: 32, title: 'Baby Shower', description: 'Celebrate with family', type: 'preparation', completed: false, emoji: '🎊' },
      { week: 36, title: 'Hospital Bag Ready', description: 'Pack essentials for delivery', type: 'preparation', completed: false, emoji: '🎒' },
      { week: 40, title: 'Due Date', description: 'Baby arrival expected', type: 'development', completed: false, emoji: '👶' }
    ];
    setMilestones(pregnancyMilestones);
  }, []);

  // Initial load from backend
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const res = await dashboardService.getDashboardData();
        if (!res?.success || !res?.data) throw new Error('Failed to load dashboard');
        const p = res.data.pregnancy;
        const serverIsPreg = !!p?.isPregnant;
        const serverEDD = p?.estimatedDueDate || p?.dueDate || null;
        const serverWeek = p?.currentWeek || 1;
        if (!isMounted) return;
        setIsPregnant(serverIsPreg);
        setEstimatedDueDate(serverEDD);
        // Compute GA from EDD if provided; otherwise use server week
        const computedWeek = serverEDD ? computeWeekFromEdd(serverEDD) : serverWeek;
        const safeWeek = clampWeek(computedWeek);
        setCurrentWeek(safeWeek);
        setSelectedTrimester(getCurrentTrimester(safeWeek));
        setLastSyncedWeek(safeWeek);
        setLoading(false);
      } catch (e) {
        // Fallback: not blocking UI
        setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, []);

  // Debounced sync of current week to backend
  useEffect(() => {
    if (lastSyncedWeek === currentWeek) return;
    if (syncTimer) clearTimeout(syncTimer);
    const timer = setTimeout(async () => {
      try {
        await dashboardService.updatePregnancyWeek(currentWeek);
        setLastSyncedWeek(currentWeek);
      } catch (e) {
        // Best-effort sync; ignore errors for offline use
      }
    }, 800);
    setSyncTimer(timer);
    return () => clearTimeout(timer);
  }, [currentWeek]);

  const getCurrentTrimester = (week: number) => {
    if (week <= 12) return 1;
    if (week <= 27) return 2;
    return 3;
  };

  const getTrimesterProgress = (week: number) => {
    const trimester = getCurrentTrimester(week);
    if (trimester === 1) return (week / 12) * 100;
    if (trimester === 2) return ((week - 12) / 15) * 100;
    return ((week - 27) / 13) * 100;
  };

  const getOverallProgress = (week: number) => {
    return (week / 40) * 100;
  };

  const ordinalTrimester = useMemo(() => {
    const t = getCurrentTrimester(currentWeek);
    return t === 1 ? '1st' : t === 2 ? '2nd' : '3rd';
  }, [currentWeek]);

  // Helpers: dates and GA computation
  function isValidISODate(s?: string | null) {
    if (!s) return false;
    const m = /^\d{4}-\d{2}-\d{2}$/.test(s);
    if (!m) return false;
    const d = new Date(s + 'T00:00:00Z');
    return !isNaN(d.getTime());
  }

  function diffDays(a: Date, b: Date) {
    const MS = 24 * 60 * 60 * 1000;
    const da = new Date(Date.UTC(a.getUTCFullYear(), a.getUTCMonth(), a.getUTCDate()));
    const db = new Date(Date.UTC(b.getUTCFullYear(), b.getUTCMonth(), b.getUTCDate()));
    return Math.floor((da.getTime() - db.getTime()) / MS);
  }

  function addDays(base: string, days: number) {
    const d = new Date(base + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() + days);
    const y = d.getUTCFullYear();
    const m = String(d.getUTCMonth() + 1).padStart(2, '0');
    const day = String(d.getUTCDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  function clampWeek(w: number) {
    return Math.min(42, Math.max(1, Math.round(w)));
  }

  function computeWeekFromEdd(edd: string) {
    if (!isValidISODate(edd)) return currentWeek || 1;
    const today = new Date();
    const eddDate = new Date(edd + 'T00:00:00Z');
    // Weeks elapsed = 40 - weeks until EDD
    const daysUntil = diffDays(eddDate, today); // positive if EDD in future
    const weeksUntil = Math.floor(daysUntil / 7);
    const ga = 40 - weeksUntil; // may exceed bounds
    return ga;
  }

  function computeEddFromLmp(lmp: string) {
    if (!isValidISODate(lmp)) return null;
    // Naegele's rule: LMP + 280 days
    return addDays(lmp, 280);
  }

  const openWeekDetail = (week: number) => {
    const weekInfo = weekData[week];
    if (weekInfo) {
      setSelectedWeek(weekInfo);
      setShowWeekDetail(true);
    }
  };

  const getWeekRange = (trimester: number) => {
    switch (trimester) {
      case 1: return Array.from({ length: 12 }, (_, i) => i + 1);
      case 2: return Array.from({ length: 15 }, (_, i) => i + 13);
      case 3: return Array.from({ length: 13 }, (_, i) => i + 28);
      default: return [];
    }
  };

  const completedMilestones = milestones.filter(m => m.completed).length;
  const currentWeekData = weekData[currentWeek];

  // Auto-adjust currentWeek from EDD while viewing
  useEffect(() => {
    if (!isPregnant || !estimatedDueDate) return;
    const newWeek = clampWeek(computeWeekFromEdd(estimatedDueDate));
    if (newWeek !== currentWeek) {
      setCurrentWeek(newWeek);
    }
    // Lightweight periodic re-check (every 6 hours)
    const id = setInterval(() => {
      const w = clampWeek(computeWeekFromEdd(estimatedDueDate));
      if (w !== currentWeek) setCurrentWeek(w);
    }, 6 * 60 * 60 * 1000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPregnant, estimatedDueDate]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#E91E63" />
          <Text style={styles.loadingText}>Loading pregnancy data…</Text>
        </View>
      )}

      {/* Modern Header with Gradient */}
      <LinearGradient
        colors={['#FF6B9D', '#E91E63', '#C2185B']}
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
            <Text style={styles.headerTitle}>Pregnancy Journey</Text>
            <Text style={styles.headerSubtitle}>Track your amazing journey</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => setShowSettings(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.calendarIcon}>📅</Text>
          </TouchableOpacity>
        </View>

        {/* Pregnancy Progress Card - Only show if pregnant */}
        {isPregnant && (
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <View style={styles.weekDisplay}>
                <Text style={styles.weekNumber}>{currentWeek}</Text>
                <Text style={styles.weekLabel}>WEEKS</Text>
              </View>
              <View style={styles.pregnancyInfo}>
                <Text style={styles.trimesterText}>{ordinalTrimester} Trimester</Text>
                <Text style={styles.dueDate}>Due: {estimatedDueDate || currentWeekData?.dueDate || '—'}</Text>
                <Text style={styles.remainingWeeks}>{Math.max(0, 40 - currentWeek)} weeks to go</Text>
              </View>
            </View>
            
            <View style={styles.progressBars}>
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Overall Progress</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getOverallProgress(currentWeek)}%`, backgroundColor: '#4CAF50' }]} />
                  </View>
                  <Text style={styles.progressPercent}>{Math.round(getOverallProgress(currentWeek))}%</Text>
                </View>
              </View>
              
              <View style={styles.progressItem}>
                <Text style={styles.progressLabel}>Trimester Progress</Text>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${getTrimesterProgress(currentWeek)}%`, backgroundColor: '#FF9800' }]} />
                  </View>
                  <Text style={styles.progressPercent}>{Math.round(getTrimesterProgress(currentWeek))}%</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </LinearGradient>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Onboarding prompt when not pregnant */}
        {!isPregnant && (
          <View style={styles.formCard}>
            <Text style={styles.modalSectionTitle}>Are you pregnant?</Text>
            <Text style={{ color: '#555', marginBottom: 12 }}>Set your status and due date to unlock personalized tracking.</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowSettings(true)} activeOpacity={0.85}>
              <Text style={styles.primaryButtonText}>Update Pregnancy</Text>
            </TouchableOpacity>
          </View>
        )}
        {/* Current Week Highlight - Only show if pregnant */}
        {isPregnant && currentWeekData && currentWeekData.babySize && (
          <TouchableOpacity 
            style={styles.currentWeekCard}
            onPress={() => openWeekDetail(currentWeek)}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#FFE0F0', '#FFF0F8']}
              style={styles.currentWeekGradient}
            >
              <View style={styles.currentWeekHeader}>
                <Text style={styles.currentWeekTitle}>This Week: {currentWeek}</Text>
                <Text style={styles.babySizeEmoji}>{currentWeekData.babySize?.emoji || '👶'}</Text>
              </View>
              
              <View style={styles.babySizeInfo}>
                <Text style={styles.babySizeTitle}>Your Baby is the size of a</Text>
                <Text style={styles.babySizeComparison}>{currentWeekData.babySize?.comparison || 'N/A'}</Text>
                <View style={styles.babySizeDetails}>
                  <Text style={styles.babySizeDetail}>Length: {currentWeekData.babySize?.length || 'N/A'}</Text>
                  <Text style={styles.babySizeDetail}>Weight: {currentWeekData.babySize?.weight || 'N/A'}</Text>
                </View>
              </View>
              
              <Text style={styles.tapToLearn}>Tap to learn more →</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Milestones Section - Only show if pregnant */}
        {isPregnant && (
          <View style={styles.milestonesSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>🎯 Pregnancy Milestones</Text>
              <View style={styles.milestonesBadge}>
                <Text style={styles.milestonesCount}>{completedMilestones}/{milestones.length}</Text>
              </View>
            </View>
            
            <View style={styles.milestonesGrid}>
              {milestones.slice(0, 6).map((milestone, index) => (
                <TouchableOpacity 
                  key={milestone.week}
                  style={[
                    styles.milestoneCard,
                    milestone.completed && styles.milestoneCompleted,
                    milestone.week === currentWeek && styles.milestoneCurrent
                  ]}
                  activeOpacity={0.8}
                >
                  <Text style={styles.milestoneEmoji}>{milestone.emoji}</Text>
                  <Text style={[
                    styles.milestoneTitle,
                    milestone.completed && styles.milestoneCompletedText
                  ]}>{milestone.title}</Text>
                  <Text style={styles.milestoneWeek}>Week {milestone.week}</Text>
                  {milestone.completed && (
                    <View style={styles.completedBadge}>
                      <Text style={styles.completedText}>✓</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Week Timeline - Only show if pregnant */}
        {isPregnant && (
          <View style={styles.timelineSection}>
            <Text style={styles.sectionTitle}>📊 Week Timeline</Text>
            
            {/* Trimester Selector */}
            <View style={styles.trimesterSelector}>
              {[1, 2, 3].map((trimester) => (
                <TouchableOpacity
                  key={trimester}
                  style={[
                    styles.trimesterButton,
                    selectedTrimester === trimester && styles.trimesterButtonActive
                  ]}
                  onPress={() => setSelectedTrimester(trimester)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.trimesterButtonText,
                    selectedTrimester === trimester && styles.trimesterButtonTextActive
                  ]}>
                    {trimester === 1 ? '1st' : trimester === 2 ? '2nd' : '3rd'} Trimester
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Week Grid */}
            <View style={styles.weekGrid}>
              {getWeekRange(selectedTrimester).map((week) => (
                <TouchableOpacity
                  key={week}
                  style={[
                    styles.weekButton,
                    week === currentWeek && styles.weekButtonCurrent,
                    week < currentWeek && styles.weekButtonPast,
                    weekData[week] && styles.weekButtonHasData
                  ]}
                  onPress={() => weekData[week] && openWeekDetail(week)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.weekButtonText,
                    week === currentWeek && styles.weekButtonCurrentText,
                    week < currentWeek && styles.weekButtonPastText
                  ]}>
                    {week}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActionsSection}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsGrid}>
            {isPregnant ? (
              <>
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>📱</Text>
                  <Text style={styles.quickActionText}>Kick Counter</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>📔</Text>
                  <Text style={styles.quickActionText}>Pregnancy Journal</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>🍎</Text>
                  <Text style={styles.quickActionText}>Nutrition Guide</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={() => setShowSettings(true)}>
                  <Text style={styles.quickActionIcon}>🧘‍♀️</Text>
                  <Text style={styles.quickActionText}>Update Pregnancy</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>🍎</Text>
                  <Text style={styles.quickActionText}>Health Guide</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>🧘‍♀️</Text>
                  <Text style={styles.quickActionText}>Wellness</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8}>
                  <Text style={styles.quickActionIcon}>📚</Text>
                  <Text style={styles.quickActionText}>Learn About Pregnancy</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.quickActionCard} activeOpacity={0.8} onPress={() => setShowSettings(true)}>
                  <Text style={styles.quickActionIcon}>⚙️</Text>
                  <Text style={styles.quickActionText}>Update Status</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Week Detail Modal */}
      <Modal
        visible={showWeekDetail}
        animationType="slide"
        onRequestClose={() => setShowWeekDetail(false)}
        transparent={false}
      >
        {selectedWeek && selectedWeek.babySize && (
          <SafeAreaView style={styles.modalContainer}>
            <StatusBar barStyle="light-content" />
            
            {/* Modal Header */}
            <LinearGradient
              colors={['#FF6B9D', '#E91E63']}
              style={styles.modalHeader}
            >
              <TouchableOpacity 
              onPress={() => setShowWeekDetail(false)}
              style={styles.modalBackButton}
              activeOpacity={0.8}
            >
              <Text style={styles.modalBackIcon}>‹</Text>
            </TouchableOpacity>              <View style={styles.modalHeaderInfo}>
                <Text style={styles.modalHeaderIcon}>{selectedWeek.babySize?.emoji || '👶'}</Text>
                <View style={styles.modalHeaderText}>
                  <Text style={styles.modalTitle}>Week {selectedWeek.week}</Text>
                  <Text style={styles.modalSubtitle}>
                    {selectedWeek.trimester === 1 ? '1st' : selectedWeek.trimester === 2 ? '2nd' : '3rd'} Trimester
                  </Text>
                </View>
              </View>
              
              <View style={styles.modalBabySizeChip}>
                <Text style={styles.modalBabySizeText}>{selectedWeek.babySize?.comparison || 'N/A'}</Text>
              </View>
            </LinearGradient>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              {/* Baby Development */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>👶 Baby Development</Text>
                <View style={styles.babySizeCard}>
                  <View style={styles.babySizeRow}>
                    <Text style={styles.babySizeLabel}>Size:</Text>
                    <Text style={styles.babySizeValue}>{selectedWeek.babySize?.comparison || 'N/A'}</Text>
                  </View>
                  <View style={styles.babySizeRow}>
                    <Text style={styles.babySizeLabel}>Length:</Text>
                    <Text style={styles.babySizeValue}>{selectedWeek.babySize?.length || 'N/A'}</Text>
                  </View>
                  <View style={styles.babySizeRow}>
                    <Text style={styles.babySizeLabel}>Weight:</Text>
                    <Text style={styles.babySizeValue}>{selectedWeek.babySize?.weight || 'N/A'}</Text>
                  </View>
                </View>
                
                {selectedWeek.development?.map((item, index) => (
                  <View key={index} style={styles.developmentItem}>
                    <Text style={styles.developmentIcon}>✨</Text>
                    <Text style={styles.developmentText}>{item}</Text>
                  </View>
                ))}
              </View>

              {/* Mother Changes */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>🤱 What You Might Experience</Text>
                {selectedWeek.motherChanges?.map((change, index) => (
                  <View key={index} style={styles.changeItem}>
                    <Text style={styles.changeIcon}>💕</Text>
                    <Text style={styles.changeText}>{change}</Text>
                  </View>
                ))}
              </View>

              {/* Tips */}
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>💡 Tips for This Week</Text>
                {selectedWeek.tips?.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Text style={styles.tipNumber}>{index + 1}</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.modalBottomSpacing} />
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>

      {/* Pregnancy Settings Modal */}
      <Modal
        visible={showSettings}
        animationType="slide"
        onRequestClose={() => setShowSettings(false)}
        transparent={false}
      >
        <SafeAreaView style={styles.modalContainer}>
          <StatusBar barStyle="light-content" />
          <LinearGradient colors={['#FF6B9D', '#E91E63']} style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowSettings(false)} style={styles.modalBackButton} activeOpacity={0.8}>
              <Text style={styles.modalBackIcon}>‹</Text>
            </TouchableOpacity>
            <View style={styles.modalHeaderInfo}>
              <Text style={styles.modalHeaderIcon}>🤰</Text>
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle}>Pregnancy Settings</Text>
                <Text style={styles.modalSubtitle}>Update status and dates</Text>
              </View>
            </View>
          </LinearGradient>

          <ScrollView style={styles.modalContent}>
            <View style={styles.formCard}>
              <Text style={styles.formLabel}>Currently Pregnant</Text>
              <View style={styles.toggleRow}>
                <TouchableOpacity
                  style={[styles.toggleChip, isPregnant && styles.toggleChipActive]}
                  onPress={() => setIsPregnant(true)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleChipText, isPregnant && styles.toggleChipTextActive]}>Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toggleChip, !isPregnant && styles.toggleChipActive]}
                  onPress={() => setIsPregnant(false)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.toggleChipText, !isPregnant && styles.toggleChipTextActive]}>No</Text>
                </TouchableOpacity>
              </View>
            </View>

            {isPregnant && (
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>Estimated Due Date (YYYY-MM-DD)</Text>
                <TextInput
                  placeholder="e.g. 2025-12-15"
                  value={estimatedDueDate || ''}
                  onChangeText={(t) => setEstimatedDueDate(t.trim())}
                  style={styles.input}
                  placeholderTextColor="#999"
                  keyboardType="numbers-and-punctuation"
                />
                <Text style={styles.helpText}>Or provide your Last Menstrual Period (LMP) date and we'll calculate the due date.</Text>
                <Text style={styles.formLabel}>LMP Date (YYYY-MM-DD)</Text>
                <TextInput
                  placeholder="e.g. 2025-03-10"
                  value={lmpDate || ''}
                  onChangeText={(t) => setLmpDate(t.trim())}
                  style={styles.input}
                  placeholderTextColor="#999"
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => {
                    const edd = lmpDate && computeEddFromLmp(lmpDate);
                    if (edd) setEstimatedDueDate(edd);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonText}>Compute Due Date from LMP</Text>
                </TouchableOpacity>

                <View style={{ height: 8 }} />
                <Text style={styles.formLabel}>Set Current Week (optional)</Text>
                <View style={styles.weekAdjustRow}>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => setCurrentWeek(clampWeek(currentWeek - 1))}><Text style={styles.adjustBtnText}>−</Text></TouchableOpacity>
                  <Text style={styles.adjustWeekText}>{currentWeek} weeks</Text>
                  <TouchableOpacity style={styles.adjustBtn} onPress={() => setCurrentWeek(clampWeek(currentWeek + 1))}><Text style={styles.adjustBtnText}>＋</Text></TouchableOpacity>
                </View>
                <Text style={styles.helpText}>If EDD is filled, the week will auto-calculate daily.</Text>
              </View>
            )}

            <View style={{ height: 12 }} />
            <TouchableOpacity
              style={[styles.primaryButton, saving && { opacity: 0.7 }]}
              disabled={saving}
              onPress={async () => {
                try {
                  setSaving(true);
                  // Decide final payload
                  let finalEDD = estimatedDueDate;
                  if (!finalEDD && lmpDate) {
                    const edd = computeEddFromLmp(lmpDate);
                    finalEDD = edd || null;
                    if (edd) setEstimatedDueDate(edd);
                  }
                  let week = currentWeek;
                  if (isPregnant && finalEDD && isValidISODate(finalEDD)) {
                    week = clampWeek(computeWeekFromEdd(finalEDD));
                    setCurrentWeek(week);
                  }

                  // Persist to backend
                  const payload: any = {
                    currentPregnancy: {
                      isPregnant: !!isPregnant,
                      currentWeek: isPregnant ? week : undefined,
                      estimatedDueDate: isPregnant && finalEDD && isValidISODate(finalEDD) ? finalEDD : undefined,
                    }
                  };
                  await apiService.updatePatientProfile(payload);
                  if (isPregnant) {
                    try { await dashboardService.updatePregnancyWeek(week); } catch {}
                  }
                  setShowSettings(false);
                } catch (e) {
                  // noop - UI remains
                } finally {
                  setSaving(false);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>{saving ? 'Saving…' : 'Save Changes'}</Text>
            </TouchableOpacity>

            {isPregnant && (
              <TouchableOpacity
                style={styles.linkButton}
                onPress={async () => {
                  // Quick mark as not pregnant
                  try {
                    setSaving(true);
                    await apiService.updatePatientProfile({ currentPregnancy: { isPregnant: false } as any });
                    setIsPregnant(false);
                  } catch {}
                  finally { setSaving(false); }
                }}
              >
                <Text style={styles.linkButtonText}>Mark not pregnant</Text>
              </TouchableOpacity>
            )}

            <View style={styles.modalBottomSpacing} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(248,249,250,0.85)'
  },
  loadingText: {
    marginTop: 10,
    color: '#E91E63',
    fontWeight: '600'
  },

  // Header Styles
  headerGradient: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  backIcon: {
    fontSize: 26,
    color: '#ffffff',
    fontWeight: 'bold',
    textAlign: 'center',
    textAlignVertical: 'center',
    includeFontPadding: false,
    marginLeft: -2, // Slight adjustment for visual centering
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginTop: 2,
  },
  calendarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  calendarIcon: {
    fontSize: 20,
  },

  // Progress Card Styles
  progressCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    marginHorizontal: 20,
    marginTop: 15,
    borderRadius: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  weekDisplay: {
    alignItems: 'center',
    marginRight: 20,
  },
  weekNumber: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#E91E63',
    lineHeight: 40,
  },
  weekLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    letterSpacing: 1,
  },
  pregnancyInfo: {
    flex: 1,
  },
  trimesterText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dueDate: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  remainingWeeks: {
    fontSize: 14,
    color: '#E91E63',
    fontWeight: '600',
  },
  progressBars: {
    gap: 12,
  },
  progressItem: {
    marginBottom: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 6,
    fontWeight: '600',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: '#666',
    fontWeight: '600',
    minWidth: 35,
  },

  // Content Styles
  content: {
    flex: 1,
    padding: 20,
  },

  // Current Week Card
  currentWeekCard: {
    marginBottom: 24,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  currentWeekGradient: {
    padding: 20,
  },
  currentWeekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  currentWeekTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  babySizeEmoji: {
    fontSize: 32,
  },
  babySizeInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  babySizeTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  babySizeComparison: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E91E63',
    marginBottom: 8,
  },
  babySizeDetails: {
    flexDirection: 'row',
    gap: 20,
  },
  babySizeDetail: {
    fontSize: 12,
    color: '#666',
  },
  tapToLearn: {
    fontSize: 14,
    color: '#E91E63',
    textAlign: 'center',
    fontWeight: '600',
  },

  // Milestones Section
  milestonesSection: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  milestonesBadge: {
    backgroundColor: '#E91E63',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  milestonesCount: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  milestonesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  milestoneCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '30%',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    position: 'relative',
  },
  milestoneCompleted: {
    backgroundColor: '#E8F5E8',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  milestoneCurrent: {
    backgroundColor: '#FFE0F0',
    borderWidth: 2,
    borderColor: '#E91E63',
  },
  milestoneEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  milestoneTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 4,
  },
  milestoneCompletedText: {
    color: '#4CAF50',
  },
  milestoneWeek: {
    fontSize: 10,
    color: '#666',
  },
  completedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },

  // Timeline Section
  timelineSection: {
    marginBottom: 24,
  },
  trimesterSelector: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  trimesterButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  trimesterButtonActive: {
    backgroundColor: '#E91E63',
  },
  trimesterButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  trimesterButtonTextActive: {
    color: '#fff',
  },
  weekGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  weekButton: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minWidth: 48,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  weekButtonCurrent: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  weekButtonPast: {
    backgroundColor: '#f5f5f5',
    borderColor: '#ccc',
  },
  weekButtonHasData: {
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  weekButtonText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  weekButtonCurrentText: {
    color: '#fff',
  },
  weekButtonPastText: {
    color: '#999',
  },

  // Quick Actions
  quickActionsSection: {
    marginBottom: 24,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  quickActionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: '45%',
    flex: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  quickActionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  quickActionText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '600',
    textAlign: 'center',
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    paddingTop: StatusBar.currentHeight || 44,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  modalBackButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 16,
  },
  modalBackIcon: {
    fontSize: 26,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  modalBabySizeChip: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  modalBabySizeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },

  // Modal Content
  modalContent: {
    flex: 1,
    padding: 20,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  toggleChip: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    borderRadius: 20,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  toggleChipActive: {
    backgroundColor: '#E91E63',
    borderColor: '#E91E63',
  },
  toggleChipText: {
    color: '#555',
    fontWeight: '600',
  },
  toggleChipTextActive: {
    color: '#fff',
  },
  weekAdjustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  adjustBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f1f1',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  adjustBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  adjustWeekText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  primaryButton: {
    backgroundColor: '#E91E63',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  secondaryButton: {
    backgroundColor: '#FFF3F8',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFD1E3',
    marginTop: 6,
  },
  secondaryButtonText: {
    color: '#E91E63',
    fontWeight: '700',
    fontSize: 14,
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkButtonText: {
    color: '#E91E63',
    fontWeight: '600',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },

  // Baby Size Card
  babySizeCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  babySizeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  babySizeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  babySizeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: 'bold',
  },

  // Development Items
  developmentItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  developmentIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  developmentText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Change Items
  changeItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  changeIcon: {
    fontSize: 16,
    marginRight: 12,
    marginTop: 2,
  },
  changeText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Tip Items
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  tipNumber: {
    backgroundColor: '#E91E63',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    borderRadius: 12,
    width: 24,
    height: 24,
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },

  // Spacing
  bottomSpacing: {
    height: 40,
  },
  modalBottomSpacing: {
    height: 60,
  },
});
