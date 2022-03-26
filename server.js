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
// const logger = require("./config/logger");
const blog = require("./blog-service");

const app = express();

// app.use(morgan("combined", { stream: logger.stream }));

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
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static("public"));

cloudinary.config({
  cloud_name: env.CLOUDINARY.CLOUD_NAME,
  api_key: env.CLOUDINARY.API_KEY,
  api_secret: env.CLOUDINARY.API_SECRET,
  secure: env.CLOUDINARY.SECURE,
});

app.get("/", function (req, res) {
  res.status(200).redirect("/blog");
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
  var minDate = req.query.minDate;
  blog
    .getPostsByMinDate(minDate)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.send(`Problem with fetching All posts..... ${err}`);
    });
});

app.get("/posts:category", function (req, res) {
  var id = req.query.category;
  blog
    .getPostsByCategory(id)
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.send(`Problem with fetching All posts..... ${err}`);
    });
});

app.get("/posts", function (req, res) {
  var category = req.query.category;
  var id = req.query.id;
  var minDate = req.query.minDate;

  if (typeof category !== "undefined") {
    blog
      .getPostsByCategory(category)
      .then((data) => {
        res.render("post", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  } else if (typeof id !== "undefined") {
    blog
      .getPostById(id)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.send(`Problem with fetching All posts..... ${err}`);
      });
  } else if (typeof minDate !== "undefined") {
    blog
      .getPostsByMinDate(minDate)
      .then((data) => {
        res.json(data);
      })
      .catch((err) => {
        res.send(`Problem with fetching All posts..... ${err}`);
      });
  } else {
    blog
      .getAllPosts()
      .then((data) => {
        console.error("Serv", data);

        res.status(200).render("post", { posts: data });
      })
      .catch((err) => {
        res.status(200).render("post", { message: "no results" });
      });
  }
});

app.get("/categories", function (req, res) {
  blog
    .getCategories()
    .then((data) => {
      res.status(200).render("catergory", { categories: data });
    })
    .catch((err) => {
      res.status(200).render("catergory", { message: "no results" });
    });
});

app.get("/imgadd", function (req, res) {
  res.status(200).render("addPost");
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
    let result = await streamUpload(req);
    console.log(result);
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
        // logger.error(`Problem with creating data..... ${err}`);
        res.send(`Problem with creating data..... ${err}`);
      });
  });
});

// seting up http server to listen on HTTP_PORT
// Define a port to listen to requests on.
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
  console.error(err.stack);
  res.status(500).render("404", {
    Errdata: {
      CODE: 500,
      MESSAGE: "Internal Server Error",
    },
  });
});

// call this function after the http server starts listening for requests
function onHttpStart() {
  // logger.info(`Express http server listening on ${HTTP_PORT}`);
  // logger.info(`server listening on: http://localhost:${HTTP_PORT}/`);
  console.log(`Express http server listening on ${HTTP_PORT}`);
  console.log(`server listening on: http://localhost:${HTTP_PORT}/`);
}

// if the intialize function successfully invoke then the server should listen on 8080
blog
  .initializeDB()
  .then((result) => {
    // logger.info(returnConfig.authSuccess);
    console.log(result);
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    console.log(err);
    // logger.error(err);
  });
