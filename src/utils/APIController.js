import axios from 'axios';
import Storage from './Storage';

const BASE_URL = 'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com/';

// Create axios instance with default configuration
const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
});

// Request interceptor to add authentication token
apiClient.interceptors.request.use(
  config => {
    // Get token from storage or passed parameter
    const token = config.token || Storage.getString('authToken');
    if (token) {
      config.headers.authorization = token;
    }

    // Remove custom token property to avoid sending it in the request
    delete config.token;

    // Handle FormData content type
    if (config.data instanceof FormData) {
      config.headers['Content-Type'] = 'multipart/form-data';
    }

    // Log request in development
    if (__DEV__) {
      console.log(
        `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
        {
          headers: config.headers,
          data: config.data,
        },
      );
    }

    return config;
  },
  error => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  },
);

// Response interceptor for error handling and logging
apiClient.interceptors.response.use(
  response => {
    // Log successful responses in development
    if (__DEV__) {
      console.log(
        `✅ API Success: ${response.config.method?.toUpperCase()} ${
          response.config.url
        }`,
        {
          status: response.status,
          data: response.data,
        },
      );
    }
    return response;
  },
  error => {
    // Log errors in development
    if (__DEV__) {
      console.error(
        `❌ API Error: ${error.config?.method?.toUpperCase()} ${
          error.config?.url
        }`,
        {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
          message: error.message,
        },
      );
    }

    // Handle different error scenarios
    if (error.response) {
      // Server responded with error status
      const {status, statusText} = error.response;

      // Allow 400 and 500 errors to pass through (as per original implementation)
      if (status === 400 || status === 500) {
        return Promise.resolve(error.response);
      }

      throw new Error(statusText || `Request failed with status ${status}`);
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('Network error - no response received');
    } else {
      // Something else happened
      throw new Error(error.message || 'Request failed');
    }
  },
);

const getRequest = async (endPoint, token = false) => {
  try {
    const response = await apiClient.get(endPoint, {
      token, // Pass token as custom config property
    });
    return response.data;
  } catch (error) {
    throw error;
  }
};

const postRequest = async (endPoint, data, token = false, method = 'POST') => {
  try {
    const config = {
      token, // Pass token as custom config property
    };

    let response;
    if (method.toLowerCase() === 'put') {
      response = await apiClient.put(endPoint, data, config);
    } else if (method.toLowerCase() === 'patch') {
      response = await apiClient.patch(endPoint, data, config);
    } else if (method.toLowerCase() === 'delete') {
      response = await apiClient.delete(endPoint, config);
    } else {
      response = await apiClient.post(endPoint, data, config);
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

export {getRequest, postRequest};

// Utility functions for API client management
export const setAuthToken = token => {
  if (token) {
    Storage.setString('authToken', token);
  } else {
    Storage.removeItem('authToken');
  }
};

export const getAuthToken = () => {
  return Storage.getString('authToken');
};

export const clearAuthToken = () => {
  Storage.removeItem('authToken');
};

// Function to update base URL if needed
export const updateBaseURL = newBaseURL => {
  apiClient.defaults.baseURL = newBaseURL;
};

// Function to update request timeout
export const updateTimeout = timeout => {
  apiClient.defaults.timeout = timeout;
};

export const getStoreTimes = async (token = false) => {
  try {
    const response = await getRequest('store-times', token);
    return response;
  } catch (error) {
    throw error;
  }
};

export const getStoreOverrides = async (token = false) => {
  try {
    const response = await getRequest('store-overrides', token);
    return response;
  } catch (error) {
    throw error;
  }
};

// Mock data for development/testing
export const getMockStoreTimes = () => {
  return [
    {
      id: '1',
      day_of_week: 0, // Sunday
      is_open: false,
      start_time: null,
      end_time: null,
    },
    {
      id: '2',
      day_of_week: 1, // Monday
      is_open: true,
      start_time: '09:00',
      end_time: '21:00',
    },
    {
      id: '3',
      day_of_week: 2, // Tuesday
      is_open: true,
      start_time: '09:00',
      end_time: '21:00',
    },
    {
      id: '4',
      day_of_week: 3, // Wednesday
      is_open: true,
      start_time: '09:00',
      end_time: '21:00',
    },
    {
      id: '5',
      day_of_week: 4, // Thursday
      is_open: true,
      start_time: '09:00',
      end_time: '21:00',
    },
    {
      id: '6',
      day_of_week: 5, // Friday
      is_open: true,
      start_time: '09:00',
      end_time: '21:00',
    },
    {
      id: '7',
      day_of_week: 6, // Saturday
      is_open: true,
      start_time: '10:00',
      end_time: '18:00',
    },
  ];
};

export const getMockStoreOverrides = () => {
  return [
    {
      id: 'override_1',
      day: 25, // December 25th
      month: 12,
      is_open: false,
      start_time: null,
      end_time: null,
    },
    {
      id: 'override_2',
      day: 1, // January 1st
      month: 1,
      is_open: false,
      start_time: null,
      end_time: null,
    },
    {
      id: 'override_3',
      day: 4, // July 4th
      month: 7,
      is_open: false,
      start_time: null,
      end_time: null,
    },
    {
      id: 'override_4',
      day: 24, // December 24th - Early closure
      month: 12,
      is_open: true,
      start_time: '09:00',
      end_time: '15:00',
    },
  ];
};

// Combined function to get store times with fallback to mock data
export const getStoreTimesWithFallback = async (
  token = false,
  useMock = false,
) => {
  if (useMock) {
    return getMockStoreTimes();
  }

  try {
    return await getStoreTimes(token);
  } catch (error) {
    console.log('APIController: API failed, using mock data for store times');
    return getMockStoreTimes();
  }
};

// Combined function to get store overrides with fallback to mock data
export const getStoreOverridesWithFallback = async (
  token = false,
  useMock = false,
) => {
  if (useMock) {
    return getMockStoreOverrides();
  }

  try {
    return await getStoreOverrides(token);
  } catch (error) {
    console.log(
      'APIController: API failed, using mock data for store overrides',
    );
    return getMockStoreOverrides();
  }
};
