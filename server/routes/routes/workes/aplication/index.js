const express = require("express");
const schema = require("../../companies/post/schema");
const { User } = require("../midlewares/middleware");
const aplicationRoute = express.Router();
const aplicationSchema = require("./schema");
const q2m = require("query-to-mongo");

aplicationRoute.get("/getAllAplication", User, async (req, res, next) => {
  try {
    const query = q2m(req.query);
    const _id = req.user._id;
    const allAplication = await aplicationSchema
      .find({ userId: _id }, query.criteria, query.options.fields)
      .populate("postId")
      .skip(query.options.skip)
      .limit(query.options.limit)
      .sort({
        dateOfCreation: -1,
      });

    res.send(allAplication);
  } catch (err) {
    next(err);
    console.log(err);
  }
});
aplicationRoute.get("/getAplication/:_id", User, async (req, res, next) => {
  try {
    const _id = req.user._id;
    const postId = req.params._id;
    const allAplication = await aplicationSchema.find({
      userId: _id,
      postId: postId,
    });

    res.send(allAplication);
  } catch (err) {
    next(err);
    console.log(err);
  }
});

aplicationRoute.post("/aply/:_id", User, async (req, res, next) => {
  try {
    const _id = req.params._id;
    const userId = req.user._id;
    const findPost = await schema.findById({ _id: _id });
    console.log(findPost, "why is not here");

    findPost.allAplication.push(userId);
    await findPost.save();
    if (findPost.allAplication) {
      const add = new aplicationSchema({ userId: userId, postId: _id });
      const posted = await add.save();
      if (posted) {
        console.log("posted", add);
      }
      res.send("application aded");
    } else {
      res.send("post not exist");
    }
  } catch (error) {
    next(error);
    console.log(error);
  }
});

aplicationRoute.delete("/getAplication/:_id", User, async (req, res, next) => {
  try {
    const postId = req.params._id;
    const allAplication = await aplicationSchema.findByIdAndDelete({
      _id: postId,
    });

    console.log(allAplication);
    res.send("deleted");
  } catch (err) {
    next(err);
    console.log(err);
  }
});

module.exports = aplicationRoute;
