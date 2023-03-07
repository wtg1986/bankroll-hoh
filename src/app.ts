import { Bankroll } from "./bankroll.hoh";
import { RedisAdapter } from './utils/redis.help';
import { parentPort } from 'worker_threads';

const redis = new RedisAdapter();
const gbank = new Bankroll(redis);

export const Bet = async (user_name: string, amount: number, onDone: Function) => {
     gbank.onDone = onDone;
    return (gbank && await gbank.bet({ user_name, amount }));
}
export const Prize = async (user_name: string, amount: number, onDone: Function) => {
     gbank.onDone = onDone;
    return (gbank && await gbank.prize({ user_name, amount }));
}
export const Invest = async (user_name: string, amount: number, onDone:Function) => {
    gbank.onDone = onDone;
    return (gbank && await gbank.deposit({ user_name, amount }));
}
export const Withdraw = async (user_name: string, amount: number, onDone: Function) => {
    gbank.onDone = onDone;
    return (gbank && await gbank.withdraw({ user_name, amount }));
}
export const Init = async (config: any) => {
    return (gbank && await gbank.init(config));
    // redis?.quit();
}
export const Info = async () => {
    return (gbank && await gbank.info());
}
export const NewUser = async ({ user_name, balance }: any) => {
    return (redis && await redis.insert('users', { user_name, balance }));
}

export const ListUser = async () => {
    return (redis && await redis.get('users'));
}

export const LisInvest = async () => {
    return (redis && await redis.get('invests'));
}

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




    