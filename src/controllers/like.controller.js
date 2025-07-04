import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js"
import { CommunityPost } from "../models/coomunityPost.models.js"

//status:working
const toggleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video

    //get video id from url
    //get user id
    //verify video id
    //check if already liked (then unlike)
    //else create a like

    const {videoId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video")
    }

    const toLikeVideo = await Video.findById(videoId)

    if(!toLikeVideo){
        throw new ApiError(404,"Video not found")
    }

    const existingLike = await Like.findOne({
        video : videoId,
        likedBy : userId
    })

    if(existingLike){
        await Like.deleteOne({_id : existingLike._id})

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Unliked successfully"))
    }
    
    await Like.create(
        {
            video :  videoId,
            likedBy : userId
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Liked successfullly"))

})

//status:working
const toggleCommentLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on comment

    //similar process
    
    const {commentId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400,"Invalid comment")
    }

    const toLikeComment = await Comment.findById(commentId)

    if(!toLikeComment){
        throw new ApiError(404,"Comment does not exist")
    }

    const existingLike = await Like.findOne(
        {
            comment : commentId,
            likedBy : userId
        }
    )

    if(existingLike){
        await Like.deleteOne({_id : existingLike._id})

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Comment unliked successfully"))
    }
    
    await Like.create({
        comment : commentId,
        likedBy : userId
    })

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Comment liked succcessfully"))
    
})

//status:working
const toggleCommunityPostLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on communityPost

    //similar steps

    const {communityPostId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(communityPostId)){
        throw new ApiError(400,"Invalid community post")
    }

    const toLikePost = await CommunityPost.findById(communityPostId)

    if(!toLikePost){
        throw new ApiError(404,"Community post does not exist")
    }

    const existingLike = await Like.findOne(
        {
            communityPost : communityPostId,
            likedBy : userId
        }
    )

    if(existingLike){
        await Like.deleteOne({_id : existingLike._id})

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Community post unliked successfully"))
    }

    await Like.create(
        {
            communityPost : communityPostId,
            likedBy : userId
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Community post liked successfully"))
}
)

//status:working
const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        {
            $match : {
                likedBy : new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "likedVideos" 
            }
        },
        {
            $unwind : "$likedVideos"
        },
        {                                      //another lookup to get owner details of videos
            $lookup: {
                from: "users",
                localField: "likedVideos.owner",
                foreignField: "_id",
                as: "ownerDetails"
            }
        },
        {
            $unwind : "$ownerDetails"
        },
        {
            $project : {
                _id : "$likedVideos._id",
                thumbnail : "$likedVideos.thumbnail",
                title : "$likedVideos.title",
                duration : "$likedVideos.duration",
                views : "$likedVideos.views",
                isPublished : "$likedVideos.isPublished",
                createdAt : 1,
                owner : {
                    _id: "$ownerDetails._id",
                    fullName: "$ownerDetails.fullName",
                    userName: "$ownerDetails.userName",
                    avatar: "$ownerDetails.avatar"
                }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,likedVideos,"Liked videos fetched successfully"))
})

export {
    toggleCommentLike,
    toggleCommunityPostLike,
    toggleVideoLike,
    getLikedVideos
}