import  {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

//method to generate access and refresh token
const generateAccessAndRefreshToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave : false})     //validateBeforeSave : false will not run any validations and directly save the token

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}

//method to generate only access token
const generateAccessToken = async(userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = await user.generateAccessToken()

        return accessToken
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating tokens")
    }
}



//register controller (working)
const registerUser = asyncHandler(async(req,res)=>{
    /* res.status(200).json({
        message: "ok"
    }) */

    //get user details from frontend
    //verification - not empty
    //check if user already exists : username, email
    //check for images, check for avatar
    //upload to cloudinary and check for avatar
    //create a user object and create a entry in db
    //remove password and refresh token field from response
    //check for user creation
    //return res

    // console.log(req.body);

    const {fullName, userName, email, password} = req.body   //to get data from form submissions and json. Also we used multer in user route for file uploads
    
    //to check if any field is empty
    if([fullName,userName,email,password].some((field)=>(
        field.trim()=== ""
    ))){
        throw new ApiError(400,"All fields are required")
    }

    //check if user with username or email prior exists
    const existedUser =  await User.findOne({
        $or : [{ userName }, { email }]     //OR operator parameter
    })
    if(existedUser){
        throw new ApiError(409, "User with this username or email already exists")
    }

    //check for images
    const avatarLocalPath = req.files?.avatar[0]?.path     //files prop is brought by multer
    // const coverImageLocalPath = req.files?.coverImage[0]?.path

    let coverImageLocalPath=""                                                //corrected method to check for coverImage path
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    //additional check for avatar because it's required
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar is required")
    }

    //upload on cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    //additional check for avatar
    if(!avatar){
        throw new ApiError(400,"Avatar is required")
    }

    //create an entry in db
   const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",  //because it is not compulsory
        password : password,
        userName : userName.toLowerCase(),
        email : email
    })

    //check if user got created and also de-select password and refresh token using .select method
    const createdUser = await User.findById(user._id)?.select(
        "-password -refreshToken"
    )
    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    //return response
    return res.status(201).json(
        new ApiResponse(200,createdUser,"User has been registered successfully")
    )
})  


//login controller  (working)
const loginUser = asyncHandler(async(req,res)=>{
    //req body => data
    //username or email
    //find user in db
    //password check
    //access and refresh token
    //send cookie

    const {email, userName, password} = req.body

    if(!(userName||email)){
        throw new ApiError(400, "Username or email is required")
    }

    const user = await User.findOne({
        $or: [{email}, {userName}]
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isCorrectPassword(password)

    if(!isPasswordValid){
        throw new ApiError(401, "Invalid user credentials")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    //options for cookies
    const options = {
        httpOnly : true,     //using these two options, cookies can't be updated via frontend. And only through server 
        secure : true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)     //cookie method comes from cookie-parser middleware
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User is logged in successfully"
        )
    )
})

//logout controller  (working)
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id , 
        {
            $unset : {
                refreshToken : 1  // this removes the field from the document
            }
        },
        {
            new : true
        }
    )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(200, {}, "User logged out" )
    )
})

//controller to refresh the access token  (working)
const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        
        const user = await User.findById(decodedToken._id)
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user.refreshToken){  //match the incoming token and the token saved in user
            throw new ApiError(401,"Refresh token is either invalid or used")
        }
        
        const newAccessToken = await generateAccessToken(user._id)
    
        const options = {                 // options can be declared globally because they are being used many times
            httpOnly : true,       
            secure : true
        }
    
        return res
        .status(200)
        .cookie("accessToken",newAccessToken,options)
        .cookie("refreshToken",incomingRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken : newAccessToken, refreshToken : incomingRefreshToken},
                "Access token refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

//controller to change current password  (working)
const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isCorrectPassword(oldPassword)

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))
})

//controller to get current user  (working)
const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched successfully"))
})

//controller to update user details (fullname and email)   (working)
const updateUserDetails = asyncHandler(async(req,res)=>{
    const {fullName, email} = req.body
    if(!fullName || !email){
        throw new ApiError(400, "Name and email are required")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                fullName : fullName,
                email : email
            }
        },
        {
            new : true
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
})

//controller to update avatar  (working)
const updateUserAvatar = asyncHandler(async(req,res)=>{
    const userAvatar = req.file?.path

    if(!userAvatar){
        throw new ApiError(400,"Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(userAvatar)

    if(!avatar){
        throw new ApiError(500,"Error while uploading avatar")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200, "Avatar has been updated successfully"))
})

//controller to update cover image  (working)
const updateUserCoverImage = asyncHandler(async(req,res)=>{
    const userCoverImage = req.file?.path

    if(!userCoverImage){
        throw new ApiError(400,"CoverImage is missing")
    }

    const CoverImage = await uploadOnCloudinary(userCoverImage)

    if(!CoverImage){
        throw new ApiError(500,"Error while uploading CoverImage")
    }

    const user = await User.findByIdAndUpdate(req.user?._id,
        {
            $set : {
                CoverImage : CoverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200, "CoverImage has been updated successfully"))
})

//aggregation pipelines to get user channel profile  (working)
const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {userName} = req.params            // get username from url

    if(!userName?.trim()){
        throw new ApiError(400, "User not found")
    }

    const channel = await User.aggregate([
        {
            $match : {                   // filtered one document(ie of one user)
                userName : userName?.toLowerCase()
            }
        },
        {
            $lookup : {                               // for subscribers
                from : "subscriptions",
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {                              // for channels subscribed to
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers"
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubscribed : {
                    $cond : {
                        if : {$in : [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }

                }
            }
        },
        {
            $project : {
                fullName : 1,
                userName : 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubscribed : 1,
                avatar : 1,
                coverImage : 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, channel[0], "Channel has been fetched successfully"))
})

//controller for watch history using pipelines and sub-pipelines  (working)
const getUserWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match : {
                _id :new mongoose.Types.ObjectId(req.user._id)
            } 
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [              //subpipeline to get owner details
                    {
                        $lookup : {           
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [     //to just apply project on owner
                                {
                                    $project : {
                                        fullName : 1,
                                        userName : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            owner : {
                                $first : "$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched successfully"))
})

export {registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getUserWatchHistory
}