const { verifyToken } = require("./utilities");
const ProfileSchema = require("../login/schema");

const User = async (req, res, next) => {
  try {
    console.log(req.headers);
    console.log(req.headers.authorization.split(" ")[1]);
    const token = req.headers.authorization.split(" ")[1];

    console.log(token, "khfgkuvkhv khvhv hm n");
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
