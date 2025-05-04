import  {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.models.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

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

    console.log(req.body);

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


export {registerUser,}