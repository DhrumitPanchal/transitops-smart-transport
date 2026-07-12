module.exports = {
  testEnvironment: 'node',
  watchman: false,
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transform: {
    '^.+\\.[jt]sx?$': ['babel-jest', { caller: { name: 'metro', bundler: 'metro' } }],
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|@react-native-async-storage/async-storage)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|expo-secure-store|react-navigation|@react-navigation/.*|@sentry/react-native|native-base|react-native-svg|lucide-react-native|zod)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-native$': '<rootDir>/__mocks__/reactNative.js',
    '^expo-secure-store$': '<rootDir>/__mocks__/expoSecureStore.js',
    '^@react-native-async-storage/async-storage$':
      '<rootDir>/__mocks__/asyncStorage.js',
  },
  testMatch: ['**/__tests__/**/*.test.js'],
  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/**/*.test.{js,jsx}',
    '!**/node_modules/**',
  ],
}
