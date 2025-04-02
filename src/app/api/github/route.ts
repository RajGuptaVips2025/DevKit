import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: { username: string } }) {
    try {
        const { username } = params;

        // Fetch GitHub profile
        const userRes = await fetch(`https://api.github.com/users/${username}`, {
            headers: {
                Authorization: `token ${process.env.GITHUB_API_KEY}`,
            },
        });

        if (!userRes.ok) {
            throw new Error("GitHub user not found");
        }

        const userProfile = await userRes.json();

        // Fetch repositories
        const repoRes = await fetch(userProfile.repos_url, {
            headers: {
                Authorization: `token ${process.env.GITHUB_API_KEY}`,
            },
        });

        const repos = await repoRes.json();

        return NextResponse.json({ userProfile, repos }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
