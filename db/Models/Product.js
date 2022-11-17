const mongoose = require("mongoose");

const productsSchema = new mongoose.Schema({
  tokenId: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  price: {
    type: String,
    required: true,
  },
  owner: {
    type: String,
    required: true,
  },
  image: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
  },
  flag: {
    type: String,
    required: true,
  },
});


const Products = mongoose.model("Products", productsSchema);

module.exports = Products;