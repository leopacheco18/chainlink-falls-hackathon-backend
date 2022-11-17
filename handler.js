const serverless = require("serverless-http");
const express = require("express");
const cors = require("cors");
const app = express();
const ethers = require("ethers");
const bodyParser = require("body-parser");

const ProductModel = require("./db/Models/Product");
const RandomNumbersModel = require("./db/Models/RandomNumbers");
const ChatsModel = require("./db/Models/Chat");
const MessagesModel = require("./db/Models/Messages");

const abi = require("./json/abiOpenMarket.json");
const { default: mongoose } = require("mongoose");

require("./db/db");
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = "0xA82b4B9355B91Fb28376cb2917c72437f0E8c88e";

app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(
  bodyParser.urlencoded({
    // to support URL-encoded bodies
    extended: true,
  })
);
app.use(cors());
app.get("/", async function (req, res) {
  res.send("Funciona ");
});

app.get("/get-transactions/:address", async function (req, res) {
  const { address } = req.params;

  try {
    const data = await RandomNumbersModel.find({
      $or: [{ from: address }, { to: address }],
    })
    .sort({_id: -1})
    .lean();

    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-mumbai.maticvigil.com/"
    );
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    let maticPrice = await contract.callStatic.getMaticPrice();
    maticPrice = ethers.utils.formatUnits(maticPrice, 8);

    for (let i = 0; i < data.length; i++) {
      let product = await ProductModel.findOne({ tokenId: data[i].objectId }).lean();

      let dataNFT = await contract.callStatic.NFTData(product.tokenId);
      let price = dataNFT[0];
      price = ethers.utils.formatUnits(price, 18);
      let currency = dataNFT[3];
      if (currency === "MATIC") {
        product.priceMatic = price;
        product.priceUSD = parseFloat(price) * parseFloat(maticPrice);
      } else {
        product.priceUSD = price;
        product.priceMatic = parseFloat(price) * parseFloat(maticPrice);
      }
      data[i].product = product;
    }

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.get("/get-chats/:address", async function (req, res) {
  const { address } = req.params;

  try {
    const data = await ChatsModel.find({
      $or: [{ owner: address }, { buyer: address }],
    }).lean();

    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-mumbai.maticvigil.com/"
    );
    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);
    
    let maticPrice = await contract.callStatic.getMaticPrice();
    maticPrice = ethers.utils.formatUnits(maticPrice, 8);

    for (let i = 0; i < data.length; i++) {
      let product = await ProductModel.findOne({ tokenId: data[i].tokenId });
      let dataNFT = await contract.callStatic.NFTData(product.tokenId);
      let lastMsg = await MessagesModel.findOne({chatId: mongoose.Types.ObjectId(data[i]._id)}).sort({date : 'desc'});
      let status = dataNFT[2];
      let price = dataNFT[0];
      price = ethers.utils.formatUnits(price, 18);
      let currency = dataNFT[3];
      if (currency === "MATIC") {
        data[i].priceMatic = price;
      } else {
        data[i].priceMatic = parseFloat(price) * parseFloat(maticPrice);
      }
      data[i].image = product.image;
      data[i].name = product.name;
      data[i].lastMsg = lastMsg.message || 'Empty chat';
      data[i].status = status;
    }

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.post("/delete-chat", async function (req, res) {
  const { chatId } = req.body;
  try {
    const chat = await ChatsModel.findById(chatId);
    if (chat) {
      await chat.remove();
      return res.send({ result: "success", chatId });
    } else {
      return res.send({ result: "error", message: "Chat doesn't exist." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.post("/create-chat", async function (req, res) {
  const { tokenId, owner, buyer } = req.body;
  try {
    const chatExist = await ChatsModel.findOne({
      tokenId,
      owner,
      buyer,
    });

    if (chatExist) {
      return res.send({ result: "Success", chatId: chatExist._id });
    }

    const chat = new ChatsModel({
      tokenId,
      owner,
      buyer,
    });
    await chat.save();
    return res.send({ result: "Success", chatId: chat._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.post("/add-msg", async function (req, res) {
  const { chatId, from, message } = req.body;
  try {
    const messageModel = new MessagesModel({
      chatId,
      from,
      message,
    });
    await messageModel.save();
    res.send({ result: "Success", messageId: messageModel._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.get("/get-messages/:chatId", async function (req, res) {
  const { chatId } = req.params;
  try {
    const data = await MessagesModel.find({ chatId }).sort({ date: "asc" });
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.get("/profile/:address", async function (req, res) {
  const { address } = req.params;

  try {
    const data = await ProductModel.find({ owner: address }).sort({
      tokenId: "desc",
    }).lean();


    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-mumbai.maticvigil.com/"
    );

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    let maticPrice = await contract.callStatic.getMaticPrice();
    maticPrice = ethers.utils.formatUnits(maticPrice, 8);

    for (let i = 0; i < data.length; i++) {
      let dataNFT = await contract.callStatic.NFTData(data[i].tokenId);
      let price = dataNFT[0];
      price = ethers.utils.formatUnits(price, 18);
      let currency = dataNFT[3];
      if (currency === "MATIC") {
        data[i].priceMatic = price;
        data[i].priceUSD = parseFloat(price) * parseFloat(maticPrice);
      } else {
        data[i].priceUSD = price;
        data[i].priceMatic = parseFloat(price) * parseFloat(maticPrice);
      }
      data[i].status = dataNFT[2]
    }

    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.get("/search/:search", async function (req, res) {
  const { search } = req.params;
  try {
    const data = await ProductModel.find({
      name: { $regex: search, $options: "i" },
    })
      .sort({ tokenId: "desc" })
      .lean();


    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-mumbai.maticvigil.com/"
    );

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    let maticPrice = await contract.callStatic.getMaticPrice();
    maticPrice = ethers.utils.formatUnits(maticPrice, 8);

    for (let i = 0; i < data.length; i++) {
      let dataNFT = await contract.callStatic.NFTData(data[i].tokenId);
      let price = dataNFT[0];
      price = ethers.utils.formatUnits(price, 18);
      let currency = dataNFT[3];
      if (currency === "MATIC") {
        data[i].priceMatic = price;
        data[i].priceUSD = parseFloat(price) * parseFloat(maticPrice);
      } else {
        data[i].priceUSD = price;
        data[i].priceMatic = parseFloat(price) * parseFloat(maticPrice);
      }
      data[i].status = dataNFT[2]
    }
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.get("/get-lastest-products", async function (req, res) {
  try {
    const data = await ProductModel.find()
      .sort({ tokenId: "desc" })
      .limit(4)
      .lean();

    const provider = new ethers.providers.JsonRpcProvider(
      "https://rpc-mumbai.maticvigil.com/"
    );

    const signer = new ethers.Wallet(PRIVATE_KEY, provider);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, signer);

    let maticPrice = await contract.callStatic.getMaticPrice();
    maticPrice = ethers.utils.formatUnits(maticPrice, 8);

    for (let i = 0; i < data.length; i++) {
      let dataNFT = await contract.callStatic.NFTData(data[i].tokenId);
      let price = dataNFT[0];
      price = ethers.utils.formatUnits(price, 18);
      let currency = dataNFT[3];
      if (currency === "MATIC") {
        data[i].priceMatic = price;
        data[i].priceUSD = parseFloat(price) * parseFloat(maticPrice);
      } else {
        data[i].priceUSD = price;
        data[i].priceMatic = parseFloat(price) * parseFloat(maticPrice);
      }
      data[i].status = dataNFT[2]
    }
    res.send(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Could not retreive products" });
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
