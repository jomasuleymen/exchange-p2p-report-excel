import exchanges from "./exchanges";
import { P2POrder } from "./types";

const main = async () => {
	const startDate = { year: 2023, month: 0, day: 1 };
	const endDate = { year: 2023, month: 12, day: 31 };
	const fetchOptions = { startDate, endDate };

	const orders: P2POrder[] = await fetchP2POrders(exchanges, fetchOptions);
	await exportOrdersToExcel(orders, fetchOptions);
};

main();
