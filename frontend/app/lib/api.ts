const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UserCheckResponse {
  exists: boolean;
  onboarding_completed: boolean;
  user_id?: number;
}

export interface UserCreateRequest {
  email: string;
  preferred_topics?: string[];
  locations?: string[];
  political_leaning?: string;
  additional_info?: string;
  preferred_writing_style?: string[];
}

export interface UserUpdateRequest {
  preferred_topics?: string[];
  locations?: string[];
  political_leaning?: string;
  additional_info?: string;
  preferred_writing_style?: string[];
}

export const api = {
  async checkUser(email: string): Promise<UserCheckResponse> {
    const response = await fetch(`${API_BASE_URL}/users/check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    });

    if (!response.ok) {
      throw new Error(`Failed to check user: ${response.statusText}`);
    }

    return response.json();
  },

  async createUser(userData: UserCreateRequest): Promise<{ message: string; user_id: number }> {
    const response = await fetch(`${API_BASE_URL}/users/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Failed to create user: ${response.statusText}`);
    }

    return response.json();
  },

  async updateUser(userId: number, userData: UserUpdateRequest): Promise<{ message: string }> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `Failed to update user: ${response.statusText}`);
    }

    return response.json();
  },
}; 