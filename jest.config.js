export default {
  // testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx)?$": "babel-jest"
  },
  transformIgnorePatterns: [
    'node_modules/(?!variables/.*)'
  ],
  setupFiles: ["./src/.jest/testEnv.js"],
  testPathIgnorePatterns :[
    "./src/__tests__/helpers"
  ]
};