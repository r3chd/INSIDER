import { TEXT } from "../components/constants/text.js";

export function t(key, variables = {}) {
    let text = TEXT[key] || key;

    Object.keys(variables).forEach((varName) => {
        const regex = new RegExp(`{{varName}}`, "g");
        text = text.replace (regex, variables[varName]);
    });

    return text;
}