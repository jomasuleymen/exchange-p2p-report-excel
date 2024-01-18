import { P2PExchange, P2POrder } from "@/types";

export type FetchDate = { year: number; month: number; day: number };

export type P2POrdersFetchOptions = {
	startDate: FetchDate;
	endDate: FetchDate;
};

const getOptionsDate = (fetchOptions: P2POrdersFetchOptions) => {
	const { startDate, endDate } = fetchOptions;
	const startDateDate = new Date(
		startDate.year,
		startDate.month,
		startDate.day,
		0,
		0,
		0,
		0
	);
	const endDateDate = new Date(
		endDate.year,
		endDate.month,
		endDate.day,
		23,
		59,
		59,
		999
	);

	return [startDateDate, endDateDate];
};

const getStartMaxDate = (startDate: Date, maxDate: Date, durationDays: number) => {
	const startMaxDate = new Date(startDate);
	startMaxDate.setDate(startMaxDate.getDate() + durationDays);
	return startMaxDate > maxDate ? maxDate : startMaxDate;
}

const MAX_FETCH_DURATION_DAYS = 59;

export async function fetchP2POrders(
	exchanges: P2PExchange[],
	fetchOptions: P2POrdersFetchOptions
): Promise<P2POrder[]> {
	const [startDate, endDate] = getOptionsDate(fetchOptions);
	const allOrders: P2POrder[] = [];



	return allOrders;
}
