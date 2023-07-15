/**
 * @class
 * Класс ClassEsp8266 реализует логику работы WiFi-модуля на чипе Esp8266.
 * Для работы класса требуется подключить модуль ModuleAppMath, где 
 * добавляется функция проверки на целочисленность, а так-же базовый класс,
 * разработанный Amperka
 * 
 * Тип для возвращения списка подключенных устройств
 * @typedef  {Object} ObjectDevice     - тип контейнер хранящий подключенные устройства
 * @property {string} ip               - Ip-адрес устройства
 * @property {string} mac              - Mac-адрес устройства
 * 
 * Тип для возвращения списка точек доступа, которые смог обнаружить модуль
 * @typedef  {Object} ObjectAP         - тип контейнер хранящий обнаруженные сети
 * @property {string} ip               - Ip-адрес сети
 * @property {string} enc              - метод аутентификации
 * @property {number} signal           - уровень сигнала в децибелах
 * @property {string} mac              - Mac-адрес устройства точки доступа
 * 
 * Тип для хранения опций при передаче сообщений по HTTP
 * @typedef  {Object} ObjectHTTPOpts   - тип контейнер хранящий опции
 * @property {string} host             - адрес хоста
 * @property {number} port             - номер порта (не обязателен, по-умолчанию -- 80)
 * @property {string} path             - путь на сервере
 * @property {string} method           - тип запроса (GET, POST...)
 * @property {string} protocol         - тип протокола (не обязателен)
 * @property {Object} headers          - хедеры (не обязательны)
 * 
 * Методы аутентификации следующие: open, wep, wpa_psk, wpa2_psk, wpa_wpa2_psk
 */
class ClassEsp8266WiFi {
    /**
     * @constructor
     * @param {Object} _rx      - порт rx шины UART, обязательное поле
     * @param {Object} _tx      - порт tx шины UART, обязательное поле
     */// удалить, потом добавить в конфигурацию. Основа - ESP32
    constructor(_rx, _tx) {
        //реализация паттерна синглтон
        if (this.Instance) {
            return this.Instance;
        } else {
            ClassEsp8266WiFi.prototype.Instance = this;
        }

        this._name = 'ClassEsp8266WiFi'; //переопределяем имя типа
        this._wifi = undefined;
        this._bus = undefined;
        this._ssid = undefined;
        this._ip = undefined;
        this.Init(_rx, _tx);
	}
    /**
     * @method
     * Инициализирует шину для работы с вай-фай модулем
     * @param {Object} _rx      - порт rx шины UART, обязательное поле
     * @param {Object} _tx      - порт tx шины UART, обязательное поле
     */
    InitBus(_rx, _tx) {
        if (_rx && _tx) {
            let bus_class = new UARTBus();
            let opt = {rx: _rx, tx: _tx, baud: 115200};
            this._bus = bus_class.AddBus(opt);
        }
    }
    /**
     * @method
     * Сканирует окружение на наличие точек доступа и выбирает
     * из знакомых к какой подключится, и осуществляет подключение
     * @param {Object} _rx      - порт rx шины UART, нужен для запуска шины
     * @param {Object} _tx      - порт tx шины UART, нужен для запуска шины
     */
    Init(_rx, _tx) {
        if (process.env.MODULES.includes("Wifi")) {
            this._wifi = require("Wifi");
            let pass;
            this._wifi.scan((err, aps) => {
                if (err) {
                    throw err;
                  }
                  else {
                    let s = require("Storage");
                    if (!(s.list().includes("APs.json"))) {
                        throw "No JSON file found!";
                    }
                    let found = aps.map(a => a.ssid);
                    let wrt = s.readJSON("APs.json", true);

                    found.forEach(fName => {
                        wrt.forEach(sName => {
                            if (fName == sName.ssid) {
                                this._ssid = sName.ssid;
                                pass = sName.pass;
                            }                               
                        });
                    });
                    this._wifi.connect(this.ssid, { password : pass }, (err) => {
                        if (err) {
                            throw err;
                        }
                        this._wifi.getIP((err, info) => {
                            if (err) {
                              throw err;
                            }
                           this._ip = info.ip;            
                        });
                    });
                }
            });
        }
        else {
            //this.InitBus(_rx, _tx);
            let pass;
            this._wifi = require("https://raw.githubusercontent.com/AlexGlgr/ModuleMiddleWIFIesp8266/fork-Alexander/js/module/ClassBaseWIFIesp8266.min.js").setup(Serial3, (err) => {
                if (err) {
                    throw err;
                }
                this._wifi.getAPs((err, aps) => {
                    if (err) {
                        throw err;
                    }
                    else {
                        let s = require("Storage");
                        if (!(s.list().includes("APs.json"))) {
                            throw "No JSON file found!";
                        }
                        let found = aps.map(a => a.ssid);
                        let wrt = s.readJSON("APs.json", true);

                        found.forEach(fName => {
                            wrt.forEach(sName => {
                                if (fName == sName.ssid) {
                                    this._ssid = sName.ssid;
                                    pass = sName.pass;
                                }                               
                            });
                        });
                        this._wifi.connect (this._ssid, pass, (err) => {
                            if (err) {
                                throw err;
                            }
                            else {
                                this._wifi.getIP((emsg, ipAdress) => {
                                    if (emsg) {
                                        throw err;
                                    }
                                    this._ip = ipAdress;
                                });
                            }
                        });
                    }
                });                
            });
        }            
    }
}

exports = ClassEsp8266WiFi;