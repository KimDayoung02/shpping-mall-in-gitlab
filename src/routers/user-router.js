import { Router } from "express";
import is from "@sindresorhus/is";
// 폴더에서 import하면, 자동으로 폴더의 index.js에서 가져옴
import { loginRequired } from "../middlewares";
import { userService } from "../services";

const userRouter = Router();

userRouter.get("/user", loginRequired, async (req, res, next) => {
  const userId = req.currentUserId;
  console.log(userId);
  try {
    if (is.emptyString(userId)) {
      throw new Error("로그인된 유저가 아닙니다.");
    }
    const user = await userService.getUser(userId);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

// 회원가입 api (아래는 /register이지만, 실제로는 /api/register로 요청해야 함.)
userRouter.post("/register", async (req, res, next) => {
  try {
    // Content-Type: application/json 설정을 안 한 경우, 에러를 만들도록 함.
    // application/json 설정을 프론트에서 안 하면, body가 비어 있게 됨.
    if (is.emptyObject(req.body)) {
      throw new Error(
        "headers의 Content-Type을 application/json으로 설정해주세요"
      );
    }

    // req (request)의 body 에서 데이터 가져오기
    const { fullName, email, password } = req.body;
    // 위 데이터를 유저 db에 추가하기
    const newUser = await userService.addUser({
      fullName,
      email,
      password,
    });

    // 추가된 유저의 db 데이터를 프론트에 다시 보내줌
    // 물론 프론트에서 안 쓸 수도 있지만, 편의상 일단 보내 줌
    res.status(201).json(newUser);
  } catch (error) {
    next(error);
  }
});

// 로그인 api (아래는 /login 이지만, 실제로는 /api/login로 요청해야 함.)
userRouter.post("/login", async function (req, res, next) {
  // req (request) 에서 데이터 가져오기
  const email = req.body.email;
  const password = req.body.password;
  try {
    //유저서비스
    // 로그인 진행 (로그인 성공 시 jwt 토큰을 프론트에 보내 줌)
    const { token, role } = await userService.getUserToken({ email, password });

    // jwt 토큰을 프론트에 보냄 (jwt 토큰은, 문자열임)
    res.status(200).json({ token, role });
  } catch (error) {
    next(error);
  }
});

// 전체 유저 목록을 가져옴 (배열 형태임)
// 미들웨어로 loginRequired 를 썼음 (이로써, jwt 토큰이 없으면 사용 불가한 라우팅이 됨)
// userRouter.get("/userlist", loginRequired, async function (req, res, next) {
//   try {
//     // 전체 사용자 목록을 얻음
//     const users = await userService.getUsers();

//     // 사용자 목록(배열)을 JSON 형태로 프론트에 보냄
//     res.status(200).json(users);
//   } catch (error) {
//     next(error);
//   }
// });

// 사용자 정보 수정
// (예를 들어 /api/users/abc12345 로 요청하면 req.params.userId는 'abc12345' 문자열로 됨)
userRouter.patch("/user/:userId", async function (req, res, next) {
  try {
    const { userId } = req.params;
    const { fullName, email, password, currentPassword } = req.body;

    // body data로부터, 확인용으로 사용할 현재 비밀번호를 추출함.

    // currentPassword 없을 시, 진행 불가
    if (currentPassword) {
      throw new Error("정보를 변경하려면, 현재의 비밀번호가 필요합니다.");
    }

    const userInfoRequired = { userId, currentPassword };

    // 위 데이터가 undefined가 아니라면, 즉, 프론트에서 업데이트를 위해
    // 보내주었다면, 업데이트용 객체에 삽입함.
    const toUpdate = {
      ...(fullName && { fullName }),
      ...(password && { password }),
      ...(email && { email }),
      // fullName,
      // password,
      // email,
    };

    // 사용자 정보를 업데이트함.
    const updatedUserInfo = await userService.setUser(
      userInfoRequired,
      toUpdate
    );

    // 업데이트 이후의 유저 데이터를 프론트에 보내 줌
    res.status(200).json(updatedUserInfo);
  } catch (error) {
    next(error);
  }
});

userRouter.delete('/user/:id', async(req, res) => {
  const userId = req.params.id;

  const deleteUser = await userService.deleteUser(userId);

  res.json(deleteUser);
})

export { userRouter };
