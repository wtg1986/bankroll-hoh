"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LisInvest = exports.ListUser = exports.NewUser = exports.Info = exports.Init = exports.Withdraw = exports.Invest = exports.Prize = exports.Bet = void 0;
const bankroll_hoh_1 = require("./bankroll.hoh.cjs");
const redis_help_1 = require("./utils/redis.help.cjs");
const redis = new redis_help_1.RedisAdapter();
const gbank = new bankroll_hoh_1.Bankroll(redis);
const Bet = (user_name, amount, onDone) => __awaiter(void 0, void 0, void 0, function* () {
    gbank.onDone = onDone;
    return (gbank && (yield gbank.bet({ user_name, amount })));
});
exports.Bet = Bet;
const Prize = (user_name, amount, onDone) => __awaiter(void 0, void 0, void 0, function* () {
    gbank.onDone = onDone;
    return (gbank && (yield gbank.prize({ user_name, amount })));
});
exports.Prize = Prize;
const Invest = (user_name, amount, onDone) => __awaiter(void 0, void 0, void 0, function* () {
    gbank.onDone = onDone;
    return (gbank && (yield gbank.deposit({ user_name, amount })));
});
exports.Invest = Invest;
const Withdraw = (user_name, amount, onDone) => __awaiter(void 0, void 0, void 0, function* () {
    gbank.onDone = onDone;
    return (gbank && (yield gbank.withdraw({ user_name, amount })));
});
exports.Withdraw = Withdraw;
const Init = (config) => __awaiter(void 0, void 0, void 0, function* () {
    return (gbank && (yield gbank.init(config)));
    // redis?.quit();
});
exports.Init = Init;
const Info = () => __awaiter(void 0, void 0, void 0, function* () {
    return (gbank && (yield gbank.info()));
});
exports.Info = Info;
const NewUser = ({ user_name, balance }) => __awaiter(void 0, void 0, void 0, function* () {
    return (redis && (yield redis.insert('users', { user_name, balance })));
});
exports.NewUser = NewUser;
const ListUser = () => __awaiter(void 0, void 0, void 0, function* () {
    return (redis && (yield redis.get('users')));
});
exports.ListUser = ListUser;
const LisInvest = () => __awaiter(void 0, void 0, void 0, function* () {
    return (redis && (yield redis.get('invests')));
});
exports.LisInvest = LisInvest;
gbank.start();
// if (parentPort) {
//     parentPort.once("message", async (data) => {
//         const { method, input } = data;
//         switch (method) {
//             case 'Bet':
//                 parentPort && parentPort.postMessage(await Bet(input.user_name, input.amount));
//                 break;
//             case 'Prize':
//                 parentPort && parentPort.postMessage(await Prize(input.user_name, input.amount));
//                 break;
//             case 'Init':
//                 parentPort && parentPort.postMessage(await Init(input));
//                 break;
//             case 'Invest':
//                 parentPort && parentPort.postMessage(await Invest(input.user_name, input.amount));
//                 break;
//             case 'Withdraw':
//                 parentPort && parentPort.postMessage(await Withdraw(input.user_name, input.amount));
//                 break;
//             case 'Info':
//                 parentPort && parentPort.postMessage(await Info());
//                 break;
//             case 'NewUser':
//                 parentPort && parentPort.postMessage(await NewUser(input));
//                 break;
//             case 'ListUser':
//                 parentPort && parentPort.postMessage(await ListUser());
//                 break;
//             case 'ListInvest':
//                 parentPort && parentPort.postMessage(await LisInvest());
//                 break;
//             default:
//                 break;
//         }
//     })
// }
