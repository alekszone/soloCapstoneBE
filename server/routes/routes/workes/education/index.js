const express = require("express");
const schema = require("./schema");
const { User } = require("../midlewares/middleware");
const profileSchema = require("../profile/schema");
const q2m = require("query-to-mongo");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");
const upload = multer({});
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});
const educationRoute = express.Router();
educationRoute.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

educationRoute.get("/allEducation", User, async (req, res, next) => {
  try {
    const _id = req.user._id;
    const data = await schema.find({ profileId: _id });
    res.status(200).send(data);
  } catch (error) {
    next(error);
    console.log(error);
  }
});
educationRoute.get("/allEducation/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const data = await schema.find({ profileId: _id });
    res.status(200).send(data);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

educationRoute.get("/allEducation/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const data = await schema.findById({ _id: _id });
    res.send(data);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

educationRoute.post("/postEducation", User, async (req, res, next) => {
  try {
    const _id = req.user._id;
    const post = req.body;
    const newPost = new schema({ profileId: _id, ...req.body });
    const data = await newPost.save();

    const addToProfile = await profileSchema.findById({ _id: _id });
    const education = addToProfile.education;
    education.push(data._id);
    await addToProfile.save({ validateBeforeSave: false });
    res.status(201).send(data._id);
  } catch (error) {
    next(error);
    console.log(error);
  }
});
educationRoute.post(
  "/uploadImage/:_id",
  User,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "educationImage",
          },
          async (err, data) => {
            if (!err) {
              const user = await schema.findById({
                // image: data.secure_url,
                _id: req.params._id,
              });

              user.image = data.secure_url;
              const info = await user.save({ validateBeforeSave: false });
              res.status(201).send(info);
              console.log(user);

              //   let user = await schema.findOneAndUpdate(req.params._id, {
              //     image: data.secure_url,
              //   });

              //   if (user) res.status(201).json(user);
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

educationRoute.put("/edit/:_id", User, async (req, res, next) => {
  try {
    const userId = req.params._id;
    const update = req.body;
    const newUpdate = await schema.findByIdAndUpdate({
      _id: userId,
      ...update,
    });
    if (newUpdate) {
      // await newUpdate.save()
      res.status(201).send(newUpdate);
    } else {
      res.status(404).send("Post is not founded");
    }
  } catch (error) {
    next(error);
    console.log(error);
  }
});

educationRoute.delete("/delete/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const deleted = await schema.findByIdAndDelete({ _id: _id });
    res.send("education deleted");
  } catch (error) {
    next(error);
    console.log(error);
  }
});

module.exports = educationRoute;
