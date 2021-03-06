import routes from "../routes";
import VideoDB from "../models/video";
import Comment from "../models/Comment";

export const home = async (req, res) => {
  try {
    const video = await VideoDB.find({}).sort({ _id: -1 }); // await : 해당 작업이 끝날 때까지 기다림.
    res.render("home", { pageTitle: "Home", video });
  } catch (error) {
    console.log(error);
    res.render("home", { pageTitle: "Home", video });
  }
}; //.render(template, value)

export const search = async (req, res) => {
  const {
    query: { term: searchingBy }
  } = req; // == const searchingBy = req.query.params
  let video = [];
  try {
    video = await VideoDB.find({
      title: { $regex: searchingBy, $options: "i" }
    });
  } catch (error) {
    console.log(error);
  }
  res.render("Search", { pageTitle: "Search", searchingBy, video });
};

export const videos = (req, res) =>
  res.render("uideos", { pageTitle: "Videos" });

export const getUpload = (req, res) =>
  res.render("upload", { pageTitle: "Upload" });

export const postUpload = async (req, res) => {
  const {
    body: { title, description },
    file: { path }
  } = req;
  const newVideo = await VideoDB.create({
    fileUrl: path,
    title,
    description,
    creator: req.user.id
  });
  req.user.videos.push(newVideo.id);
  req.user.save();
  res.redirect(routes.videoDetail(newVideo.id));
};

export const videoDetail = async (req, res) => {
  const {
    params: { id }
  } = req;
  try {
    const video = await VideoDB.findById(id)
      .populate("creator")
      .populate("comments");
    res.render("videoDetail", { pageTitle: "Video Detail", video });
  } catch (error) {
    res.redirect(routes.home);
    console.error(error);
  }
};

export const getEditVideo = async (req, res) => {
  const {
    params: { id }
  } = req;
  try {
    const video = await VideoDB.findById(id);
    if (video.creator !== req.user.id) {
      throw Error();
    } else {
      res.render("editVideo", { pageTitle: `Edit ${video.title}`, video });
    }
  } catch (error) {
    res.redirect(routes.home);
    console.error(error);
  }
};

export const postEditVideo = async (req, res) => {
  const {
    params: { id },
    body: { title, description }
  } = req;
  try {
    await VideoDB.findOneAndUpdate({ id }, { title, description });
    res.redirect(routes.videoDetail(id));
  } catch (error) {
    res.redirect(routes.home);
    console.error(error);
  }
};

export const deleteVideo = async (req, res) => {
  const {
    params: { id }
  } = req;
  try {
    const video = await VideoDB.findById(id);
    if (video.creator !== req.user.id) {
      throw Error();
    } else {
      await VideoDB.findOneAndRemove({ _id: id });
    }
  } catch (error) {}
  res.redirect(routes.home);
};

// Register Video View

export const postRegisterView = async (req, res) => {
  const {
    params: { id }
  } = req;
  try {
    const video = await VideoDB.findById(id);
    video.views += 1;
    video.save();
    res.status(200);
  } catch (error) {
    res.status(400);
  } finally {
    res.end();
  }
};

// Comment

export const postAddComment = async (req, res) => {
  const {
    params: { id },
    body: { comment },
    user
  } = req;
  try {
    const video = await VideoDB.findById(id);
    const newComment = await Comment.create({
      text: comment,
      creator: user.id
    });
    video.comments.push(newComment.id);
    video.save();
  } catch (error) {
    res.status(400);
  } finally {
    res.end();
  }
};
