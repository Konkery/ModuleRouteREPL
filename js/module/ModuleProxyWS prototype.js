/**
 * @class является придатком WS Server и реализует передачу и обработку запросов и сообщений 
 * как со стороны WS Server (сверху), так и со стороны RouteREPL, SensorManager, Control (снизу). 
 * Экземляр класса инициализируется как поле класса WS Server при успешном создании последнего.
 */
class ProxyWS {
    /**
     * @constructor
     * @param {WS} _wss - WS Server
     */
    constructor(_wss) {
        this._WSS = _wss;
        this._Sub = {'repl': [],
                      'sensor': [],
                      'process': []
        };
        this.name = 'ProxyWS';
        this._SubID = {}; //{'MAS-1000': 'hfehklvhelv'}      

        Object.on('repl-sub', (id, key) => {
            if (!this._Sub.repl.includes(key)) this._Sub.repl.push(key);          //ID клиента, подписавшегося на REPL, добавляется в коллекцию
            if (!(this._SubID[id])) this._SubID[id] = key;
        });
        Object.on('sensor-sub', (id, key) => {
            if (!this._Sub.sensor.includes(key)) this._Sub.sensor.push(key);
            if (!(this._SubID[id])) this._SubID[id] = key;
        });   
        Object.on('process-sub', (id, key) => {
            if (!this._Sub.process.includes(key)) this._Sub.process.push(key);
            if (!(this._SubID[id])) this._SubID[id] = key;
        });

        Object.on('repl-read', msg => {         //обработка события repl-read перехватом сообщения от REPL 
            this.Send(msg, 'repl');    //отправкой на WS Server сообщения и списка подпищиков
        });

        Object.on('sensor-read', msg => {
            this.Send(msg, 'sensor');
        });

        Object.on('process-read', msg => {
            return;
        });
    }
    /**
     * @method 
     * Вызывается извне (со стороны WS) для передачи команд
     * @param {String} _data -  JSON пакет с командами в виде строки
     * @param {String} [key] - ключ с которым WSS ассоциирует отправителя
     */
    Receive(_data, _key) {
        let obj = null;
        try {
            obj = JSON.parse(_data);
        } catch (e) {
            throw new err('Incorrect JSON data');
        }
        let key = _key;
        
        let meta_crc = obj.MetaData.CRC;
        delete obj.MetaData.CRC;

        let actual_crc = E.CRC32(JSON.stringify(obj));

        if (actual_crc === meta_crc) {  //если фактический CRC полученного пакета сходится с CRC зашитым в пакет
            let flag = true;

            obj.MetaData.Command.forEach(comObj => {   //перебор объектов { "com": 'String', "arg": [] }
                if (flag) {
                    if (comObj.com.endsWith('sub') || comObj.com.endsWith('cm')) {
                        Object.emit(comObj.com, obj.MetaData.ID, key);
                        flag = false;
                    }
                    else Object.emit(comObj.com, comObj.arg, obj.MetaData.ID);
                }
            }); 
        }
    }
    /**
     * @method
     * Отправляет сообщение в виде JSON-строки в WS Server
     * @param {String} data сообщение 
     * @param {[String]} keys список подписчиков на источник этого события 
     */
    Send(msg, type) { 

        if (type === 'repl') this._WSS.Notify(this.FormPackREPL(msg), this._Sub.repl);
        else if (type === 'sensor') this._WSS.Notify(this.FormPackSensor(msg), this._Sub.sensor);
    }
    /**
     * @method 
     * Удаление подписчика из коллекции по ключу
     * @param {String} key 
     */
    RemoveSub(key) {
        let i = 0;
        for (const k in this._Sub) {
            i = this._Sub[k].indexOf(key);
            if (i !== -1) this._Sub[k].splice(i, 1);
        };
        for (let k of this._SubID) {
            if (this._SubID[k] === key) delete this._SubID[k];
        };
        if (this._Sub.repl.length === 0) Object.emit('repl-cm', 'EWI');
    }
    /**
     * @method
     * Метод формирует пакет из сообщения, полученного от REPL 
     * @param {String} msg 
     * @returns {String}
     */
    FormPackREPL(msg) {
        let pack = JSON.stringify({
            "MetaData": {
                "Type": "controller",
                "ID": process.env.SERIAL,
                "TimeStamp2": getTime(),
                "Repl": {
                    "com":""
                }
            },
            "Value": msg
        });
        return pack;
        let crc = E.CRC32(pack);
        pack = JSON.parse(pack);
        pack.MetaData.CRC = crc;
        // return pack;
        return JSON.stringify(pack);
    }
    /**
     * @typedef {Object} SensorMsg
     * @property {String} name
     * @property {Number} value
     */
    /**
     * @method
     * Метод формирует пакет из данных, полученных от Sensor модуля 
     * @param {SensorMsg} msg 
     */
    FormPackSensor(msg) {
        let pack = JSON.stringify({
            "MetaData":{
                "Type":'controller',
                "ID": process.env.SERIAL,
                "TimeStamp2": getTime(),
                "Sensor": {
                    "ID": '54-54',
                    "Name": "Vova",
                    "Type": "meas",
                    "TypeOutSignal": "analog",
                    "TypeInSignal":  "analog",
                    "NumPortsRequired": [1],
                    "NumChannel":       1,
                    "Bus":              ["i2c"]
                }
            },
            "Value": msg
        });
        return pack;
        let crc = E.CRC32(pack);
        pack = JSON.parse(pack);
        pack.MetaData.CRC = crc;
        // return pack;
        return JSON.stringify(pack);
    }
}
exports = ProxyWS;