/**
 * @typedef 
 */
class BaseRouteREPL {
    constructor() {
        this._Listeners = [];
    }
    Enable() {
        E.setConsole(LoopbackA);
        this._Listeners.forEach(listener => LoopbackB.pipe(listener));
    }
    /**
     * @method
     * @param {Serial} - UART-шина, на которую будет перенаправлен вывод
     */
    AddListener(listener) {
        this._Listeners.push(listener);
    }
}
expors = BaseRouteREPL;
