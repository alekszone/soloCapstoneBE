const express = require("express");
const schema = require("./schema");
const { User } = require("../midlewares/middleware");
const profileSchema = require("../profile/schema");
const experienceRoute = express.Router();
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");
const upload = multer({});
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

experienceRoute.get("/workExperience", User, async (req, res, next) => {
  try {
    const _id = req.user._id;
    const skill = await schema.find({ profileId: _id });
    res.send(skill);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

experienceRoute.get("/workExperience/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const skill = await schema.findById({ _id: _id });
    res.send(skill);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

experienceRoute.post("/postWork", User, async (req, res, next) => {
  try {
    const _id = req.user._id;
    const post = new schema({ profileId: _id, ...req.body });
    const savePost = await post.save();

    const addToProfile = await profileSchema.findById({ _id: _id });
    const workExperience = addToProfile.workExperience;
    workExperience.push(savePost._id);
    await addToProfile.save({ validateBeforeSave: false });
    res.send(savePost);
    console.log(savePost);
  } catch (error) {
    next(error);
    console.log(error);
  }
});
experienceRoute.post(
  "/uploadImage/:id",
  User,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "experienceImage",
          },
          async (err, data) => {
            if (!err) {
              const user = await schema.findById({
                _id: req.params.id,
              });
              console.log(data.secure_url, "hwelellelel");
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

experienceRoute.put("/edit/:_id", User, async (req, res, next) => {
  try {
    const id = req.params._id;
    const update = req.body;
    const editPost = await schema.findByIdAndUpdate({ _id: id, ...update });
    console.log(editPost, "edited post");
    if (editPost) {
      res.send(editPost);
    } else {
      res.send("Skill not exist");
    }
  } catch (error) {
    next(error);
    console.log(error);
  }
});

experienceRoute.delete("/delete/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const deleteSkill = await schema.findByIdAndDelete({ _id: _id });
    if (deleteSkill) {
      res.send("deleted");
    } else {
      res.send("Skill is removed");
    }
  } catch (error) {
    next(error);
    console.log(error);
  }
});

module.exports = experienceRoute;
