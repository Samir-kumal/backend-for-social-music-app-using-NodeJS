// const asyncHandler = require("express-async-handler");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

const createToken = (userId, userName, userEmail, userImage, isArtist) => {
  // Set the token payload
  const payload = {
    userId: userId,
    userName: userName,
    userEmail: userEmail,
    userImage: userImage,
    isArtist: isArtist,
  };

  // Generate the token with a secret key and expiration time
  const token = jwt.sign(payload, "Q$r2K6W8n!jCW%Zk", { expiresIn: "1h" });

  return token;
};

const registerUser = async (req, res) => {
  const { name, email, password, image, isArtist } = req.body;

  try {
    // create a new User object
    const newUser = new User({ name, email, password, image, isArtist });

    // save the user to the database
    await newUser.save();
    res.status(200).json({ message: "User registered successfully" });
  } catch (error) {
    console.log(error.message);
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  //check if the email and password are provided
  if (!email || !password) {
    return res
      .status(404)
      .json({ message: "Email and the password are required" });
  }

  try {
    //check for that user in the database
    User.findOne({ email }).then((user) => {
      if (!user) {
        //user not found
        return res.status(404).json({ message: "User not found" });
      }

      //compare the provided passwords with the password in the database
      if (user.password !== password) {
        return res.status(401).json({ message: "Invalid Password!" });
      }

      const token = createToken(
        user._id,
        user.name,
        user.email,
        user.image,
        user.isArtist
      );
      res.status(200).json({ token });
    });
  } catch (error) {
    console.log("error in finding the user", error);
    res.status(500).json({ message: "Internal server Error!" });
  }
};

const getAllUsers = async (req, res) => {
  const loggedInUserId = req.params.userId;
  try {
    const users = await User.find({ _id: { $ne: loggedInUserId } });
    res.status(200).json(users);
  } catch (error) {
    console.log("Error retrieving users", error);
    res.status(500).json({ message: "Error retrieving users" });
  }
};


module.exports = {
    registerUser,
    loginUser,
    getAllUsers,
}