let l = [];
let oo = {
    "MetaData": {
        "ID": 'nikita',
        "Command": [
            {
                "com": 'repl-sub',
                "arg": []
            },
            {
                "com": 'repl-write',
                "arg": ['console.log(`5454`)']
            }
        ]
    }
};

const RouteREPL = require('ModuleRouteREPL rev.02 v01.min');
const Tester = require('Tester.min');
const route = new RouteREPL();
const tester = new Tester();

setTimeout(() => {
    route.emit('repl-write', `console.log("100")`);
}, 1000);

setTimeout(() => {
    USB.write('a');
}, 3000);

setTimeout(() => {
    E.setConsole(USB);
}, 10000);

setTimeout(() => {
    tester.Init(route);
}, 600);
/*
setTimeout(() => {
  let s = JSON.stringify(oo);
  for (let ch of s) {
    USB.write(ch);
  }
}, 1500);*/



