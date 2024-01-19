import { P2PExchange, P2POrder } from "@/types";
import { getDate, sleep } from "@/utils/time.util";
import axios from "axios";

export class OkxP2PExchange implements P2PExchange {
	name: string = "OKX";
	p2pOrdersUrl: string = "https://www.okx.com/v4/c2c/order/getOrderList";

	constructor(private readonly auth_token: string) {
		if (!auth_token)
			throw new Error(`"Authorization" for ${this.name} not provided`);
	}

	getRequestPayload(startDate: Date, endDate: Date, page: number) {
		const startDateStr = startDate.getTime().toString();
		const endDateStr = endDate.getTime().toString();

		const params = {
			pageSize: 45,
			pageIndex: page,
			startTime: startDateStr,
			orderType: "completed",
			orderStatusLabel: 4,
			endTime: endDateStr,
		};

		const headers = {
			Host: "www.okx.com",
			Authorization: this.auth_token,
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		};

		return {
			params,
			headers,
		};
	}

	async fetchP2POrders(startDate: Date, endDate: Date): Promise<any[]> {
		try {
			let page = 1;
			const orders: any[] = [];

			while (true) {
				console.log(`Fetching ${this.name} P2P Orders page ${page}`);
				const { params, headers } = this.getRequestPayload(
					startDate,
					endDate,
					page
				);

				const res = await axios.get(this.p2pOrdersUrl, { headers, params });

				const {
					data: { items: fetchedOrders },
				} = res.data;
				if (!fetchedOrders || !fetchedOrders?.length) break;

				orders.push(...fetchedOrders);
				page++;

				await sleep(1500);
			}

			return orders;
		} catch (err) {
			throw new Error(
				`Some error while fetching P2POrders of ${this.name}: ${err}`
			);
		}
	}

	async parseP2POrders(fetchedOrders: any[]): Promise<P2POrder[]> {
		const orders: P2POrder[] = [];

		const getOrderUrl = (orderId: string) =>
			`https://www.okx.com/ru/p2p/order?orderId=${orderId}`;

		for (let order of fetchedOrders) {
			orders.push({
				url: getOrderUrl(order.id),
				orderId: order.id,
				counterPartyNickname: order.detailUser?.nickName || "?",
				counterPartyName: order.detailUser?.realName || "?",
				side: order.side.toUpperCase() || "?",
				exchange: this.name,
				dateAndTime: getDate(order.createdDate),
				price: parseFloat(order.price),
				count: parseFloat(order.baseAmount),
				amount: parseFloat(order.quoteAmount),
				asset: order.baseCurrency.toUpperCase(),
				bankName: order.receiptAccountType || "?",
				fiat: order.quoteCurrency.toUpperCase(),
			});
		}

		return orders;
	}
}
