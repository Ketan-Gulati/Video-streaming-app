import mongoose from "mongoose";

const communityPostSchema = new mongoose.Schema({
    content : {
        type : String,
        required : true
    },
    owner : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    }
},{timestamps : true})

export const CommunityPost = mongoose.model("CommunityPost", communityPostSchema)