import express from "express";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import userRouter from "./routers/userRouter";
import videoRouter from "./routers/videoRouter";
import globalRouter from "./routers/globalRouter";
import routes from "./routes";
import { localsMiddleware } from "./middleware";

const app = express() //application 생성

app.use(helmet());
app.set('view engine', "pug");
app.use("/uploads", express.static("uploads"));
app.use(cookieParser()); //cookie를 전달받아 사용할 수 있도록 만들어주는 middleware.
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true })); //사용자가 웹사이트로 전달하는 정보들을 검사 / request 정보에서 form이나 json 형태로 된 body를 검사.
app.use(morgan("dev"));

app.use(localsMiddleware);

app.use(routes.home, globalRouter);
app.use(routes.users, userRouter);
app.use(routes.videos, videoRouter);

export default app;