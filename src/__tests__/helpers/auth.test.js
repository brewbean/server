import getDuplicateError, { validateCredentials } from "../../helpers/auth";
import bcrypt from "bcrypt";
import axios from "axios";
import boom from "@hapi/boom";
jest.mock("axios");
// test('Check if email already exists', () => {
//   let error = "Something barista_email_key";
//   console.log(getDuplicateError(error));
//   expect(getDuplicateError(error)).toBe();
// })
describe("[Validate Credentials Tests]", () => {
  const email = "jest-test@test.com";
  const password = "TestPassword123!";

  test("Returns valid if barista email and password match", async () => {
    const encryptedPassword = await bcrypt.hash(password, 10);
    const expected = {
      valid: true,
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
              password: encryptedPassword,
            },
          ],
        },
      },
    });
    const data = await validateCredentials(email, password);
    expect(data).toEqual(expected);
  });

  test("Returns invalid username or password error if no barista found", async () => {
    const expected = {
      valid: false,
      error: boom.unauthorized("Invalid 'username' or 'password'")
    };
    axios.post.mockResolvedValue({
      data: {
        data: {
          barista: [
          ],
        },
      },
    });
    const data = await validateCredentials(email, password);
    expect(data).toEqual(expected);
  });

  test("Returns invalid username or password error if barista found but different password", async () => {
    const expected = {
      valid: false,
      error: boom.unauthorized("Invalid 'username' or 'password'")
    };
    axios.post.mockResolvedValue({
      data: {
        data: {
          barista: [{
            id: 2,
            email: "jest-test@test.com",
            password: "123",
          }],
        },
      },
    });
    const data = await validateCredentials(email, password);
    expect(data).toEqual(expected);
  });
});
