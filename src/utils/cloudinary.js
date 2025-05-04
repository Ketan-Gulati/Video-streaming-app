import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"


// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});

const uploadOnCloudinary = async function(localFilePath){
    try {
        if(!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        // console.log("file has been uploaded on cloud")
        fs.unlinkSync(localFilePath)
        // console.log("file has been removed from local server")
        return response
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }

}

export {uploadOnCloudinary}


//reference from doc
// (async function() {
//     const results = await cloudinary.uploader.upload('./images/my_image.jpg');
//     console.log(results);
//   })();