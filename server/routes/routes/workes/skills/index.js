const express = require("express");
const schema = require("./schema");
const q2m = require("query-to-mongo");
const { User } = require("../midlewares/middleware");
const profileSchema = require("../profile/schema");
const skillsRoute = express.Router();
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");
const upload = multer({});
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});

skillsRoute.get("/skill", User, async (req, res, next) => {
  try {
    const id = req.user._id;
    const skill = await schema.find({ profileId: id });
    res.send(skill);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

skillsRoute.post("/postSkill", User, async (req, res, next) => {
  try {
    const _id = req.user._id;
    const post = new schema({ profileId: _id, ...req.body });
    const savePost = await post.save();

    const addToProfile = await profileSchema.findById({ _id: _id });
    const skills = addToProfile.skills;
    skills.push(savePost._id);
    await addToProfile.save({ validateBeforeSave: false });
    res.send(savePost);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

skillsRoute.put("/edit/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const update = req.body;
    const editPost = await schema.findByIdAndUpdate({ _id: _id, update });
    if (editPost) {
      res.send("updated");
    } else {
      res.send("Skill not exist");
    }
  } catch (error) {
    next(error);
    console.log(error);
  }
});

skillsRoute.delete("/delete/:_id", User, async (req, res, next) => {
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

module.exports = skillsRoute;
