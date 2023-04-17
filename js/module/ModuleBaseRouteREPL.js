/**
 * @typedef {Object} Pack
 * @property {String} ID
 * @property {String} content
 */
/**
 * @typedef {Object} Subscriber
 * @property {String} ID
 * @property {Function} callback
 */

class BaseRouteREPL {
    constructor() {
        this._Subscibers = [];                              //Массив объектов типа Subscriber
        // this._StrOutQueue = []; 
        this._StrInQueue = {};                              //Объект типа {id: [strings]}
        this._DefConsole = eval(E.getConsole());
        this._IncrVal = 1;
        this._MasterID = null;     
        this._IsInited = false;  
        this._EchoIsEnabled = false;                       
    }
    /**
     * Команда, по которой ProxyREPL переназначает Master-устройство
     * @returns {Number}
     */
    get NEW_MASTER_COMMAND() { return '@CHANGE_MASTER@'; }
    /**
     * Автоикрементирующийся индекс для входящих и исходящих сообщений
     * @returns {Number}
     */
    get IncrID() { return ++this._IncrVal; }
    /**
     * @method
     * Перехват консоли, инициализация стандартного Master-подписчика в виде EspruinoWebIDE (EWI)
     */
    Init() {
        this._IsInited = true;
        this.AddSub({
            ID: 'EWI',
            callback: this._DefConsole.write.bind(this._DefConsole),
        });
        this._MasterID = 'EWI';
        this.InitLoopBackB();
        this.InitDefDevice();
    }
    InitLoopBackB() {
        LoopbackA.setConsole();
        LoopbackB.on('data', data => {
            this.GetFromREPL(data);
        });
    }
    InitDefDevice() {
        this._DefConsole.on('data', data => {
            if (this._EchoIsEnabled) this._DefConsole.write(data); 
            this.Receive({ ID: 'EWI', content: data });
        });
        //LoopbackB.pipe(listener);
        //listener.pipe(LoopbackB);
    }
    //#region commented
    // /**
    //  * @method
    //  * Метод который вызыывается когда из REPL приходит сообщение (console.log, print, результат вычисления и т.д)
    //  */
    // OnUpdateOutQueue() {
    //     let log = this.ParseLog();
    //     this.NotifyAllExcept(log, ['EWI']);
    // }
    //#endregion
    /**
     * @method
     * Метод который рассылает сообщение подписчикам
     * @param {String} message - сообщение
     * @param {[String]} exceptions - список из ID подписчиков, которым НЕ должно рассылаться сообщение
     */
    NotifyAllExcept(_message, _exceptions) {
        _exceptions = _exceptions || [];
        this._Subscibers.forEach(sub => {
            if (!_exceptions.includes(sub.ID)) {
                sub.callback(_message);
            }
        });
    }
    GetFromREPL(_data) {
        this._DefConsole.write(_data);
        this.NotifyAllExcept(this.ToMsgPattern(_data), ['EWI']);
    }
    /**
     * @method
     * Через этот методж ProxyREPL принимает пакет данных в виде объекта с собственно сообщением и ID отправителя
     * @param {Pack} pack 
     * @returns 
     */
    Receive(_pack) {
        if (this._Subscibers.map(sub => sub.ID).includes(_pack.ID)) {
            if (this._StrInQueue[_pack.ID]) this._StrInQueue[_pack.ID].push(_pack.content);
            else this._StrInQueue[_pack.ID] = [_pack.content];
            
            if (_pack.content.endsWith('\r')) this.OnNewCommand(_pack.ID);
            return true;
        }
        return false;
    }
    /**
     * @method
     * Метод, который обрабатывает поступившую в ProxyREPL команду
     * @param {String} id 
     */
    OnNewCommand(_id) {
        let command = this._StrInQueue[_id].join('');
        this._StrInQueue[_id] = [];

        if (command.indexOf(this.NEW_MASTER_COMMAND) !== -1) {
            if (_id !== this._MasterID) {
                E.setConsole(this._DefConsole);
                this._MasterID = _id;
                this.NotifyAllExcept(this.ToMsgPatter(`Info>> New MasterREPL, ID: ${this._MasterID}`));
                setTimeout(() => {
                    E.setConsole(LoopbackA); 
                }, 0);
            }
        }

        if (this._MasterID === _id) {
            LoopbackB.write(command);
            this.NotifyAllExcept(this.ToMsgPattern(command, _id), [this._MasterID]);
        }
    }
    /**
     * @method
     * Метод который добавляет подписчика, который будет получать логи и может отправлять запросы на ProxyREPL
     * @param {Subscriber} 
     * @returns {Boolean} 
     */
    AddSub(subscriber) {
        if (this._Subscibers.map(sub => sub.ID).includes(subscriber.ID)) {
            return false;
        }
        if (! this._IsInited) this.Init();
        this._Subscibers.push(subscriber);
        return true;
    }
    /**
     * @method
     * Метод которые удаляет подписчика по переданному ID
     * @param {String} _id - ID подписчика
     * @returns 
     */
    RemoveSubByID(_id) {
        this._Subscibers.forEach((sub, index) => {
            if (sub.ID === _id) {
                this._Subscibers.splice(index, 1);
                return true;
            }
        });
        return false;
    }
    /**
     * @method
     * Метод включает/выключает эхо-отображение ввода в консоль
     * @param {Boolean} _bool - значения, приводимые к true включают эхо-режим,
     * соответственно значения, которые приводятся к false - его выключают
     */
    SetEchoMode(_bool) {
        this._EchoIsEnabled = Boolean(_bool);
    }
    /**
     * @method
     * Формирует выходное сообщение
     * @param {String} _string - Текст сообщения
     * @param {String} [_id] - ID отправителя
     * @returns {String}
     */
    ToMsgPattern(_string, _id) {
        if (_id) return `${this.IncrID} <${_id}> ${_string}}`;

        return `${this.IncrID} ${_string}`;
    }
}
exports = BaseRouteREPL;
