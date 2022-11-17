const mongoose = require('mongoose');
require('dotenv').config();
/* A way to set the name of the database. */
const MONGODB_URL = process.env.MONGODB_URL;

/* Connecting to the database. */
mongoose.connect(MONGODB_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});
