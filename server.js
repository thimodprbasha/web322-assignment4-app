var express = require("express");
var path = require("path");
const blog = require("./blog-service");
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const env = require("./env");
const handlebars = require("express-handlebars");
const upload = multer();
const stripJs = require("strip-js");

var app = express();

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
  },
});

app.engine("hbs", hbs.engine);
app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "/views"));
app.use(express.static("public"));

app.use(function (req, res, next) {
  let route = req.path.substring(1);
  app.locals.activeRoute =
    route == "/" ? "/" : "/" + route.replace(/\/(.*)/, "");
  app.locals.viewingCategory = req.query.category;
  next();
});

app.use(function (req, res, next) {
  res.status(404);
  if (req.accepts("html")) {
    res.render("404", { url: req.url });
    return;
  }
});

cloudinary.config({
  cloud_name: env.CLOUD_NAME,
  api_key: env.API_KEY,
  api_secret: env.API_SECRET,
  secure: true,
});

app.get("/", function (req, res) {
  res.redirect("/about");
});

app.get("/about", function (req, res) {
  res.render("about");
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
  console.log(viewData.post);
  res.render("blog", { data: viewData });
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
  console.log(viewData.post);
  res.render("blog", { data: viewData });
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
  console.log(id);
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

  console.log(id, minDate, category);
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
        res.render("post", { posts: data });
      })
      .catch((err) => {
        res.render("posts", { message: "no results" });
      });
  }
});

app.get("/categories", function (req, res) {
  blog
    .getCategories()
    .then((data) => {
      res.render("catergory", { categories: data });
    })
    .catch((err) => {
      res.render("catergory", { message: "no results" });
    });
});

app.get("/posts/add", function (req, res) {
  res.render("addPost");
});

app.post(
  "/posts/add",
  upload.single("featureImage"),
  function (req, res, next) {
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
        .then((data) => {
          res.json(data);
        })
        .catch((err) => {
          res.send(`Problem with creating data..... ${err}`);
        });
    });
  }
);

// seting up http server to listen on HTTP_PORT
// Define a port to listen to requests on.
var HTTP_PORT = process.env.PORT || 8081;

app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
});

// call this function after the http server starts listening for requests
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
  console.log("server listening on: http://localhost:8080/");
}

// if the intialize function successfully invoke then the server should listen on 8080
blog
  .initialize()
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    console.log(
      `There was a problem invoking the initialize function ... ${err}`
    );
  });
