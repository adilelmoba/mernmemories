import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

import User from '../models/user.js'

export const signin = async (request, response) => {
  const {email, password} = request.body;

  try {
    const existingUser = await User.findOne({email});

    if(!existingUser) return response.status(404).json({message: "User doesn't exist."});

    const isPasswordCorrect = await bcrypt.compare(password, existingUser.password);

    if(!isPasswordCorrect) return response.status(400).json({message: "Inavlid credentials."});

    const token = jwt.sign({email: existingUser.email, id: existingUser._id}, 'test', {expiresIn: "1h"})

    response.status(200).json({result: existingUser, token})
  } catch (error) {
    response.status(500).json({message: 'Something went wrong!'})
  }
}

export const signup = async (request, response) => {
  const {email, password, confirmPassword, firstName, lastName} = request.body;

  try {
    const existingUser = await User.findOne({email});

    if(existingUser) return response.status(400).json({message: "User already exists."});

    if(password !== confirmPassword) return response.status(400).json({message: "Passwords don't match."});

    const hashedPassword = await bcrypt.hash(password, 12);

    const result = await User.create({email, password: hashedPassword, name: `${firstName} ${lastName}`});

    const token = jwt.sign({email: result.email, id: result._id}, 'test', {expiresIn: "1h"});

    response.status(200).json({result, token})
  } catch (error) {
    console.error(error);
    response.status(500).json({message: 'Something went wrong!'})
  }
}