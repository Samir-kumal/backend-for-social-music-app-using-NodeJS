const mongoose = require("mongoose");
const connectDB = mongoose
  .connect(
    "mongodb+srv://kumalsameer124:wasd@cluster0.konldwo.mongodb.net/test",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => {
    console.log("Connected to Mongo Db");
  })
  .catch((err) => {
    console.log("Error connecting to MongoDb", err);
  });

module.exports = connectDB;