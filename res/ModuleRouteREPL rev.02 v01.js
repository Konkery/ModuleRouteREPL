//const EventEmitter = require('events').EventEmitter;
/**
 * @class
 * Класс реализует перехват ввода и вывода из консоли, включая в этот процесс внешние источники. 
 */
class BaseRouteREPL {//extends EventEmitter {
    constructor() {                         
        this._InBuffer = '';
        this._InSubBuffer = [];
        this._DefConsole = eval(E.getConsole()); // eval позволяет хранить инстанциированный объект UART шины. Это необходимо для работы с его функционалом из класса Route 
        this._IncrVal = 0;
        this._MasterID = 'EWI';     
        this._IsOn = false;    
        Object.on('repl-sub', () => {
            if (!this._IsOn) this.RouteOn();
        }); 
        this._Logs = {      //Кольцевой буффер максимальной длины max_i, в который помещаются все логи командой this._Logs.add()
            logs: [],
            i: 0,
            max_i: 15,
            add: function(log) {
                this.logs[this.i] = log;
                this.i++;
                if (this.i === this.max_i) this.i = 0;
            },
            toString: () => this.logs
        };
    }
    /**
     * Команда, по которой RouteREPL переназначает Master-устройство
     * @returns {Number}
     */
    get NEW_MASTER_COMMAND() { return '@@C_M@@'; }
    /**
     * Автоикрементирующийся индекс для входящих и исходящих сообщений
     * @returns {Number}
     */
    get IncrID() { return ++this._IncrVal; }
    /**
     * @method
     * Метод инициализирует события "repl-sub", "repl-write",
     * которые осуществляют обмен данными между RoutREPL и внешней средой,
     * "repl-cm" который устанавливает новое значение мастера
     */
    InitEvents() {
        Object.on('repl-write', (command, id) => {
            if (id === this._MasterID) this.Receive(`${command}\r`);
        });

        Object.on('repl-cm', id => this.ChangeMaster(id));
    }
    /**
     * @method
     * Перехват консоли, настройка ивентов для обмена сообщениями между REPL, EWI и внешними устройствами
     */
    RouteOn() {
        // E.setConsole(LoopbackA, { force: true });   //Перехватываем консоль
        this.InitEvents();

        LoopbackB.on('data', data => {              //настраиваем обработку данных, поступающих с REPL
            this.LoopbackBHandler(data);
        });

        // this._DefConsole.on('data', data => {       //настраиваем обработку данных, поступающих с консоли
        //     this.DefConsoleHandler(data);
        // });

        this._IsOn = true;
    }
    LoopbackBHandler(data) {
        // this._DefConsole.write(' ' + data);
        let log = this.ToMsgPattern(data);
        Object.emit('repl-read', log);
        this._Logs.add(log);
    }
    /**
     * @method
     * Через этот метод RouteREPL принимает пакет данных в виде объекта с собственно сообщением и ID отправителя
     * @param {} pack 
     * @returns 
     */
    Receive(_command) {
        if (!this._IsOn) return false; 
        let command = _command;
        let log = this.ToMsgPattern(command);
        this._Logs.add(log);
        this.emit('repl-read', log);  //"отзеркаливание" входного сообщения

        LoopbackB.write(command);
        // USB.inject(command);
        return true;
    }
    /**
     * @method
     * Метод, который меняет текущего мастера
     * @param {String} id - идентификатор нового мастера
     */
    ChangeMaster(_id) {
        let id = _id;
        // E.setConsole(this._DefConsole, { force: true });
        this._MasterID = id;
        this.emit('repl-read', this.ToMsgPattern(`Info>> New MasterREPL, ID: ${this._MasterID}`));
        // E.setConsole(LoopbackA, { force: true }); 
    }
    /**
     * @method 
     * Возвращает работу консоли в состояние по умолчанию (как при запуске Espruino IDE). 
     * Применять сугубо для отладки.
     */
    SetOff() {
        E.setConsole(this._DefConsole, { force: true });
        this._IsOn = false;
    }
    /**
     * @method
     * Формирует выходное сообщение
     * @param {String} _string - Текст сообщения
     * @param {String} [_id] - ID отправителя
     * @returns {String}
     */
    ToMsgPattern(_string, _id) {
        let str = _string;
        let id = _id;
        if (id) return `${this.IncrID} <${id}> ${str}}`;

        // return `${this.IncrID} ${str}`;
        return str;
    }
}
exports = BaseRouteREPL;
