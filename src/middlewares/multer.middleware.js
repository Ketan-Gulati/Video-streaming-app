import multer from "multer";
import path from "path"


const fullPath = path.join(process.cwd(), "public", "temp");   // Builds an absolute path to 'public/temp' from the project root, safe for all OS


const storage = multer.diskStorage({
    destination: function(req,file,cb){
        cb(null,fullPath)
    },
    filename: function(req,file,cb){
        cb(null,file.originalname)
    }
})


export const Upload = multer({
    storage:storage,
})
