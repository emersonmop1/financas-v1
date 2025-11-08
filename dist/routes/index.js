"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_routes_1 = __importDefault(require("./auth.routes"));
const account_routes_1 = __importDefault(require("./account.routes"));
const transaction_routes_1 = __importDefault(require("./transaction.routes"));
const category_routes_1 = __importDefault(require("./category.routes"));
const report_routes_1 = __importDefault(require("./report.routes"));
const creditCard_routes_1 = __importDefault(require("./creditCard.routes"));
const goal_routes_1 = __importDefault(require("./goal.routes"));
const import_routes_1 = __importDefault(require("./import.routes"));
const invoice_routes_1 = __importDefault(require("./invoice.routes"));
const router = (0, express_1.Router)();
router.use('/auth', auth_routes_1.default);
router.use('/accounts', account_routes_1.default);
router.use('/transactions', transaction_routes_1.default);
router.use('/categories', category_routes_1.default);
router.use('/reports', report_routes_1.default);
router.use('/credit-cards', creditCard_routes_1.default);
router.use('/goals', goal_routes_1.default);
router.use('/imports', import_routes_1.default);
router.use('/invoices', invoice_routes_1.default);
// Health check
router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
exports.default = router;
//# sourceMappingURL=index.js.map