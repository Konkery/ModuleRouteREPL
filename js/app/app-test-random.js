/*class ProxySocket {
    constructor() {
        this._RouteREPL = null;
        this._FromRoute = [];
        this._Subs = [];

        route.on('out_msg', data => {
            this._FromRoute.push(`from route ${data}`);
        });
    }
    Connect(_repl) {
        this._RouteREPL = _repl;
        this._RouteREPL.on('out_msg', data => {
            this._FromRoute.push(`from route ${data}`);
        });
    }
    Send(_data) {
        let data = _data;
        route.emit('in_msg', data);
        // this._RouteREPL.Receive(data);
    }
    AddSub(sub) {
        this._Subs.push(sub);
        if (this._Subs.length == 1) route.emit('first_sub', this);
    }
}

const RouteREPL = require('ModuleBaseRouteREPL.min');

let route = new RouteREPL();
let ws = new ProxySocket();
let ws2 = new ProxySocket();
setTimeout(() => {ws.AddSub({});
                 ws2.AddSub({});}, 200);
setTimeout(() => {console.log(route._InBuffer);}, 4000);
setTimeout(() => {route.SetOff();}, 5000);*/