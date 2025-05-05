import { Router } from "express";
import {loginUser, logoutUser, registerUser} from "../controllers/user.controller.js"
import {Upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    Upload.fields([                  // to use multer for file uploads - as a middleware
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }
    ]),
    registerUser
)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser)

export default router;