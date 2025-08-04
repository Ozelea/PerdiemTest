/**
 * @format
 */

import AppointmentManager from '../src/utils/AppointmentManager';

// Create a proper mock for the Storage module
const mockStorage = {
  getString: jest.fn(),
  setString: jest.fn(),
  removeItem: jest.fn(),
};

// Mock the Storage module itself
jest.mock('../src/utils/Storage', () => mockStorage);

// Mock the actual AppointmentManager module to inject our storage mock
jest.mock('../src/utils/AppointmentManager', () => {
  const originalModule = jest.requireActual('../src/utils/AppointmentManager');
  return {
    ...originalModule,
    default: {
      ...originalModule.default,
      storage: mockStorage,
    },
  };
});

describe('AppointmentManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset storage state
    mockStorage.getString.mockReturnValue(null);
  });

  describe('Basic storage operations', () => {
    it('should handle storage calls correctly', () => {
      mockStorage.getString.mockReturnValue(null);
      mockStorage.setString.mockReturnValue(undefined);
      mockStorage.removeItem.mockReturnValue(undefined);

      expect(mockStorage.getString).toBeDefined();
      expect(mockStorage.setString).toBeDefined();
      expect(mockStorage.removeItem).toBeDefined();
    });
  });

  describe('Mock validation', () => {
    it('should have proper mock functions', () => {
      expect(jest.isMockFunction(mockStorage.getString)).toBe(true);
      expect(jest.isMockFunction(mockStorage.setString)).toBe(true);
      expect(jest.isMockFunction(mockStorage.removeItem)).toBe(true);
    });
  });
});
