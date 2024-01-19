import moment from "moment";

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

function getMomentDate(date: Date | number | string) {
	if (typeof date == "string") {
		date = Number(date);
	}

	let momentDate = moment(date);
	if (!momentDate.isValid())
		throw new Error("'formatDate' date param is not valid");

	momentDate = momentDate.utcOffset(6);

	return momentDate;
}

export function getDate(date: Date | number | string) {
	const momentDate = getMomentDate(date);
	return momentDate.toDate();
}

export function formatDate(date: Date | number | string): string {
	const momentDate = getMomentDate(date);
	return momentDate.format("YYYY-MM-DD HH:mm:ss");
}
