const { Schema } = require("mongoose");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const profile = new Schema(
  {
    position: {
      type: String,
    },
    name: {
      type: String,
    },
    surname: {
      type: String,
    },
    portfolioLink: {
      type: String,
    },
    aboutMe: {
      type: String,
      default: "nothing to show",
    },
    dateOfBirth: {
      type: Date,
    },
    email: {
      type: String,
      required: true,
      validate: {
        validator: async (value) => {
          if (!validator.isEmail(value)) {
            throw new Error("Email is invalid");
          } else {
            const uniqueEmail = await Model.findOne({ email: value });
            if (uniqueEmail) {
              throw new Error("Email already exist");
            }
          }
        },
      },
    },
    password: {
      type: String,
      required: true,
    },

    location: {
      type: String,
    },
    workExperience: [
      {
        type: Schema.Types.ObjectId,
        ref: "workExperience",
      },
    ],
    education: [
      {
        type: Schema.Types.ObjectId,
        ref: "education",
      },
    ],
    skills: [
      {
        type: Schema.Types.ObjectId,
        ref: "skills",
      },
    ],
    image: {
      type: String,
    },
    token: {
      type: String,
    },
  },
  { timestamps: true }
);
profile.methods.toJSON = function () {
  let object = this.toObject();
  delete object.password, delete object.token, delete object.__v;

  return object;
};

profile.statics.findByCredentials = async (email, password) => {
  const user = await Model.findOne({ email: email });
  if (!user) {
    const err = new Error("Email is not Correct ");
    err.httpStatusCode = 404;
    throw err;
  }

  const match = await bcrypt.compare(password, user.password);
  console.log(match);
  console.log(password);
  console.log(user.password);
  if (!match) {
    const err = new Error("Password is not Correct");
    err.httpStatusCode = 401;
    throw err;
  } else {
    return user;
  }
};

profile.pre("save", async function (next) {
  const user = this;
  console.log(user);
  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }
  next();
});

const Model = mongoose.model("workersprofile", profile);
module.exports = Model;
