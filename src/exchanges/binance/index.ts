import { P2PExchange, P2POrder } from "@/types";
import { formatDate, sleep } from "@/utils/time.util";
import axios from "axios";

export class BinanceP2PExchange implements P2PExchange {
	name: string = "Binance";
	p2pOrdersUrl: string =
		"https://www.binance.com/bapi/c2c/v1/private/c2c/order-match/order-list-archived-involved";

	constructor(
		private readonly sessionId: string,
		private readonly csrfToken: string
	) {
		if (!sessionId)
			throw new Error(`"sessionId" for ${this.name} not provided`);
		if (!csrfToken)
			throw new Error(`"csrfToken" for ${this.name} not provided`);
	}

	getRequestPayload(startDate: Date, endDate: Date, page: number) {
		const startDateStr = startDate.getTime().toString();
		const endDateStr = endDate.getTime().toString();

		const body = {
			page,
			rows: 40,
			startDate: startDateStr,
			endDate: endDateStr,
			orderStatusList: [4], // 4 - completed
		};

		const headers = {
			Host: "www.binance.com",
			clienttype: "web",
			"Content-Length": JSON.stringify(body).length,
			"Content-Type": "application/json",
			csrftoken: this.csrfToken,
			Cookie: `p20t=${this.sessionId};`,
			"User-Agent":
				"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		};

		return {
			body,
			headers,
		};
	}

	async fetchP2POrders(startDate: Date, endDate: Date): Promise<any[]> {
		try {
			let page = 1;
			const orders: any[] = [];

			while (true) {
				console.log(`Fetching ${this.name} P2P Orders page ${page}`);
				const { body, headers } = this.getRequestPayload(
					startDate,
					endDate,
					page
				);

				const res = await axios.post(this.p2pOrdersUrl, body, { headers });

				const { data: fetchedOrders } = res.data;
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

	parseP2POrders(fetchedOrders: any[]): P2POrder[] {
		const orders: P2POrder[] = [];

		const getOrderUrl = (orderId: string, createdAt: string) =>
			`https://c2c.binance.com/ru/fiatOrderDetail?orderNo=${orderId}&createdAt=${createdAt}`;
		const getCounterPartyNickname = (order: any) =>
			(order.tradeType == "BUY" ? order.sellerNickname : order.buyerNickname) ||
			order.makerNickname;
		const getBankName = (order: any) => {
			const selectedPaymentId = order.selectedPayId;
			const paymentMethods: any[] = order.payMethods;

			const selectedPayment = paymentMethods.find(
				(payment: any) => payment.id == selectedPaymentId
			);
			return (
				selectedPayment.tradeMethodName ||
				selectedPayment.tradeMethodShortName ||
				selectedPayment.identifier
			);
		};

		const getCounterPartyName = (order: any) => {
			const paymentMethods: any[] = order.payMethods;
			const searchFieldNames = ["full name", "name"];

			for (let payment of paymentMethods) {
				const fields: any[] = payment.fields;
				if (!fields) continue;

				for (let searchFieldName of searchFieldNames) {
					for (let field of fields) {
						if (
							field.fieldName?.toLowerCase?.() == searchFieldName &&
							field.fieldValue
						)
							return field.fieldValue;
					}
				}
			}
		};

		for (let order of fetchedOrders) {
			orders.push({
				url: getOrderUrl(order.orderNumber, order.createTime),
				orderId: order.orderNumber,
				counterPartyNickname: getCounterPartyNickname(order) || "?",
				counterPartyName:
					order.tradeType == "BUY" ? getCounterPartyName(order) : "",
				side: order.tradeType,
				exchange: this.name,
				dateAndTime: formatDate(new Date(order.createTime)),
				price: parseFloat(order.price),
				count: parseFloat(order.amount),
				amount: parseFloat(order.totalPrice),
				asset: order.asset,
				bankName: getBankName(order) || "?",
				fiat: order.fiat,
			});
		}

		return orders;
	}
}
