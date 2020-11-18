const express = require("express");
const schema = require("./schema");
const q2m = require("query-to-mongo");
const { User } = require("../Midlewares/middleware");
const { createToken } = require("../Midlewares/utilities");
const postSchema = require("../post/schema");
const workerSchema = require("../../workes/profile/schema");
const passport = require("passport");
const multer = require("multer");
const fs = require("fs-extra");
const port = process.env.PORT;
const upload = multer({});
const path = require("path");
const companyRoute = express.Router();
const { join } = require("path");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const createPdf = require("pdfkit");
const axios = require("axios");

cloudinary.config({
  cloud_name: process.env.cloud_name,
  api_key: process.env.api_key,
  api_secret: process.env.api_secret,
});
companyRoute.all("*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "PUT, GET, POST, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

companyRoute.get("/profile", User, async (req, res, next) => {
  try {
    const data = req.user._id;
    const profile = await schema.find({ _id: data }).populate("jobOffers");
    res.send(profile);
  } catch (err) {
    next(err);
    console.log(err);
  }
});
companyRoute.get("/singleProfile/:_id", User, async (req, res, next) => {
  try {
    const id = req.params._id;
    const profile = await workerSchema
      .find({ _id: id })
      .populate("workExperience")
      .populate("education")
      .populate("skills");

    res.send(profile);
  } catch (error) {
    next(error);
    console.log(error);
  }
});
companyRoute.get("/allProfiles", User, async (req, res, next) => {
  try {
    const allProfiles = await schema.find().populate("jobOffers");
    res.send(allProfiles);
  } catch (error) {
    next(error);
    console.log(error);
  }
});
companyRoute.get("/allWorkers", User, async (req, res, next) => {
  try {
    const allProfiles = await workerSchema
      .find()
      .populate("skills")
      .populate("education")
      .populate("workExperience");
    res.send(allProfiles);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

companyRoute.post(
  "/uploadImage",
  User,
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "companyImages",
          },
          async (err, data) => {
            if (!err) {
              req.user.image = data.secure_url;
              await req.user.save({ validateBeforeSave: false });
              res.status(201).send("image is aded");
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
companyRoute.post(
  "/companyImage/:_id",
  upload.single("image"),
  async (req, res, next) => {
    try {
      if (req.file) {
        const cloud_upload = cloudinary.uploader.upload_stream(
          {
            folder: "companyImages",
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

companyRoute.put("/edit", User, async (req, res, next) => {
  try {
    // delete req.body.email;
    const edit = Object.keys(req.body);

    edit.forEach((edit) => (req.user[edit] = req.body[edit]));
    await req.user.save({ validateBeforeSave: false });
    res.send(req.user);
  } catch (err) {
    console.log(err);
    next(err);
  }
});

companyRoute.delete("/delete", User, async (req, res, next) => {
  try {
    await schema.findByIdAndDelete({ _id: req.user._id });
    await postSchema.findByIdAndDelete({ jobOffers: req.user._id });
    res.send("deleted");
  } catch (err) {
    console.log(err);
    next(err);
  }
});

companyRoute.get("/:_id/pdf", async (req, res, next) => {
  try {
    const profile = await workerSchema
      .findOne({
        _id: req.params._id,
      })
      .populate("workeExperience")
      .populate("education")
      .populate("skills");
    console.log(profile);

    const doc = new createPdf();
    const url = profile.image;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${profile.name} : ${profile.surname}.pdf`
    );

    if (url && url.length > 0) {
      const response = await axios.get(url, {
        responseType: "arraybuffer",
      });
      const img = new Buffer(response.data, "base64");
      doc.image(img, 50, 50, {
        fit: [100, 100],
      });
      console.log(response.data, "new response");
      console.log(img, "this.is image");
    }

    doc.font("Helvetica-Bold");
    doc.fontSize(20);

    doc.text(`${profile.name} ${profile.surname}`, 100, 50, {
      width: 410,
      align: "center",
    });
    doc.fontSize(12);
    doc.font("Helvetica");
    doc.text(
      `
     Email: ${profile.email}

     Location: ${profile.location}

     Bio:  ${profile.position}`,
      260,
      80,
      {
        align: "left",
      }
    );
    doc.fontSize(18);
    doc.text(`About Me`, 110, 200, {
      width: 400,
      align: "center",
    });
    doc.fontSize(12);
    doc.text(
      `      
        ${profile.aboutMe}`,
      100,
      210,
      {
        width: 400,
        align: "center",
      }
    );
    doc.fontSize(18);
    doc.text("Education", 100, 400, {
      width: 410,
      align: "center",
    });
    doc.fontSize(12);
    const education = async () => {
      profile.education &&
        profile.education.map(
          (education) =>
            doc.text(`
            Education
            SchoolName: ${education.schoolName}
            Image: ${education.image}
            Started: ${education.startDate}
            Finished:${education.endDate}
            Description: ${education.description}
            About:${education.about}
            SkillLearned:  ${education.skillsLearned}
      
          `),
          {
            width: 410,
            align: "center",
          }
        );
    };
    await education();

    doc.fontSize(18);
    doc.text("Experiences", 100, 750, {
      width: 410,
      align: "center",
    });
    doc.fontSize(12);
    const workExperience = async () => {
      profile.workExperience &&
        profile.workExperience.map(
          (work) =>
            doc.text(`
             Experiences
            Worked In: ${work.workExperience}
            Started: ${work.started}
            Finished:  ${work.finished}
            Description: ${work.workPosition}

          `),
          {
            width: 410,
            align: "center",
          }
        );
    };
    await workExperience();
    doc.fontSize(18);
    doc.text("Skills", 100, 350, {
      width: 410,
      align: "center",
    });
    doc.fontSize(12);
    const skills = async () => {
      profile.skills &&
        profile.skills.map(
          (skill) =>
            doc.text(`
            Skills
            Skill: ${skill.skillName}
        
          `),
          {
            width: 410,
            align: "center",
          }
        );
    };
    await skills();

    doc.pipe(res);

    doc.end();
  } catch (error) {
    next(error);
  }
});

companyRoute.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await schema.findByCredentials(email, password);
    if (user) {
      const token = await createToken(user);
      res.cookie("token", token.token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
      });
      res.send("loged in");
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
});

companyRoute.post("/logout", User, async (req, res, next) => {
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

companyRoute.post("/register", async (req, res, next) => {
  try {
    const data = req.body;
    const newData = new schema(data);
    const created = await newData.save();
    res.send(created);
  } catch (err) {
    next(err);
    console.log(err);
  }
});

companyRoute.get("/auth/linkedin", passport.authenticate("linkedin"));

companyRoute.get(
  "/auth/linkedin/callback",
  passport.authenticate("linkedin", { failureRedirect: "/login" }),
  async (req, res, next) => {
    try {
      const token = req.user.token;

      res.cookie("token", token, {
        httpOnly: true,
        sameSite: "none",
        secure: true,
      });

      //   res.writeHead(301, {
      //     Location:
      //     //   process.env.FRONTEND_URL + '/profiles/me?' + req.user.username,
      //   });
      res.end();
    } catch (error) {
      console.log(error);
      next(error);
    }
  }
);
module.exports = companyRoute;
