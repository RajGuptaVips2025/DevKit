import { NextRequest, NextResponse } from "next/server";
import Generation from "@/models/Generation";
import dbConnect from "@/dbConfig/dbConfig";
import redis from "@/lib/redis";
import { Types } from "mongoose";
import { authOptions } from "../../auth/[...nextauth]/authOptions";
import { getServerSession } from "next-auth";

// -------------------- PATCH --------------------
export async function PATCH(req: NextRequest,
  //  ctx: any
  ctx: { params: { id: string }}
  ) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // const generationId = ctx.params.id;
  // const { params } = await ctx; // <-- await here
  // const generationId = params.id;
  const { id: generationId } = await ctx.params; // <- correct destructuring

  const { files } = await req.json();

  try {
    const updated = await Generation.findByIdAndUpdate(
      generationId,
      { files },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    const genIdStr = (updated._id as Types.ObjectId).toString();
    const userIdStr = typeof updated.user === "string" ? updated.user : updated.user.toString();

    // Update Redis cache
    await redis.set(`generation:${userIdStr}:${genIdStr}`, JSON.stringify(updated), { ex: 60 * 5 });

    return NextResponse.json({ success: true, updated }, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating generation files:", err);
    return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
  }
}

// -------------------- GET --------------------
export async function GET(
  _req: NextRequest,
  // ctx: any
  ctx: { params: { id: string } }
) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  // const generationId = ctx.params.id;
  // const generationId = ctx.params.id; // <- NO await
  const { id: generationId } = await ctx.params; // <- correct destructuring

  if (!generationId || generationId === "undefined") {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const cacheKey = `generation:${userId}:${generationId}`;

  try {
    const cached = await redis.get(cacheKey);
    if (cached) {
      try {
        const generation = JSON.parse(cached);
        return NextResponse.json({ success: true, generation, cached: true }, { status: 200 });
      } catch {
        console.warn("⚠️ Invalid cached JSON, falling back to DB");
      }
    }

    const generation = await Generation.findById(generationId);
    if (!generation) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    await redis.set(cacheKey, JSON.stringify(generation), { ex: 60 * 5 });

    return NextResponse.json({ success: true, generation, cached: false }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching generation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// -------------------- DELETE --------------------
export async function DELETE(_req: NextRequest,
  // ctx: any
  ctx: { params: { id: string }}
  ) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  // const generationId = ctx.params.id;
  // Await ctx to get params
  // const { params } = await ctx;
  // const generationId = params.id;
  const { id: generationId } = await ctx.params; // <- correct destructuring
  const userScopedKey = `generation:${userId}:${generationId}`;
  const historyKey = `history:${userId}`;

  try {
    const deleted = await Generation.findOneAndDelete({
      _id: new Types.ObjectId(generationId),
      user: new Types.ObjectId(userId),
    });

    if (!deleted) {
      return NextResponse.json({ error: "Generation not found or unauthorized" }, { status: 404 });
    }

    // Build the exact JSON string for Redis history
    const listItem = JSON.stringify({
      // _id: deleted._id.toString(),
      _id: (deleted._id as Types.ObjectId).toString(),
      prompt: deleted.prompt,
      modelName: deleted.modelName,
      framework: deleted.framework,
      user: deleted.user.toString(),
    });


        try {
      if (typeof (redis as any).multi === "function") {
        const txn = (redis as any).multi();
        txn.lrem(historyKey, 0, listItem);
        // txn.del(generationKey);
        txn.del(userScopedKey);

        if (typeof txn.exec === "function") {
          await txn.exec();
        } else {
          await txn;
        }
      }
      else if (typeof (redis as any).pipeline === "function") {
        const p = (redis as any).pipeline();
        p.lrem(historyKey, 0, listItem);
        // p.del(generationKey);
        p.del(userScopedKey);
        await p.exec();
      }
      else {
        await (redis as any).lrem(historyKey, 0, listItem);
        // await (redis as any).del(generationKey);
        await (redis as any).del(userScopedKey);
      }
    } catch (redisErr) {
      console.error("⚠️ Redis deletion failed (non-fatal):", redisErr);
    }
    // try {
    //   if (typeof (redis as any).multi === "function") {
    //     const txn = (redis as any).multi();
    //     txn.lrem(historyKey, 0, listItem);
    //     txn.del(userScopedKey);
    //     if (typeof txn.exec === "function") await txn.exec();
    //   } else if (typeof (redis as any).pipeline === "function") {
    //     const p = (redis as any).pipeline();
    //     p.lrem(historyKey, 0, listItem);
    //     p.del(userScopedKey);
    //     await p.exec();
    //   } else {
    //     await (redis as any).lrem(historyKey, 0, listItem);
    //     await (redis as any).del(userScopedKey);
    //   }
    // } catch (redisErr) {
    //   console.error("⚠️ Redis deletion failed (non-fatal):", redisErr);
    // }

    return NextResponse.json({ success: true, message: "Generation deleted from Mongo & Redis (attempted)." }, { status: 200 });
  } catch (err) {
    console.error("❌ Error deleting generation:", err);
    return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
  }
}


















// import { NextRequest, NextResponse } from "next/server";
// import Generation from "@/models/Generation";
// import dbConnect from "@/dbConfig/dbConfig";
// import redis from "@/lib/redis";
// import { Types } from "mongoose";
// import { authOptions } from "../../auth/[...nextauth]/authOptions";
// import { getServerSession } from "next-auth";

// // -------------------- PATCH --------------------
// export async function PATCH(
//   req: NextRequest,
//   { params }: { params: { id: string } } // plain object, no await
// ) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const { id: generationId } = params;
//   const { files } = await req.json();

//   try {
//     const updated = await Generation.findByIdAndUpdate(
//       generationId,
//       { files },
//       { new: true }
//     );

//     if (!updated) {
//       return NextResponse.json({ error: "Generation not found" }, { status: 404 });
//     }

//     // const genIdStr = updated._id.toString();
//     const genIdStr = (updated._id as Types.ObjectId).toString();
//     const userIdStr = typeof updated.user === "string" ? updated.user : updated.user.toString();

//     const payload = updated.toObject();

//     // Update Redis cache
//     await redis.set(`generation:${userIdStr}:${genIdStr}`, JSON.stringify(payload), { ex: 60 * 5 });

//     return NextResponse.json({ success: true, updated }, { status: 200 });
//   } catch (err) {
//     console.error("❌ Error updating generation files:", err);
//     return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
//   }
// }

// // -------------------- GET --------------------
// export async function GET(
//   _req: NextRequest,
//   { params }: { params: { id: string } } // plain object, no await
// ) {
//   // await dbConnect();

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const userId = session.user.id;
//   const { id: generationId } = params;

//   // if (!generationId) {
//   //   return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
//   // }
//   if (!generationId || generationId === "undefined") {
//     return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
//   }

//   const cacheKey = `generation:${userId}:${generationId}`;

//   try {
//     const cached = await redis.get(cacheKey);
//     if (cached) {
//       let generation;
//       try {
//         generation =
//           typeof cached === "string" ? JSON.parse(cached) : cached;
//         // const generation = JSON.parse(cached);
//         // return NextResponse.json({ success: true, generation, cached: true }, { status: 200 });
//       } catch {
//         console.warn("⚠️ Invalid cached JSON, falling back to DB");
//         generation= null;
//       }
//       if (generation) {
//         return NextResponse.json(
//           { success: true, generation, cached: true },
//           { status: 200 }
//         );
//       }
//     }

//     await dbConnect();
//     const generation = await Generation.findById(generationId);
//     if (!generation) {
//       return NextResponse.json({ error: "Generation not found" }, { status: 404 });
//     }

//     await redis.set(cacheKey, JSON.stringify(generation), { ex: 60 * 5 });

//     return NextResponse.json({ success: true, generation, cached: false }, { status: 200 });
//   } catch (err) {
//     console.error("❌ Error fetching generation:", err);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }

// // -------------------- DELETE --------------------
// export async function DELETE(
//   _req: NextRequest,
//   { params }: { params: { id: string } } // plain object, no await
// ) {
 

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   // const userId = session.user.id;
//   const { id: generationId } = params;
//   // const userScopedKey = `generation:${userId}:${generationId}`;

//   try {
//     await dbConnect();

//     const session = await getServerSession(authOptions);
//     if (!session?.user?.id) {
//       return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//     }

//     const userId = session.user.id;
//     const historyKey = `history:${userId}`;
//     // const generationKey = `generation:${generationId}`;
//     const userScopedKey = `generation:${userId}:${generationId}`;

    // const deleted = await Generation.findOneAndDelete({
    //   _id: new Types.ObjectId(generationId),
    //   user: new Types.ObjectId(userId),
    // });

//     if (!deleted) {
//       return NextResponse.json(
//         { error: "Generation not found or unauthorized" },
//         { status: 404 }
//       );
//     }

//     // Build the exact JSON string that we stored in the Redis list
//     const listItem = JSON.stringify({
//       _id: (deleted._id as Types.ObjectId).toString(),
//       prompt: deleted.prompt,
//       modelName: deleted.modelName,
//       framework: deleted.framework,
//       user: deleted.user.toString(),
//     });

    // try {
    //   if (typeof (redis as any).multi === "function") {
    //     const txn = (redis as any).multi();
    //     txn.lrem(historyKey, 0, listItem);
    //     // txn.del(generationKey);
    //     txn.del(userScopedKey);

    //     if (typeof txn.exec === "function") {
    //       await txn.exec();
    //     } else {
    //       await txn;
    //     }
    //   }
    //   else if (typeof (redis as any).pipeline === "function") {
    //     const p = (redis as any).pipeline();
    //     p.lrem(historyKey, 0, listItem);
    //     // p.del(generationKey);
    //     p.del(userScopedKey);
    //     await p.exec();
    //   }
    //   else {
    //     await (redis as any).lrem(historyKey, 0, listItem);
    //     // await (redis as any).del(generationKey);
    //     await (redis as any).del(userScopedKey);
    //   }
    // } catch (redisErr) {
    //   console.error("⚠️ Redis deletion failed (non-fatal):", redisErr);
    // }

//     return NextResponse.json(
//       { success: true, message: "Generation deleted from Mongo & Redis (attempted)." },
//       { status: 200 }
//     );
//   } catch (err) {
//     console.error("❌ Error deleting generation:", err);
//     return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
//   }
// }




















// import { NextRequest, NextResponse } from "next/server";
// import Generation from "@/models/Generation";
// import dbConnect from "@/dbConfig/dbConfig";
// import redis from "@/lib/redis";
// import { Types } from "mongoose";
// import { authOptions } from "../../auth/[...nextauth]/authOptions";
// import { getServerSession } from "next-auth";

// export async function PATCH(
//   req: NextRequest,
//   // { params }: { params: Promise<{ id: string }> 
//   // { params }: { params: { id: string }}
//   ctx: { params: { id: string } }
// ) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   // const { id: generationId } = await params;
//   const { id: generationId } = await ctx.params;

//   const { files } = await req.json();

//   try {
//     const updated = await Generation.findByIdAndUpdate(
//       generationId,
//       { files },
//       { new: true }
//     );

//     if (!updated) {
//       return NextResponse.json({ error: "Generation not found" }, { status: 404 });
//     }

//     const genIdStr = (updated._id as Types.ObjectId).toString();
//     const userIdStr =
//       typeof updated.user === "string" ? updated.user : updated.user.toString();

//     const payload = updated.toObject();

//     await Promise.all([
//       // redis.set(`generation:${genIdStr}`, JSON.stringify(payload), { ex: 60 * 5 }),
//       redis.set(`generation:${userIdStr}:${genIdStr}`, JSON.stringify(payload), { ex: 60 * 5 }),
//     ]);

//     return NextResponse.json({ success: true, updated }, { status: 200 });
//   } catch (err) {
//     console.error("❌ Error updating generation files:", err);
//     return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
//   }
// }

// export async function GET(
//   _req: NextRequest,
//   // context: { params: { id: string } 
//   // { params }: { params: { id: string }
//   ctx: { params: { id: string } }
// ) {
//   await dbConnect();
//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const userId = session.user.id;

//   // const { id: generationId } = await params;
//   // const { id: generationId } = params;
//   const { id: generationId } = await ctx.params;

//   // ✅ Fix #3: Validate ID early
//   if (!generationId || generationId === "undefined") {
//     return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
//   }

//   // const cacheKey = `generation:${generationId}:${userId}`;
//   const cacheKey = `generation:${userId}:${generationId}`;

//   try {
//     const cached = await redis.get(cacheKey);

//     if (cached) {
//       let generation;
//       try {
//         generation =
//           typeof cached === "string" ? JSON.parse(cached) : cached;
//       } catch {
//         console.warn("⚠️ Invalid cached JSON, falling back to DB");
//         generation = null;
//       }

//       if (generation) {
//         return NextResponse.json(
//           { success: true, generation, cached: true },
//           { status: 200 }
//         );
//       }
//     }


//     // 2. Fallback to DB
//     await dbConnect();
//     const generation = await Generation.findById(generationId);
//     if (!generation) {
//       return NextResponse.json(
//         { error: "Generation not found" },
//         { status: 404 }
//       );
//     }

//     // 3. Cache (TTL e.g. 5 minutes)
//     await redis.set(cacheKey, JSON.stringify(generation), { ex: 60 * 5 });

//     return NextResponse.json(
//       { success: true, generation, cached: false },
//       { status: 200 }
//     );

//     // // 2. Fallback to DB
//     // await dbConnect();
//     // const generation = await Generation.findById(generationId);
//     // if (!generation) {
//     //   return NextResponse.json(
//     //     { error: "Generation not found" },
//     //     { status: 404 }
//     //   );
//     // }

//     // // 3. Cache (TTL e.g. 5 minutes)
//     // await redis.set(cacheKey, JSON.stringify(generation), { ex: 60 * 5 });

//     // return NextResponse.json(
//     //   { success: true, generation, cached: false },
//     //   { status: 200 }
//     // );
//   } catch (error) {
//     console.error("❌ Error fetching generation:", error);
//     return NextResponse.json(
//       { error: "Internal Server Error" },
//       { status: 500 }
//     );
//   }
// }

// export async function DELETE(
//   _req: NextRequest,
//   // { params }: { params: Promise<{ id: string }> 
//   // { params }: { params: { id: string }
//   ctx: { params: { id: string } }
// ) {
//   const { id: generationId } = await ctx.params;
//   // const { id: generationId } = await params;

//   try {
    
//   } catch (error) {
//     console.error("❌ Error deleting history:", error);
//     return NextResponse.json({ error: "Failed to delete history" }, { status: 500 });
//   }
// }
