const { verifyToken } = require("./utilities");
const ProfileSchema = require("../profile/schema");

const User = async (req, res, next) => {
  try {
    const token = req.cookies.token;

    if (token) {
      const data = await verifyToken(token);
      const user = await ProfileSchema.findById(data._id);
      if (user) {
        req.user = user;
        req.token = token;
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
