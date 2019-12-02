import express from "express";
import routes from "../routes";
import { videos, getUpload, postUpload, videoDetail, getEditVideo, deleteVideo, postEditVideo } from "../controllers/videoController";
import { uploadVideo } from "../middleware";

const videoRouter = express.Router();

console.log(routes.editVideo());

//videoRouter.get(routes.videos, videos);
// Upload
videoRouter.get(routes.upload, getUpload);
videoRouter.post(routes.upload, uploadVideo, postUpload);

//Video Detail
videoRouter.get(routes.videoDetail(), videoDetail);

// Edit Video
videoRouter.get(routes.editVideo(), getEditVideo);
videoRouter.post(routes.editVideo(), postEditVideo);

//Delete Video
videoRouter.get(routes.deleteVideo(), deleteVideo);

export default videoRouter;