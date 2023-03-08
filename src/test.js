import {Init, Invest, Withdraw, Bet, Prize} from 'bankroll-hoh';

const start = async () => {

    // Khởi tạo Gamebank
    const configGb = {
        currency: 'BNB',
        max_invest: 1000000,
        max_bet_round: 0.0075,
        max_profit_round: 0.0125,
        init_jackpot: 5000,
        min_balance: 15000,
        warning_percent: 0.3,
        min_leverage_percent: 0.1,
        max_leverage_percent: 0.9,
        interest_leverage_percent: 0.13
    };
    const result = await Init(configGb);

    // Đầu tư Gamebank
    Invest('batman', 500, (result) => {
        // Do something...
        console.log(result);
    })

    ......
}