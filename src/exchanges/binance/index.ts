import { P2PExchange, P2POrder } from "@/types";
import { formatDate } from "@/utils/time.util";
import axios from "axios";

export class BinanceP2PExchange implements P2PExchange {
	exchangeName: string = "Binance";
	p2pOrdersUrl: string =
		"https://www.binance.com/bapi/c2c/v1/private/c2c/order-match/order-list-archived-involved";

	constructor(
		private readonly sessionId: string,
		private readonly csrfToken: string
	) {
		if (!sessionId)
			throw new Error(`"sessionId" for ${this.exchangeName} not provided`);
		if (!csrfToken)
			throw new Error(`"csrfToken" for ${this.exchangeName} not provided`);
	}

	getRequestPayload(startDate: Date, endDate: Date, page: number) {
		const startDateStr = startDate.getTime().toString();
		const endDateStr = endDate.getTime().toString();

		const body = {
			page,
			rows: 30, // TODO: check max rows number
			startDate: startDateStr,
			endDate: endDateStr,
			orderStatusList: [4], // 4 - completed
		};

		const headers = {
			Host: "www.binance.com",
			clienttype: "web",
			"Content-Length": JSON.stringify(body),
			"content-type": "application/json",
			csrftoken: this.csrfToken,
			Cookie: `p20t=${this.sessionId};`,
		};

		return {
			body,
			headers,
		};
	}

	async fetchP2POrders(startDate: Date, endDate: Date): Promise<P2POrder[]> {
		try {
			let page = 1;
			const orders: P2POrder[] = [];

			while (true) {
				const { body, headers } = this.getRequestPayload(
					startDate,
					endDate,
					page
				);
				const res = await axios.post(this.p2pOrdersUrl, body, { headers });

				const { data: fetchedOrders } = res.data;
				if (!fetchedOrders || !fetchedOrders?.length) break;

				const parsedOrders: P2POrder[] = this.parseOrders(fetchedOrders);

				orders.push(...parsedOrders);
				page++;
			}

			return orders;
		} catch (err) {
			throw new Error(
				`Some error while fetching P2POrders of ${this.exchangeName}: ${err}`
			);
		}
	}

	parseOrders(fetchedOrders: any[]): P2POrder[] {
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
							field.fieldName?.toLoweCase?.() == searchFieldName &&
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
				counterPartyName: getCounterPartyName(order) || "?",
				side: order.tradeType,
				exchange: this.exchangeName,
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
