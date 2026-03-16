const express = require('express');
const app = express();

require('dotenv').config();

const fs = require('fs')
const bcrypt = require('bcrypt');

const jwt = require('jsonwebtoken');

const cookieParser = require('cookie-parser');
app.use(cookieParser());

const cors = require('cors');
app.use(cors({
    origin: "http://localhost:5173", // ya frontend port
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const signup = require('./modals/signup');

// Middleware that checkes if a user is logged in or not

// const checker = async (req, res, next) => {

//     const token = req.cookies.token;
//     if (!token) {
//         req.user = null;
//         return next();
//     }

//     try {

//         const verifying = await jwt.verify(token, process.env.JWT_SECRET);
//         req.user = verifying;

//         next();
//     } catch (err) {
//         console.log("Error: ", err);
//         req.user = null;
//         next();
//     }
// }

// app.use(['/'], checker);

// Creating the file 

app.post('/inputText', async (req, res) => {

    try {
        const token = req.cookies.token;

        if (token) {
            const verify = await jwt.verify(token, process.env.JWT_SECRET);
            const data = await signup.findOne({ email: verify.email });
            const separateFolder = data._id

            fs.mkdirSync(`./data/${separateFolder}`, { recursive: true });

            fs.writeFile(`./data/${separateFolder}/${req.body.heading.split(' ').join('')}.txt`, req.body.paragraph, () => {
                return res.json({
                    success: true
                })
            });
        }
    } catch (err) {
        console.log(err);
    }
})

// Updating the file data

app.post('/updatingdata', async (req, res) => {

    try {
        const token = req.cookies.token;

        if (token) {
            const verify = await jwt.verify(token, process.env.JWT_SECRET);
            const data = await signup.findOne({ email: verify.email });
            const separateFolder = data._id

            fs.writeFile(`./data/${separateFolder}/${req.body.filename}`, req.body.filedata, () => {
                return res.json({
                    success: true
                })
            });
        }
    } catch (err) {
        console.log(err);
    }
})

// Deleting a file

app.post('/deletingfile', async (req, res) => {

    try {
        const token = req.cookies.token;

        if (token) {
            const verify = await jwt.verify(token, process.env.JWT_SECRET);
            const data = await signup.findOne({ email: verify.email });
            const separateFolder = data._id

            fs.unlink(`./data/${separateFolder}/${req.body.file}`, function (err) {
                if (err) {
                    return res.json({
                        success: false,
                        message: "Something went wrong!"
                    })
                }

                return res.json({
                    success: true
                })

            })
        }
    } catch (err) {
        console.log(err);
    }
})

// Getting the file name

app.get('/getfiles', async (req, res) => {

    try {
        const token = req.cookies.token;

        if (token) {
            const verify = await jwt.verify(token, process.env.JWT_SECRET);
            const data = await signup.findOne({ email: verify.email });
            const separateFolder = data._id

            fs.mkdirSync(`./data/${separateFolder}`, { recursive: true });

            fs.readdir(`./data/${separateFolder}`, (err, files) => {



                if (!files || files.length === 0) {
                    return res.json({
                        success: false,
                        message: "Create files to access them!"
                    })
                }

                return res.json({
                    success: true,
                    files: files
                })

            })
        }
    } catch (err) {
        console.log(err);
    }

})

// Getting the file data

app.post('/getfiledata', async (req, res) => {

    try {
        const token = req.cookies.token;

        if (token) {
            const verify = await jwt.verify(token, process.env.JWT_SECRET);
            const data = await signup.findOne({ email: verify.email });
            const separateFolder = data._id;

            fs.readFile(`./data/${separateFolder}/${req.body.filepath}`, 'utf-8', (err, filedata) => {
                if (err) {
                    console.error(err);
                }
                return res.json({
                    filedata: filedata
                })
            })
        }
    } catch (err) {
        console.log(err);
    }
})

// Signup route

app.post('/signup', async (req, res) => {

    const checkingDuplicacy = await signup.findOne({ email: req.body.formData.email });

    if (checkingDuplicacy || (req.body.formData.password !== req.body.formData.confirmPassword)) {
        return res.json({
            success: false,
            message: "Something went wrong!"
        })
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(req.body.formData.password, salt);

    const addingData = await signup.create({
        email: req.body.formData.email,
        password: hash,
        username: `@default_${salt.slice(0, 5)}`,
        contact_no: req.body.formData.contact

    })

    if (addingData) {

        const token = jwt.sign(
            { email: req.body.formData.email },
            process.env.JWT_SECRET
        );

        res.cookie("token", token);

        return res.json({
            success: true,
            message: "Account Created Successfully!"
        })
    }

})

// Login route

app.post('/login', async (req, res) => {

    const savedPassword = await signup.findOne({ email: req.body.formData.email });

    if (!savedPassword) {
        return res.json({
            success: false,
            message: "User did not exist!"
        })
    }

    const match = await bcrypt.compare(req.body.formData.password, savedPassword.password);
    if (match) {

        const token = jwt.sign(
            { email: savedPassword.email },
            process.env.JWT_SECRET
        );

        res.cookie("token", token);

        return res.json({
            success: true,
            message: "Logged in successfully"
        })
    } else {
        return res.json({
            success: false,
            message: "Wrong credentials"
        })
    }
})

// Redirecting to the login page, If there is no cookie

app.get('/user', (req, res) => {
    if (!req.cookies.token) {
        return res.status(401).json({
            isLoggedIn: false
        });
    }
    return res.status(200).json({
        isLoggedIn: true
    })
});

app.get('/profile', async (req, res) => {

    // try {
    //     const data = await signup.findOne({ email: req.formData.email });
    //     return res.status(200).json({
    //         email: data.email,
    //         username: data.username
    //     })

    // } catch (err) {
    //     return res.status(404).json({
    //         success: false
    //     })
    // }

    try {
        const token = req.cookies.token;
        if (token) {
            const verify = await jwt.verify(token, process.env.JWT_SECRET);
            const findingOne = await signup.findOne({ email: verify.email });
            return res.status(200).json({
                email: findingOne.email,
                username: findingOne.username
            })
        }
    } catch (err) {
        console.log("Error: ", err);
    }

})


app.listen(3000, () => console.log("Server is running!"));