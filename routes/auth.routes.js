const {Router} = require('express')
const bcrypt = require('bcryptjs')
const { check, validationResult } = require('express-validator')
const User = require('../models/User')
const router = Router()

//api/auth/register
router.post(
  '/register', 
  [
    check('email', 'wrong email format').isEmail(),
    check('password', 'password should be more than 6 letters').isLength({min: 6})
  ],
  async(req, res)=> {
    try {

      const {email, password} = req.body

      const candidate = await User.findOne({ email })

      if (candidate) {
        return res.status(400).json({message:'this email is already exists'})
      }

      const hashedPassword = await bcrypt.hash(password, 12)
      const user = new User ({email, password: hashedPassword})

      user.save()

      res.status(201).json({ message: 'new user created' })
    } catch (e) {
      res.status(500).json({message: 'something wrONg, try again'})
    }
})

module.exports = router