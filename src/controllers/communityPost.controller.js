import mongoose, { isValidObjectId, mongo } from "mongoose"
import {CommunityPost} from "../models/coomunityPost.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//status:working
const getAllCommunityPosts = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const posts = await CommunityPost.find({})
    .sort({ createdAt: -1 }) // latest first
    .skip((page - 1) * limit)
    .limit(parseInt(limit))
    .populate("owner", "fullName userName avatar"); // optional: to show user info

  const totalPosts = await CommunityPost.countDocuments();

  return res.status(200).json(
    new ApiResponse(200, {
      posts,
      totalPages: Math.ceil(totalPosts / limit),
      currentPage: Number(page),
    }, "All community posts fetched successfully")
  );
});

//status:working
const createCommunityPost = asyncHandler(async (req, res) => {
    //TODO: create post

    //get user id
    //verify user
    //get post content from body
    //create post

    const ownerId = req.user._id

    const {content} = req.body

    if(!content || content.trim()===""){
        throw new ApiError(400,"Post content is required")
    }

    const post = await CommunityPost.create({
        content,
        owner : ownerId
    })

    if(!post){
        throw new ApiError(500,"Error while creating post")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,post,"Community post created successfully"))
})

//status:working
const getUserCommunityPost = asyncHandler(async (req, res) => {
    // TODO: get user posts

    //get user id
    //verify user
    //find the owner and populate the fields

    const ownerId = req.user._id

    const posts = await CommunityPost.find({owner : ownerId}).populate("owner", "fullName userName avatar")

    if(!posts || posts.length===0){             // If no posts found, return empty array
        return res
        .status(200)
        .json(new ApiResponse(200,[],"No posts found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,posts,"User posts have been fetched successfully"))
})

//status:working
const updateCommunityPost = asyncHandler(async (req, res) => {
    //TODO: update post

    //get post id from url
    //get current user from req.user
    //verify id
    //check if post post exists in DB
    //check whether current user is post owner
    //get new details from body
    //update the post

    const {communityPostId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(communityPostId)){
        throw new ApiError(400,"Invalid post")
    }

    const post = await CommunityPost.findById(communityPostId)

    if(!post){
        throw new ApiError(404,"Post not found")
    }

    if(post.owner.toString()!==userId.toString()){
        throw new ApiError(403,"Unauthorized access")
    }

    const {content} = req.body

    if(!content || content.trim()===""){
        throw new ApiError(400,"New content required")
    }

    const updatedPost = await CommunityPost.findByIdAndUpdate(
        communityPostId,
        {
            $set : {
                content,
            }
        },
        {
            new : true
        }
    )

    if(!updatedPost){
        throw new ApiError(500,"Error while updating post")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPost,"Post has been updated successfully"))
})

//status:working
const deleteCommunityPost = asyncHandler(async (req, res) => {
    //TODO: delete post

    //get post id from url
    //get current user id 
    //verify post id
    //check that current user is the owner
    //delete the post

    const {communityPostId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(communityPostId)){       //verify post id
        throw new ApiError(400,"Invalid post")
    }

    const post = await CommunityPost.findById(communityPostId)        // find post in db

    if(!post){
        throw new ApiError(404,"Post does not exist")
    }

    if(post.owner.toString()!==userId.toString()) {                  //check if current user is owner of post
        throw new ApiError(403,"Unauthorized access")
    }
    
    const deletedPost = await CommunityPost.findByIdAndDelete(communityPostId)

    if(!deletedPost){
        throw new ApiError(500,"Error while deleting post")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Post has been deleted successfully"))
})

export {
    createCommunityPost,
    getUserCommunityPost,
    updateCommunityPost,
    deleteCommunityPost,
    getAllCommunityPosts
}