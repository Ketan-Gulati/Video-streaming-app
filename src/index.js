// require('dotenv').config({path : './env'})
import dotenv from 'dotenv'
import { app } from './app.js';

// import mongoose from "mongoose";
// import {DB_NAME} from "./constants";

import connectDB from "./db/index.js";

dotenv.config()


connectDB()
.then(()=>{
    app.on("error",(error)=>{
        console.log("Error : ",error);
    })
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`server is listening at port ${process.env.PORT}`);
    }
)
})
.catch((err)=>{
    console.log("MONGO db connection failed ",err);
})







/*import express from "express";
const app=express();

;( async()=>{
    try {
        await mongoose.connect(`${MONGODB_URI}/${DB_NAME}`);
        app.on("error",(error)=>{
            console.log("Error : ",error);
            throw error;
        })

        app.listen(process.env.PORT, ()=>{
            console.log(`app is listening at port ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("Error : ",error);
        throw error;
    }
})() */

    