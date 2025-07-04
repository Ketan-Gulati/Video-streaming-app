import mongoose from "mongoose"
import {Comment} from "../models/comment.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//status:working
const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video

    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video")
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const comments = await Comment.find({video : videoId})
                                .populate("owner","userName avatar")
                                .sort({ createdAt: -1 })            //gets latest comments first
                                .skip(skip)
                                .limit(parseInt(limit));

     const totalComments = await Comment.countDocuments({ video: videoId });   // to count number of comments                            

    if(comments.length===0){
        return res
        .status(200)
        .json(new ApiResponse(200,{comments : [], totalComments},"No comments"))
    }
    
    return res
    .status(200)
    .json(new ApiResponse(200,{comments, totalComments},"Comments fetched successfully"))
})

//status:working
const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    const {videoId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video")
    }

    const {content} = req.body

    if(!content || content.trim()===""){
        throw new ApiError(400,"Comment can't be empty")
    }

    const newComment = await Comment.create(
        {
            content,
            video : videoId,
            owner : userId
        }
    )

    if(!newComment){
        throw new ApiError(500,"Error while creating the comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,newComment,"Comment created successfully"))
})

//status:working
const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    const {commentId} = req.params

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid comment")
    }

    const {content} = req.body                             //get new content from body

    if(!content || content.trim()===""){                    
        throw new ApiError(400,"New comment is required")
    }

    const comment = await Comment.findById(commentId);

    if (comment.owner.toString() !== req.user._id.toString()) {               //check that current user is the owner of comment
        throw new ApiError(403, "Unauthorized to modify this comment");
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId,
        {
            content,
        },
        {
            new : true
        }
    )

    if(!updatedComment){
        throw new ApiError(500,"Error while updating comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedComment,"Comment updated successfully"))
})

//status:working
const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment

    const {commentId} = req.params

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid comment")
    }

    const comment = await Comment.findById(commentId);

    if(comment.owner.toString()!==req.user._id.toString()){
        throw new ApiError(403,"Unauthorized to modify the comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId)

    if(!deletedComment){
        throw new ApiError(500,"Error while deleting the comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Comment has been deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }