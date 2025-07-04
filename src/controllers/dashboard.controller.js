import mongoose from "mongoose"
import {Video} from "../models/video.models.js"
import {Subscriptions} from "../models/subscription.model.js"
import {Like} from "../models/like.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//status:working
const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

    //Protected, only accessible to the logged-in creator (like YouTube Studio)
    //Meant for analytics, not public profile

    
    const userId = req.user._id;

    const totalSubscribers = await Subscriptions.countDocuments({ channel: userId });  // Count total subscribers of the logged-in user

    const videos = await Video.find({ owner: userId });  // Get all videos posted by this user

    const totalVideos = videos.length;

    // Count total views across all videos
    let totalViews = 0;
    for (const video of videos) {
        totalViews += video.views || 0;
    }

    // Get all video IDs
    const videoIds = videos.map(video => video._id);

    // Count total likes on these videos
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    return res.status(200).json(
        new ApiResponse(200, {
            totalSubscribers,
            totalVideos,
            totalViews,
            totalLikes
        }, "Channel stats fetched successfully")
    );
});

//status:working
const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel

    const channelId = req.user._id
    const {page = 1, limit = 10}  = req.query
    
    if(!mongoose.Types.ObjectId.isValid(channelId)){
        throw new ApiError(400,"Invalid channel")
    }

    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    const skip = (pageNumber - 1) * limitNumber;

    const videos = await Video.find({owner : channelId})
                            .select("title thumbnail duration views isPublished createdAt")
                            .sort({ createdAt: -1 })
                            .skip(skip)
                            .limit(limitNumber);

    const totalVideos = await Video.countDocuments({owner : channelId})
                           
    if(videos.length===0){
        return res
        .status(200)
        .json(new ApiResponse(200,{videos : [], totalVideos},"No videos found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{videos, totalVideos},"Videos fetched successfully"))
})

export {
    getChannelStats, 
    getChannelVideos
    }