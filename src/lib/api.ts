const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

interface ApiResponse<T = unknown> {
  data?: T;
  error?: string;
}

async function fetchApi<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Something went wrong' };
    }

    return { data };
  } catch (error) {
    console.error('API Error:', error);
    return { error: 'Network error. Please try again.' };
  }
}

// Auth API
export const authApi = {
  sendOtp: (phone: string) =>
    fetchApi<{ message: string; isNewUser: boolean }>('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  login: (phone: string, otp: string) =>
    fetchApi<{
      message: string;
      token: string;
      user: {
        id: string;
        phone: string;
        name: string;
        email: string;
        role: 'PHOTOGRAPHER' | 'USER';
        avatar: string | null;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ phone, otp }),
    }),

  photographerSignup: (data: { phone: string; otp: string; name: string; email?: string }) =>
    fetchApi<{
      message: string;
      token: string;
      user: {
        id: string;
        phone: string;
        name: string;
        email: string;
        role: 'PHOTOGRAPHER';
        avatar: string | null;
      };
    }>('/auth/photographer/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  userSignup: (data: { phone: string; otp: string; name: string; email?: string }) =>
    fetchApi<{
      message: string;
      token: string;
      user: {
        id: string;
        phone: string;
        name: string;
        email: string;
        role: 'USER';
        avatar: string | null;
      };
    }>('/auth/user/signup', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getMe: () =>
    fetchApi<{
      user: {
        id: string;
        phone: string;
        name: string;
        email: string;
        role: 'PHOTOGRAPHER' | 'USER';
        avatar: string | null;
        createdAt: string;
      };
    }>('/auth/me'),
};

// Event types
export interface Event {
  id: string;
  code: string;
  name: string;
  description: string | null;
  location: string | null;
  coverImage: string | null;
  eventDate: string | null;
  isActive: boolean;
  createdAt: string;
  participantCount: number;
  imageCount: number;
}

export interface CreateEventData {
  name: string;
  description?: string;
  location?: string;
  eventDate?: string;
  coverImage?: string;
}

export interface UpdateEventData {
  name?: string;
  description?: string;
  location?: string;
  eventDate?: string;
  coverImage?: string;
  isActive?: boolean;
}

// Events API
export const eventsApi = {
  create: (data: CreateEventData) =>
    fetchApi<{ message: string; event: Event }>('/events', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  getAll: (params?: { page?: number; limit?: number; isActive?: boolean }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive.toString());
    const query = searchParams.toString();
    return fetchApi<{
      events: Event[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/events${query ? `?${query}` : ''}`);
  },

  getById: (id: string) =>
    fetchApi<{ event: Event }>(`/events/${id}`),

  getByCode: (code: string) =>
  fetchApi<{ event: Event }>(`/events/code/${code}`),

  update: (id: string, data: UpdateEventData) =>
    fetchApi<{ message: string; event: Event }>(`/events/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/events/${id}`, {
      method: 'DELETE',
    }),

  getStats: (id: string) =>
    fetchApi<{ stats: { participantCount: number; imageCount: number; faceCount: number } }>(
      `/events/${id}/stats`
    ),

  join: (code: string) =>
    fetchApi<{ message: string; event: Event }>('/events/join', {
      method: 'POST',
      body: JSON.stringify({ code }),
    }),

  getMyJoinedEvents: () =>
    fetchApi<{ events: Event[] }>('/events/my'),

  getJoinedEventImages: (eventId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<{
      images: Image[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/events/${eventId}/images${query ? `?${query}` : ''}`);
  },
};

// Image types
export interface Image {
  id: string;
  url: string;
  thumbnail: string | null;
  width: number | null;
  height: number | null;
  size: number | null;
  faceCount: number;
  createdAt: string;
}

export interface PresignedUpload {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  originalFilename: string;
}

// Images API
export const imagesApi = {
  getPresignedUrls: (eventId: string, files: Array<{ filename: string; contentType: string }>) =>
    fetchApi<{ message: string; uploads: PresignedUpload[] }>('/images/presign', {
      method: 'POST',
      body: JSON.stringify({ eventId, files }),
    }),

  confirmUploads: (
    eventId: string,
    images: Array<{ url: string; key: string; width?: number; height?: number; size?: number }>
  ) =>
    fetchApi<{ message: string; images: Image[] }>('/images/confirm', {
      method: 'POST',
      body: JSON.stringify({ eventId, images }),
    }),

  getEventImages: (eventId: string, params?: { page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    const query = searchParams.toString();
    return fetchApi<{
      images: Image[];
      pagination: { page: number; limit: number; total: number; totalPages: number };
    }>(`/images/event/${eventId}${query ? `?${query}` : ''}`);
  },

  delete: (id: string) =>
    fetchApi<{ message: string }>(`/images/${id}`, {
      method: 'DELETE',
    }),

  bulkDelete: (imageIds: string[]) =>
    fetchApi<{ message: string; deletedCount: number }>('/images/bulk-delete', {
      method: 'POST',
      body: JSON.stringify({ imageIds }),
    }),
};

// Upload helper - uploads a single file to the presigned URL
export async function uploadFileToPresignedUrl(
  file: File,
  uploadUrl: string,
  onProgress?: (progress: number) => void
): Promise<boolean> {
  return new Promise((resolve) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100);
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      resolve(xhr.status >= 200 && xhr.status < 300);
    });

    xhr.addEventListener('error', () => {
      resolve(false);
    });

    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type);
    xhr.send(file);
  });
}

// Get image dimensions
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      resolve({ width: img.width, height: img.height });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}
