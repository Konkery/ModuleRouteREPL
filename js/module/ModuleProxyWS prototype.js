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

        Object.on('repl-sub', key => this._Subs.repl.push(key));          //ID клиента, подписавшегося на REPL, добавляется в коллекцию
        Object.on('sensor-sub', key => this._Subs.sensor.push(key));   
        Object.on('process-sub', key => this._Subs.process.push(key));

        Object.on('repl-read', msg => {         //обработка события repl-read перехватом сообщения от REPL 
            this.Send(msg, this._Subs.repl);    //отправкой на WS Server сообщения и списка подпищиков
        });

        Object.on('sensor-read', msg => {
            this.Send(msg, this._Subs.sensor);
        });
    }
    /**
     * @method 
     * Вызывается извне (со стороны WS)для передачи 
     * @param {String} _data - строковое представление JSON пакета с командами
     * @param {Function} [callback] - коллбэк который передаст в WSS извлеченный из пакета ID
     */
    Receive(_data, _key) {
        let msg = _data;
        let key = _key;
        
        let obj = null;
        try {   
            obj = JSON.parse(msg);
        } catch (error) { return false; } //TODO: проработать отладку ошибки
        let meta_crc = obj.MetaData.CRC;
        delete obj.MetaData.CRC;

        let actual_crc = E.CRC32(JSON.stringify(obj));

        if (actual_crc === meta_crc) {  //если фактический CRC полученного пакета сходится с CRC зашитым в пакет

            obj.MetaData.Command.forEach(comObj => {   //перебор объектов { "com": 'String', "arg": [] }
                if (comObj.com.endsWith('sub')) Object.emit(comObj.com, key);
                else if (comObj.com.endsWith('cm')) Object.emit(comObj.com, obj.MetaData.ID);
                // else Object.emit(comObj.com, (comObj.arg[0] || obj.MetaData.ID), obj.MetaData.ID);
                else Object.emit.apply(Object, [comObj.com].concat(comObj.arg, [obj.MetaData.ID]));
            }); 
            return true;
        }
    }
    /**
     * @method
     * Отправляет сообщение в виде JSON-строки в WS Server (В тестовой версии возможна передача просто строки) 
     * @param {String} data сообщение 
     * @param {[String]} keys список подписчиков на источник этого события 
     */
    Send(msg, keys) {
        
        this._WSS.Receive(msg, keys);
    }
    /**
     * @method
     * Метод формирует пакет из сообщения, полученного от REPL 
     * @param {String} msg 
     * @returns 
     */
    FormPackREPL(msg) {
        return {
            "Metadata":{
                "Type":'controller',
                "Repl":{
                    "com":msg
                }
            }
        };
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