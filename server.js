const express = require("express");
const path = require("path");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const env = require("./env");
const handlebars = require("express-handlebars");
const upload = multer();
const stripJs = require("strip-js");
const morgan = require("morgan");
const logger = require("./config/logger");
const blog = require("./blog-service");
const authData = require("./auth-service");
const clientSessions = require("client-sessions");
const bcryptService = require("./bycrpt-service");

const app = express();

// app.use(morgan("combined", { stream: logger.stream }));
app.use(express.static("static"));

app.use(
  clientSessions({
    cookieName: "session", // this is the object name that will be added to 'req'
    secret: "week10example_web322", // this should be a long un-guessable string.
    duration: 2 * 60 * 1000, // duration of the session in milliseconds (2 minutes)
    activeDuration: 1000 * 60, // the session will be extended by this many ms each request (1 minute)
  })
);

app.use(function (req, res, next) {
  res.locals.session = req.session;
  app.locals.session = req.session;
  app.locals.res = res;
  next();
});

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    route == "/" ? "/" : "/" + route.replace(/\/(.*)/, "");
  app.locals.viewingCategory = req.query.category;
  next();
});

const hbs = handlebars.create({
  extname: "hbs",
  layoutsDir: path.join(__dirname, "/views/layouts"),
  defaultLayout: "main",
  helpers: {
    navLink: function (url, options) {
      return (
        "<li" +
        (url == app.locals.activeRoute ? ' class="active" ' : "") +
        '><a href="' +
        url +
        '">' +
        options.fn(this) +
        "</a></li>"
      );
    },

    equal: function (lvalue, rvalue, options) {
      if (arguments.length < 3)
        throw new Error("Handlebars Helper equal needs 2 parameters");
      if (lvalue != rvalue) {
        return options.inverse(this);
      } else {
        return options.fn(this);
      }
    },

    concat: function (url, category) {
      return url.concat(category);
    },

    safeHTML: function (context) {
      return stripJs(context);
    },

    formatDate: function (dateObj) {
      // const dateObj = new Date(date);
      let year = dateObj.getFullYear();
      let month = (dateObj.getMonth() + 1).toString();
      let day = dateObj.getDate().toString();
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    },

    // ensureLogin: function () {
    //   if (!app.locals.session.user) {
    //     app.locals.res.redirect("/login");
    //   } else {
    //   }
    // },
  },
});

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME,
  api_key: env.CLOUDINARY.API_KEY,
  api_secret: env.CLOUDINARY.API_SECRET,
  secure: env.CLOUDINARY.SECURE,
});

app.engine("hbs", hbs.engine);

app.get("/", function (req, res) {
  res.status(200).redirect("/blog");
});

app.get("/categories/add", function (req, res) {
  if (req.session.user) {
    if (req.session.user) {
      res.status(200).render("addCategory");
    } else {
      res.redirect("/login");
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/posts/delete/:id", function (req, res) {
  if (req.session.user) {
    blog
      .deletePostById(req.params.id)
      .then(() => res.status(200).redirect("/posts"))
      .catch(() => {
        logger.error(`Destory Error : ${err}`);
        res.status(500).send("Unable to Remove Post / Post not found");
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/categories/delete/:id", function (req, res) {
  if (req.session.user) {
    blog
      .deleteCategoryById(req.params.id)
      .then(() => res.status(200).redirect("/categories"))
      .catch((err) => {
        logger.error(`Destory Error : ${err}`);
        res.status(500).send("Unable to Remove category / Category not found");
      });
  } else {
    res.redirect("/login");
  }
});

app.post("/categories/add", function (req, res) {
  if (req.session.user) {
    blog
      .createCategory(req.body.category)
      .then(() => res.status(200).redirect("/categories"))
      .catch((err) => {
        logger.error(`Creation Error : ${err}`);
        res.send(`Problem with creating category ..... ${err}`);
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/about", function (req, res) {
  res.status(200).render("about");
});

app.get("/blog", async (req, res) => {
  let viewData = {};

  try {
    let posts = [];
    if (req.query.category) {
      posts = await blog.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blog.getPublishedPosts();
    }

    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));

    let post = posts[0];
    viewData.posts = posts;
    viewData.post = post;
  } catch (err) {
    viewData.message = "no results";
  }

  try {
    let categories = await blog.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.status(200).render("blog", { data: viewData });
});

app.get("/blog/:id", async (req, res) => {
  let viewData = {};

  try {
    let posts = [];
    if (req.query.category) {
      posts = await blog.getPublishedPostsByCategory(req.query.category);
    } else {
      posts = await blog.getPublishedPosts();
    }
    posts.sort((a, b) => new Date(b.postDate) - new Date(a.postDate));
    viewData.posts = posts;
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    viewData.post = await blog.getPostById(req.params.id);
  } catch (err) {
    viewData.message = "no results";
  }
  try {
    let categories = await blog.getCategories();
    viewData.categories = categories;
  } catch (err) {
    viewData.categoriesMessage = "no results";
  }
  res.status(200).render("blog", { data: viewData });
});

//setup posts route
app.get("/posts:minDate", function (req, res) {
  if (req.session.user) {
    var minDate = req.query.minDate;
    blog
      .getPostsByMinDate(minDate)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.send(`Problem with fetching All posts..... ${err}`);
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/posts:category", function (req, res) {
  if (req.session.user) {
    var id = req.query.category;
    blog
      .getPostsByCategory(id)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.send(`Problem with fetching All posts..... ${err}`);
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/posts", function (req, res) {
  if (req.session.user) {
    var category = req.query.category;
    var id = req.query.id;
    var minDate = req.query.minDate;

    if (typeof category !== "undefined") {
      blog
        .getPostsByCategory(category)
        .then((data) => {
          res.render("post", { posts: data });
        })
        .catch(() => {
          res.render("posts", { message: "no results" });
        });
    } else if (typeof id !== "undefined") {
      blog
        .getPostById(id)
        .then((data) => {
          res.json(data);
        })
        .catch(() => {
          res.render("posts", { message: "no results" });
        });
    } else if (typeof minDate !== "undefined") {
      blog
        .getPostsByMinDate(minDate)
        .then((data) => {
          res.json(data);
        })
        .catch(() => {
          res.render("posts", { message: "no results" });
        });
    } else {
      blog
        .getAllPosts()
        .then((data) => {
          res.status(200).render("post", { posts: data });
        })
        .catch(() => {
          res.status(200).render("post", { message: "no results" });
        });
    }
  } else {
    res.redirect("/login");
  }
});

app.get("/categories", function (req, res) {
  if (req.session.user) {
    blog
      .getCategories()
      .then((data) => {
        res.status(200).render("catergory", { categories: data });
      })
      .catch(() => {
        res.status(200).render("catergory", { message: "no results" });
      });
  } else {
    res.redirect("/login");
  }
});

app.get("/posts/add", function (req, res) {
  if (req.session.user) {
    blog
      .getCategories()
      .then((data) => {
        res.status(200).render("addPost", { categories: data });
      })
      .catch(() => {
        res.status(200).render("addPost", { categories: [] });
      });
  } else {
    res.redirect("/login");
  }
});

app.post("/imgadd", upload.single("featureImage"), function (req, res, next) {
  let streamUpload = (req) => {
    return new Promise((resolve, reject) => {
      let stream = cloudinary.uploader.upload_stream((error, result) => {
        if (result) {
          resolve(result);
        } else {
          reject(error);
        }
      });

      streamifier.createReadStream(req.file.buffer).pipe(stream);
    });
  };

  async function upload(req) {
    let result = null
    try {
       result = await streamUpload(req);
      logger.info(`streamUpload : ${result}`);
    } catch (error) {
      logger.error(`streamUpload Error : ${error}`);
    }

    return result;
  }

  upload(req).then((uploaded) => {
    req.body.featureImage = uploaded.url;
    blog
      .getPost(req.body)
      .then(() => {
        res.redirect("/posts");
      })
      .catch((err) => {
        logger.error(`Creation Error : ${err}`);
      });
  });
});

app.get("/register", function (req, res) {
  res.status(200).render("register");
});

app.post("/register", async (req, res) => {
  if (!(req.body.password === req.body.password2)) {
    res.render("register", {
      errorMessage: "Passwords do not match",
    });
  } else if (await authData.checkUserExists(req.body.userName)) {
    res.render("register", {
      errorMessage: " User name taken",
    });
  } else {
    var hashPassword = "";
    try {
      hashPassword = await bcryptService.cryptPassword(10, req.body.password);
    } catch (error) {
      console.error("ERROR : ", error);
    }

    userData = {
      userName: req.body.userName,
      password: hashPassword,
      email: req.body.email,
    };

    authData
      .registerUser(userData)
      .then((result) => {
        res.render("register", {
          successMessage: result,
        });
      })
      .catch((error) => {
        res.render("register", {
          errorMessage: error,
          userName: req.body.userName,
        });
      });
    // console.log("ZZ", req.body.password === req.body.password2);
  }
});

app.get("/login", function (req, res) {
  res.status(200).render("login");
});

app.post("/login", (req, res) => {
  req.body.userAgent = req.get("User-Agent");

  const username = req.body.userName;
  const password = req.body.password;

  console.log(username, password);

  authData
    .checkUser(username)
    .then((user) => {
      bcryptService.dycrptPassword(password, user.password).then((valid) => {
        if (valid) {
          // req.session.user
          var userData = {
            userName: user.userName,
            email: user.email,
            loginHistory: user.loginHistory, // authenticated user's loginHistory
          };
          const session = {
            dateTime: new Date(),
            userAgent: req.get("User-Agent"),
          };

          userData.loginHistory.push(session);
          req.session.user = userData;

          authData.updateUser(userData);
          res.redirect("/posts");
        } else {
          res.render("login", {
            errorMessage: "Invalid username or password",
          });
        }
      });
    })
    .catch(() =>
      res.render("login", {
        errorMessage: "Invalid username or password",
      })
    );
});

app.get("/logout", function (req, res) {
  req.session.reset();
  res.redirect("/");
});

app.get("/userHistory", function (req, res) {
  if (req.session.user) {
    res.render("userHistory", {
      userHistroy: req.session.user.loginHistory,
      user: req.session.user.userName,
      email: req.session.user.email,
    });
  } else {
    res.redirect("/login");
  }
});

var HTTP_PORT = process.env.PORT || env.PORT.HOST;

app.use((req, res) => {
  res.status(404).render("404", {
    Errdata: {
      CODE: 404,
      MESSAGE: "Page Not Found",
      URL: req.url,
    },
  });
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
  logger.error(err.stack);

  res.status(500).render("404", {
    Errdata: {
      CODE: 500,
      MESSAGE: "Internal Server Error",
    },
  });
});

// call this function after the http server starts listening for requests
function onHttpStart() {
  logger.info(`Express http server listening on ${HTTP_PORT}`);
  logger.info(`server listening on: http://localhost:${HTTP_PORT}/`);
}

// if the intialize function successfully invoke then the server should listen on 8080
blog
  .initializeDB()
  .then(authData.initializeMongoDB)
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    logger.error(err);
  });
