const { verifyToken } = require("./utilities");
const ProfileSchema = require("../profile/schema");

const User = async (req, res, next) => {
  try {
    // const token = req.cookies.token
    const token = JSON.stringify(req.headers.cookie);

    // console.log(token, "what has token");
    const authorization = token.slice(7, -1);

    if (authorization) {
      const data = await verifyToken(authorization);
      const user = await ProfileSchema.findById(data._id);
      if (user) {
        req.user = user;
        req.token = authorization;
        next();
      } else {
        res.status(404).send("Your username or password is incorrect");
      }
    }
  } catch (err) {
    console.log(err);
    next(err);
  }
};

module.exports = { User };
