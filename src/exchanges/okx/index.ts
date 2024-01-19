import { P2PExchange, P2POrder } from "@/types";
import { formatDate, sleep } from "@/utils/time.util";
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
			pageSize: 40,
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
