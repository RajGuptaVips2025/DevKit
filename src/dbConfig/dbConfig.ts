import mongoose from "mongoose";

let isConnected = false; // Flag to track connection status

const dbConnect = async () => {
  if (isConnected) {
    console.log("✅ Already connected to MongoDB");
    return;
  }

  try {
    await mongoose.connect(process.env.MONGO_URI!, {
      dbName: "MajorProject", 
    });

    mongoose.connection.setMaxListeners(20); // Optional: avoid listener warnings

    mongoose.connection.on("connected", () => {
      console.log("✅ Mongoose connected successfully");
    });

    mongoose.connection.on("error", (err) => {
      console.error("❌ Mongoose connection error:", err);
    });

    isConnected = true;
    console.log("✅ MongoDB connection established");
  } catch (err: any) {
    console.error("❌ MongoDB connection failed:", err.message);
    process.exit(1);
  }
};

export default dbConnect;
















