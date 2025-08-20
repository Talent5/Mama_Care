import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  FlatList,
  RefreshControl,
  Animated,
  Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { telemedicineService, VideoConsultation, TelemedicineStats } from '../services';

const { width, height } = Dimensions.get('window');

interface TelemedicineScreenProps {
  navigation: any;
}

const TelemedicineScreen: React.FC<TelemedicineScreenProps> = ({ navigation }) => {
  const [sessions, setSessions] = useState<VideoConsultation[]>([]);
  const [stats, setStats] = useState<TelemedicineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSession, setSelectedSession] = useState<VideoConsultation | null>(null);
  const [activeSession, setActiveSession] = useState<VideoConsultation | null>(null);
  const [isInCall, setIsInCall] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    loadData();
    checkBrowserSupport();
  }, []);

  useEffect(() => {
    if (isInCall) {
      startPulseAnimation();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isInCall]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sessionsResponse, statsResponse] = await Promise.all([
        telemedicineService.getSessions({ limit: 20 }),
        telemedicineService.getTelemedicineStats()
      ]);
      
      if (sessionsResponse.success && sessionsResponse.data) {
        setSessions(sessionsResponse.data.sessions);
      }
      
      if (statsResponse.success && statsResponse.data) {
        setStats(statsResponse.data);
      }
    } catch (error) {
      console.error('Error loading telemedicine data:', error);
      Alert.alert('Error', 'Failed to load telemedicine information');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const checkBrowserSupport = async () => {
    try {
      const isSupported = await telemedicineService.checkBrowserSupport();
      if (!isSupported) {
        Alert.alert(
          'Compatibility Warning', 
          'Your device may not support all video calling features'
        );
      }
    } catch (error) {
      console.error('Error checking browser support:', error);
    }
  };

  const startPulseAnimation = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const handleJoinSession = async (session: VideoConsultation) => {
    try {
      setConnectionStatus('connecting');
      
      // Request media permissions
      const mediaStream = await telemedicineService.requestMediaPermissions(true, true);
      if (!mediaStream) {
        Alert.alert('Permission Denied', 'Camera and microphone access is required for video calls');
        return;
      }

      const response = await telemedicineService.joinSession(session.sessionId);
      
      if (response.success && response.data) {
        setActiveSession(session);
        setIsInCall(true);
        setConnectionStatus('connected');
        
        // Animate in the video call interface
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
        
        Alert.alert('Connected', 'You have joined the video consultation');
      }
    } catch (error) {
      console.error('Error joining session:', error);
      Alert.alert('Connection Failed', 'Failed to join the video session');
      setConnectionStatus('disconnected');
    }
  };

  const handleLeaveSession = async () => {
    if (!activeSession) return;

    try {
      await telemedicineService.leaveSession(activeSession.sessionId);
      
      // Animate out the video call interface
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setActiveSession(null);
        setIsInCall(false);
        setConnectionStatus('disconnected');
        loadData();
      });
      
      Alert.alert('Disconnected', 'You have left the video consultation');
    } catch (error) {
      console.error('Error leaving session:', error);
    }
  };

  const handleEndSession = async () => {
    if (!activeSession) return;

    Alert.alert(
      'End Session',
      'Are you sure you want to end this video consultation?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Session',
          style: 'destructive',
          onPress: async () => {
            try {
              await telemedicineService.endSession(activeSession.sessionId);
              handleLeaveSession();
            } catch (error) {
              console.error('Error ending session:', error);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = (status: VideoConsultation['status']) => {
    return telemedicineService.getStatusColor(status);
  };

  const renderSessionItem = ({ item }: { item: VideoConsultation }) => (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={() => setSelectedSession(item)}
    >
      <View style={styles.sessionHeader}>
        <Text style={styles.sessionDate}>
          {new Date(item.scheduledTime).toLocaleDateString()}
        </Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{telemedicineService.getStatusText(item.status)}</Text>
        </View>
      </View>
      
      <Text style={styles.sessionTime}>
        {new Date(item.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </Text>
      
      <Text style={styles.participantName}>
        {typeof item.participants.patient.userId === 'object' ? 
          `${item.participants.patient.userId.firstName} ${item.participants.patient.userId.lastName}` : 
          'Patient'
        }
      </Text>
      
      {item.duration && (
        <Text style={styles.duration}>
          Duration: {telemedicineService.formatDuration(item.duration)}
        </Text>
      )}

      <View style={styles.sessionActions}>
        {item.status === 'scheduled' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#10B981' }]}
            onPress={() => handleJoinSession(item)}
          >
            <Ionicons name="videocam" size={16} color="white" />
            <Text style={styles.actionButtonText}>Join</Text>
          </TouchableOpacity>
        )}
        
        {item.status === 'active' && (
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: '#3B82F6' }]}
            onPress={() => handleJoinSession(item)}
          >
            <Ionicons name="enter" size={16} color="white" />
            <Text style={styles.actionButtonText}>Rejoin</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );

  const StatsCard = ({ title, value, color, icon }: {
    title: string;
    value: string | number;
    color: string;
    icon: string;
  }) => (
    <View style={[styles.statsCard, { borderLeftColor: color }]}>
      <View style={styles.statsContent}>
        <Ionicons name={icon as any} size={24} color={color} />
        <View style={styles.statsText}>
          <Text style={styles.statsValue}>{value}</Text>
          <Text style={styles.statsTitle}>{title}</Text>
        </View>
      </View>
    </View>
  );

  const VideoCallInterface = () => (
    <Animated.View style={[styles.videoCallOverlay, { opacity: fadeAnim }]}>
      <View style={styles.videoCallContainer}>
        {/* Simulated video areas */}
        <View style={styles.remoteVideo}>
          <Text style={styles.videoLabel}>Patient Video</Text>
          <Ionicons name="person" size={80} color="white" />
        </View>
        
        <View style={styles.localVideo}>
          <Text style={styles.localVideoLabel}>You</Text>
          <Ionicons name="person" size={40} color="white" />
        </View>
        
        {/* Call controls */}
        <View style={styles.callControls}>
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="mic" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="videocam" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <Ionicons name="chatbubble" size={30} color="white" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={() => {
              // Toggle screen sharing simulation
              Alert.alert('Screen Share', 'Screen sharing toggled');
            }}
          >
            <Ionicons name="desktop" size={30} color="white" />
          </TouchableOpacity>
        </View>
        
        {/* End call controls */}
        <View style={styles.endCallControls}>
          <TouchableOpacity 
            style={[styles.endCallButton, { backgroundColor: '#6B7280' }]}
            onPress={handleLeaveSession}
          >
            <Ionicons name="exit" size={24} color="white" />
            <Text style={styles.endCallText}>Leave</Text>
          </TouchableOpacity>
          
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={[styles.endCallButton, { backgroundColor: '#EF4444' }]}
              onPress={handleEndSession}
            >
              <Ionicons name="call" size={24} color="white" />
              <Text style={styles.endCallText}>End</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Connection status */}
        <View style={styles.connectionStatus}>
          <View style={[styles.connectionDot, { 
            backgroundColor: connectionStatus === 'connected' ? '#10B981' : 
                            connectionStatus === 'connecting' ? '#F59E0B' : '#EF4444'
          }]} />
          <Text style={styles.connectionText}>
            {connectionStatus === 'connected' ? 'Connected' : 
             connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Telemedicine</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateSession')}
        >
          <Ionicons name="videocam" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        renderItem={renderSessionItem}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadData} />
        }
        ListHeaderComponent={() => (
          <>
            {/* Stats Section */}
            {stats && (
              <View style={styles.statsSection}>
                <Text style={styles.sectionTitle}>Session Overview</Text>
                <View style={styles.statsGrid}>
                  <StatsCard
                    title="Total Sessions"
                    value={stats.totalSessions}
                    color="#3B82F6"
                    icon="videocam"
                  />
                  <StatsCard
                    title="Active Now"
                    value={stats.activeSessions}
                    color="#10B981"
                    icon="radio-button-on"
                  />
                  <StatsCard
                    title="Completed"
                    value={stats.completedSessions}
                    color="#6B7280"
                    icon="checkmark-circle"
                  />
                  <StatsCard
                    title="Avg Duration"
                    value={`${Math.round(stats.averageDuration)}m`}
                    color="#F59E0B"
                    icon="time"
                  />
                </View>
              </View>
            )}

            {/* Sessions List Header */}
            <View style={styles.sessionsHeader}>
              <Text style={styles.sectionTitle}>Video Sessions</Text>
            </View>
          </>
        )}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      {/* Video Call Interface */}
      {isInCall && <VideoCallInterface />}

      {/* Session Detail Modal */}
      <Modal
        visible={!!selectedSession}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Session Details</Text>
            <TouchableOpacity onPress={() => setSelectedSession(null)}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {selectedSession && (
            <View style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Session ID</Text>
                <Text style={styles.detailValue}>{selectedSession.sessionId}</Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Scheduled Time</Text>
                <Text style={styles.detailValue}>
                  {new Date(selectedSession.scheduledTime).toLocaleString()}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Status</Text>
                <Text style={[styles.detailValue, { color: getStatusColor(selectedSession.status) }]}>
                  {telemedicineService.getStatusText(selectedSession.status)}
                </Text>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Patient</Text>
                <Text style={styles.detailValue}>
                  {typeof selectedSession.participants.patient.userId === 'object' ? 
                    `${selectedSession.participants.patient.userId.firstName} ${selectedSession.participants.patient.userId.lastName}` : 
                    'Patient'
                  }
                </Text>
              </View>

              {selectedSession.status === 'scheduled' && (
                <TouchableOpacity
                  style={styles.joinButton}
                  onPress={() => {
                    setSelectedSession(null);
                    handleJoinSession(selectedSession);
                  }}
                >
                  <Ionicons name="videocam" size={24} color="white" />
                  <Text style={styles.joinButtonText}>Join Session</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333'
  },
  addButton: {
    backgroundColor: '#4ea674',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center'
  },
  listContainer: {
    padding: 20
  },
  statsSection: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  statsCard: {
    backgroundColor: '#f8f9fa',
    padding: 15,
    borderRadius: 10,
    width: '48%',
    marginBottom: 10,
    borderLeftWidth: 4
  },
  statsContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  statsText: {
    marginLeft: 10
  },
  statsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333'
  },
  statsTitle: {
    fontSize: 12,
    color: '#666'
  },
  sessionsHeader: {
    marginBottom: 10
  },
  sessionCard: {
    backgroundColor: 'white',
    padding: 20,
    marginBottom: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  sessionDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333'
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600'
  },
  sessionTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4ea674',
    marginBottom: 5
  },
  participantName: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5
  },
  duration: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15
  },
  sessionActions: {
    flexDirection: 'row',
    gap: 10
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 5
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600'
  },
  videoCallOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.9)',
    zIndex: 1000
  },
  videoCallContainer: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50
  },
  videoLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10
  },
  localVideo: {
    position: 'absolute',
    top: 80,
    right: 30,
    width: 120,
    height: 160,
    backgroundColor: '#555',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white'
  },
  localVideoLabel: {
    color: 'white',
    fontSize: 12,
    marginBottom: 5
  },
  callControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginVertical: 30
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center'
  },
  endCallControls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 30,
    marginBottom: 30
  },
  endCallButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10
  },
  endCallText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20
  },
  connectionDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8
  },
  connectionText: {
    color: 'white',
    fontSize: 14
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  modalContent: {
    flex: 1,
    padding: 20
  },
  detailSection: {
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 5
  },
  detailValue: {
    fontSize: 16,
    color: '#333'
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4ea674',
    padding: 15,
    borderRadius: 10,
    gap: 10,
    marginTop: 20
  },
  joinButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600'
  }
});

export default TelemedicineScreen;
