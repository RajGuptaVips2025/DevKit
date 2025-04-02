"use client";

import ProfileInfo from "@/components/ProfileInfo";
import Repos from "@/components/Repos";
import Search from "@/components/Search";
import SortRepos from "@/components/SortRepos";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

interface UserProfile {
  avatar_url: string;
  html_url: string;
  bio?: string;
  email?: string;
  followers: number;
  following: number;
  location?: string;
  name?: string;
  public_repos: number;
  public_gists: number;
  twitter_username?: string;
  login: string;
  created_at: string;
}

interface Repo {
  id: number;
  name: string;
  html_url: string;
  stargazers_count: number;
  forks_count: number;
  clone_url: string;
  created_at: string;
  description?: string;
  language?: string;
}

const Page: React.FC = () => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [sortType, setSortType] = useState<string>("recent");

  // Fetch user profile and repos
  const getUserProfileAndRepos = async (username: string = "RajGuptaVips2025") => {
    setLoading(true);
    try {
      // Fetch user profile
      const userRes = await fetch(`https://api.github.com/users/${username}`);
      if (!userRes.ok) throw new Error("User not found");
      const userData: UserProfile = await userRes.json();

      // Fetch repositories
      const repoRes = await fetch(`https://api.github.com/users/${username}/repos?per_page=100`);
      if (!repoRes.ok) throw new Error("Failed to fetch repositories");
      const repoData: Repo[] = await repoRes.json();

      // Sort repositories by creation date
      const sortedRepos = repoData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      // Update state
      setUserProfile(userData);
      setRepos(sortedRepos);
    } catch (error: any) {
      toast.error(error.message);
      setUserProfile(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };

  // Load default user profile on mount
  useEffect(() => {
    getUserProfileAndRepos();
  }, []);

  // Handle search
  // const onSearch = async (e: React.FormEvent, username: string) => {
  //   e.preventDefault();
  //   if (!username.trim()) return;
  //   setLoading(true);
  //   await getUserProfileAndRepos(username);
  //   setSortType("recent");
  // };

  const onSearch = async (e: React.FormEvent, query: string, searchType: string) => {
    e.preventDefault();
    if (!query.trim()) return;
  
    setLoading(true);
  
    try {
      if (searchType === "users") {
        // Fetch user profile
        const userRes = await fetch(`https://api.github.com/users/${query}`);
        if (!userRes.ok) throw new Error("User not found");
        const userData: UserProfile = await userRes.json();
  
        // Fetch repositories of the user
        const repoRes = await fetch(`https://api.github.com/users/${query}/repos?per_page=100`);
        if (!repoRes.ok) throw new Error("Failed to fetch repositories");
        const repoData: Repo[] = await repoRes.json();
  
        // Sort repositories by creation date
        const sortedRepos = repoData.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
  
        setUserProfile(userData);
        setRepos(sortedRepos);
      } else {
        // Fetch repositories directly based on query
        const repoSearchRes = await fetch(`https://api.github.com/search/repositories?q=${query}+in:name`);
        if (!repoSearchRes.ok) throw new Error("Failed to fetch repositories");
        const repoSearchData = await repoSearchRes.json();
  
        setUserProfile(null); // Since we are only searching for repos
        setRepos(repoSearchData.items || []);
      }
    } catch (error: any) {
      toast.error(error.message);
      setUserProfile(null);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  };
  

  // Handle sorting
  const onSort = (sortType: string) => {
    const sortedRepos = [...repos];

    if (sortType === "recent") {
      sortedRepos.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortType === "stars") {
      sortedRepos.sort((a, b) => b.stargazers_count - a.stargazers_count);
    } else if (sortType === "forks") {
      sortedRepos.sort((a, b) => b.forks_count - a.forks_count);
    }

    setSortType(sortType);
    setRepos(sortedRepos);
  };

  return (
    <div className="flex flex-col items-center p-6">
      <Search onSearch={onSearch} />
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl">
        {/* Profile Section */}
        <div className="lg:w-1/3 border-black border-2 p-4">
          {loading ? <p>Loading profile...</p> : userProfile ? <ProfileInfo userProfile={userProfile} /> : <p className="text-center">No user found</p>}
        </div>

        {/* Repositories Section */}
        <div className="lg:w-2/3 border-black border-2 p-4">
          <SortRepos onSort={onSort} sortType={sortType} />
          {loading ? <p>Loading repositories...</p> : repos.length > 0 ? <Repos repos={repos} /> : <p className="text-center">No repositories found</p>}
        </div>
      </div>
    </div>
  );
};

export default Page;















