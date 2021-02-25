import getDuplicateError, { validateCredentials } from "../../helpers/auth";
import bcrypt from "bcrypt";
import axios from "axios";

jest.mock("axios");
// test('Check if email already exists', () => {
//   let error = "Something barista_email_key";
//   console.log(getDuplicateError(error));
//   expect(getDuplicateError(error)).toBe();
// })

test("Validate Credentials returns correct valid and barista values", async () => {
  const email = "jest-test@test.com";
  const password = "TestPassword123!";
  const encryptedPassword = await bcrypt.hash(password, 10)
  const valid = await bcrypt.compare(password, encryptedPassword);
  const expected = {
    valid: valid,
    barista: {
      id: 2,
      email: "jest-test@test.com",
      password: encryptedPassword,
    },
  };
  axios.post.mockResolvedValue({
    data: {
      data: {
        barista: [
          {
            id: 2,
            email: "jest-test@test.com",
            password: encryptedPassword
          }
        ]
      }
    },
  });
  const data = await validateCredentials(email, password);
  expect(data).toEqual(expected);
});
