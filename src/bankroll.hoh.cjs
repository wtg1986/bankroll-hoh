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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Bankroll = void 0;
const bull_1 = __importDefault(require("bull"));
class Bankroll {
    constructor(redis) {
        this.init = ({ type, currency, max_invest, max_bet_round, max_profit_round, init_jackpot, min_balance, warning_percent, min_leverage_percent, max_leverage_percent, interest_leverage_percent }) => __awaiter(this, void 0, void 0, function* () {
            const thisGamebank = yield this.redisClient.get('gamebank');
            if (thisGamebank) {
                return thisGamebank;
            }
            else {
                return yield this.redisClient.set('gamebank', {
                    type,
                    currency,
                    max_invest,
                    max_bet_round,
                    max_profit_round,
                    init_jackpot,
                    min_balance,
                    warning_percent,
                    min_leverage_percent,
                    max_leverage_percent,
                    interest_leverage_percent
                });
            }
        });
        this.bet = ({ user_name, amount }) => __awaiter(this, void 0, void 0, function* () {
            const existUser = yield this.redisClient.query('users', {
                key: 'user_name',
                condition: user_name,
            });
            if (!existUser)
                return 'Không tồn tại user';
            yield this.queueProcess.add({
                type: 'BET',
                existUser,
                amount
            });
        });
        this.prize = ({ user_name, amount }) => __awaiter(this, void 0, void 0, function* () {
            const existUser = yield this.redisClient.query('users', {
                key: 'user_name',
                condition: user_name,
            });
            if (!existUser)
                return 'Không tồn tại user';
            yield this.queueProcess.add({
                type: 'PRIZE',
                existUser,
                amount
            });
        });
        this.info = () => __awaiter(this, void 0, void 0, function* () {
            let thisGamebank = yield this.redisClient.get('gamebank');
            if (!thisGamebank)
                return 'Bankroll chưa khởi tạo';
            return thisGamebank;
        });
        this.deposit = ({ user_name, amount }) => __awaiter(this, void 0, void 0, function* () {
            const existUser = yield this.redisClient.query('users', {
                key: 'user_name',
                condition: user_name,
            });
            if (!existUser)
                return 'Không tồn tại user';
            yield this.queueProcess.add({
                type: 'DEPOSIT',
                existUser,
                amount
            });
        });
        this.withdraw = ({ user_name, amount }) => __awaiter(this, void 0, void 0, function* () {
            const existUser = yield this.redisClient.query('users', {
                key: 'user_name',
                condition: user_name,
            });
            if (!existUser)
                return 'Không tồn tại user';
            yield this.queueProcess.add({
                type: 'WITHDRAW',
                existUser,
                amount
            });
        });
        this.start = () => {
            this.queueProcess.process((job, done) => __awaiter(this, void 0, void 0, function* () {
                const vl = yield this._process_backroll(job.data);
                done(null, vl);
            }));
            this.queueProcess.on('completed', (job, result) => {
                this.onDone(result);
            });
        };
        this._process_backroll = (data) => __awaiter(this, void 0, void 0, function* () {
            if (!data || !data.type)
                return;
            const { existUser, amount } = data;
            let thisGamebank = yield this.redisClient.get('gamebank');
            if (!thisGamebank)
                return 'Bankroll chưa khởi tạo';
            let invests = yield this.redisClient.get('invests');
            switch (data.type) {
                case 'BET':
                    if (existUser.balance < amount)
                        return 'User không đủ tiền';
                    if (existUser.balance > thisGamebank.max_bet * thisGamebank.balance)
                        return 'Mức bet quá lớn';
                    thisGamebank.balance += amount;
                    existUser.balance -= amount;
                    yield this.redisClient.set('gamebank', thisGamebank);
                    return yield this.redisClient.update('users', {
                        key: 'user_name',
                        condition: existUser.user_name,
                        field: 'balance',
                        value: existUser.balance
                    });
                    break;
                case 'PRIZE':
                    if (thisGamebank.balance > amount)
                        return 'Gamebank không đủ, prize được trả thưởng';
                    thisGamebank.balance -= amount;
                    existUser.balance += amount;
                    yield this.redisClient.set('gamebank', thisGamebank);
                    return yield this.redisClient.update('users', {
                        key: 'user_name',
                        condition: existUser.user_name,
                        field: 'balance',
                        value: existUser.balance
                    });
                    break;
                case 'DEPOSIT':
                    const ratio = !invests || Object.keys(invests).length === 1 ? 0 : 0.02;
                    if (existUser.balance < amount)
                        return 'Không đủ tiền';
                    if (thisGamebank.capital + (1 - ratio) * amount >= thisGamebank.max_invest)
                        return 'Bankroll đã vượt hạn mức đầu tư';
                    if (invests) {
                        let invested = false;
                        Object.keys(invests).forEach(key => {
                            invests[key].balance = invests[key].profit_percent * thisGamebank.balance;
                            invests[key].balance += amount * this.ratioInvest * invests[key].profit_percent;
                            invests[key].update_at = Date.now();
                            if (key === existUser.user_name) {
                                invests[key].capital += amount;
                                invests[key].balance += amount * (1 - this.ratioInvest);
                                invests[key].update_at = Date.now();
                                invested = true;
                            }
                        });
                        if (!invested) {
                            invests[existUser.user_name] = {
                                capital: amount,
                                balance: amount * (1 - this.ratioInvest),
                                create_at: Date.now(),
                                update_at: Date.now()
                            };
                        }
                    }
                    else {
                        invests = {};
                        invests[existUser.user_name] = {
                            capital: amount,
                            balance: amount,
                            create_at: Date.now(),
                            update_at: Date.now()
                        };
                    }
                    thisGamebank.capital = thisGamebank.capital ? thisGamebank.capital + (1 - ratio) * amount : amount;
                    thisGamebank.balance = thisGamebank.balance ? thisGamebank.balance + amount : amount;
                    Object.keys(invests).forEach(key => {
                        invests[key].profit_percent = invests[key].balance / thisGamebank.balance;
                    });
                    yield this.redisClient.update('users', {
                        key: 'user_name',
                        condition: existUser.user_name,
                        field: 'balance',
                        value: existUser.balance - amount
                    });
                    yield this.redisClient.set('gamebank', thisGamebank);
                    return yield this.redisClient.set('invests', invests);
                    break;
                case 'WITHDRAW':
                    console.log(existUser.user_name);
                    if (!invests || !invests[existUser.user_name])
                        return 'Chưa đầu tư';
                    if (thisGamebank.balance - amount <= thisGamebank.min_balance)
                        return 'Bankroll chạm mức min';
                    if (invests) {
                        Object.keys(invests).forEach(key => {
                            invests[key].balance = invests[key].profit_percent * thisGamebank.balance;
                        });
                        if (invests[existUser.user_name].balance < amount)
                            return 'Rút quá hạn mức';
                        const capital = invests[existUser.user_name].capital;
                        const profit = invests[existUser.user_name].balance - capital;
                        invests[existUser.user_name].balance -= amount;
                        invests[existUser.user_name].capital -= (profit > amount ? 0 : (amount - profit));
                        invests[existUser.user_name].update_at = Date.now();
                        if (invests[existUser.user_name].balance === 0)
                            invests[existUser.user_name] = undefined;
                        thisGamebank.balance -= amount;
                        thisGamebank.capital -= (profit > amount ? 0 : (amount - profit));
                        Object.keys(invests).forEach(key => {
                            invests[key].profit_percent = invests[key].balance / thisGamebank.balance;
                            invests[key].update_at = Date.now();
                        });
                        yield this.redisClient.update('users', {
                            key: 'user_name',
                            condition: existUser.user_name,
                            field: 'balance',
                            value: existUser.balance + amount
                        });
                        yield this.redisClient.set('gamebank', thisGamebank);
                        return yield this.redisClient.set('invests', invests);
                    }
                    break;
                default:
                    break;
            }
        });
        this.redisClient = redis;
        this.ratioInvest = 0.02;
        this.queueProcess = new bull_1.default('bankroll_process');
    }
    ;
}
exports.Bankroll = Bankroll;
