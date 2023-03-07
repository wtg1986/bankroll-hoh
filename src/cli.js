#!/usr/bin/env node
import yargs from "yargs";
import { hideBin } from 'yargs/helpers'
import chalk from "chalk";
import boxen from "boxen";
import { Invest, Withdraw, Bet, Prize, Info, Init, LisInvest, ListUser, NewUser } from "./app.cjs";
import { Worker } from 'worker_threads';

const usage = boxen(chalk.green("\n" + "Thư viện xử lý gamebank HoH" + "\n"), { padding: 1, borderColor: 'green', dimBorder: true }) + "\n";
    
yargs(hideBin(process.argv))
    .usage(usage)
    .scriptName('>')

    .command('init', 'Khởi tạo gamebank', (yargs) => {
        return yargs
            .option('c', { alias: 'currency', describe: 'Loại tokent khởi tạo' })
            .option('v', { alias: 'max_invest', describe: 'Giới hạn đầu tư' })
            .option('b', { alias: 'max_bet_round', describe: 'Giới hạn đặt cửa của 1 round (% gamebank)' })
            .option('p', { alias: 'max_profit_round', describe: 'Giới hạn lợi nhuận toàn bộ người chơi trong 1 phiên' })
            .option('j', { alias: 'init_jackpot', describe: 'Khởi tạo Jackpot' })
            .option('n', { alias: 'min_balance', describe: 'Giá trị tối thiểu của gamebank. Không được rút' })
            .option('w', { alias: 'warning_percent', describe: 'Mức cảnh báo (chạm ngưỡng tối thiểu theo %)' })
            .option('i', { alias: 'min_leverage_percent', describe: 'Phần trăm tối thiểu vay đòn bẩy' })
            .option('a', { alias: 'max_leverage_percent', describe: 'Phần trăm tối đa vay đòn bẩy' })
            .option('l', { alias: 'interest_leverage_percent', describe: 'Lãi vay theo năm (%)' })
    },async (argv) => {
        const configGb = {
            currency: argv.c,
            max_invest: argv.v,
            max_bet_round: argv.b,
            max_profit_round: argv.p,
            init_jackpot: argv.j,
            min_balance: argv.n,
            warning_percent: argv.w,
            min_leverage_percent: argv.i,
            max_leverage_percent: argv.a,
            interest_leverage_percent: argv.l
        }
        const result = await Init(configGb);
        console.log(chalk.green('==> Khởi tạo thành công gamebank'));
        console.log(chalk.gray('Currency:', result.currency));
        console.log(chalk.gray('Max Invest:', result.max_invest));
        console.log(chalk.gray('Max Bet per Round(%):', result.max_bet_round));
        console.log(chalk.gray('Max Profit per Round:', result.max_profit_round));
        console.log(chalk.gray('Init Jackpot:', result.init_jackpot));
        console.log(chalk.gray('Min Gamebank balance:', result.min_balance));
        console.log(chalk.gray('Warning Gamebank balance form min(%):', result.warning_percent));
        console.log(chalk.gray('Min Leverage Percent(%):', result.min_leverage_percent));
        console.log(chalk.gray('Max Leverage Percent(%):', result.max_leverage_percent));
        console.log(chalk.gray('Interest Leverage Percent(%):', result.interest_leverage_percent));
        console.log(chalk.yellow('Capital:', result.capital));
        console.log(chalk.yellow('Balance:', result.balance));
        process.exit(1); 
    })



    .command('deposit', 'Đầu tư gamebank', (yargs) => {
        return yargs
            .option('u', { alias: 'user_name', describe: 'Người người đầu tư' })
            .option('a', { alias: 'amount', describe: 'Giá trị đầu tư' })
    }, async (argv) => {
        const inp = {
            user_name: argv.u,
            amount: argv.a,
        }
        
        Invest(inp.user_name, inp.amount, (value) => {
            console.log(value);
            process.exit(1);
        });

    })



    .command('withdraw', 'Rút đầu tư game bank', (yargs) => {
        return yargs
            .option('u', { alias: 'user_name', describe: 'Người đầu tư' })
            .option('a', { alias: 'amount', describe: 'Giá trị muốn rút' })
    }, async (argv) => {
        const inp = {
            user_name: argv.u,
            amount: argv.a,
        }
        
        Withdraw(inp.user_name, inp.amount, (value) => {
            console.log(value);
        });
        
        // const seprateThread = new Worker(process.cwd() + '/src/app.cjs');
        // seprateThread.on("message", (result) => {
        //     console.log(chalk.green('==> Rút tiền gamebank thành công'));
        //     process.exit(1);
        // });
        // seprateThread.postMessage({ method: 'Withdraw', input: inp });
    })



    .command('info', 'Lấy thông tin game bank', () => { }, async () => {
        // const seprateThread = new Worker(process.cwd() + '/src/app.cjs');

        const result = await Info();
        console.log(chalk.green('==> Thông tin Gamebank'));
        console.log(chalk.gray('Currency:', result.currency));
        console.log(chalk.gray('Max Invest:', result.max_invest));
        console.log(chalk.gray('Max Bet per Round(%):', result.max_bet_round));
        console.log(chalk.gray('Max Profit per Round:', result.max_profit_round));
        console.log(chalk.gray('Init Jackpot:', result.init_jackpot));
        console.log(chalk.gray('Min Gamebank balance:', result.min_balance));
        console.log(chalk.gray('Warning Gamebank balance form min(%):', result.warning_percent));
        console.log(chalk.gray('Min Leverage Percent(%):', result.min_leverage_percent));
        console.log(chalk.gray('Max Leverage Percent(%):', result.max_leverage_percent));
        console.log(chalk.gray('Interest Leverage Percent(%):', result.interest_leverage_percent));
        console.log(chalk.yellow('Capital:', result.capital));
        console.log(chalk.yellow('Balance:', result.balance));
        process.exit(1);
        // seprateThread.on("message", (result) => {process.exit(1); });
        // seprateThread.postMessage({ method: 'Info', input: undefined });
    })



    .command('bet', 'Người chơi đặt lệnh Bet', (yargs) => {
        return yargs
            .option('u', { alias: 'user_name', describe: 'Người chơi tham gia Bet' })
            .option('m', { alias: 'amount', describe: 'Giá trị bet' })
    }, (argv) => {
        const inp = {
            user_name: argv.u,
            amount: argv.a,
        }
        Bet(inp.user_name, inp.amount, (value) => {
            console.log(value);
        });

        // const seprateThread = new Worker(process.cwd() + '/src/app.cjs');
        // seprateThread.on("message", (result) => {
        //     console.log(chalk.green('==> Đặt cược thành công'));
        //     process.exit(1);
        // });
        // seprateThread.postMessage({ method: 'Bet', input: inp });
    })



    .command('prize', 'Trả thưởng người thắng', (yargs) => {
        return yargs
            .option('u', { alias: 'user_name', describe: 'Người chơi thắng cược' })
            .option('m', { alias: 'amount', describe: 'Giá trị thắng cược' })
    }, (argv) => {
        const inp = {
            user_name: argv.u,
            amount: argv.a,
        }
        Prize(inp.user_name, inp.amount, (value) => {
            console.log(value);
        });

        // const seprateThread = new Worker(process.cwd() + '/src/app.cjs');
        // seprateThread.on("message", (result) => {
        //     console.log(chalk.green('==> Trả thưởng thành công'));
        //     process.exit(1);
        // });
        // seprateThread.postMessage({ method: 'Prize', input: inp });
    })



    .command('users', 'Lấy danh sách người chơi', () => { }, async () => {
        const result = await ListUser();
        console.log(chalk.green('==> Danh sách người chơi'));
        console.log(JSON.parse(result))
        process.exit(1);
    })



    .command('invests', 'Lấy danh sách người đầu tư', () => { }, async () => {
        const result = await LisInvest();
        console.log(chalk.green('==> Danh sách người đầu tư'));
        console.log(result)
        process.exit(1);
    })



    .command('newuser', 'Tạo người chơi mới', (yargs) => {
        return yargs
            .option('u', { alias: 'user_name', describe: 'UserName của người chơi' })
            .option('b', { alias: 'balance', describe: 'Khởi tạo số dư ban đầu của người chơi' })
    }, async (argv) => {
        const user_name = argv.u, balance = argv.b;
        const result = await NewUser({ user_name, balance });
        console.log(chalk.green('==> Thêm người chơi mới thành công'));
        console.log(result)
        process.exit(1);
    })

    .wrap(null)
    .strict()
    .demandCommand(1)
    .version('v1.0.0')
    .parse();
  

const gbConfig = {
    type: 1,
    currency: 'HoH',
    max_invest: 200000000,
    max_bet_round: 0.75,
    max_profit_round: 0,
    init_jackpot: 10000000,
    min_balance: 10000000 * 3,
    warning_percent: 0.3,
    min_leverage_percent: 0.1,
    max_leverage_percent: 0.9,
    interest_leverage_percent: 0.2,
    state: 'lock'
}