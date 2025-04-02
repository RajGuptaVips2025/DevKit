"use client"

import { useState } from "react";

const Page: React.FC = () => {
	const [selectedLanguage, setSelectedLanguage] = useState<string>("");

	const handleLanguageSelect = (language: string) => {
		setSelectedLanguage(language);
	};

	return (
		<div className='px-4'>
			<div className='bg-glass max-w-2xl mx-auto rounded-md p-4'>
				<h1 className='text-xl font-bold text-center'>Explore Popular Repositories</h1>
				<div className='flex flex-wrap gap-2 my-2 justify-center'>
					<img
						src='/javascript.svg'
						alt='JavaScript logo'
						className='h-11 sm:h-20 cursor-pointer'
						onClick={() => handleLanguageSelect("javascript")}
					/>
					<img
						src='/typescript.svg'
						alt='TypeScript logo'
						className='h-11 sm:h-20 cursor-pointer'
						onClick={() => handleLanguageSelect("typescript")}
					/>
					<img
						src='/c++.svg'
						alt='C++ logo'
						className='h-11 sm:h-20 cursor-pointer'
						onClick={() => handleLanguageSelect("c++")}
					/>
					<img
						src='/python.svg'
						alt='Python logo'
						className='h-11 sm:h-20 cursor-pointer'
						onClick={() => handleLanguageSelect("python")}
					/>
					<img
						src='/java.svg'
						alt='Java logo'
						className='h-11 sm:h-20 cursor-pointer'
						onClick={() => handleLanguageSelect("java")}
					/>
				</div>
				{selectedLanguage && (
					<h2 className='text-lg font-semibold text-center my-4'>
						<span className='bg-blue-100 text-blue-800 font-medium px-2.5 py-0.5 rounded-full'>
							{selectedLanguage.toUpperCase()} 
						</span>
						Repositories (Static Example)
					</h2>
				)}
			</div>
		</div>
	);
};

export default Page;