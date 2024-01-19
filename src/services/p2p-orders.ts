import { P2PExchange, P2PRawOrders } from "@/types";
import { readJsonFile } from "@/utils/file.util";
import { sleep } from "@/utils/time.util";
import * as fs from "fs";
import moment from "moment";
import {
	getExchangeOrdersFilePath,
	isExchangeOrdersAlreadyOnDisk,
	writeOrdersOnDisk,
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
	const orders: P2PRawOrders[] = [];
	exchanges.forEach((exchange) => {
		const exchangeOrdersPath = getExchangeOrdersFilePath(
			fetchOptions,
			exchange
		);

		if (fs.existsSync(exchangeOrdersPath)) {
			console.log(`Reading orders on disk for ${exchange.name}`);
			const exchangeOrders: P2PRawOrders = readJsonFile(exchangeOrdersPath);
			orders.push(exchangeOrders);
		}
	});

	return orders;
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

	const fetchExchanges = filterExchanges(exchanges, fetchOptions);
	const ordersData: P2PRawOrders[] = getOrdersFromDisk(exchanges, fetchOptions);
	fetchExchanges.forEach((exchange) => {
		ordersData.push({
			exchangeName: exchange.name,
			orders: [],
		});
	});

	if (fetchExchanges.length === 0) {
		return ordersData;
	}

	while (nextStartDate < endDate) {
		// Fetch orders from all exchanges
		await Promise.all(
			fetchExchanges.map(async (exchange) => {
				const orders = await exchange.fetchP2POrders(
					nextStartDate,
					nextEndDate
				);
				const data = ordersData.find(
					(data) => data.exchangeName === exchange.name
				);
				data?.orders.push(...orders);
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

	writeOrdersOnDisk(fetchOptions, exchanges, ordersData);

	return ordersData;
}
