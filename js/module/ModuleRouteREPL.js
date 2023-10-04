/**
 * @class
 * Класс реализует перехват ввода и вывода из консоли, включая в этот процесс внешние источники. 
 * Прием сообщений происходит по воозникновению события 'repl-write'.
 * Отзеркаливание и передача данных из REPL происходит по событию ''repl-read.  
 */
class ClassRouteREPL {
    constructor() {                         
        this._InBuffer = '';
        this._DefConsole = eval(E.getConsole()); // eval позволяет хранить инстанциированный объект UART шины. Это необходимо для работы с его функционалом из класса Route 
        this._IncrVal = 0;
        this._MasterID = 'EWI';     
        this._IsOn = false;     
        this._Name = 'RouteREPL';

        Object.on('repl-sub', () => {
            if (!this._IsOn) this.RouteOn();
        });
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
     * Метод включает обработку событий "repl-cm", "repl-write",
     * которые осуществляют обмен данными между RoutREPL и внешней средой,
     * "repl-cm" который устанавливает новое значение мастера
     */
    InitEvents() {       
        Object.on('repl-write', (commands, id) => {
            if (id === this._MasterID) {
                commands.forEach(command => {
                    this.Receive(`${command}\r`);
                });
            }
        });

        Object.on('repl-cm', id => this.ChangeMaster(id));
    }
    /**
     * @method
     * Обработчик события, вызываемого по поступлению данных из REPL на LoopbackB 
     * @param {String} data 
     */
    LoopbackBHandler(data) {
        this._DefConsole.write(' ' + data);
        Object.emit('repl-read', data);
    }
    /**
     * @method
     * Обработчик события, вызываемого по поступлению данных со стандартной консоли
     */
    DefConsoleHandler(data) {
        this._DefConsole.write(data); 
        this._InBuffer += data;             //заполнение буффера введеными символами
        if (data === '\r') {
            let command = this._InBuffer;
            this._InBuffer = '';

            if (this._MasterID === 'EWI') this.Receive(command);  //проверка на то что была введена команда смены мастера
            
            else if (command.indexOf(this.NEW_MASTER_COMMAND) !== -1) {
                this.ChangeMaster('EWI');
            }
        }
    }
    /**
     * @method
     * Перехват консоли, настройка ивентов для обмена сообщениями между REPL, EWI и внешними устройствами
     */
    RouteOn() {
        E.setConsole(LoopbackA, { force: true });   //Перехватываем консоль

        this.InitEvents();

        LoopbackB.on('data', data => {              //настраиваем обработку данных, поступающих с REPL
            this.LoopbackBHandler(data);
        });

        this._DefConsole.on('data', data => {       //настраиваем обработку данных, поступающих с консоли
            this.DefConsoleHandler(data);
        });

        this._IsOn = true;
    }
    /**
     * @method
     * Через этот метод RouteREPL получает команду к непосредственно выполнению.
     * @param {String} command - команда, которая передается в REPL
     * @returns 
     */
    Receive(command) {
        if (!this._IsOn) return false; 
        Object.emit('repl-read', command);  //"отзеркаливание" входного сообщения
        // TODO: продумать необходмимо ли дополнительно обрамлять отзеркаливаемое сообщение
        LoopbackB.write(command);
        return true;
    }
    /**
     * @method
     * Метод, который меняет текущего мастера
     * @param {String} id - идентификатор нового мастера
     */
    ChangeMaster(id) {
        this._MasterID = id;
        this._DefConsole.write('repl-read', this.ToMsgPattern(`Info>> New MasterREPL, ID: ${this._MasterID}`));  //TODO: проверить насколько этот формат отправки сообщения соответствует общей методолгии
    }
    /**
     * @method 
     * Возвращает работу консоли в состояние по умолчанию (как при запуске Espruino IDE). 
     * Рассчитан на применение сугубо в целях отладки.
     */
    SetOff() {
        E.setConsole(this._DefConsole, { force: true });
        this._IsOn = false;
    }
    /**
     * @method
     * Формирует выходное сообщение
     * @param {String} string - Текст сообщения
     * @param {String} [id] - ID отправителя
     * @returns {String}
     */
    ToMsgPattern(str, id) {
        // TODO: код ниже задокументирован до принятия решения касательно форматирования исходящих сообщений
        // if (id) return `${this.IncrID} <${id}> ${str}}`;

        // return `${this.IncrID} ${str}`;

        return str;
    }
}
exports = ClassRouteREPL;
