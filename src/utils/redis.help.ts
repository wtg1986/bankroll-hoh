import { createClient } from "redis";
import { v4 as uuidv4 } from 'uuid';

export class RedisAdapter {
    redisClient: any;

    constructor() {
        this.redisClient = createClient();
        this.redisClient.connect();
    };

    public get = async (key: string) => {
        let objStr = await this.redisClient.get(key);
        if (objStr) {
            const vv: any = JSON.parse(objStr);
            return vv;
        } else {
            return null;
        }
    }

    public get_field = async (key: string, field: string) => {
        let objStr = await this.redisClient.get(key);
        if (objStr) {
            return (JSON.parse(objStr))[field] || undefined
        } else {
            return null;
        }
    }

    public set = async (key: string, value: any) => {
        if (!key || !value) return false;
        try {
            let obj = JSON.stringify(value);
            if (obj) {
                await this.redisClient.set(key, obj);
                return value;
            }
        } catch (error) {
            return false
        }
    }

    public set_field = async (key: string, field: any) => {
        if (!key || !field) return false;
        try {
            let obj = await this.get(key);
            if (obj) {
                obj[field.key] = field.value
                await this.redisClient.set(key, JSON.stringify(obj));
                return obj;
            } else {
                return false
            }
        } catch (error) {
            return false
        }
    }

    public insert = async (table: string, obj: any) => {
        let thisTable = await this.get(table);
        // let thisTable = await this.redisClient.get(table);
        try {
            if (!thisTable) {
                let tableObj = [];
                let new_row = {
                    ...obj,
                    id: uuidv4(),
                    create_at: Date.now(),
                    update_at: Date.now(),
                };
                tableObj.push(new_row);
                await this.set(table, JSON.stringify(tableObj));
                return new_row
            } else {
                thisTable = JSON.parse(thisTable);
                let new_row: any = {
                    ...obj,
                    id: uuidv4(),
                    create_at: Date.now(),
                    update_at: Date.now(),
                };
                thisTable.push(new_row)
                await this.set(table, JSON.stringify(thisTable));
                return new_row
            }
        } catch (error) {
            console.log(error)
        }
        
    }

    public update = async (table: string, obj: any) => {
        if (!table || !obj || !obj.key || !obj.condition || !obj.field || !obj.value) return 0;
        try {
            let thisTable = await this.get(table);
            if (!thisTable) return false;
            thisTable = JSON.parse(thisTable);
            const index = thisTable.findIndex((e: any) => { return e[obj.key] === obj.condition });
            if (index === -1) return 0;
            thisTable[index][obj.field] = obj.value;

            await this.set(table, JSON.stringify(thisTable));
            return thisTable[index];
        } catch (error) {
            return false;
        }
        
        // console.log(thisTable[index]);
    }

    public query = async (table: string, obj: any) => {
        if (!table || !obj || !obj.key || !obj.condition) return 0;
        try {
            let thisTable = await this.get(table);
            if (!thisTable) return false;
            thisTable = JSON.parse(thisTable);
            const index = thisTable.findIndex((e: any) => { return e[obj.key] === obj.condition });
            if (index === -1) return 0;
            return thisTable[index];
        } catch (error) {
            return false;
        }
    }

    public quit = async()=>{this.redisClient.quit()}

}

