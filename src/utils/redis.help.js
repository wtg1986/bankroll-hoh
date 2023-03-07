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
exports.RedisAdapter = void 0;
const redis_1 = require("redis");
const uuid_1 = require("uuid");
class RedisAdapter {
    constructor() {
        this.get = (key) => __awaiter(this, void 0, void 0, function* () {
            let objStr = yield this.redisClient.get(key);
            if (objStr) {
                const vv = JSON.parse(objStr);
                return vv;
            }
            else {
                return null;
            }
        });
        this.get_field = (key, field) => __awaiter(this, void 0, void 0, function* () {
            let objStr = yield this.redisClient.get(key);
            if (objStr) {
                return (JSON.parse(objStr))[field] || undefined;
            }
            else {
                return null;
            }
        });
        this.set = (key, value) => __awaiter(this, void 0, void 0, function* () {
            if (!key || !value)
                return false;
            try {
                let obj = JSON.stringify(value);
                if (obj) {
                    yield this.redisClient.set(key, obj);
                    return value;
                }
            }
            catch (error) {
                return false;
            }
        });
        this.set_field = (key, field) => __awaiter(this, void 0, void 0, function* () {
            if (!key || !field)
                return false;
            try {
                let obj = yield this.get(key);
                if (obj) {
                    obj[field.key] = field.value;
                    yield this.redisClient.set(key, JSON.stringify(obj));
                    return obj;
                }
                else {
                    return false;
                }
            }
            catch (error) {
                return false;
            }
        });
        this.insert = (table, obj) => __awaiter(this, void 0, void 0, function* () {
            let thisTable = yield this.get(table);
            // let thisTable = await this.redisClient.get(table);
            try {
                if (!thisTable) {
                    let tableObj = [];
                    let new_row = Object.assign(Object.assign({}, obj), { id: (0, uuid_1.v4)(), create_at: Date.now(), update_at: Date.now() });
                    tableObj.push(new_row);
                    yield this.set(table, JSON.stringify(tableObj));
                    return new_row;
                }
                else {
                    thisTable = JSON.parse(thisTable);
                    let new_row = Object.assign(Object.assign({}, obj), { id: (0, uuid_1.v4)(), create_at: Date.now(), update_at: Date.now() });
                    thisTable.push(new_row);
                    yield this.set(table, JSON.stringify(thisTable));
                    return new_row;
                }
            }
            catch (error) {
                console.log(error);
            }
        });
        this.update = (table, obj) => __awaiter(this, void 0, void 0, function* () {
            if (!table || !obj || !obj.key || !obj.condition || !obj.field || !obj.value)
                return 0;
            try {
                let thisTable = yield this.get(table);
                if (!thisTable)
                    return false;
                thisTable = JSON.parse(thisTable);
                const index = thisTable.findIndex((e) => { return e[obj.key] === obj.condition; });
                if (index === -1)
                    return 0;
                thisTable[index][obj.field] = obj.value;
                yield this.set(table, JSON.stringify(thisTable));
                return thisTable[index];
            }
            catch (error) {
                return false;
            }
            // console.log(thisTable[index]);
        });
        this.query = (table, obj) => __awaiter(this, void 0, void 0, function* () {
            if (!table || !obj || !obj.key || !obj.condition)
                return 0;
            try {
                let thisTable = yield this.get(table);
                if (!thisTable)
                    return false;
                thisTable = JSON.parse(thisTable);
                const index = thisTable.findIndex((e) => { return e[obj.key] === obj.condition; });
                if (index === -1)
                    return 0;
                return thisTable[index];
            }
            catch (error) {
                return false;
            }
        });
        this.quit = () => __awaiter(this, void 0, void 0, function* () { this.redisClient.quit(); });
        this.redisClient = (0, redis_1.createClient)();
        this.redisClient.connect();
    }
    ;
}
exports.RedisAdapter = RedisAdapter;
