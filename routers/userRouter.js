import express from "express";
import routes from "../routes";
import {
  users,
  userDetail,
  getEditProfile,
  postEditProfile,
  changePassword,
  getChangePassword,
  postChangePassword
} from "../controllers/userController";
import { onlyPrivate } from "../middleware";
import { postEditVideo } from "../controllers/videoController";

const userRouter = express.Router();

//userRouter.get(routes.users, users);
userRouter.get(routes.editProfile, onlyPrivate, getEditProfile);
userRouter.post(routes.editProfile, onlyPrivate, postEditProfile);

userRouter.get(routes.changePassword, onlyPrivate, getChangePassword);
userRouter.post(routes.changePassword, onlyPrivate, postChangePassword);

userRouter.get(routes.userDetail(), userDetail);

export default userRouter;
