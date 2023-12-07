const mongoose = require("mongoose");

const NewsongsSchema = new mongoose.Schema({
  songId: {
    type: String,
    ref: "User",
  },
  title: {
    type: String,
    required: true,
  },
  artist:{
    type: String,
    required: true,
  
  },
  imageCover:{
    type: String,
    required: true,
  },
  url: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
  },
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

const Song = mongoose.model('NewSongs',NewsongsSchema);

module.exports = Song;