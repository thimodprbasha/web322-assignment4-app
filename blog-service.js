const sequelizeController = require("./models/initialize-db");
const postQueryController = sequelizeController.model.post;
const categoryQueryController = sequelizeController.model.category;

const env = require("./env");

module.exports.initializeDB = () => {
  return new Promise(function (resolve, reject) {
    sequelizeController.sequelize
      .sync()
      .then(() => {
        resolve(
          `Connection has been established with ${env.DB.DATABASE} successfully.`
        );
      })
      .catch((error) => {
        reject(error);
      });
  });

  return;
};

let formatDate = (dateObj) => {
  return (
    dateObj.getFullYear() +
    "-" +
    String(dateObj.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(dateObj.getDate()).padStart(2, "0")
  );
};

module.exports.getAllPosts = function () {
  return new Promise(function (resolve, reject) {
    let Post = [];

    postQueryController
      .findAll()
      .then((data) => {
        data.forEach((element) => {
          console.log(element);
          let post = {};
          post.id = element.post_id;
          post.body = element.body;
          post.title = element.title;
          post.postDate = formatDate(new Date(element.postDate));
          post.featureImage = element.featureImage;
          post.published = element.published;
          post.category =
            element.categoryCategoryId === null
              ? "null"
              : element.categoryCategoryId;
          Post.push(post);
        });
        if (Post.length === 0) reject("no results returned");
        resolve(Post);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports.getPublishedPosts = function () {
  return new Promise(function (resolve, reject) {
    let Post = [];
    postQueryController
      .findAll({ where: { published: true } })
      .then((data) => {
        data.forEach((element) => {
          console.log(element);
          let post = {};
          post.id = element.post_id;
          post.body = element.body;
          post.title = element.title;
          post.postDate = formatDate(new Date(element.postDate));
          post.featureImage = element.featureImage;
          post.published = element.published;
          post.category = element.categoryCategoryId;
          Post.push(post);
        });
        if (Post.length === 0) reject("no results returned");
        resolve(Post);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports.getPostsByCategory = function (category) {
  return new Promise(function (resolve, reject) {
    let Post = [];
    postQueryController
      .findAll({ where: { category: category } })
      .then((data) => {
        data.forEach((element) => {
          console.log(element);
          let post = {};
          post.id = element.post_id;
          post.body = element.body;
          post.title = element.title;
          post.postDate = formatDate(new Date(element.postDate));
          post.featureImage = element.featureImage;
          post.published = element.published;
          post.category = element.categoryCategoryId;
          Post.push(post);
        });
        if (Post.length === 0) reject("no results returned");
        resolve(Post);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports.getPostsByMinDate = function (minDateStr) {
  return new Promise(function (resolve, reject) {
    let Post = [];
    postQueryController
      .findAll()
      .then((data) => {
        data.forEach((element) => {
          console.log(element);
          let post = {};
          post.id = element.post_id;
          post.body = element.body;
          post.title = element.title;
          post.postDate = formatDate(new Date(element.postDate));
          post.featureImage = element.featureImage;
          post.published = element.published;
          post.category =
            element.categoryCategoryId === null
              ? "null"
              : element.categoryCategoryId;
          Post.push(post);
        });
        const filteredData = Post.filter(function (post) {
          return new Date(post.postDate) >= new Date(minDateStr);
        });
        if (filteredData.length === 0) reject("no results returned");
        resolve(filteredData);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports.getPostById = function (id) {
  return new Promise(function (resolve, reject) {
    let Post = [];
    postQueryController
      .findAll({ where: { post_id: id } })
      .then((data) => {
        data.forEach((element) => {
          console.log(element);
          let post = {};
          post.id = element.post_id;
          post.body = element.body;
          post.title = element.title;
          post.postDate = formatDate(new Date(element.postDate));
          post.featureImage = element.featureImage;
          post.published = element.published;
          post.category = element.categoryCategoryId;
          Post.push(post);
        });
        if (Post.length === 0) reject("no results returned");
        resolve(Post);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports.getCategories = function () {
  return new Promise(function (resolve, reject) {
    let Category = [];
    categoryQueryController
      .findAll()
      .then((data) => {
        data.forEach((element) => {
          console.log(element);
          let CategoryObj = {};
          CategoryObj.id = element.category_id;
          CategoryObj.category = element.category;
          Category.push(CategoryObj);
        });
        if (Category.length === 0) reject("no results returned");
        resolve(Category);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports.getPost = function (posData) {
  return new Promise(function (resolve, reject) {
    if (posData === null) {
      reject("no data");
    }
    if (typeof posData.published === "undefined") {
      posData.published = false;
    } else {
      posData.published = true;
    }

    let date = new Date();
    const currentDate =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");

    let Post = {
      title: posData.title,
      body: posData.body,
      featureImage: posData.featureImage,
      postDate: currentDate,
      published: posData.published,
      categoryCategoryId: posData.category,
    };

    postQueryController
      .create(Post)
      .then((result) => {
        resolve(result);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

module.exports.getPublishedPostsByCategory = function (category) {
  return new Promise(function (resolve, reject) {
    let Post = [];
    postQueryController
      .findAll({
        where: {
          categoryCategoryId: { like: "%" + category + "%" },
          published: { like: "%" + true + "%" },
        },
      })
      .then((data) => {
        data.forEach((element) => {
          console.log(element);
          let post = {};
          post.id = element.post_id;
          post.body = element.body;
          post.title = element.title;
          post.postDate = formatDate(new Date(element.postDate));
          post.featureImage = element.featureImage;
          post.published = element.published;
          post.category = element.categoryCategoryId;
          Post.push(post);
        });
        if (Post.length === 0) reject("no results returned");
        resolve(Post);
      })
      .catch((error) => {
        reject(error);
      });
  });
};
