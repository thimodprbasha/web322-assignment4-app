const fs = require("fs");

var posts = [];
var categories = [];

module.exports.initialize = function () {
  return new Promise(function (resolve, reject) {
    fs.readFile("./data/posts.json", "utf-8", function (err, data) {
      if (err) reject(err.message);
      posts = JSON.parse(data);
      fs.readFile("./data/categories.json", "utf-8", function (err, data) {
        if (err) return reject(err.message);
        categories = JSON.parse(data);
        resolve();
      });
    });
  });
};

module.exports.getAllPosts = function () {
  return new Promise(function (resolve, reject) {
    if (posts.length === 0) reject("no results returned");
    resolve(posts);
  });
};

module.exports.getPublishedPosts = function () {
  return new Promise(function (resolve, reject) {
    var isPublished = posts.filter(function (post) {
      return post.published === true;
    });
    if (isPublished.length === 1) reject("no results returned");
    resolve(isPublished);
  });
};

module.exports.getPostsByCategory = function (category) {
  return new Promise(function (resolve, reject) {
    var categories = posts.filter(function (post) {
      return post.category === parseInt(category);
    });
    if (categories.length === 0) reject("no results returned");
    resolve(categories);
  });
};

module.exports.getPostsByMinDate = function (minDateStr) {
  return new Promise(function (resolve, reject) {
    var categories = posts.filter(function (post) {
      return new Date(post.postDate) >= new Date(minDateStr);
    });
    if (categories.length === 0) reject("no results returned");
    resolve(categories);
  });
};

module.exports.getPostById = function (id) {
  return new Promise(function (resolve, reject) {
    var categories = posts.filter(function (post) {
      return post.id === parseInt(id);
    });
    if (categories.length === 0) reject("no results returned");
    resolve(categories[0]);
  });
};

module.exports.getCategories = function () {
  return new Promise(function (resolve, reject) {
    if (categories.length === 0) reject("no results returned");
    resolve(categories);
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
    posData.postDate =
      date.getFullYear() +
      "-" +
      String(date.getMonth() + 1).padStart(2, "0") +
      "-" +
      String(date.getDate()).padStart(2, "0");
    posData.id = posts.length + 1;
    posts.push(posData);
    resolve(posts);
  });
};

module.exports.getPublishedPostsByCategory = function (category) {
  return new Promise(function (resolve, reject) {
    var postsdata = posts.filter((data) => {
      return data.published == true && data.category == parseInt(category);
    });

    if (postsdata.length === 0) reject("no result returned");
    resolve(postsdata);
  });
};

// module.exports.streamUpload = function(req , res){
//     return new Promise((resolve, reject) => {
//         let stream = cloudinary.uploader.upload_stream(
//           (error, result) => {
//             if (result) {
//               resolve(result);
//             } else {
//               reject(error);
//             }
//           }
//         );

//        streamifier.createReadStream(req.file.buffer).pipe(stream);
//     });
//     async function upload(req) {
//         let result = await streamUpload(req);
//         console.log(result);
//     }

//     upload(req);

// }
