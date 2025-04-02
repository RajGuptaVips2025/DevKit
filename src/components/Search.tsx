"use client";

import { useState } from "react";
import { IoSearch } from "react-icons/io5";

interface SearchProps {
  onSearch: (event: React.FormEvent<HTMLFormElement>, username: string, searchType: string) => void;
}

const Search: React.FC<SearchProps> = ({ onSearch }) => {
  const [username, setUsername] = useState<string>("");
  const [searchType, setSearchType] = useState<string>("users");

  return (
    <form className="max-w-3xl mx-auto p-4" onSubmit={(e) => onSearch(e, username, searchType)}>
      <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">
        Search
      </label>
      <div className="relative flex items-center space-x-2">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 start-0 flex items-center z-10 ps-3 pointer-events-none">
            <IoSearch className="w-5 h-5" />
          </div>
          <input
            type="search"
            id="default-search"
            className="block w-full p-4 ps-10 text-sm rounded-lg bg-glass focus:ring-blue-500 focus:border-blue-500 bg-transparent focus:bg-transparent"
            placeholder="i.e. johndoe"
            required
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 text-sm border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          value={searchType}
          onChange={(e) => setSearchType(e.target.value)}
        >
          <option value="users">Users</option>
          <option value="repositories">Repositories</option>
        </select>
        <button
          type="submit"
          className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 bg-gradient-to-r from-cyan-900 to-blue-900 hover:scale-95 active:scale-90 transition-all duration-300"
        >
          Search
        </button>
      </div>
    </form>
  );
};

export default Search;

















// "use client";

// import { useState } from "react";
// import { IoSearch } from "react-icons/io5";

// interface SearchProps {
//   onSearch: (event: React.FormEvent<HTMLFormElement>, username: string) => void;
// }

// const Search: React.FC<SearchProps> = ({ onSearch }) => {
//   const [username, setUsername] = useState<string>("");
// const [searchType, setSearchType] = useState<string>("users");

//   return (
//     <form className="max-w-xl mx-auto p-2" onSubmit={(e) => onSearch(e, username)}>
//       <label htmlFor="default-search" className="mb-2 text-sm font-medium text-gray-900 sr-only">
//         Search
//       </label>
//       <div className="relative">
//         <div className="absolute inset-y-0 start-0 flex items-center z-10 ps-3 pointer-events-none">
//           <IoSearch className="w-5 h-5" />
//         </div>
//         <input
//           type="search"
//           id="default-search"
//           className="block w-full p-4 ps-10 text-sm rounded-lg bg-glass focus:ring-blue-500 focus:border-blue-500 bg-transparent focus:bg-transparent"
//           placeholder="i.e. johndoe"
//           required
//           value={username}
//           onChange={(e) => setUsername(e.target.value)}
//         />
//         <select
//         className="absolute end-24 bottom-2.5 px-2 py-2 text-sm border rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
//         value={searchType}
//         onChange={(e) => setSearchType(e.target.value)}
//         >
//         <option value="users">Users</option>
//         <option value="repositories">Repositories</option>
//         </select> 
//         <button
//           type="submit"
//           className="text-white absolute end-2.5 bottom-2.5 bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-4 py-2 bg-gradient-to-r from-cyan-900 to-blue-900 hover:scale-95 active:scale-90 transition-all duration-300"
//         >
//           Search
//         </button>
//       </div>
//     </form>
//   );
// };

// export default Search;
