import  {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"

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

//register controller
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

    const {fullName, userName, email, password} = req.body   //to get data from form submissions and json , we used multer in user route for file uploads
    
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


//login controller
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

//logout controller
const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id , 
        {
            $set : {
                refreshToken : undefined
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

//controller to refresh the access token
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
        
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        options = {                 // options can be declared globally because they are being used many times
            httpOnly : true,       
            secure : true
        }
    
        return res
        .status(200)
        .cookie("access token",accessToken,options)
        .cookie("refresh token",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken : newRefreshToken},
                "Access token refreshed"
            )
        )
    
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})


export {registerUser,loginUser,logoutUser,refreshAccessToken}