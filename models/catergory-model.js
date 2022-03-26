module.exports = (sequelize, Sequelize) => {
  const Category = sequelize.define(
    "category",
    {
      category_id: {
        type: Sequelize.INTEGER,
        primaryKey: true, // use "project_id" as a primary key
        autoIncrement: true, // automatically increment the value
      },

      category: Sequelize.STRING,
    },
    {
      createdAt: true,
      updatedAt: true,
    }
  );

  return Category;
};
