import config from "./config/config";
import exchanges from "./exchanges";
import { exportP2POrdersToExcel } from "./services/export";
import { parseOrders } from "./services/p2p-order-parser";
import { fetchP2POrders } from "./services/p2p-orders";
import { P2POrder, P2PRawOrders } from "./types";

const main = async () => {
	const startDate = { year: 2023, month: 1, day: 1 };
	const endDate = { year: 2023, month: 12, day: 31 };
	const fetchOptions = { startDate, endDate, nickName: config.nickName };

	if (exchanges.length === 0) {
		throw new Error("No exchanges provided");
	}

	const rawOrders: P2PRawOrders[] = await fetchP2POrders(
		exchanges,
		fetchOptions
	);
	const parsedOrders: P2POrder[] = await parseOrders(exchanges, rawOrders);

	await exportP2POrdersToExcel(parsedOrders, fetchOptions);
};

main();
