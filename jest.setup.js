import '@testing-library/jest-native/extend-expect';

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    replace: jest.fn(),
    goBack: jest.fn(),
  }),
  useFocusEffect: jest.fn(),
}));

// Mock Firebase Auth
jest.mock('@react-native-firebase/auth', () => ({
  auth: () => ({
    currentUser: {
      uid: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    signOut: jest.fn().mockResolvedValue(true),
  }),
}));

// Mock Google Sign-In
jest.mock('@react-native-google-signin/google-signin', () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn().mockResolvedValue(true),
    signIn: jest.fn().mockResolvedValue({
      user: {
        id: 'test-id',
        name: 'Test User',
        email: 'test@example.com',
      },
      idToken: 'test-token',
    }),
    signOut: jest.fn().mockResolvedValue(true),
    isSignedIn: jest.fn().mockResolvedValue(false),
  },
}));

// Mock Push Notifications
jest.mock('@react-native-community/push-notification-ios', () => ({
  requestPermissions: jest.fn().mockResolvedValue(true),
  scheduleLocalNotification: jest.fn(),
  cancelAllLocalNotifications: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

// Mock MMKV Storage
jest.mock('react-native-mmkv-storage', () => ({
  MMKVLoader: function () {
    return {
      withEncryption: () => ({
        initialize: () => ({
          getString: jest.fn(),
          setString: jest.fn(),
          removeItem: jest.fn(),
        }),
      }),
    };
  },
  useMMKVStorage: jest.fn((key, storage) => {
    if (key === 'user') {
      return [
        {
          uid: 'test-user-id',
          email: 'test@example.com',
          displayName: 'Test User',
        },
        jest.fn(),
      ];
    }
    if (key === 'timezone') {
      return ['America/New_York', jest.fn()];
    }
    return [null, jest.fn()];
  }),
}));
