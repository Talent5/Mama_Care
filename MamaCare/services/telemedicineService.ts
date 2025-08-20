import { apiClient, ApiResponse } from '../config/api';

export interface VideoConsultation {
  _id: string;
  appointment: string | any;
  sessionId: string;
  roomName: string;
  platform: 'webrtc' | 'zoom' | 'agora' | 'twilio';
  status: 'scheduled' | 'waiting' | 'active' | 'completed' | 'cancelled' | 'failed';
  scheduledTime: string;
  startTime?: string;
  endTime?: string;
  duration?: number; // in minutes
  participants: {
    patient: {
      userId: string | any;
      joinedAt?: string;
      leftAt?: string;
      connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    };
    provider: {
      userId: string | any;
      joinedAt?: string;
      leftAt?: string;
      connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    };
  };
  settings: {
    videoEnabled: boolean;
    audioEnabled: boolean;
    screenSharingEnabled: boolean;
    chatEnabled: boolean;
    recordingEnabled: boolean;
    maxDuration: number;
  };
  recording?: {
    enabled: boolean;
    consentGiven: boolean;
    recordingId?: string;
    url?: string;
    startTime?: string;
    endTime?: string;
    size?: number;
    duration?: number;
  };
  chatHistory: Array<{
    senderId: string | any;
    senderRole: 'patient' | 'provider';
    message: string;
    timestamp: string;
    messageType: 'text' | 'file' | 'image' | 'system';
    attachments?: Array<{
      filename: string;
      originalName: string;
      url: string;
      size: number;
      type: string;
    }>;
  }>;
  technicalDetails?: {
    bandwidth?: {
      patient?: { upload: number; download: number };
      provider?: { upload: number; download: number };
    };
    quality?: {
      video: 'low' | 'medium' | 'high' | 'hd';
      audio: 'low' | 'medium' | 'high';
    };
    connectionIssues?: Array<{
      timestamp: string;
      userId: string;
      issue: string;
      resolved: boolean;
    }>;
  };
  feedback?: {
    patient?: {
      rating: number;
      comments?: string;
      technicalRating: number;
      submittedAt: string;
    };
    provider?: {
      rating: number;
      comments?: string;
      technicalRating: number;
      submittedAt: string;
    };
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSessionData {
  appointmentId: string;
  settings?: {
    videoEnabled?: boolean;
    audioEnabled?: boolean;
    screenSharingEnabled?: boolean;
    chatEnabled?: boolean;
    recordingEnabled?: boolean;
    maxDuration?: number;
  };
}

export interface JoinSessionResponse {
  token: string;
  roomName: string;
  sessionId: string;
  settings: VideoConsultation['settings'];
  participants: VideoConsultation['participants'];
}

export interface ChatMessage {
  message: string;
  messageType?: 'text' | 'file' | 'image' | 'system';
  attachments?: Array<{
    filename: string;
    originalName: string;
    url: string;
    size: number;
    type: string;
  }>;
}

export interface SessionFeedback {
  rating: number;
  comments?: string;
  technicalRating?: number;
}

export interface TelemedicineFilters {
  page?: number;
  limit?: number;
  status?: VideoConsultation['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface PaginatedSessions {
  sessions: VideoConsultation[];
  pagination: {
    current: number;
    pages: number;
    total: number;
    limit: number;
  };
}

export interface TelemedicineStats {
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  averageDuration: number;
  sessionsToday: number;
  feedback: {
    avgPatientRating: number;
    avgProviderRating: number;
    avgTechnicalRating: number;
    totalFeedbacks: number;
  };
}

class TelemedicineService {
  async createSession(sessionData: CreateSessionData): Promise<ApiResponse<VideoConsultation>> {
    try {
      return await apiClient.post<VideoConsultation>('/telemedicine/create-session', sessionData);
    } catch (error) {
      console.error('Failed to create video session:', error);
      throw error;
    }
  }

  async joinSession(sessionId: string): Promise<ApiResponse<JoinSessionResponse>> {
    try {
      return await apiClient.post<JoinSessionResponse>(`/telemedicine/join/${sessionId}`);
    } catch (error) {
      console.error('Failed to join session:', error);
      throw error;
    }
  }

  async leaveSession(sessionId: string): Promise<ApiResponse<VideoConsultation>> {
    try {
      return await apiClient.post<VideoConsultation>(`/telemedicine/leave/${sessionId}`);
    } catch (error) {
      console.error('Failed to leave session:', error);
      throw error;
    }
  }

  async endSession(sessionId: string, notes?: string): Promise<ApiResponse<VideoConsultation>> {
    try {
      return await apiClient.post<VideoConsultation>(`/telemedicine/end/${sessionId}`, { notes });
    } catch (error) {
      console.error('Failed to end session:', error);
      throw error;
    }
  }

  async sendChatMessage(sessionId: string, messageData: ChatMessage): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/telemedicine/${sessionId}/chat`, messageData);
    } catch (error) {
      console.error('Failed to send chat message:', error);
      throw error;
    }
  }

  async getSessionDetails(sessionId: string): Promise<ApiResponse<VideoConsultation>> {
    try {
      return await apiClient.get<VideoConsultation>(`/telemedicine/${sessionId}`);
    } catch (error) {
      console.error('Failed to fetch session details:', error);
      throw error;
    }
  }

  async getSessions(filters?: TelemedicineFilters): Promise<ApiResponse<PaginatedSessions>> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            queryParams.append(key, value.toString());
          }
        });
      }
      
      const endpoint = `/telemedicine${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      return await apiClient.get<PaginatedSessions>(endpoint);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      throw error;
    }
  }

  async submitFeedback(sessionId: string, feedback: SessionFeedback): Promise<ApiResponse<any>> {
    try {
      return await apiClient.post(`/telemedicine/${sessionId}/feedback`, feedback);
    } catch (error) {
      console.error('Failed to submit feedback:', error);
      throw error;
    }
  }

  async getTelemedicineStats(period?: string): Promise<ApiResponse<TelemedicineStats>> {
    try {
      const queryParams = period ? `?period=${period}` : '';
      return await apiClient.get<TelemedicineStats>(`/telemedicine/stats/dashboard${queryParams}`);
    } catch (error) {
      console.error('Failed to fetch telemedicine statistics:', error);
      throw error;
    }
  }

  // WebRTC Helper Methods
  async checkBrowserSupport(): Promise<boolean> {
    try {
      const hasWebRTC = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
      const hasRTCPeerConnection = !!(window.RTCPeerConnection || window.webkitRTCPeerConnection);
      return hasWebRTC && hasRTCPeerConnection;
    } catch (error) {
      console.error('Error checking WebRTC support:', error);
      return false;
    }
  }

  async requestMediaPermissions(video: boolean = true, audio: boolean = true): Promise<MediaStream | null> {
    try {
      const constraints = { video, audio };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      return stream;
    } catch (error) {
      console.error('Error requesting media permissions:', error);
      throw new Error('Camera/microphone permissions denied or not available');
    }
  }

  async testNetworkConnection(): Promise<{
    connected: boolean;
    speed?: string;
    latency?: number;
  }> {
    try {
      const start = Date.now();
      const response = await fetch('/api/health');
      const latency = Date.now() - start;
      
      return {
        connected: response.ok,
        latency,
        speed: latency < 100 ? 'excellent' : latency < 300 ? 'good' : 'poor'
      };
    } catch (error) {
      return { connected: false };
    }
  }

  // Session status helpers
  getStatusColor(status: VideoConsultation['status']): string {
    const colors = {
      scheduled: '#3B82F6',
      waiting: '#F59E0B',
      active: '#10B981',
      completed: '#6B7280',
      cancelled: '#EF4444',
      failed: '#EF4444'
    };
    return colors[status] || '#6B7280';
  }

  getStatusText(status: VideoConsultation['status']): string {
    const texts = {
      scheduled: 'Scheduled',
      waiting: 'Waiting to Join',
      active: 'In Progress',
      completed: 'Completed',
      cancelled: 'Cancelled',
      failed: 'Failed'
    };
    return texts[status] || 'Unknown';
  }

  // Time formatting helpers
  formatDuration(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  }

  formatSessionTime(startTime: string, endTime?: string): string {
    const start = new Date(startTime);
    const startStr = start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (endTime) {
      const end = new Date(endTime);
      const endStr = end.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `${startStr} - ${endStr}`;
    }
    
    return `Started at ${startStr}`;
  }

  // Chat helpers
  formatChatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Integration with appointment service
  async convertAppointmentToTelemedicine(appointmentId: string, settings?: CreateSessionData['settings']): Promise<ApiResponse<VideoConsultation>> {
    try {
      return await this.createSession({
        appointmentId,
        settings
      });
    } catch (error) {
      console.error('Failed to convert appointment to telemedicine:', error);
      throw error;
    }
  }
}

export default new TelemedicineService();
