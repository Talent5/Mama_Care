import api, { patientsAPI, usersAPI } from './api';

type SearchEntityType = 'patient' | 'user' | 'appointment';

type SearchResult = {
  id: string;
  type: SearchEntityType;
  title: string;
  subtitle: string;
  avatar?: string;
  metadata?: Record<string, unknown>;
};

type SearchResponse = {
  patients: SearchResult[];
  users: SearchResult[];
  appointments: SearchResult[];
  total: number;
};

function mapPatients(patients: any[]): SearchResult[] {
  if (!Array.isArray(patients)) return [];
  return patients.map((p: any) => {
    const fullName = p?.user
      ? [p.user.firstName, p.user.lastName].filter(Boolean).join(' ').trim()
      : [p.firstName, p.lastName].filter(Boolean).join(' ').trim();

    const email = p?.user?.email || p?.email;
    const phone = p?.user?.phone || p?.phone;

    return {
      id: p._id || p.id,
      type: 'patient',
      title: fullName || 'Unknown Patient',
      subtitle: email || phone || 'Patient',
      metadata: {
        riskLevel: p?.currentPregnancy?.riskLevel,
        isPregnant: Boolean(p?.currentPregnancy?.isPregnant),
      },
    } as SearchResult;
  });
}

function mapUsers(users: any[]): SearchResult[] {
  if (!Array.isArray(users)) return [];
  return users.map((u: any) => {
    const fullName = u.name || [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || 'User';
    return {
      id: u._id || u.id,
      type: 'user',
      title: fullName,
      subtitle: u.email || u.phone || 'User',
      metadata: {
        role: u.role,
        isActive: u.isActive,
      },
    } as SearchResult;
  });
}

function mapAppointments(appointments: any[]): SearchResult[] {
  if (!Array.isArray(appointments)) return [];
  return appointments.map((a: any) => {
    const patientName = a?.patient?.user
      ? [a.patient.user.firstName, a.patient.user.lastName].filter(Boolean).join(' ').trim()
      : a?.patient
      ? [a.patient.firstName, a.patient.lastName].filter(Boolean).join(' ').trim()
      : 'Patient';
    const providerName = a?.healthcareProvider
      ? [a.healthcareProvider.firstName, a.healthcareProvider.lastName].filter(Boolean).join(' ').trim()
      : '';
    return {
      id: a._id || a.id,
      type: 'appointment',
      title: `${patientName || 'Patient'} • ${new Date(a.appointmentDate || a.date || Date.now()).toLocaleDateString()}`,
      subtitle: providerName || a.reason || 'Appointment',
      metadata: {
        status: a.status,
        type: a.type,
      },
    } as SearchResult;
  });
}

let debounceTimer: number | undefined;
let lastRequestId = 0;

async function performSearch(query: string): Promise<SearchResponse> {
  const q = query.trim();
  if (!q) {
    return { patients: [], users: [], appointments: [], total: 0 };
  }

  const limit = 5;

  const [patientsRes, usersRes, appointmentsRes] = await Promise.all([
    patientsAPI
      .getPatients({ search: q, page: 1, limit })
      .then((r: any) => r?.data?.patients ?? [])
      .catch(() => []),
    usersAPI
      .getUsers({ search: q, page: 1, limit })
      .then((r: any) => r?.data?.users ?? [])
      .catch(() => []),
    // Appointments API filters type doesn't include `search`, so query directly
    api
      .get(`/appointments`, { params: { search: q, page: 1, limit } })
      .then((r: any) => r?.data?.data?.appointments ?? [])
      .catch(() => []),
  ]);

  const patients = mapPatients(patientsRes as any[]);
  const users = mapUsers(usersRes as any[]);
  const appointments = mapAppointments(appointmentsRes as any[]);

  return {
    patients,
    users,
    appointments,
    total: patients.length + users.length + appointments.length,
  };
}

export const searchService = {
  async search(query: string): Promise<SearchResponse> {
    return performSearch(query);
  },

  debouncedSearch(query: string, onResults: (results: SearchResponse) => void, delayMs = 300) {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }
    const requestId = ++lastRequestId;
    debounceTimer = (setTimeout(async () => {
      try {
        const results = await performSearch(query);
        if (requestId === lastRequestId) {
          onResults(results);
        }
      } catch {
        if (requestId === lastRequestId) {
          onResults({ patients: [], users: [], appointments: [], total: 0 });
        }
      }
    }, delayMs) as unknown) as number;
  },
};

export type { SearchResult, SearchResponse };


