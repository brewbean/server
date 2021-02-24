import getDuplicateError, { validateCredentials } from '../../helpers/auth'

// test('Check if email already exists', () => {
//   let error = "Something barista_email_key";
//   console.log(getDuplicateError(error));
//   expect(getDuplicateError(error)).toBe();
// })

test('Validate Credentials to Strict Equal', async () => {
  let email = 'jest-test@test.com'

  const data = await validateCredentials(email, password);
  expect(data).toStrictEqual(expected)
})
