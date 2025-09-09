// import dbConnect from "@/dbConfig/dbConfig";
// import UserModel from "@/models/userModel";

// const COOLDOWN_SECONDS = 60;

// export async function checkAndUpdatePromptCooldown(email: string) {
//   await dbConnect();
//   const user = await UserModel.findOne({ email });

//   if (!user) throw new Error("User not found");

//   const now = new Date();
//   const lastCooldown = user.lastCooldownTime || new Date(0);
//   const diff = (now.getTime() - lastCooldown.getTime()) / 1000;

//   if (diff < COOLDOWN_SECONDS) {
//     return {
//       allowed: false,
//       remainingSeconds: Math.ceil(COOLDOWN_SECONDS - diff),
//     };
//   }

//   user.lastCooldownTime = now;
//   await user.save();

//   return { allowed: true };
// }