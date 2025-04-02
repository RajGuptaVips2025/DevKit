import { NextResponse } from "next/server";
import dbConnect from "@/dbConfig/dbConfig";
import User, { IUser } from "@/models/userModel";
import { getAuthUser } from "@/app/lib/auth";

export async function POST(req: Request) {
	try {
		await dbConnect();
		const { username } = await req.json();
		const authUser = await getAuthUser(req); // Get authenticated user

		if (!authUser || !authUser._id) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}

		const user = await User.findById(authUser._id).lean() as IUser;
		const userToLike = await User.findOne({ username }).lean() as IUser;

		if (!userToLike) {
			return NextResponse.json({ error: "User is not a member" }, { status: 404 });
		}

		if (user.likedProfiles.includes(userToLike.username)) {
			return NextResponse.json({ error: "User already liked" }, { status: 400 });
		}

		userToLike.likedBy.push({
			username: user.username,
			avatarUrl: user.avatarUrl,
			likedDate: new Date(),
		});
		user.likedProfiles.push(userToLike.username);

		await Promise.all([
			User.findByIdAndUpdate(authUser._id, { likedProfiles: user.likedProfiles }),
			User.findOneAndUpdate({ username }, { likedBy: userToLike.likedBy }),
		]);

		return NextResponse.json({ message: "User liked" }, { status: 200 });
	} catch (error: any) {
		return NextResponse.json({ error: error.message }, { status: 500 });
	}
}















// import { NextResponse } from "next/server";
// import dbConnect from "@/dbConfig/dbConfig";
// import User from "@/models/userModel";
// import { getAuthUser } from "@/app/lib/auth";

// export async function POST(req: Request) {
// 	try {
// 		await dbConnect();
// 		const { username } = await req.json();
// 		const authUser = await getAuthUser(req); // Get authenticated user

// 		if (!authUser) {
// 			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
// 		}

// 		const user = await User.findById(authUser._id);
// 		const userToLike = await User.findOne({ username });

// 		if (!userToLike) {
// 			return NextResponse.json({ error: "User is not a member" }, { status: 404 });
// 		}

// 		if (user.likedProfiles.includes(userToLike.username)) {
// 			return NextResponse.json({ error: "User already liked" }, { status: 400 });
// 		}

// 		userToLike.likedBy.push({
// 			username: user.username,
// 			avatarUrl: user.avatarUrl,
// 			likedDate: new Date(),
// 		});
// 		user.likedProfiles.push(userToLike.username);

// 		await Promise.all([userToLike.save(), user.save()]);

// 		return NextResponse.json({ message: "User liked" }, { status: 200 });
// 	} catch (error: any) {
// 		return NextResponse.json({ error: error.message }, { status: 500 });
// 	}
// }
