const express = require("express");
const {
  notFound,
  badRequest,
  newDefinedError,
  otherGenericError,
} = require("./errorHeandlers");
const cors = require("cors");
const login = require("./routes/routes/companies/login");
const post = require("./routes/routes/companies/post");
const profileWorker = require("./routes/routes/workes/profile");
const education = require("./routes/routes/workes/education");
const aplication = require("./routes/routes/workes/aplication/index");
const workExperience = require("./routes/routes/workes/workExperience");
const skills = require("./routes/routes/workes/skills");
const manageAplication = require("./routes/routes/companies/aplication");
const port = process.env.PORT;
const mongoose = require("mongoose");
const name = process.env.DATABASENAME;
const password = process.env.PASSWORD;
const database = process.env.DATABASE;
const mainDatabase = process.env.MAINDATABASE;
const { join } = require("path");
const listEndpoints = require("express-list-endpoints");

const cookieParser = require("cookie-parser");

require("./routes/routes/companies/oauth");
require("./routes/routes/workes/oauth");

const passport = require("passport");

const server = express();

const whitelist = process.env.Client_Website;
const corsOptions = {
  origin: (origin, callback) => {
    console.log("this is origin", origin);
    console.log("this is white list", whitelist);
    if (whitelist.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
};
server.use(cookieParser());

server.use(cors());

server.use(express.json());

server.use("/login", login);
server.use("/post", post);
server.use("/aplicationn", manageAplication);
server.use("/profile", profileWorker);
server.use("/education", education);
server.use("/aplication", aplication);
server.use("/workExperience", workExperience);
server.use("/skills", skills);
server.set("trust proxy", 1);

server.use(passport.initialize());
server.use(passport.session());
server.use(notFound);
server.use(badRequest);
server.use(newDefinedError);
server.use(otherGenericError);
console.log(listEndpoints(server));

mongoose
  .connect(
    `mongodb+srv://${name}:${password}@${mainDatabase}.anpmf.mongodb.net/${database}`,
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false,
    }
  )
  .then(
    server.listen(port, () => {
      console.log(`Server running on port : ${port}`);
    })
  )
  .catch((err) => console.log(err));
