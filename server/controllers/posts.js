import mongoose from "mongoose";

import PostMessage from "../models/postMessage.js";

export const getPost = async (request, response) => {
  const {id} = request.params;

  try {
    const post = await PostMessage.findById(id);

    response.status(200).json(post)
  } catch(error) {
    response.status(404).json({message: error.message})
  }
}

export const getPosts = async (request, response) => {
  const {page} = request.query;

  try {
    const LIMIT = 1;
    const startIndex = (Number(page) - 1) * LIMIT; // GET THE STARTING INDEX OF EVERY PAGE
    const total = await PostMessage.countDocuments({});

    const posts = await PostMessage.find().sort({_id: -1}).limit(LIMIT).skip(startIndex);

    response.status(200).json({data: posts, currentPage: Number(page), numberOfPages: Math.ceil(total / LIMIT)});
  } catch (error) {
    response.status(404).json({ message: error.message });
  }
};

export const getPostsBySearch = async (request, response) => {
  // QUERY -> /posts?page=1 -> page = 1
  // PARAMS -> /posts/:id -> /posts/123 -> id = 123
  const {searchQuery, tags} = request.query;


  try {
    const title = new RegExp(searchQuery, 'i'); // Test test tEsT TEST -> test

    const posts = await PostMessage.find({
      $or: [
        { title },
        { 
          tags: { 
            $in: tags.split(',') 
          }
        }
      ]
    })

    response.json({data: posts});
  } catch (error) {
    console.error(error);
    response.status(404).json({message: error.message})
  }
}

export const createPost = async (request, response) => {
  const post = request.body;

  const newPost = new PostMessage({...post, creator: request.userId, createdAt: new Date().toISOString()});

  try {
    await newPost.save();

    response.status(201).json(newPost);
  } catch (error) {
    response.status(409).json({ message: error.message });
  }
};

export const updatePost = async (request, response) => {
  const { id: _id } = request.params;
  const post = request.body;

  if (!mongoose.Types.ObjectId.isValid(_id))
    return response.status(404).send("No post with that id");

  const updatedPost = await PostMessage.findByIdAndUpdate(
    _id,
    { ...post, _id },
    { new: true }
  );

  response.json(updatedPost);
};

export const deletePost = async(request, response) => {
  const { id } = request.params

  if (!mongoose.Types.ObjectId.isValid(id))
    return response.status(404).send("No post with that id");

    await PostMessage.findByIdAndRemove(id);

    return response.json({message: 'Post deleted successfully'})
}

export const likePost = async (request, response) => {
  const {id} = request.params;

  if(!request.userId) return response.json({message: 'Unauthenticated'});

  if (!mongoose.Types.ObjectId.isValid(id))
    return response.status(404).send("No post with that id");

 const post = await PostMessage.findById(id);

 const index = post.likes.findIndex((id) => id === String(request.userId));

 if(index === -1) {
   // LIKE THE POST
   post.likes.push(request.userId)
 } else {
   // DISLIKE THE POST
   post.likes = post.likes.filter((id) => id !== String(request.userId))
 }

 const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {new: true})

 response.json(updatedPost)
}

export const commentPost = async(request, response) => {
  const {id} = request.params;
  const {value} = request.body;

  const post = await PostMessage.findById(id);

  post.comments.push(value);

  const updatedPost = await PostMessage.findByIdAndUpdate(id, post, {new: true})

  return response.json(updatedPost)
}
