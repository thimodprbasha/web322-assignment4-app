module.exports = (sequelize, Sequelize) => {
  const Post = sequelize.define(
    "post",
    {
      post_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },

      body: Sequelize.TEXT,
      title: Sequelize.STRING,
      postDate: Sequelize.DATE,
      featureImage: Sequelize.STRING,
      published: Sequelize.BOOLEAN,
    },
    {
      createdAt: true,
      updatedAt: true,
    }
  );

  return Post


};
