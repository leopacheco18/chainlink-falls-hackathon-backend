const mongoose = require("mongoose");

const chatsSchema = new mongoose.Schema({
  tokenId: {
    type: Number,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  buyer: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now
  }
});


const Chats = mongoose.model("Chats", chatsSchema);

module.exports = Chats;