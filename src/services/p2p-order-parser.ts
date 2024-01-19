import { P2PExchange, P2POrder, P2PRawOrders } from "@/types";
import _ from "lodash";

const showInfo = (orders: P2POrder[]) => {
	const groupedByExchange = _.groupBy(orders, "exchange");
	for (const [exchange, orders] of Object.entries(groupedByExchange)) {
		console.log(exchange, "-", orders.length, "orders");
	}
};

export async function parseOrders(
	excahnges: P2PExchange[],
	rawOrdersData: P2PRawOrders[]
) {
	const allParsedOrders: P2POrder[] = [];

	for (const exchangeRawOrders of rawOrdersData) {
		// find orders exchange
		const exchange = excahnges.find(
			(exchange) => exchange.name === exchangeRawOrders.exchangeName
		);

		if (!exchange) {
			throw new Error(
				`Exchange ${exchangeRawOrders.exchangeName} not found in exchanges list`
			);
		}

		const parsedOrders: P2POrder[] = await exchange.parseP2POrders(
			exchangeRawOrders.orders
		);

		allParsedOrders.push(...parsedOrders);
	}

	showInfo(allParsedOrders);

	return allParsedOrders;
}
