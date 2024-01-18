import * as fs from "fs";
import path from "path";

export const writeJsonFile = (path: string, data: any) => {
	ensureDirectoryExistence(path);
	fs.writeFileSync(path, JSON.stringify(data, null, 4));
};

export const readJsonFile = (path: string) => {
	if (fs.existsSync(path)) {
		return JSON.parse(fs.readFileSync(path, "utf8"));
	}
};

export const ensureDirectoryExistence = (filePath: string) => {
	var dirname = path.dirname(filePath);
	if (!fs.existsSync(dirname)) {
		fs.mkdirSync(dirname, { recursive: true });
	}
};
