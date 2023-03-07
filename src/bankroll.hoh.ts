import { RedisAdapter } from './utils/redis.help';
import Queue from "bull";
// import { RedisFunctions } from 'redis';

interface ProcessData {
    type: string;// BET, PRIZE, DEPOST, WITHDRAW,
    user_name: string;
    amount: number;
}

export class Bankroll {
    redisClient: RedisAdapter;
    queueProcess: any;
    ratioInvest: number;
    
    constructor(redis: RedisAdapter) {
        this.redisClient = redis;
        this.ratioInvest = 0.02;
        this.queueProcess = new Queue<ProcessData>('bankroll_process');
    };

    public onDone!: Function;

    public init = async ({
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
    }: any) => {
        const thisGamebank = await this.redisClient.get('gamebank');
        if (thisGamebank) {
            return thisGamebank
        } else {
            return await this.redisClient.set('gamebank', {
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
    }

    public bet = async ({ user_name, amount }: any) => {
        const existUser = await this.redisClient.query('users', {
            key: 'user_name',
            condition: user_name,
        });
        if (!existUser) return 'Không tồn tại user';
        await this.queueProcess.add({
            type: 'BET',
            existUser,
            amount
        });
    }

    public prize = async ({ user_name, amount }: any) => {
        const existUser = await this.redisClient.query('users', {
            key: 'user_name',
            condition: user_name,
        });
        if (!existUser) return 'Không tồn tại user';
        await this.queueProcess.add({
            type: 'PRIZE',
            existUser,
            amount
        });
    }

    public info = async () => {
        let thisGamebank = await this.redisClient.get('gamebank');
        if (!thisGamebank) return 'Bankroll chưa khởi tạo';
        return thisGamebank
    }

    public deposit = async ({ user_name, amount }: any) => {
        const existUser = await this.redisClient.query('users', {
            key: 'user_name',
            condition: user_name,
        });
        if (!existUser) return 'Không tồn tại user';
        await this.queueProcess.add({
            type: 'DEPOSIT',
            existUser,
            amount
        })
    }

    public withdraw = async ({ user_name, amount }: any) => {
        const existUser = await this.redisClient.query('users', {
            key: 'user_name',
            condition: user_name,
        });
        if (!existUser) return 'Không tồn tại user';
        await this.queueProcess.add({
            type: 'WITHDRAW',
            existUser,
            amount
        });
    }

    public start = () => {
        this.queueProcess.process(async (job: any, done: any) => {
            const vl = await this._process_backroll(job.data);
            done(null, vl);
        });
        this.queueProcess.on('completed', (job: any, result: any) => {
            this.onDone(result);
        });
    }
    
    private _process_backroll = async (data: any) => {
        if (!data || !data.type) return;
        const { existUser, amount } = data;

        let thisGamebank = await this.redisClient.get('gamebank');
        if (!thisGamebank) return 'Bankroll chưa khởi tạo';
        
        let invests = await this.redisClient.get('invests');

        switch (data.type) {
            case 'BET':
                if (existUser.balance < amount) return 'User không đủ tiền';
                if (existUser.balance > thisGamebank.max_bet * thisGamebank.balance) return 'Mức bet quá lớn';
                
                thisGamebank.balance += amount;
                existUser.balance -= amount;
                await this.redisClient.set('gamebank', thisGamebank);
                return await this.redisClient.update('users', {
                    key: 'user_name',
                    condition: existUser.user_name,
                    field: 'balance',
                    value: existUser.balance
                });

                break;
            
            case 'PRIZE':
                if (thisGamebank.balance > amount) return 'Gamebank không đủ, prize được trả thưởng';
                
                thisGamebank.balance -= amount;
                existUser.balance += amount;

                await this.redisClient.set('gamebank', thisGamebank);
                return await this.redisClient.update('users', {
                    key: 'user_name',
                    condition: existUser.user_name,
                    field: 'balance',
                    value: existUser.balance
                });

                break;
            case 'DEPOSIT':
                const ratio = !invests || Object.keys(invests).length === 1 ? 0 : 0.02;
                if (existUser.balance < amount) return 'Không đủ tiền';

                if (thisGamebank.capital + (1 - ratio) * amount >= thisGamebank.max_invest) return 'Bankroll đã vượt hạn mức đầu tư';

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
                    })
                    if (!invested) {
                        invests[existUser.user_name] = {
                            capital: amount,
                            balance: amount * (1 - this.ratioInvest),
                            create_at: Date.now(),
                            update_at: Date.now()
                        }
                    }
                } else {
                    invests = {}
                    invests[existUser.user_name] = {
                        capital: amount,
                        balance: amount,
                        create_at: Date.now(),
                        update_at: Date.now()
                    }
                }

                thisGamebank.capital = thisGamebank.capital ? thisGamebank.capital + (1 - ratio) * amount : amount;
                thisGamebank.balance = thisGamebank.balance ? thisGamebank.balance + amount : amount;

                Object.keys(invests).forEach(key => {
                    invests[key].profit_percent = invests[key].balance / thisGamebank.balance;
                });
                
                await this.redisClient.update('users', {
                    key: 'user_name',
                    condition: existUser.user_name,
                    field: 'balance',
                    value: existUser.balance - amount
                });
                
                await this.redisClient.set('gamebank', thisGamebank);
                return await this.redisClient.set('invests', invests);

                break;
           
            case 'WITHDRAW':
                console.log(existUser.user_name)
                if (!invests || !invests[existUser.user_name]) return 'Chưa đầu tư';
                if (thisGamebank.balance - amount <= thisGamebank.min_balance) return 'Bankroll chạm mức min';

                if (invests) {
                    
                    Object.keys(invests).forEach(key => {
                        invests[key].balance = invests[key].profit_percent * thisGamebank.balance;
                    });

                    if (invests[existUser.user_name].balance < amount) return 'Rút quá hạn mức';

                    const capital = invests[existUser.user_name].capital;
                    const profit = invests[existUser.user_name].balance - capital;

                    invests[existUser.user_name].balance -= amount;
                    invests[existUser.user_name].capital -= (profit > amount ? 0 : (amount - profit));

                    invests[existUser.user_name].update_at = Date.now();
                    if (invests[existUser.user_name].balance === 0) invests[existUser.user_name] = undefined;

                    thisGamebank.balance -= amount;
                    thisGamebank.capital -= (profit > amount ? 0 : (amount - profit));

                    Object.keys(invests).forEach(key => {
                        invests[key].profit_percent = invests[key].balance / thisGamebank.balance;
                        invests[key].update_at = Date.now();
                    });

                    await this.redisClient.update('users', {
                        key: 'user_name',
                        condition: existUser.user_name,
                        field: 'balance',
                        value: existUser.balance + amount
                    });
                   
                    await this.redisClient.set('gamebank', thisGamebank);
                    return await this.redisClient.set('invests', invests);

                } 
                break;
            
            default:
                break;
        }
    }
}

    