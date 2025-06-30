import mongoose, { Aggregate, isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
//

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query = "",
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  if (!req.user) {
    throw new ApiError(401, "User needs to be logged in");
  }

  const match = {
    ...(query ? { title: { $regex: query, $options: "i" } } : {}),
    ...(userId ? { owner: mongoose.Types.ObjectId(userId) } : {}),
  };

  const videos = await Video.aggregate( [
    {
      $match: match,
    },
    {
      $lookup: {
        from: "user",
        localField: "owner",
        foreignField: "_id",
        as: "videosByOwner",
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        owner: {
          $arrayElemAt: ["$videosByOwner", 0],
        },
      },
    },
    {
      $sort: {
        [sortBy]: sortType === "desc" ? -1 : 1,
      },
    },
  ]);

  const options = {
    page: parseInt(page),
    limit: parseInt(limit),
    customLabels: {
      totalDocs: "totalVideos",
      docs: "videos",
    },
  };

  const result = await Video.aggregatePaginate(Video.aggregate(videos), options);

  if (!result.videos.length) {
    throw new ApiError(404, "No videos found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

//status : working
const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and desciption are required");
  }

  // TODO: get video, upload to cloudinary, create video

  // const videoLocalPath = req.files?.videoFile[0]?.path
  // const thumbnailLocalPath = req.files?.thumbnail[0]?.path

  let videoLocalPath = "";
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.files.videoFile.length > 0
  ) {
    videoLocalPath = req.files.videoFile[0].path;
  }

  let thumbnailLocalPath = "";
  if (
    req.files &&
    Array.isArray(req.files.thumbnail) &&
    req.files.thumbnail.length > 0
  ) {
    thumbnailLocalPath = req.files.thumbnail[0].path;
  }

  if (!videoLocalPath) {
    throw new ApiError(400, "Video required");
  }
  //I have not made thumbnail a compulsory field

  const uploadVideo = await uploadOnCloudinary(videoLocalPath);
  const uploadThumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!uploadVideo) {
    throw new ApiError(400, "Video required");
  }

  const video = await Video.create({
    videoFile: uploadVideo.url,
    thumbnail:
      uploadThumbnail?.url ||
      "https://res.cloudinary.com/dxanpvaub/image/upload/v1747674972/no-image_xaemc2.jpg",
    title,
    description,
    owner: req.user?._id,
    duration : uploadVideo.duration
  });

  if (!video) {
    throw new ApiError(500, "Error while uploading video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video has been uploaded successfully"));
});

//status : working
const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res.status(200).json(new ApiResponse(200, video, "Video fetched"));
});

//status : working
const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail

  const { title, description } = req.body;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  const newThumbnail = req.file?.path;

  const uploadThumbnail = await uploadOnCloudinary(newThumbnail);

  if (!uploadThumbnail) {
    throw new ApiError(400, "Thumbnail required");
  }

  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $set: {
        title,
        description,
        thumbnail:
          uploadThumbnail?.url ||
          "https://res.cloudinary.com/dxanpvaub/image/upload/v1747674972/no-image_xaemc2.jpg",
      },
    },
    {
      new: true,
    }
  );

  if (!video) {
    throw new ApiError(500, "Error while updating details");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video details have been updated"));
});

//status : working
const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video

  const deleteVideo = await Video.findByIdAndDelete(videoId);

  if (!deleteVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Video has been deleted successfully"));
});

//status : working
const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Status of the video has been toggled successfully")
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
