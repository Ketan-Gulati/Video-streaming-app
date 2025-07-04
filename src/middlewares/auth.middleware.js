//we are creating a custom middleware here to verify JWT token to check whether user is logged in
//We require the verifyJWT middleware to protect routes that should only be accessed by authenticated users.

import { User } from "../models/user.models.js"
import { ApiError } from "../utils/ApiError.js"
import jwt from "jsonwebtoken"


export const verifyJWT = async(req, _, next)=>{      //whenever res is not being used, we write _
    try {
        const token = req.cookies?.accessToken || req.headers["authorization"]?.replace("Bearer ","")
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        const decodedTokenInfo = jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
        const user = await User.findById(decodedTokenInfo._id).select("-password -refreshToken")
    
        if(!user){
            throw new ApiError(401,"Invalid access token")
        }
    
        req.user = user
        next()
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

}