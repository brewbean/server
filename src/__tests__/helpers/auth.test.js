import getDuplicateError from '../../helpers/auth'

test('Check if email already exists', () => {
  let error = "Something barista_email_key";
  console.log(getDuplicateError(error));
  expect(getDuplicateError(error)).toBe();
})