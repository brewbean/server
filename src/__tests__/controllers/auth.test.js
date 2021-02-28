import { expectationFailed } from '@hapi/boom'
import { logoutController } from '../../controllers/auth'
import axios from 'axios'
jest.mock("axios");

// beforeAll(() => {
//   mockRequest: () => {
//     const req = {}
//     req.body = jest.fn().mockReturnValue(req)
//     req.params = jest.fn().mockReturnValue(req)
//     return req
//   },

//   mockResponse: () => {
//     const res = {}
//     res.send = jest.fn().mockReturnValue(res)
//     res.status = jest.fn().mockReturnValue(res)
//     res.json = jest.fn().mockReturnValue(res)
//     return res
//   },
//   // mockNext: () => jest.fn()
// }
describe('[Logout Controller]', () => {
  let req=  {};
  let res = {};
  let next = {};
  beforeAll(() => {
    res = {};
    res.status = () => res;
    res.json = () => res;
  })
  axios.post.mockResolvedValue({})
  test('test first lougout controller', async () =>{
    req = {
      cookies : {
        refreshToken: "1"
      }
    }
    res = {
      cookie: (a,b,c) => {

      },
      send: jest.fn().mockReturnValue(req)
    }
    await logoutController(req,res,next)
    expect(res.send).toHaveBeenCalledWith("OK");
  })
})