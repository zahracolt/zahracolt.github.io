const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const User = require('./models/User');
const Post = require('./models/Post');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const uploadMiddleware = multer({ dest: 'uploads/' });
const fs = require('fs');
const path = require('path');

const app = express();
const salt = bcrypt.genSaltSync(10);
const secret = 'asdfe45we45w345wegw345werjktjwertkj';

// Middleware function for token verification
function verifyToken(req, res, next) {
    const { token } = req.cookies;
    jwt.verify(token, secret, {}, (err, info) => {
        if (err) {
            return res.status(401).json({ error: 'Invalid token' });
        }
        req.userInfo = info;
        next();
    });
}

app.use(cors({ credentials: true, origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(cookieParser());
app.use('/uploads', express.static(__dirname + '/uploads'));

mongoose.connect('mongodb+srv://McIntyre:882ajVCdLCx4Kl3V@cluster0.o3dzasw.mongodb.net/?retryWrites=true&w=majority');

app.post('/register', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.create({
            username,
            password: bcrypt.hashSync(password, salt),
        });
        res.json(userDoc);
    } catch (e) {
        console.log(e);
        res.status(400).json(e);
    }
});


app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const userDoc = await User.findOne({ username });
        if (!userDoc) {
            return res.status(400).json('User not found'); // Return an error if the user is not found
        }

        const passOk = bcrypt.compareSync(password, userDoc.password);
        if (passOk) {
            // logged in
            jwt.sign({ username, id: userDoc._id }, secret, {}, (err, token) => {
                if (err) throw err;
                res.cookie('token', token).json({
                    id: userDoc._id,
                    username,
                });
            });
        } else {
            res.status(400).json('Wrong Credentials!');
        }
    } catch (error) {
        console.log(error);
        res.status(500).json('Internal Server Error');
    }
});


app.get('/profile', verifyToken, (req, res) => {
    const { username } = req.userInfo;
    res.json({ username });
});

app.post('/logout', verifyToken, (req, res) => {
    res.clearCookie('token').json('ok');
});

app.post('/post', verifyToken, uploadMiddleware.single('file'), async (req, res) => {
    const { originalname, path } = req.file;
    const parts = originalname.split('.');
    const ext = parts[parts.length - 1];
    const newPath = path + '.' + ext;
    fs.renameSync(path, newPath);

    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { title, summary, content } = req.body;
        const postDoc = await Post.create({
            title,
            summary,
            content,
            cover: newPath,
            author: info.id,
        });
        res.json(postDoc);
    });
});

app.put('/post', verifyToken, uploadMiddleware.single('file'), async (req, res) => {
    let newPath = null;
    if (req.file) {
        const { originalname, path } = req.file;
        const parts = originalname.split('.');
        const ext = parts[parts.length - 1];
        newPath = path + '.' + ext;
        fs.renameSync(path, newPath);
    }


    const { token } = req.cookies;
    jwt.verify(token, secret, {}, async (err, info) => {
        if (err) throw err;
        const { id, title, summary, content, cover } = req.body;
        const postDoc = await Post.findById(id);
        const isAuthor = JSON.stringify(postDoc.author) === JSON.stringify(info.id);
        if (!isAuthor) {
            return res.status(400).json('You are not the author!');
        }
        await postDoc.updateOne({
            title,
            summary,
            content,
            cover: newPath ? newPath : postDoc.cover,
            author: info.id,
        });
        res.json(postDoc);
    });
});

app.get('/post', async (req, res) => {
    const posts = await Post.find()
        .populate('author', 'username')
        .sort({ createdAt: -1 })
        .limit(20);
    res.json(posts);
});

app.get('/post/:id', async (req, res) => {
    const { id } = req.params;
    const post = await Post.findById(id).populate('author', 'username');
    res.json(post);
});

app.listen(4000, () => {
    // console.log('Server is running on http://localhost:4000');
});
