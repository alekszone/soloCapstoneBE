const express = require("express");
const schema = require("./schema");
const q2m = require("query-to-mongo");
const { User } = require("../midlewares/middleware");
const { createToken } = require("../midlewares/utilities");
const allCompanies = require("../../companies/login/schema");
const companiesPost = require("../../companies/post/schema");
const passport = require("passport");
const workersRoute = express.Router();
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const multer = require("multer");

const upload = multer({});
cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});
workersRoute.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

workersRoute.get("/allProfiles", User, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const allProfiles = await schema
      .find(query.criteria, query.options.fields)
      .populate("skills")
      .populate("education")
      .populate("workExperience")

      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);

    if (allProfiles.length > 0) res.send(allProfiles);
    else res.status(404).send("the profiles doesn't exist");
  } catch (error) {
    next(error);
    console.log(error);
  }
});

workersRoute.get("/allCompanies", User, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const all = await allCompanies
      .find(query.criteria, query.options.fields)
      .populate("allAplication")
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);
    console.log(await allCompanies.find(), "hellloooo");
    if (all.length > 0) res.send(all);
    else res.send("THe companies does not exist");
  } catch (error) {
    next(error);
    console.log(error);
  }
});

workersRoute.get("/allPostJobs", User, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const all = await companiesPost
      .find(query.criteria, query.options.fields)
      .populate("jobOffers")
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort(query.options.sort);
    console.log(await companiesPost.find(), "hellloooo");
    if (all.length > 0) res.send(all);
    else res.send("THe companies does not exist");
  } catch (error) {
    next(error);
    console.log(error);
  }
});

workersRoute.get("/singleProfile/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const profile = await schema
      .findById({ _id: _id })
      .populate("workExperience")
      .populate("education")
      .populate("skills");
    if (profile) res.send(profile);
    else res.status(404).send("Profile does not exist");
  } catch (error) {
    next(error);
    console.log(error);
  }
});
workersRoute.get("/profile", User, async (req, res, next) => {
  try {
    const user = req.user;
    res.send(user);
  } catch (err) {
    next(err);
    console.log(err);
  }
});
workersRoute.post(
  "/uploadImage",
  User,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "workersImage",
          },
          async (err, data) => {
            if (!err) {
              req.user.image = data.secure_url;
              console.log(req.user.image, "hellooo");
              await req.user.save({ validateBeforeSave: false });
              res.status(201).json(req.user.image);
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
workersRoute.post(
  "/workerImage/:_id",
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "workersImage",
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

workersRoute.put("/edit", User, async (req, res, next) => {
  try {
    delete req.body.email;
    const edit = Object.keys(req.body);
    edit.forEach((edit) => (req.user[edit] = req.body[edit]));
    await req.user.save({ validateBeforeSave: false });
    res.send(req.user);
  } catch {
    next(err);
    console.log(err);
  }
});

workersRoute.delete("/delete", User, async (req, res, next) => {
  try {
    const _id = req.user._id;
    await schema.findByIdAndDelete({ _id: _id });
    res.send("Deleted");
  } catch {
    next(err);
    console.log(err);
  }
});

workersRoute.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(email, "hellllloooooooo");
    const user = await schema.findByCredentials(email, password);
    if (user) {
      const token = await createToken(user);
      console.log("hello token", token.token, "this is token");
      res.cookie("token", token.token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.send("loged in");
    }
  } catch (err) {
    next(err);
    console.log(err);
  }
});

workersRoute.post("/register", async (req, res, next) => {
  try {
    const data = req.body;
    const newData = new schema(data);
    const created = await newData.save();
    if (created) {
      res.send(created);
    } else {
      res.send("canot create");
    }
  } catch (err) {
    next(err);
    console.log(err);
  }
});
workersRoute.post("/logout", User, async (req, res, next) => {
  try {
    const user = req.user;
    user.token = "";
    await user.save({ validateBeforeSave: false });

    res.clearCookie("token", {
      secure: true,
      httpOnly: true,
      sameSite: "none",
    });

    res.send("ok");
  } catch (err) {
    console.log(err);
    next(err);
  }
});
workersRoute.get(
  "/auth/linkedin",
  passport.authenticate("linkedin", { state: "SOME STATE" })
);

workersRoute.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/login" }),
  async (req, res, next) => {
    try {
      console.log("hellllo im here");
      const token = req.user.token;

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });
      res.send("helllo welcome");

      //   res.writeHead(301, {
      //     Location:
      //       process.env.FRONTEND_URL + '/profiles/me?' + req.user.username,
      //   });
      res.end();
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);

module.exports = workersRoute;
