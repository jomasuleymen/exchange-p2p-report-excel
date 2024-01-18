import config from "./config/config";
import exchanges from "./exchanges";
import { fetchP2POrders } from "./services/p2p-orders";
import { P2POrder } from "./types";

const main = async () => {
	const startDate = { year: 2023, month: 1, day: 1 };
	const endDate = { year: 2023, month: 12, day: 31 };
	const fetchOptions = { startDate, endDate, nickName: config.nickName };

	if (exchanges.length === 0) {
		throw new Error("No exchanges provided");
	}

	const orders: P2POrder[] = await fetchP2POrders(exchanges, fetchOptions);
	console.log(orders.length);
	// await exportOrdersToExcel(orders, fetchOptions);
};

main();
