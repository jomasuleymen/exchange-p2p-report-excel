import { P2POrder } from "@/types";
import { P2POrdersFetchOptions } from "../p2p-orders";
import Excel, { Workbook } from "exceljs";
import { getOrdersDirPath } from "../utils";
import path from "path";
import _ from "lodash";
import config from "@/config/config";

export class ExcelP2PService {
	private templatePath = path.join(__dirname, "template.xlsx");
	private templateWorkbook: Workbook | null = null;
	private templateSheetName = "template";

	// singleton
	private getTemplateWorkbook = async () => {
		if (this.templateWorkbook) {
			return this.templateWorkbook;
		}

		const workbook = new Excel.Workbook();
		await workbook.xlsx.readFile(this.templatePath);
		const currentTemplateSheet =
			workbook.getWorksheet("KZT") || workbook.worksheets[0];
		currentTemplateSheet.name = this.templateSheetName;

		this.templateWorkbook = workbook;

		return workbook;
	};

	private async prepareWorkBook() {
		const wb = new Excel.Workbook();

		// copy all sheets from template workbook
		const templateWorkbook = await this.getTemplateWorkbook();
		templateWorkbook.eachSheet((templateSheet) => {
			const ws = wb.addWorksheet(templateSheet.name);
			ws.model = templateSheet.model;
		});

		// remove template sheet, we will add from "addNewFiatCurrencySheet" method
		wb.removeWorksheet(this.templateSheetName);

		return wb;
	}

	private async addNewFiatCurrencySheet(wb: Workbook, fiatCurrency: string) {
		// if sheet already exists, delete it
		const existingSheet = wb.getWorksheet(fiatCurrency);
		if (existingSheet) wb.removeWorksheet(fiatCurrency);

		const templateWorkbook = await this.getTemplateWorkbook();
		const templateWorksheet =
			templateWorkbook.getWorksheet(this.templateSheetName) ||
			templateWorkbook.worksheets[0];

		const ws = wb.addWorksheet(fiatCurrency);
		ws.model = templateWorksheet.model;
		ws.name = fiatCurrency;

		return ws;
	}

	private insertOrdersToSheet(ws: Excel.Worksheet, orders: P2POrder[]) {
		for (const order of orders) {
			ws.addRow([
				"",
				{
					text: order.orderId,
					hyperlink: order.url,
					tooltip: "Ссылка на ордер",
				},
				order.counterPartyNickname,
				order.counterPartyName,
				order.side,
				order.exchange,
				order.dateAndTime,
				order.price,
				order.count,
				order.amount,
				order.asset,
				order.bankName,
				order.fiat,
			]);
		}
	}

	private filterOrders(orders: P2POrder[]) {
		const hideAccounts = config.hiddenAccounts;
		const hiddenOrders = _.filter(orders, (order) =>
			hideAccounts.includes(order.counterPartyNickname)
		);
		const visibleOrders = _.filter(
			orders,
			(order) => !hideAccounts.includes(order.counterPartyNickname)
		);

		return { hiddenOrders, visibleOrders };
	}

	public exportOrdersToExcel = async (
		orders: P2POrder[],
		fetchOptions: P2POrdersFetchOptions
	) => {
		// iterate over all orders and create a new spreadsheet for each fiat currency
		// for each fiat currency use "template" sheet as template
		// hidden orders stored in "Скрытые" sheet in template file

		const wb = await this.prepareWorkBook();
		const { hiddenOrders, visibleOrders } = this.filterOrders(orders);
		const groupedByFiat = _.groupBy(visibleOrders, "fiat");

		for (const [fiatCurrency, orders] of Object.entries(groupedByFiat)) {
			const ws = await this.addNewFiatCurrencySheet(wb, fiatCurrency);
			this.insertOrdersToSheet(ws, orders);
		}

		const ws = await this.addNewFiatCurrencySheet(wb, "Скрытые");
		this.insertOrdersToSheet(ws, hiddenOrders);

		const ordersDirPath = getOrdersDirPath(fetchOptions);
		const filePath = path.join(ordersDirPath, "report.xlsx");
		await wb.xlsx.writeFile(filePath, { useStyles: true });
	};
}
