class Tester {
    constructor() {
        this._InBuffer = '';
        this._IsReceiving = false;
        this._BrStack = [];

        this._Subs = {'repl': [],
                      'sensor-manager': [],
                      'process': []
        };

        Object.on('repl-sub', key => this._Subs.repl.push(key));          //ID клиента, подписавшегося на REPL, добавляется в коллекцию
        Object.on('sensor-sub', key => this._Subs.sensor.push(key));   
        // Object.on('process-sub', key => this._Subs.process.push(key));

        Object.on('repl-read', msg => {         //обработка события repl-read перехватом сообщения от REPL 
            this.Send(msg, this._Subs.repl);    //отправкой на WS Server сообщения и списка подпищиков
        });

        Object.on('sensor-read', msg => {
            this.Send(JSON.stringify(msg), this._Subs.sensor);
        });
    }
    Start() {
        E.setConsole(LoopbackA, { force: true });

        USB.on('data', data => {
            data.split('').forEach(char => {
                if (char === '{') {
                    this._IsReceiving = true;
                    this._BrStack.push(char);
                }
                if (this._IsReceiving) {
                    USB.write(char);
                    this._InBuffer += char;
                    if (char === '}') {
                        this._BrStack.pop();
                        if (!this._BrStack.length) {
                            this.HandleMsg(this._InBuffer);
                            this._InBuffer = '';
                            this._IsReceiving = false;
                            USB.write('\r\n');
                        }
                    }
                }
            });
        });
    }
    HandleMsg(_data) {
        let msg = _data;
        let key = 'EWI';
        
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
    Send(msg, _subs) {
        // console.log(msg);
        USB.write(msg+'\n');
    }
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
}

exports = Tester;