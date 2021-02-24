export default {
  // testEnvironment: 'node',
  transform: {
    "^.+\\.(js|jsx)?$": "babel-jest"
  },
  transformIgnorePatterns: [
    'node_modules/(?!variables/.*)'
  ],
  "testPathIgnorePatterns" : [
    "./src/__tests__/setupTestingEnv.js" ,
    "./src/__tests__/setEnv.test.js" ,
  ],
  setupFiles: ["./src/__tests__/setupTestingEnv.js"]

};