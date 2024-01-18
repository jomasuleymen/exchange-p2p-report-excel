import { P2PExchange, P2POrder } from "@/types";
import { sleep } from "@/utils/time.util";
import moment from "moment";
import {
	getExchangeOrdersFilePath,
	isExchangeOrdersAlreadyOnDisk,
	writeOrdersOnDisk,
} from "./utils";
import { readJsonFile } from "@/utils/file.util";
import * as fs from "fs";

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

const filterExchanges = (
	exchanges: P2PExchange[],
	fetchOptions: P2POrdersFetchOptions
) => {
	// Filter exchanges that already have orders on disk
	const fetchExchanges = exchanges.filter(
		(exchange) => !isExchangeOrdersAlreadyOnDisk(fetchOptions, exchange)
	);

	return fetchExchanges;
};

const getOrdersFromDisk = (
	exchanges: P2PExchange[],
	fetchOptions: P2POrdersFetchOptions
) => {
	const orders: P2POrder[] = [];
	exchanges.forEach((exchange) => {
		const exchangeOrdersPath = getExchangeOrdersFilePath(
			fetchOptions,
			exchange
		);

		if (fs.existsSync(exchangeOrdersPath)) {
			console.log(`Reading orders on disk for ${exchange.name}`);
			const exchangeOrders = readJsonFile(exchangeOrdersPath);
			orders.push(...exchangeOrders);
		}
	});

	return orders;
};

const MAX_FETCH_DURATION_DAYS = 59;

export async function fetchP2POrders(
	exchanges: P2PExchange[],
	fetchOptions: P2POrdersFetchOptions
): Promise<P2POrder[]> {
	const [startDate, endDate] = getOptionsDate(fetchOptions);
	const allOrders: P2POrder[] = getOrdersFromDisk(exchanges, fetchOptions);
	const fetchExchanges = filterExchanges(exchanges, fetchOptions);

	// Fetch orders in batches of MAX_FETCH_DURATION_DAYS
	let nextStartDate = getDateFromBeginDay(startDate);
	let nextEndDate = getDateFromEndDay(
		getMaxDate(startDate, endDate, MAX_FETCH_DURATION_DAYS)
	);

	if (fetchExchanges.length === 0) {
		return allOrders;
	}

	while (nextStartDate < endDate) {
		// Fetch orders from all exchanges
		const orders = await Promise.all(
			fetchExchanges.map((exchange) =>
				exchange.fetchP2POrders(nextStartDate, nextEndDate)
			)
		);

		// Flatten orders array
		orders.forEach((orders) => allOrders.push(...orders));

		// Update dates for next iteration
		nextEndDate.setDate(nextEndDate.getDate() + 1);
		nextStartDate = getDateFromBeginDay(nextEndDate);
		nextEndDate = getDateFromEndDay(
			getMaxDate(nextStartDate, endDate, MAX_FETCH_DURATION_DAYS)
		);

		// Wait for a second to avoid rate limiting
		await sleep(1000);
	}

	writeOrdersOnDisk(fetchOptions, exchanges, allOrders);

	return allOrders;
}
