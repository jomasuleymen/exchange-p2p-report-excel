import path from "path";
import { P2POrdersFetchOptions } from "./p2p-orders";
import { P2PExchange, P2POrder } from "@/types";
import { writeJsonFile } from "@/utils/file.util";
import * as fs from "fs";

const getAccountOrdersPath = (nickName: string) => {
	return path.join(__dirname, "..", "orders", nickName);
};

export const getOrdersDirPath = (fetchOptions: P2POrdersFetchOptions) => {
	const { startDate, endDate, nickName } = fetchOptions;
	const start = `${startDate.year}-${startDate.month}-${startDate.day}`;
	const end = `${endDate.year}-${endDate.month}-${endDate.day}`;

	const ordersPath = getAccountOrdersPath(nickName);
	return path.join(ordersPath, `${start}_${end}`);
};

export const getExchangeOrdersFilePath = (
	fetchOptions: P2POrdersFetchOptions,
	exchange: P2PExchange
) => {
	const ordersDirPath = getOrdersDirPath(fetchOptions);
	return path.join(ordersDirPath, `${exchange.name}.json`);
};

export const writeOrdersOnDisk = (
	fetchOptions: P2POrdersFetchOptions,
	exchanges: P2PExchange[],
	orders: P2POrder[]
) => {
	exchanges.forEach((exchange) => {
		const ordersDirPath = getExchangeOrdersFilePath(fetchOptions, exchange);
		const exchangeOrders = orders.filter(
			(order) => order.exchange === exchange.name
		);
		writeJsonFile(ordersDirPath, exchangeOrders);
	});
};

export const isExchangeOrdersAlreadyOnDisk = (
	fetchOptions: P2POrdersFetchOptions,
	exchange: P2PExchange
) => {
	const ordersDirPath = getExchangeOrdersFilePath(fetchOptions, exchange);
	return fs.existsSync(ordersDirPath);
};
