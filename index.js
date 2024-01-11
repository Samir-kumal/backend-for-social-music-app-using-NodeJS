const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
const connectDB = require("./config/database");
const LocalStrategy = require("passport-local").Strategy;
require("dotenv").config();
const app = express();
const port = 9000;
const cors = require("cors");
const colors = require("colors");
app.use(cors());
connectDB();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(passport.initialize());

const cloudinary = require("cloudinary").v2;

const CLOUD_NAME = "dvhbbax7h";
const CLOUDINARY_KEY = "463467489676292";
const CLOUDINARY_SECRET = "k7j0NUYRwm5MsIiVlT23WIr0AYw";
cloudinary.config({
  cloud_name: CLOUD_NAME,
  api_key: CLOUDINARY_KEY,
  api_secret: CLOUDINARY_SECRET,
});

// const { storage } = require('./storage/storage');

//we used upload.single to tell "multer" to upload
// only single image
app.post("/uploadImage",async (req, res) => {
  const { image } = req.body;
  try{
    // uploadImage(image);
  console.log(image);
  res.send("Done");

  }catch (e){
    console.log(e);
  }
});

const uploadImage = async (imageFilePath) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(imageFilePath, {
      folder: "/profileImages",
      resource_type: "auto",
      // Use title as the public_id // Let Cloudinary determine the resource type
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });

    if (uploadResult) {
      console.log("Upload Result:", uploadResult);
    }
    return uploadResult.secure_url; // Return the secure URL of the uploaded image
  } catch (error) {
    console.error("Error uploading image:", error.message);
    throw error; // Propagate the error to the calling function
  }
};
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

const User = require("./models/user");
const Message = require("./models/message");
const Song = require("./models/song");
const NewSongs = require("./models/newSongs");
//endpoint for registration of the user

app.use("/users", require("./routes/userRoutes"))



app.get("/newSongs", (req, res) => {
  NewSongs.find()
    .then((songs) => {
      res.status(200).json(songs);
    })
    .catch((err) => {
      console.log("Error retrieving users", err);
      res.status(500).json({ message: "Error retrieving songs" });
    });
});

app.get("/songs", async (req, res) => {
  try {
    // Fetch songs from Cloudinary (replace 'tag' with your Cloudinary tag)
    const cloudinaryResponse = await cloudinary.search
      .expression("songs")
      .max_results(10) // adjust as needed
      .execute();

    const songs = cloudinaryResponse.resources.map((resource) => ({
      title: resource.filename,
      artist: resource.uploaded_by,
      url: resource.secure_url,
    }));

    res.json(songs);
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const uploadSong = async (songFilePath, title, artist) => {
  try {
    const uploadResult = await cloudinary.uploader.upload(songFilePath, {
      folder: "/discoverNewSongs",
      resource_type: "video",
      public_id: title, // Use title as the public_id // Let Cloudinary determine the resource type
      context: {
        artist: artist,
      },
    });

    if (uploadResult) {
      const imageCover = ImageCover;
      console.log("Upload Result:", uploadResult);
      const assetId = uploadResult.asset_id;
      const url = uploadResult.secure_url;
      const duration = uploadResult.duration;
      const title = uploadResult.original_filename;
      const artist = uploadResult.context.custom.artist;
      // const newSong = new Song({ songId:assetId, title:title, artist:artist, url:url, duration:duration });
      // newSong
      const newSong = new NewSongs({
        songId: assetId,
        title: title,
        artist: artist,
        imageCover: imageCover,
        url: url,
        duration: duration,
      });
      newSong
        .save()
        .then(() => {
          console.log("message: Song Added successfully");
        })
        .catch((err) => {
          console.log("Error registering Song", err);
        });
    }
    return uploadResult.secure_url; // Return the secure URL of the uploaded song
  } catch (error) {
    console.error("Error uploading song:", error.message);
    throw error; // Propagate the error to the calling function
  }
};

const songFilePath =
  "./newsongs/Taylor Swift - Lover (Official Music Video).mp3";
const title = "Taylor Swift - Lover";
const artist = "Taylor Swift";
const ImageCover =
  "https://i.scdn.co/image/ab67616d00001e02e787cffec20aa2a396a61647";
// uploadSong(songFilePath, title, artist)
//   .then((songUrl) => {
//     console.log('Song uploaded successfully. URL:', songUrl);
//   })
//   .catch((error) => {
//     console.error('Song upload failed:', error);
//   });

app.post("/uploadSong", async (req, res) => {
  const { songFilePath, title, artist, ImageCover } = req.body;
  uploadSong(songFilePath, title, artist)
    .then((songUrl) => {
      console.log("Song uploaded successfully. URL:", songUrl);
    })
    .catch((error) => {
      console.error("Song upload failed:", error);
    });
});

//endpoint to access all the users except the user who's is currently logged in!
// app.get("/users/:userId", (req, res) => {
//   const loggedInUserId = req.params.userId;

//   User.find({ _id: { $ne: loggedInUserId } })
//     .then((users) => {
//       res.status(200).json(users);
//     })
//     .catch((err) => {
//       console.log("Error retrieving users", err);
//       res.status(500).json({ message: "Error retrieving users" });
//     });
// });

//get list of all the registered users
app.get("/users", (req, res) => {
  User.find()
    .then((users) => {
      res.status(200).json(users);
    })
    .catch((err) => {
      console.log("Error retrieving users", err);
      res.status(500).json({ message: "Error retrieving users" });
    });
});

//endpoint to send a request to a user
app.post("/follow-request", async (req, res) => {
  const { currentUserId, selectedUserId } = req.body;
  console.log(currentUserId, selectedUserId);
  try {
    //update the recepient's friendRequestsArray!
    await User.findByIdAndUpdate(selectedUserId, {
      $push: { friendRequests: currentUserId },
    });

    //update the sender's sentFriendRequests array
    await User.findByIdAndUpdate(currentUserId, {
      $push: { sentFriendRequests: selectedUserId },
    });

    res.sendStatus(200);
  } catch (error) {
    res.sendStatus(500);
  }
});

//endpoint to show all the friend-requests of a particular user
app.get("/follow-request/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user document based on the User id
    const user = await User.findById(userId)
      .populate("friendRequests", "name email image")
      .lean();

    const friendRequests = user.friendRequests;

    res.json(friendRequests);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//endpoint to accept a friend-request of a particular person
app.post("/friend-request/accept", async (req, res) => {
  try {
    const { senderId, recepientId } = req.body;

    //retrieve the documents of sender and the recipient
    const sender = await User.findById(senderId);
    const recepient = await User.findById(recepientId);

    sender.friends.push(recepientId);
    recepient.friends.push(senderId);

    recepient.friendRequests = recepient.friendRequests.filter(
      (request) => request.toString() !== senderId.toString()
    );

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (request) => request.toString() !== recepientId.toString
    );

    await sender.save();
    await recepient.save();

    res.status(200).json({ message: "Friend Request accepted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

//endpoint to access all the friends of the logged in user!
app.get("/accepted-friends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "friends",
      "name email image"
    );
    const acceptedFriends = user.friends;
    res.json(acceptedFriends);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

const multer = require("multer");

// Configure multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "files/"); // Specify the desired destination folder
  },
  filename: function (req, file, cb) {
    // Generate a unique filename for the uploaded file
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});
const upload = multer({ storage });

//endpoint to post Messages and store it in the backend
app.post("/messages", upload.single("imageFile"), async (req, res) => {
  try {
    const { senderId, recepientId, messageType, messageText } = req.body;

    const newMessage = new Message({
      senderId,
      recepientId,
      messageType,
      message: messageText,
      timestamp: new Date(),
      imageUrl: messageType === "image" ? req.file.path : null,
    });

    await newMessage.save();
    res.status(200).json({ message: "Message sent Successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

///endpoint to get the userDetails to design the chat Room header
app.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    //fetch the user data from the user ID
    const recepientId = await User.findById(userId);

    res.json(recepientId);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//endpoint to fetch the messages between two users in the chatRoom
app.get("/messages/:senderId/:recepientId", async (req, res) => {
  try {
    const { senderId, recepientId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, recepientId: recepientId },
        { senderId: recepientId, recepientId: senderId },
      ],
    }).populate("senderId", "_id name");

    res.json(messages);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//endpoint to delete the messages!
app.post("/deleteMessages", async (req, res) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ message: "invalid req body!" });
    }

    await Message.deleteMany({ _id: { $in: messages } });

    res.json({ message: "Message deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Internal Server" });
  }
});

app.get("/friend-requests/sent/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("sentFriendRequests", "name email image")
      .lean();

    const sentFriendRequests = user.sentFriendRequests;

    res.json(sentFriendRequests);
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ error: "Internal Server" });
  }
});

app.get("/friends/:userId", (req, res) => {
  try {
    const { userId } = req.params;

    User.findById(userId)
      .populate("friends")
      .then((user) => {
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        const friendIds = user.friends.map((friend) => friend._id);

        res.status(200).json(friendIds);
      });
  } catch (error) {
    console.log("error", error);
    res.status(500).json({ message: "internal server error" });
  }
});
