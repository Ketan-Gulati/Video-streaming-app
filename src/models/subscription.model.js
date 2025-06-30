import mongoose from "mongoose";

const subscriptionSchema = new mongoose.Schema({
    subscriber : {                                  // one who is subscribing
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    },
    channel : {
        type : mongoose.Schema.Types.ObjectId,      // one who is getting subscribed
        ref : "User"
    }

},{timestamps:true})


export const Subscriptions = mongoose.model("Subscriptions", subscriptionSchema)