import { IoLocationOutline } from "react-icons/io5";
import { RiGitRepositoryFill, RiUserFollowFill, RiUserFollowLine } from "react-icons/ri";
import { FaXTwitter } from "react-icons/fa6";
import { TfiThought } from "react-icons/tfi";
import { FaEye } from "react-icons/fa";

type UserProfile = {
	avatar_url: string;
	bio?: string;
	email?: string;
	followers: number;
	following: number;
	html_url: string;
	location?: string;
	name?: string;
	public_gists: number;
	public_repos: number;
	twitter_username?: string;
	login: string;
	created_at: string;
};

interface ProfileInfoProps {
	userProfile: UserProfile;
}

const ProfileInfo: React.FC<ProfileInfoProps> = ({ userProfile }) => {

	if (!userProfile) {
		return <p className="text-center text-gray-500">No profile found.</p>;
	}

	return (
		<div className="w-full flex flex-col gap-3 lg:sticky md:top-10">
			{/* Profile Card */}
			<div className="bg-glass rounded-lg p-3">
				<div className="flex gap-3 items-center">
					{/* <a href={userProfile.html_url} target="_blank" rel="noreferrer">
						<img src={userProfile.avatar_url} className="rounded-md w-20 h-20" alt="" />
					</a> */}
					<a href={userProfile.html_url} target="_blank" rel="noreferrer">
						<img src={userProfile.avatar_url} className="rounded-md w-20 h-20" alt="Profile Avatar" />
					</a>

					<div className="flex flex-col gap-1 items-center">
						<a
							href={userProfile.html_url}
							target="_blank"
							rel="noreferrer"
							className="bg-glass font-medium text-xs p-2 rounded-md cursor-pointer border border-blue-400 flex items-center gap-1"
						>
							<FaEye size={14} />
							View on Github
						</a>
					</div>
				</div>

				{/* Bio */}
				{userProfile.bio && (
					<div className="flex items-center gap-1 mt-2">
						<TfiThought size={14} />
						<p className="text-sm">{userProfile.bio.substring(0, 60)}...</p>
					</div>
				)}

				{/* Location */}
				{userProfile.location && (
					<div className="flex items-center gap-1 mt-2">
						<IoLocationOutline size={14} />
						<p className="text-sm">{userProfile.location}</p>
					</div>
				)}

				{/* Twitter */}
				{userProfile.twitter_username && (
					<a
						href={`https://twitter.com/${userProfile.twitter_username}`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center gap-1 mt-2 hover:text-sky-500"
					>
						<FaXTwitter size={14} />
						<span className="text-sm">{userProfile.twitter_username}</span>
					</a>
				)}

				{/* Member Since */}
				<div className="mt-3">
					<p className="text-gray-600 font-bold text-xs">Member since</p>
					{/* <p>{memberSince}</p> */}
				</div>

				{/* Email */}
				{userProfile.email && (
					<div className="mt-2">
						<p className="text-gray-600 font-bold text-xs">Email address</p>
						<p className="text-sm">{userProfile.email}</p>
					</div>
				)}

				{/* Full Name */}
				{userProfile.name && (
					<div className="mt-2">
						<p className="text-gray-600 font-bold text-xs">Full name</p>
						<p className="text-sm">{userProfile.name}</p>
					</div>
				)}

				{/* Username */}
				<div className="mt-2">
					<p className="text-gray-600 font-bold text-xs">Username</p>
					<p className="text-sm">{userProfile.login}</p>
				</div>
			</div>

			{/* Stats Section */}
			<div className="flex flex-col gap-1 mx-2">
				{/* First Row: Followers & Following */}
				<div className="flex gap-1">
					<div className="flex items-center gap-1 bg-glass rounded-md p-2 flex-1 min-w-24">
						<RiUserFollowFill className="w-4 h-4 text-blue-800" />
						<p className="text-xs">Followers: {userProfile.followers}</p>
					</div>

					<div className="flex items-center gap-1 bg-glass rounded-md p-2 flex-1 min-w-24">
						<RiUserFollowLine className="w-4 h-4 text-blue-800" />
						<p className="text-xs">Following: {userProfile.following}</p>
					</div>
				</div>

				{/* Second Row: Repos & Gists */}
				<div className="flex gap-1">
					<div className="flex items-center gap-1 bg-glass rounded-md p-2 flex-1 min-w-24">
						<RiGitRepositoryFill className="w-4 h-4 text-blue-800" />
						<p className="text-xs">Repos: {userProfile.public_repos}</p>
					</div>

					<div className="flex items-center gap-1 bg-glass rounded-md p-2 flex-1 min-w-24">
						<RiGitRepositoryFill className="w-4 h-4 text-blue-800" />
						<p className="text-xs">Gists: {userProfile.public_gists}</p>
					</div>
				</div>
			</div>
		</div>
	);
};

export default ProfileInfo;