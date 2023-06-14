class Sensor {
    constructor() {
        this._Sensors = {};

        Object.on('sensor-ask', (sensorName, period, arg) => { //args: Illuminance, Range, etc
            this.StartNotify(sensorName, period, arg);
        });

        Object.on('sensor-stop', (sensorName, arg) => {
            let intervName = this.GetIntervalName(sensorName, arg);
            clearInterval(this[intervName]);
            this[intervName] = null;
        });
    }
    /**
     * @method
     * Утилитарный метод, который генерирует название поля, в котором хранится интервал опроса
     * @param {String} sensorName 
     * @param {String} arg 
     * @returns {String}
     */
    GetIntervalName(sensorName, arg) { return `_${sensorName}_${arg}_interval`; }
    /**
     * @method
     * @param {Object} sensor 
     */
    Add(sensor) {
        if (this._Sensors[sensor.name]) throw new Error();
        this._Sensors[sensor.name] = sensor;
    }

    Remove(sensorName) {

    }
    /**
     * @method
     * Метод запускает циклический вызов событий, в которое передается значение значение величины arg у датчика с названием sensorName 
     * @param {String} sensorName 
     * @param {Number} period 
     * @param {String} arg
     */
    StartNotify(sensorName, period, arg) {
        if (!this._Sensors[sensorName]) throw new Error();
        if (!this._Sensors[sensorName][arg]) throw new Error();

        let intervName = this.GetIntervalName(sensorName, arg);
        if (this[intervName]) clearInterval(intervName);

        this[intervName] = setInterval(() => {
            Object.emit('sensor-read', {
                name: this._Sensors[sensorName].name,
                value: this._Sensors[sensorName][arg]
            });
        }, period);
    }
}

exports = Sensor;
// { "sensor": [...values] "period": N ms }