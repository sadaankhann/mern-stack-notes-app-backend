require('dotenv').config();

const mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI);

const signUpModal = {

    username : {
        type : String
    },

    email : {
        type : String
    },

    password : {
        type : String
    },

    contact_no : {
        type : Number
    }

}

module.exports = mongoose.model("signup", signUpModal);