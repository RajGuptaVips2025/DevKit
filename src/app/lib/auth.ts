import { getServerSession } from "next-auth";
import { authOptions } from "./authOptions";
// import { authOptions } from "@/lib/authOptions";

export async function getAuthUser(req: Request) {
	const session = await getServerSession(authOptions);
	if (!session) return null;
	return session.user;
}
