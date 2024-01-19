import { P2PExchange, P2PRawOrders } from "@/types";
import { sleep } from "@/utils/time.util";
import moment from "moment";
import {
	getRawOrdersFromDisk,
	isExchangeOrdersAlreadyOnDisk,
	writeRawOrdersOnDisk,
} from "./utils";

export type FetchDate = { year: number; month: number; day: number };

export type P2POrdersFetchOptions = {
	startDate: FetchDate;
	endDate: FetchDate;
	nickName: string;
};

const getDateFromBeginDay = (date: Date) => {
	return moment(date).startOf("day").toDate();
};

const getDateFromEndDay = (date: Date) => {
	return moment(date).endOf("day").toDate();
};

const getOptionsDate = (fetchOptions: P2POrdersFetchOptions) => {
	const { startDate, endDate } = fetchOptions;
	const startDateDate = new Date(
		startDate.year,
		startDate.month - 1,
		startDate.day,
		0,
		0,
		0,
		0
	);
	const endDateDate = new Date(
		endDate.year,
		endDate.month - 1,
		endDate.day,
		23,
		59,
		59,
		999
	);
	return [startDateDate, endDateDate];
};

const getMaxDate = (startDate: Date, maxDate: Date, durationDays: number) => {
	// Get the max date that is durationDays after startDate
	const startMaxDate = getDateFromBeginDay(startDate);
	startMaxDate.setDate(startMaxDate.getDate() + durationDays);
	return startMaxDate > maxDate ? maxDate : startMaxDate;
};

const filterExchangesFromCache = (
	exchanges: P2PExchange[],
	fetchOptions: P2POrdersFetchOptions
) => {
	// Filter exchanges that already have orders on disk
	const fetchExchanges = exchanges.filter(
		(exchange) => !isExchangeOrdersAlreadyOnDisk(fetchOptions, exchange)
	);
	const cachedExchanges = exchanges.filter((exchange) =>
		isExchangeOrdersAlreadyOnDisk(fetchOptions, exchange)
	);

	// Write cached orders into rawOrders
	const ordersInCache: P2PRawOrders[] = getRawOrdersFromDisk(
		cachedExchanges,
		fetchOptions
	);

	// Create orders date for caching
	fetchExchanges.forEach((exchange) => {
		ordersInCache.push({
			exchangeName: exchange.name,
			orders: [],
		});
	});

	return { fetchExchanges, ordersInCache };
};

const MAX_FETCH_DURATION_DAYS = 59;

export async function fetchP2POrders(
	exchanges: P2PExchange[],
	fetchOptions: P2POrdersFetchOptions
): Promise<P2PRawOrders[]> {
	const [startDate, endDate] = getOptionsDate(fetchOptions);

	// Fetch orders in batches of MAX_FETCH_DURATION_DAYS
	let nextStartDate = getDateFromBeginDay(startDate);
	let nextEndDate = getDateFromEndDay(
		getMaxDate(startDate, endDate, MAX_FETCH_DURATION_DAYS)
	);

	const { fetchExchanges, ordersInCache: rawOrders } = filterExchangesFromCache(
		exchanges,
		fetchOptions
	);

	if (fetchExchanges.length === 0) {
		return rawOrders;
	}

	while (nextStartDate < endDate) {
		// Fetch orders from all exchanges
		await Promise.all(
			fetchExchanges.map(async (exchange) => {
				// fetch orders from exchange
				const orders = await exchange.fetchP2POrders(
					nextStartDate,
					nextEndDate
				);

				// put orders into rawOrders for caching(writing on disk)
				const exchangeRawOrders = rawOrders.find(
					(data) => data.exchangeName == exchange.name
				);
				exchangeRawOrders?.orders.push(...orders);
			})
		);

		// Update dates for next iteration
		nextEndDate.setDate(nextEndDate.getDate() + 1);
		nextStartDate = getDateFromBeginDay(nextEndDate);
		nextEndDate = getDateFromEndDay(
			getMaxDate(nextStartDate, endDate, MAX_FETCH_DURATION_DAYS)
		);

		// Wait for a second to avoid rate limiting
		await sleep(1000);
	}

	writeRawOrdersOnDisk(fetchOptions, exchanges, rawOrders);

	return rawOrders;
}
