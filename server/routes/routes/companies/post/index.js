const express = require("express");
const postSchema = require("./schema");
const { User } = require("../Midlewares/middleware");
const q2m = require("query-to-mongo");
const profileSchema = require("../login/schema");
const apliactionSchema = require("../../workes/aplication/schema");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");
const postRoute = express.Router();
const upload = multer({});
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

postRoute.get("/allPosts", User, async (req, res, next) => {
  try {
    const id = req.user._id;
    const query = q2m(req.query);
    const post = await postSchema
      .find({ userID: id })
      .populate("allAplication")
     
     res.send(post);
    
  } catch (err) {
    next(err);
    console.log(err);
  }
});
postRoute.get("/singelPost/:_id", User, async (req, res, next) => {
  try {
    const singelPost = req.params._id;
    console.log(req.params._id);
    const findPost = await postSchema
      .findById({
        _id: singelPost,
      })
      .populate("allAplication");
    
    res.send(findPost);
  } catch (err) {
    next(err);
    console.log(err);
  }
});
postRoute.post("/newPost", User, async (req, res, next) => {
  try {
    const user = req.user;
    const post = req.body;
    const newPost = new postSchema({
      ...post,
      userID: user._id,
      companyName: user.companyName,
      location: user.location,
    });
    const data = await newPost.save({ validateBeforeSave: false });

    const addToProfile = await profileSchema.findById({ _id: user._id });
    const jobOffers = addToProfile.jobOffers;
    jobOffers.push(newPost._id);
    await addToProfile.save({ validateBeforeSave: false });

    res.send(data);
    console.log(data);
  } catch (err) {
    next(err);
    console.log(err);
  }
});
postRoute.post(
  "/uploadImage/:_id",
  User,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "companyPostImages",
          },
          async (err, data) => {
            if (!err) {
              const user = await postSchema.findById({
                // image: data.secure_url,
                _id: req.params._id,
              });

              user.image = data.secure_url;
              const info = await user.save({ validateBeforeSave: false });
              res.status(201).send(info);
              console.log(user);
            }
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(cloud_upload);
      } else {
        const err = new Error();
        err.httpStatusCode = 400;
        err.message = " image is missing";
        next(err);
      }
    } catch (error) {
      next(error);
      console.log(error);
    }
  }
);

postRoute.put("/editPost/:_id", User, async (req, res, next) => {
  try {
    console.log(req.body);
    const updatePost = await postSchema.findByIdAndUpdate(
      req.params._id,
      req.body
    );
    if (updatePost) res.send(updatePost);
    else res.status(404).send("not found");
  } catch (err) {
    console.log(err);
    next(err);
  }
});
postRoute.delete("/deletePost/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const remove = await postSchema.findByIdAndDelete({ _id: _id });
    const removeAplication = await apliactionSchema.find({ postId: _id });
    removeAplication.postId = [];
    removeAplication.userId = "";
  //  const data =  await removeAplication.save({ validateBeforeSave: false });
    if (remove) {
      res.send("Post is deleted");
    } else {
      res.send("Post does not exist");
    }
  } catch (err) {
    next(err);
    console.log(err);
  }
});

module.exports = postRoute;
