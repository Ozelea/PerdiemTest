import Storage from './Storage';

const BASE_URL = 'https://coding-challenge-pd-1a25b1a14f34.herokuapp.com/';

const getRequest = async (endPoint, token = false) => {
  try {
    const headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    };

    if (token) {
      headers.authorization = token;
    }

    const response = await fetch(BASE_URL + endPoint, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      throw new Error(response.statusText || 'Request failed');
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

const postRequest = async (endPoint, data, token = false, method = 'POST') => {
  try {
    const headers = {
      Accept: 'application/json',
      'Content-Type':
        data instanceof FormData ? 'multipart/form-data' : 'application/json',
    };

    if (token) {
      headers.authorization = token;
    }

    const response = await fetch(BASE_URL + endPoint, {
      method,
      headers,
      body: data instanceof FormData ? data : JSON.stringify(data),
    });

    if (!response.ok && response.status !== 500 && response.status !== 400) {
      throw new Error(response.statusText || 'Request failed');
    }

    return response.json();
  } catch (error) {
    throw error;
  }
};

export {getRequest, postRequest};

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
    console.log(TAG, 'API failed, using mock data for store times');
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
    console.log(TAG, 'API failed, using mock data for store overrides');
    return getMockStoreOverrides();
  }
};
