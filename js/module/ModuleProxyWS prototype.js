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
        this._Subs = {'repl': [],
                      'sensor': [],
                      'process': []
        };
        this.name = 'ProxyWS';
        this._SubsID = {}; //{'MAS-1000': 'hfehklvhelv'}

        Object.on('repl-sub', (id, key) => {
            this._Subs.repl.push(key);          //ID клиента, подписавшегося на REPL, добавляется в коллекцию
            if (!(this._SubsID[id])) this._SubsID[id] = key;
        });
        Object.on('sensor-sub', key => {
            this._Subs.sensor.push(key);
            if (!(this._SubsID[id])) this._SubsID[id] = key;
        });   
        Object.on('process-sub', key => {
            this._Subs.process.push(key);
            if (!(this._SubsID[id])) this._SubsID[id] = key;
        });

        Object.on('repl-read', msg => {         //обработка события repl-read перехватом сообщения от REPL 
            this.Send(this.FormPackREPL(msg), this._Subs.repl);    //отправкой на WS Server сообщения и списка подпищиков
        });

        Object.on('sensor-read', msgs => {
            this.Send(this.FormPackSensor(msgs), this._Subs.sensor);
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
        console.log(obj);
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
                        console.log('emited');
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
    Send(msg, keys) { 
        this._WSS.Notify(msg, keys);
    }
    /**
     * @method 
     * Удаление подписчика из коллекции по ключу
     * @param {String} key 
     */
    RemoveSub(key) {
        Object.values(this._Subs).forEach(subs => {
            let i = subs.indexOf(key);
            if (key !== -1) subs.splice(i, 1);
        });
        Object.entries(this._SubsID).forEach(pair => {
            if (pair[1] === key) delete this._SubsID[pair[0]];
        });
        if (this._Subs.repl.length === 0) Object.emit('repl-cm', 'EWI');
    }
    /**
     * @method
     * Метод формирует пакет из сообщения, полученного от REPL 
     * @param {String} msg 
     * @returns {String}
     */
    FormPackREPL(msg) {
        return JSON.stringify({
            
            "Metadata": {
                "Type": "controller",
                "ID": process.env.BOARD,
                "TimeStamp2": ~~getTime(),
                "Repl": {
                    "com":msg
                }
            }
        });
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
        return {
            "Metadata":{
                "Type":'controller',
                "Sensor": {
                    "Name": msg.name
                }
            },
            "Value": msg.value
        };
    }
}
exports = ProxyWS;