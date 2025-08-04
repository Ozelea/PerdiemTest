module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|react-native-linear-gradient|@react-native-community|@react-native-firebase|@react-native-google-signin)/)',
  ],
  moduleNameMapper: {
    '^react-native-linear-gradient$':
      '<rootDir>/__mocks__/react-native-linear-gradient.js',
  },
};
