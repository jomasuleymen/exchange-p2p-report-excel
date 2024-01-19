import { P2PExchange, P2POrder, RawP2PData } from "@/types";

export function parseOrders(
	excahnges: P2PExchange[],
	rawOrdersData: RawP2PData[]
) {
	const allParsedOrders: P2POrder[] = [];

	for (const rawOrderData of rawOrdersData) {
		const exchange = excahnges.find(
			(exchange) => exchange.name === rawOrderData.exchangeName
		);
		if (!exchange) {
			throw new Error(
				`Exchange ${rawOrderData.exchangeName} not found in exchanges list`
			);
		}

		const parsedOrders: P2POrder[] = exchange.parseP2POrders(
			rawOrderData.orders
		);

		allParsedOrders.push(...parsedOrders);
	}

	return allParsedOrders;
}
