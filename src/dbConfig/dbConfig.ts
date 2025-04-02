import mongoose from 'mongoose' 

export default async function dbConnect  ()  {
  try {
    await mongoose.connect(process.env.MONGO_URI!);
    const connection=mongoose.connection;

    connection.on("connected",()=>{
        console.log("mongoose connected successuflly")
    })


    connection.on("error",(err)=>{
        console.log("mongoose error")
        process.exit();
    })
    console.log('MongoDB connected',process.env.MONGO_URI!);
  } catch (err:any) {
    console.error(err.message);
    process.exit(1);
  }
};