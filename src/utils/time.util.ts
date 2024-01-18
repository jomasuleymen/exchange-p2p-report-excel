import moment from "moment";

export function formatDate(date: Date): string {
	let momentDate = moment(date);
	momentDate = momentDate.utcOffset(6);

	return momentDate.format("YYYY-MM-DD HH:mm:ss");
}