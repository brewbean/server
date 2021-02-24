import getDuplicateError, { validateCredentials } from '../../helpers/auth'

// test('Check if email already exists', () => {
//   let error = "Something barista_email_key";
//   console.log(getDuplicateError(error));
//   expect(getDuplicateError(error)).toBe();
// })

test('Validate Credentials to Strict Equal', async () => {
  let email = 'jest-test@test.com'
  let password = '''TestPassword123!'''
  let expected = {
    valid: true,
    barista: {
      id: 87,
      email: "jest-test@test.com",
      is_verified: false,
      password: ""
    }
  }
  const data = await validateCredentials(email, password);
  expect(data).toStrictEqual(expected)
})
