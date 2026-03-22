import mongoose from "mongoose";
import { string } from "zod";

const subscriptionSchema = new mongoose.Schema({
        planName: {type: String, required: true},
        planId: {type: String, required: true},
        priceId: {type: String, required: true},
});

export const Subscription = mongoose.model("Subscription", subscriptionSchema);
