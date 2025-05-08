import mongoose, { isValidObjectId } from "mongoose"
import {CommunityPost} from "../models/coomunityPost.models.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createCommunityPost = asyncHandler(async (req, res) => {
    //TODO: create tweet
})

const getUserCommunityPost = asyncHandler(async (req, res) => {
    // TODO: get user tweets
})

const updateCommunityPost = asyncHandler(async (req, res) => {
    //TODO: update tweet
})

const deleteCommunityPost = asyncHandler(async (req, res) => {
    //TODO: delete tweet
})

export {
    createCommunityPost,
    getUserCommunityPost,
    updateCommunityPost,
    deleteCommunityPost
}