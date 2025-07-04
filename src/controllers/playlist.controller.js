import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.models.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

//status:working
const createPlaylist = asyncHandler(async (req, res) => {
    //TODO: create playlist
    const {name, description} = req.body

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400,"Name and description are required")
    }

    const newPlaylist = await Playlist.create(
        {
            name,
            description,
            owner : req.user._id
        }
    )
    
    if(!newPlaylist){
        throw new ApiError(500,"Error while creating playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,newPlaylist,"Playlist has been created successfully"))
})

//status:working
const getUserPlaylists = asyncHandler(async (req, res) => {
    //TODO: get user playlists

    // const {userId} = req.params
    const userId = req.user._id

    const playlists = await Playlist.find({owner : userId})

    const totalPlaylists = await Playlist.countDocuments({ owner: userId });

    if(playlists.length===0){
        return res
        .status(200)
        .json(new ApiResponse(200,{playlists:[],totalPlaylists},"No playlists found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{playlists, totalPlaylists},"playlists fetched successfully"))
})

//status:working
const getPlaylistById = asyncHandler(async (req, res) => {
    //TODO: get playlist by id

    const {playlistId} = req.params

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    const playlist = await Playlist.findById(playlistId)
                        .populate({
                            path: "videos",
                            select: "title thumbnail duration views isPublished" // Add more fields as needed
                        })
    if(!playlist){
        throw new ApiError(404,"Playlist does not exist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,playlist,"Playlist fetched successfully"))
})

//status:working
const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video")
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
    throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {             // Check if current user is the owner
    throw new ApiError(403, "You are not authorized to modify this playlist");
    }

    if (playlist.videos.includes(videoId)) {                           //check if video already exists
        throw new ApiError(400, "Video already exists in the playlist");
    }

    playlist.videos.push(videoId);                  // Add and save
    await playlist.save({validateBeforeSave : false});

    const updatedPlaylist = await Playlist.findById(playlistId)         // Populate the playlist with video details
        .populate("videos", "title thumbnail duration views createdAt")
        .populate("owner", "fullName userName avatar");

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Video added to playlist successfully"))
})

//status:working
const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    // TODO: remove video from playlist

    const {playlistId, videoId} = req.params

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400,"Invalid video")
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {             // Check if current user is the owner
        throw new ApiError(403, "You are not authorized to modify this playlist");
    }

     const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: { videos: videoId }
        },
        { new : true }
    );

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Video deleted successfully"))
})

//status:working
const deletePlaylist = asyncHandler(async (req, res) => {
    // TODO: delete playlist

    const {playlistId} = req.params

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
    throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to delete this playlist");
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    
    if(!deletedPlaylist){
        throw new ApiError(500,"Error while deleting the playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,{},"Playlist deleted successfully"))
})

//status:working
const updatePlaylist = asyncHandler(async (req, res) => {
    //TODO: update playlist

    const {playlistId} = req.params
    const {name, description} = req.body

    if(!mongoose.Types.ObjectId.isValid(playlistId)){
        throw new ApiError(400,"Invalid playlist")
    }

    if(!name?.trim() || !description?.trim()){
        throw new ApiError(400,"New name and description are required")
    }

    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
    throw new ApiError(404, "Playlist not found");
    }

    if (playlist.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "You are not authorized to update this playlist");
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(playlistId,
        {
            name,
            description
        },
        {
            new:true
        }
    )

    if(!updatedPlaylist){
        throw new ApiError(500,"Error while updating playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200,updatedPlaylist,"Playlist updated successfully"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}