// src/app/api/generation/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import Generation from "@/models/Generation";
import { Types } from "mongoose";
import { getServerSession } from "next-auth";
import redis from "@/lib/redis";
import redisHelpers from "@/lib/redisHelpers";
import { authOptions } from "../../auth/[...nextauth]/authOptions";

type ParamsCtx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: ParamsCtx) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const generationId = id;
  if (!generationId || generationId === "undefined") {
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const generationId = ctx.params.id;
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

    // ensure a plain POJO before caching
    const payload = typeof updated.toObject === "function" ? updated.toObject() : updated;

    // guarantee string ids
    const genIdStr = (payload._id as Types.ObjectId).toString();
    const userIdStr = typeof payload.user === "string" ? payload.user : payload.user.toString();

    // cache the updated generation using helper (stringified inside helper)
    await redisHelpers.setJson(`generation:${userIdStr}:${genIdStr}`, payload, { ex: 60 * 5 });

    return NextResponse.json({ success: true, updated: payload }, { status: 200 });
  } catch (err) {
    console.error("❌ Error updating generation files:", err);
    return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
  }
}

export async function GET(_req: NextRequest, ctx: ParamsCtx) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    console.log("Unauthorized request — no session user ID");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await ctx.params;
  const generationId = id;

  if (!generationId || generationId === "undefined") {
    console.log("Invalid generation ID:", generationId);
    return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
  }

  const cacheKey = `generation:${userId}:${generationId}`;

  try {
    // use the helper to read cached JSON
    const cached = await redisHelpers.getJson(cacheKey);

    // if cached exists and is an object (valid), return it
    if (cached && typeof cached === "object") {
      console.log(`✅ Serving generation from cache for user ${userId}, generation ${generationId}`);
      return NextResponse.json({ success: true, generation: cached, cached: true }, { status: 200 });
    }

    // If cached exists but it's a string (invalid stored value like "[object Object]"),
    // delete it and fall back to DB.
    if (cached && typeof cached === "string") {
      console.warn(`⚠️ Invalid cached string found at ${cacheKey}, deleting key and falling back to DB.`);
      try { await redis.del(cacheKey); } catch (e) { console.error("Redis del error:", e); }
    }

    // Fetch from DB (lean for plain POJO)
    const generation = await Generation.findById(generationId).lean();
    if (!generation) {
      console.log(`❌ Generation not found in DB for ID ${generationId}`);
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    // cache plain object
    await redisHelpers.setJson(cacheKey, generation, { ex: 60 * 5 });
    console.log(`📂 Serving generation from database and caching for user ${userId}, generation ${generationId}`);

    return NextResponse.json({ success: true, generation, cached: false }, { status: 200 });
  } catch (err) {
    console.error("❌ Error fetching generation:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, ctx: ParamsCtx) {
  await dbConnect();

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;
  const { id } = await ctx.params;
  const generationId = id;
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

    const listItem = JSON.stringify({
      _id: (deleted._id as Types.ObjectId).toString(),
      prompt: deleted.prompt,
      modelName: deleted.modelName,
      framework: deleted.framework,
      user: deleted.user.toString(),
    });

    try {
      // Remove from history list and delete cached generation key (best-effort)
      if (typeof (redis as any).multi === "function") {
        const txn = (redis as any).multi();
        txn.lrem(historyKey, 0, listItem);
        txn.del(userScopedKey);
        if (typeof txn.exec === "function") {
          await txn.exec();
        } else {
          await txn;
        }
      } else if (typeof (redis as any).pipeline === "function") {
        const p = (redis as any).pipeline();
        p.lrem(historyKey, 0, listItem);
        p.del(userScopedKey);
        await p.exec();
      } else {
        await (redis as any).lrem(historyKey, 0, listItem);
        await (redis as any).del(userScopedKey);
      }
    } catch (redisErr) {
      console.error("⚠️ Redis deletion failed (non-fatal):", redisErr);
    }

    return NextResponse.json(
      { success: true, message: "Generation deleted from Mongo & Redis (attempted)." },
      { status: 200 }
    );
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
// // export async function PATCH(req: NextRequest, ctx: any) {
// //   await dbConnect();

// //   const session = await getServerSession(authOptions);
// //   if (!session?.user?.id) {
// //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //   }

// //   const generationId = ctx.params.id;
// //   const { files } = await req.json();

// //   try {
// //     const updated = await Generation.findByIdAndUpdate(
// //       generationId,
// //       { files },
// //       { new: true }
// //     );

// //     if (!updated) {
// //       return NextResponse.json({ error: "Generation not found" }, { status: 404 });
// //     }

// //     const genIdStr = (updated._id as Types.ObjectId).toString();
// //     const userIdStr = typeof updated.user === "string" ? updated.user : updated.user.toString();

// //     // Update Redis cache
// //     await redis.set(`generation:${userIdStr}:${genIdStr}`, JSON.stringify(updated), { ex: 60 * 5 });

// //     return NextResponse.json({ success: true, updated }, { status: 200 });
// //   } catch (err) {
// //     console.error("❌ Error updating generation files:", err);
// //     return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
// //   }
// // }

// // -------------------- PATCH --------------------
// export async function PATCH(
//   req: NextRequest,
//   ctx: { params: Promise<{ id: string }> } // 👈 Next.js 15: params is async
// ) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   // ✅ unwrap params correctly
//   const { id } = await ctx.params;
//   const generationId = id;
//   if (!generationId || generationId === "undefined") {
//     return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
//   }
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

//     // Update Redis cache
//     await redis.set(
//       `generation:${userIdStr}:${genIdStr}`,
//       JSON.stringify(updated),
//       { ex: 60 * 5 }
//     );

//     return NextResponse.json({ success: true, updated }, { status: 200 });
//   } catch (err) {
//     console.error("❌ Error updating generation files:", err);
//     return NextResponse.json({ error: "Failed to update files" }, { status: 500 });
//   }
// }


// // export async function GET(
// //   _req: NextRequest,
// //   ctx: any
// // ) {
// //   await dbConnect();

// //   const session = await getServerSession(authOptions);
// //   if (!session?.user?.id) {
// //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //   }

// //   const userId = session.user.id;
// //   const generationId = ctx.params.id;

// //   if (!generationId || generationId === "undefined") {
// //     return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
// //   }

// //   const cacheKey = `generation:${userId}:${generationId}`;

// //   try {
// //     const cached = await redis.get(cacheKey);
// //     if (cached) {
// //       try {
// //         const generation = JSON.parse(cached);
// //         return NextResponse.json({ success: true, generation, cached: true }, { status: 200 });
// //       } catch {
// //         console.warn("⚠️ Invalid cached JSON, falling back to DB");
// //       }
// //     }

// //     const generation = await Generation.findById(generationId);
// //     if (!generation) {
// //       return NextResponse.json({ error: "Generation not found" }, { status: 404 });
// //     }

// //     await redis.set(cacheKey, JSON.stringify(generation), { ex: 60 * 5 });

// //     return NextResponse.json({ success: true, generation, cached: false }, { status: 200 });
// //   } catch (err) {
// //     console.error("❌ Error fetching generation:", err);
// //     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
// //   }
// // }

// export async function GET(
//   _req: NextRequest,
//   ctx: { params: Promise<{ id: string }> }
// ) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     console.log("Unauthorized request — no session user ID");
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const userId = session.user.id;
//   const { id } = await ctx.params;
//   const generationId = id;

//   if (!generationId || generationId === "undefined") {
//     console.log("Invalid generation ID:", generationId);
//     return NextResponse.json({ error: "Invalid ID" }, { status: 400 });
//   }

//   const cacheKey = `generation:${userId}:${generationId}`;

//   try {
//     const cached = await redis.get(cacheKey);

//     if (cached) {
//       try {
//         const generation = JSON.parse(cached);
//         console.log(`✅ Serving generation from cache for user ${userId}, generation ${generationId}`);
//         return NextResponse.json({ success: true, generation, cached: true }, { status: 200 });
//       } catch {
//         // console.warn("⚠️ Invalid cached JSON, falling back to DB");
//         console.warn(`⚠️ Invalid cached JSON for key ${cacheKey}, falling back to DB`);
//       }
//     }    

//     const generation = await Generation.findById(generationId);
//     if (!generation) {
//       console.log(`❌ Generation not found in DB for ID ${generationId}`);
//       return NextResponse.json({ error: "Generation not found" }, { status: 404 });
//     }

//     // await redis.set(cacheKey, JSON.stringify(generation), { ex: 60 * 5 });


//     const payload = generation.toObject ? generation.toObject() : generation;
//     await redis.set(cacheKey, JSON.stringify(payload), { ex: 60 * 5 });
//     console.log(`📂 Serving generation from database and caching for user ${userId}, generation ${generationId}`);

//     return NextResponse.json({ success: true, generation, cached: false }, { status: 200 });
//   } catch (err) {
//     console.error("❌ Error fetching generation:", err);
//     return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
//   }
// }


// // export async function DELETE(_req: NextRequest,
// //   ctx: any
// //   // ctx: { params: { id: string }}
// // ) {
// //   await dbConnect();

// //   const session = await getServerSession(authOptions);
// //   if (!session?.user?.id) {
// //     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// //   }

// //   const userId = session.user.id;
// //   const generationId = ctx.params.id;
// //   const userScopedKey = `generation:${userId}:${generationId}`;
// //   const historyKey = `history:${userId}`;

// //   try {
// //     const deleted = await Generation.findOneAndDelete({
// //       _id: new Types.ObjectId(generationId),
// //       user: new Types.ObjectId(userId),
// //     });

// //     if (!deleted) {
// //       return NextResponse.json({ error: "Generation not found or unauthorized" }, { status: 404 });
// //     }

// //     const listItem = JSON.stringify({
// //       _id: (deleted._id as Types.ObjectId).toString(),
// //       prompt: deleted.prompt,
// //       modelName: deleted.modelName,
// //       framework: deleted.framework,
// //       user: deleted.user.toString(),
// //     });


// //     try {
// //       if (typeof (redis as any).multi === "function") {
// //         const txn = (redis as any).multi();
// //         txn.lrem(historyKey, 0, listItem);
// //         // txn.del(generationKey);
// //         txn.del(userScopedKey);

// //         if (typeof txn.exec === "function") {
// //           await txn.exec();
// //         } else {
// //           await txn;
// //         }
// //       }
// //       else if (typeof (redis as any).pipeline === "function") {
// //         const p = (redis as any).pipeline();
// //         p.lrem(historyKey, 0, listItem);
// //         p.del(userScopedKey);
// //         await p.exec();
// //       }
// //       else {
// //         await (redis as any).lrem(historyKey, 0, listItem);
// //         await (redis as any).del(userScopedKey);
// //       }
// //     } catch (redisErr) {
// //       console.error("⚠️ Redis deletion failed (non-fatal):", redisErr);
// //     }
// //     return NextResponse.json({ success: true, message: "Generation deleted from Mongo & Redis (attempted)." }, { status: 200 });
// //   } catch (err) {
// //     console.error("❌ Error deleting generation:", err);
// //     return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
// //   }
// // }

// export async function DELETE(_req: NextRequest,
//   // ctx: any
//   ctx: { params: Promise<{ id: string }> }
// ) {
//   await dbConnect();

//   const session = await getServerSession(authOptions);
//   if (!session?.user?.id) {
//     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
//   }

//   const userId = session.user.id;
//   // const generationId = ctx.params.id;
//   const { id } = await ctx.params;
//   const generationId = id;
//   const userScopedKey = `generation:${userId}:${generationId}`;
//   const historyKey = `history:${userId}`;

//   try {
//     const deleted = await Generation.findOneAndDelete({
//       _id: new Types.ObjectId(generationId),
//       user: new Types.ObjectId(userId),
//     });

//     if (!deleted) {
//       return NextResponse.json({ error: "Generation not found or unauthorized" }, { status: 404 });
//     }

//     const listItem = JSON.stringify({
//       _id: (deleted._id as Types.ObjectId).toString(),
//       prompt: deleted.prompt,
//       modelName: deleted.modelName,
//       framework: deleted.framework,
//       user: deleted.user.toString(),
//     });


//     try {
//       if (typeof (redis as any).multi === "function") {
//         const txn = (redis as any).multi();
//         txn.lrem(historyKey, 0, listItem);
//         // txn.del(generationKey);
//         txn.del(userScopedKey);

//         if (typeof txn.exec === "function") {
//           await txn.exec();
//         } else {
//           await txn;
//         }
//       }
//       else if (typeof (redis as any).pipeline === "function") {
//         const p = (redis as any).pipeline();
//         p.lrem(historyKey, 0, listItem);
//         p.del(userScopedKey);
//         await p.exec();
//       }
//       else {
//         await (redis as any).lrem(historyKey, 0, listItem);
//         await (redis as any).del(userScopedKey);
//       }
//     } catch (redisErr) {
//       console.error("⚠️ Redis deletion failed (non-fatal):", redisErr);
//     }
//     return NextResponse.json({ success: true, message: "Generation deleted from Mongo & Redis (attempted)." }, { status: 200 });
//   } catch (err) {
//     console.error("❌ Error deleting generation:", err);
//     return NextResponse.json({ error: "Failed to delete generation" }, { status: 500 });
//   }
// }