const model = require('../model/model')
const mongoose = require('mongoose')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
require('dotenv/config');

const userController = {
    login: async (req, res) => {
        try {
            console.log(req.body)
            const findUser = await model.User.findOne({ username: req.body.username });
            if (findUser) {
                const result = await bcrypt.compare(req.body.password, findUser.password);
                if (result) {
                    const payload = {
                        id: findUser.id,
                        username: findUser.username,
                    };

                    const accessToken = jwt.sign(payload, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30 days' });
                    res.status(200).json({
                        result: result,
                        token: accessToken
                    });
                }
                else {
                    res.status(400).json({
                        result: result,
                        msg: 'Username hoặc password không khớp!'
                    });
                    return;
                }
            }
            else {
                return res.status(400).json({ result: false, msg: 'Username không tồn tại.' });
            }
        } catch (err) {
            res.status(500).json({ result: false, msg: err.message });
        }
    },
    addUser: async (req, res) => {
        try {
            // Check if a user with the same username already exists
            const existingUser = await model.User.findOne({ username: req.body.username });

            if (existingUser) {
                return res.status(400).json({ success: false, msg: 'Username đã tồn tại.' });
            }

            req.body.password = await bcrypt.hash(req.body.password, 10);
            const newUser = new model.User(req.body);
            const savedUser = await newUser.save();
            res.status(200).json(savedUser);
        } catch (err) {
            res.status(500).json({ success: false, msg: err.message });
        }
    }
}

module.exports = userController;