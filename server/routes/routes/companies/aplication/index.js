const express = require("express");
const postSchema = require("../post/schema");
const aplicationSchema = require("../../workes/aplication/schema");
const { User } = require("../Midlewares/middleware");
const workerProfile = require("../../workes/profile/schema");
const manageAplication = express.Router();
const sendEmail = require("@sendgrid/mail");

manageAplication.get("/allPost", User, async (req, res, next) => {
  try {
    const allPost = await postSchema
      .find({ userID: req.user._id })
      .populate("allAplication");
    res.send(allPost);
  } catch (error) {
    next(error);
    console.log(error);
  }
});

manageAplication.get(
  "/:postId/accept/:workerid",
  User,
  async (req, res, next) => {
    try {
      const userID = req.params.workerid;
      const postID = req.params.postId;
      const accept = "accepted";
      await aplicationSchema.findOneAndUpdate({
        userId: userID,
        postId: postID,
        answer: accept,
      });

      const removeAplication = await postSchema.find({
        _id: postID,
        allAplication: userID,
      });

      const data = await removeAplication[0].allAplication.filter(
        (item) => item != userID
      );
      await postSchema.findByIdAndUpdate(postID, { allAplication: data });

      sendEmail.setApiKey(process.env.API_KEY_SENDGRID);
      const postData = await postSchema.find({
        _id: postID,
      });
      const user = req.user;
      const worker = await workerProfile.findById({ _id: userID });

      const msg = {
        to: worker.email,
        from: "TechJobs@email.com",
        subject: `Email from ${user.companyName}`,
        text: `Hello we want to inform you tha you have been accepted for ${postData.jobPosition} ,
        You gona here more from us on this email ${user.email}        
        `,
      };

      sendEmail.send(msg);

      if (removeAplication) res.send("removed");
    } catch (err) {
      next(err);
      console.log(err);
    }
  }
);
manageAplication.get(
  "/:postId/notAccept/:workerid",
  User,
  async (req, res, next) => {
    try {
      const userID = req.params.workerid;
      console.log(userID, "what inside");
      const postID = req.params.postId;
      const accept = "not accepted";
      const sendPost = await aplicationSchema.findOneAndUpdate({
        userId: userID,
        postId: postID,
        answer: accept,
      });
      const removeAplication = await postSchema.find({
        _id: postID,
        allAplication: userID,
      });

      const data = await removeAplication[0].allAplication.filter(
        (item) => item != userID
      );
      await postSchema.findByIdAndUpdate(postID, { allAplication: data });

      sendEmail.setApiKey(process.env.API_KEY_SENDGRID);
      const postData = await postSchema.find({
        _id: postID,
      });
      const user = req.user;
      const worker = await workerProfile.findById({ _id: userID });

      const msg = {
        to: worker.email,
        from: "TechJobs@email.com",
        subject: `Email from ${user.companyName}`,
        text: `Hello we want to inform you tha you have not been accepted for ${postData.jobPosition} `,
      };

      sendEmail.send(msg);

      res.send(sendPost);
    } catch (err) {
      next(err);
      console.log(err);
    }
  }
);
manageAplication.post("/sendEmail/:workerId", User, async (req, res, next) => {
  try {
    sendEmail.setApiKey(process.env.API_KEY_SENDGRID);
    const _id = req.params.workerId;
    const user = req.user;
    const worker = await workerProfile.findById({ _id: _id });
    console.log(req.body, "hellooooooodfgdfhdf");
    const msg = {
      to: worker.email,
      from: "TechJobs@email.com",
      subject: `${req.body.subject} + Contact to this email for more details  ${user.email}`,
      text: req.body.text,
    };

    sendEmail.send(msg);
    res.send("sent");
  } catch (error) {
    next(error);
    console.log(error);
  }
});

manageAplication.post(
  "/:postId/sendEmail/:workerId",
  User,
  async (req, res, next) => {
    try {
      sendEmail.setApiKey(process.env.API_KEY_SENDGRID);
      const _id = req.params.workerId;
      const postId = req.params.postId;
      const user = req.user;
      const worker = await workerProfile.findById({ _id: _id });

      const aplication = await aplicationSchema.findOne({
        userId: _id,
        postId: postId,
      });
      if (aplication.answer === "accepted") {
        const msg = {
          to: worker.email,
          from: user.email,
          subject: "Hello from our company" + worker.companyName,
          text:
            "We want to inform you that you have ben accepted for interview in our company",
        };

        await sendEmail.send(msg);
        res.send("sent");
      } else if (aplication.answer === "not accepted") {
        const msg = {
          to: worker.email,
          from: user.email,
          subject: "Hello from our company" + worker.companyName,
          text:
            "We want to inform you that you have  not  ben accepted for interview in our company",
        };

        await sendEmail.send(msg);
        res.send("sent");
      }
    } catch (error) {
      next(error);
      console.log(error);
    }
  }
);

module.exports = manageAplication;
