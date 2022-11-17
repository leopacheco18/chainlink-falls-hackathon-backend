const mongoose = require("mongoose");

const messagesSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chats" },
  from: {
    type: String,
    required: true,
  },
  message: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const Messages = mongoose.model("Messages", messagesSchema);

module.exports = Messages;
