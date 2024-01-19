import config from "@/config/config";
import moment from "moment";

const timeOffSet = config.timeZone;

export const sleep = (ms: number) =>
	new Promise((resolve) => setTimeout(resolve, ms));

function getMomentDate(date: Date | number | string) {
	if (typeof date == "string") {
		date = Number(date);
	}

	let momentDate = moment(date);
	if (!momentDate.isValid())
		throw new Error("'formatDate' date param is not valid");

	return momentDate;
}

export function getUTCDate(date: Date) {
	const d = new Date(date);
	d.setTime(d.getTime() - timeOffSet * 60 * 60 * 1000);
	return d;
}

export function getLocalUTCDate(date: Date) {
	const d = new Date(date);
	d.setTime(d.getTime() + timeOffSet * 60 * 60 * 1000);
	return d;
}

export function getDate(date: Date | number | string) {
	const momentDate = getMomentDate(date);
	return getLocalUTCDate(momentDate.toDate());
}

export function formatDate(date: Date | number | string): string {
	const momentDate = getMomentDate(date);
	return momentDate.utcOffset(timeOffSet).format("YYYY-MM-DD HH:mm:ss");
}
