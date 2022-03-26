const env = require("../env");
const Sequelize = require("sequelize");
const models = require("./post-model");

var sequelize = new Sequelize(env.DB.DATABASE, env.DB.USER, env.DB.PASSWORD, {
  host: env.DB.HOST,
  dialect: env.DB.DIALECT,
  port: env.DB.PORT,
  dialectOptions: env.DB.DIALECT_OPTION,
  query: env.DB.QUERY,
  logging: false
});

const Post = require("./post-model")(sequelize, Sequelize);
const Category = require("./catergory-model")(sequelize, Sequelize);

Category.hasMany(Post);
Post.belongsTo(Category);

const dbConfig = {};

dbConfig.Sequelize = Sequelize;
dbConfig.sequelize = sequelize;
dbConfig.model = {};
dbConfig.model.post = Post;
dbConfig.model.category = Category;

module.exports = dbConfig;
