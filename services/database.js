import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';

mongoose.connect(process.env.DATABASE_URI, {dbName: process.env.DATABASE_NAME}).then(() => 
    console.log("Connected to mongodb !")
);