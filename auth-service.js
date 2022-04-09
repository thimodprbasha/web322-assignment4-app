const mongoose = require("mongoose");
const env = require("./env");
var User = null;
const userSchema = mongoose.Schema({
  userName: String,
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});
const URI =
  "mongodb+srv://" +
  env.MONGODB_CONFIG.USER +
  ":" +
  env.MONGODB_CONFIG.PASSWORD +
  "@cluster0.rrmk7.mongodb.net/" +
  env.MONGODB_CONFIG.DB +
  "?retryWrites=true&w=majority";
// module.exports = mongoose.model("User", userSchema);

module.exports.initializeMongoDB = () => {
  return new Promise(function (resolve, reject) {
    let db = mongoose.createConnection(URI);
    db.on("error", (err) => {
      reject(err); // reject the promise with the provided error
    });
    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};

module.exports.checkUserExists = async (checkUserName) => {
  isUserExists = await User.findOne({ userName: checkUserName });
  if (isUserExists) {
    return true;
  }
  return false;
};

module.exports.registerUser = (userData) => {
  return new Promise((resolve, reject) => {
    const newUser = new User({
      userName: userData.userName,
      password: userData.password,
      email: userData.email,
    });
    newUser
      .save()
      .then((data) => {
        resolve("successfully created :" + data._id);
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports.checkUser = (username) => {
  return new Promise((resolve, reject) => {
    User.findOne({ userName: username })
      .then((data) => {
        if (data) {
          console.log(data);
          resolve(data);
        }
        reject("User not found !");
      })
      .catch((err) => {
        reject(err);
      });
  });
};

module.exports.updateUser = (userData) => {
  console.log(userData);
  return new Promise((resolve, reject) => {
    data = {
      userName: new RegExp("^" + userData.userName + "$", "i"),
    };

    User.findOneAndUpdate(data, userData)
      .then((data) => {
        if (data) {
          resolve(data);
        }
        reject("User not found !");
      })
      .catch((err) => {
        reject(err);
      });
  });
};
