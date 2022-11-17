const mongoose = require("mongoose");

const randomNumbersSchema = new mongoose.Schema({
  requestId: {
    type: String,
    required: true,
  },
  from: {
    type: String,
    required: true,
  },
  to: {
    type: String,
    required: true,
  },
  objectId: {
    type: String,
  },
  status: {
    type: String,
    required: true,
  },
});

const RandomNumbers = mongoose.model("RandomNumbers", randomNumbersSchema);

module.exports = RandomNumbers;
