export function formatMemberSince(inputDateString: string): string {
	const options: Intl.DateTimeFormatOptions = { month: "short", day: "2-digit", year: "numeric" };
	const formattedDate = new Date(inputDateString).toLocaleDateString("en-US", options);
	return formattedDate;
}

export function formatDate(inputDateString: string): string {
	const months: string[] = [
		"January",
		"February",
		"March",
		"April",
		"May",
		"June",
		"July",
		"August",
		"September",
		"October",
		"November",
		"December",
	];

	const date = new Date(inputDateString);
	const monthName: string = months[date.getMonth()];
	const day: number = date.getDate();
	const year: number = date.getFullYear();

	// Function to add ordinal suffix to day
	function getOrdinalSuffix(day: number): string {
		if (day >= 11 && day <= 13) {
			return `${day}th`;
		}
		switch (day % 10) {
			case 1:
				return `${day}st`;
			case 2:
				return `${day}nd`;
			case 3:
				return `${day}rd`;
			default:
				return `${day}th`;
		}
	}

	const formattedDate: string = `${monthName} ${getOrdinalSuffix(day)}, ${year}`;
	return formattedDate;
}

