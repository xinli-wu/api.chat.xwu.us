const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../model/user');
const jwt = require('jsonwebtoken');

router.use(async (req, res, next) => {

  next();

});

router.get('/', auth, async (req, res) => {
  const token = req.headers['authorization'].split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  if (typeof decoded !== 'string' && decoded?.email) {
    const user = await User.findOne({ email: decoded.email }, { _id: 0, __v: 0 });
    res.status(200).send({
      status: 'success',
      message: 'You are logged in, welcome 🙌',
      data: { user }
    });
  } else {
    //no such user
    res.status(401).send({
      status: 'error',
      message: 'You are not logged in 😢',
    });
  }
});


module.exports = router;