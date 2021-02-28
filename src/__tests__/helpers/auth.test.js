import {
  validateCredentials,
  getDuplicateError,
} from "../../helpers/auth";
import bcrypt from "bcrypt";
import axios from "axios";
import boom from "@hapi/boom";
import jwt from "jsonwebtoken";
// import { logoutController, signupController } from "../../controllers/auth";

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
        id: 1,
        email: "jest-test@test.com",
        password: encryptedPassword,
      },
    };
    axios.post.mockResolvedValue({
      data: {
        data: {
          barista: [
            {
              id: 1,
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
      error: boom.unauthorized("Invalid 'username' or 'password'"),
    };
    axios.post.mockResolvedValue({
      data: {
        data: {
          barista: [],
        },
      },
    });
    const data = await validateCredentials(email, password);
    expect(data).toEqual(expected);
  });

  test("Returns invalid username or password error if barista found but different password", async () => {
    const expected = {
      valid: false,
      error: boom.unauthorized("Invalid 'username' or 'password'"),
    };
    axios.post.mockResolvedValue({
      data: {
        data: {
          barista: [
            {
              id: 1,
              email: "jest-test@test.com",
              password: "123",
            },
          ],
        },
      },
    });
    const data = await validateCredentials(email, password);
    expect(data).toEqual(expected);
  });
});

// describe("[Generate JWT Tests]", () => {
//   const id = 1;
//   const email = "jest-test@test.com";
//   const JWT_SECRET = "1";
//   const JWT_TOKEN_EXPIRES = "1";

//   test("JWT created with verified account", async () => {
//     const tokenContent = {
//       sub: "1",
//       email,
//       iss: "https://brewbean-api.herokuapp.com",
//       "https://hasura.io/jwt/claims": {
//         "x-hasura-allowed-roles": ["barista", "all_barista"],
//         "x-hasura-default-role": "barista",
//         "x-hasura-barista-id": "1",
//       },
//     };

//     const expected = jwt.sign(tokenContent, JWT_SECRET, {
//       expiresIn: `${JWT_TOKEN_EXPIRES}m`,
//     });
//     const result = await generateJWT(id, email, true);
//     expect(result).toEqual(expected);
//   });

//   test("JWT created with unverified account", async () => {
//     const tokenContent = {
//       sub: "1",
//       email,
//       iss: "https://brewbean-api.herokuapp.com",
//       "https://hasura.io/jwt/claims": {
//         "x-hasura-allowed-roles": ["all_barista", "unverified"],
//         "x-hasura-default-role": "unverified",
//         "x-hasura-barista-id": "1",
//       },
//     };

//     const expected = jwt.sign(tokenContent, JWT_SECRET, {
//       expiresIn: `${JWT_TOKEN_EXPIRES}m`,
//     });
//     const result = await generateJWT(id, email, false);
//     expect(result).toEqual(expected);
//   });
// });

describe("[Get Duplicate Error]", () => {
  test("Email already exists", () => {
    const errors = [{ message: "barista_email_key already exists" }];
    const expected = boom.badRequest("Email already exists");
    const result = getDuplicateError(errors);

    expect(result).toEqual(expected);
    
  });

  test("Display name already exists", () => {
    const errors = [{ message: "barista_display_name_key already exists" }];
    const expected = boom.badRequest("Display name already exists");
    const result = getDuplicateError(errors);
    expect(result).toEqual(expected);
  });

  test("Nothing is returned if no error", () => {
    const errors = [{}];
    const result = getDuplicateError(errors);
    const expected = "";
    expect(result).toEqual(expected);
  });
});









describe("", () => {
  test("", () => {
    let result
    let next = error => { // handing in a function for next 
       result = error 
    }
    let jsonResult
    let res = {
      json: (xyz) => {
        jsonResult = xyz
      }
    }
    signupController(req, res, next)
    expect(jsonResult).toBe("??")
    expect(result).toBe(boom.unauthorized(""))
  })
})

tes("", () =>{
  // 1. don't have refresh token 
  //  - 
  let reqFail = {
    cookies: {
    }
  }
  let reqRefreshToke = {
    cookies: {
      refreshToken: "yes"
    }
  }
  axios.post.mockResolvedValue({
    // whatever fake values w/ whatever property 
  })
  // need to spy into cookies
  // need to read on spy helper 

  let res = {
    // a="refreshtoken"
    // b=''
    // c=object
    cookie: (a,b,c) => {

    },
    send: () => "OK" // just need to check it gets called (jest thing)
  }
  logoutController(req,res,next)
  
})