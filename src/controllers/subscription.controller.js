import mongoose, {isValidObjectId} from "mongoose"
import { Subscriptions } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//status:working
const toggleSubscription = asyncHandler(async (req, res) => {
    
    // TODO: toggle subscription

    //get channel id from url
    //get logged-in user id
    //check if channelId is valid
    //check if user is not subscribing to self
    //check if a subscription exists
    //if exists, then delete it (unsubscribe)
    //else create a new subscription
    const {channelId} = req.params
    const subscriberId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(channelId)){            // to verify that channel id is a valid mongodb objectID
        throw new ApiError(404,"Channel does not exist")
    }

    if(channelId.toString()===subscriberId.toString()){        //to check for self-subscription
        throw new ApiError(400,"You can not subscribe to self")
    }

    const existingSubscription = await Subscriptions.findOne({    // to check for existing subscription
        channel:channelId,
        subscriber:subscriberId
    })

    if(existingSubscription){                                          //unsubscribe
        await Subscriptions.deleteOne({_id: existingSubscription._id})

        return res
        .status(200)
        .json(new ApiResponse(200,{},"Unsubscribed successfully"))
    }
                                                                //subscribe
    await Subscriptions.create(
        {
            channel:channelId,
            subscriber:subscriberId
        }
    )

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Subscribed successfully"))
    
})

//status:working
// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {

    //get channel id from url
    //check if channel id is valid
    //apply aggregation queries
    const {channelId} = req.params

    if(! mongoose.Types.ObjectId.isValid(channelId)){        //checking if channel id is valid
        throw new ApiError(400,"Channel not found")
    }

    const subscribers = await Subscriptions.aggregate([    
        {
            $match : {                                            // matching channel id with channel
                channel : new mongoose.Types.ObjectId(channelId)       //  since MongoDB _id and references are stored as ObjectId, we need to convert the string channelId to a proper ObjectId.
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "subscriber",
                foreignField : "_id",
                as : "subscribersList"
            }
        },
        {
            $unwind : "$subscribersList"                    //converts array into individual objects or we can say documents
        },
        {
            $project : {
                _id : "$subscribersList._id",
                fullName :  "$subscribersList.fullName",
                userName : "$subscribersList.userName",
                avatar : "$subscribersList.avatar"
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, subscribers, "Subscribers fetched successfully"))
})

//status:working
// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {

    //get subscriber id from url or we can get it from req.user as we are using verifyJWT
    //verify subscriber id
    //apply aggregation queries

    // const { subscriberId } = req.params
    const subscriberId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(subscriberId)){
        throw new ApiError(400,"Subscriber id not valid")
    }

    const channels = await Subscriptions.aggregate([
        {
            $match : {
                subscriber : new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup : {
                from : "users",
                localField : "channel",
                foreignField : "_id",
                as : "channelsList"
            }
        },
        {
            $unwind : "$channelsList"
        },
        {
            $project : {
                _id : "$channelsList._id",
                fullName : "$channelsList.fullName",
                userName : "$channelsList.userName",
                avatar : "$channelsList.avatar"
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200,channels,"Channels subscribed to have been fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}