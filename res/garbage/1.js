let pack = { 
    "TimeStamp":    122465768,
    "MetaData":     {                   
                        "Type":"controller",
                        "ID": "cc50e35a-a916",
                        "TimeStamp2": 122465768.32423,                       
                        "RegServices": "Sensor",                        
                        "Repl": {
                            "com": "",
                            "arg": []
                        },

                        "CRC": 123123414
                    },
    "Value":        "Hello"
}
const getServiceName = pack => {
    return Object.keys(pack.MetaData)
        .filter(key => typeof pack.MetaData[key] === 'object')
        .find(key => 'com' in pack.MetaData[key] && 'arg' in pack.MetaData[key]);
}

console.log(getServiceName(pack));

i = setInterval(() => console.log(process.memory()), 1000);
i = setInterval(() => Object.emit('repl-read', JSON.stringify(process.memory())), 250);

wifi._wifi.scan(aps => {
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
    wifi._wifi.connect(wifi.ssid, { password : pass }, (err) => {
        if (err) {
            throw err;
        }
        wifi._wifi.getIP((err, info) => {
            if (err) {
                throw err;
            }
            wifi._ip = info.ip;            
        });
    });
});

require("Storage").list().includes("APs.json")

wifi._wifi.connect(ap.ssid, { password : ap.pass }, (err) => {
    if (err) {
        throw err;
    }
    wifi._wifi.getIP((err, info) => {
        if (err) {
          throw err;
        }
       wifi._ip = info.ip;            
    });
});

var bus_class = new UARTBus();
let opt = {rx: P0, tx: P1, baud: 115200};
var bus = bus_class.AddBus(opt);

let pins = [];
for (var i=0;i==0 || +Pin(i);i++) pins.push(new Pin(i));
let i = 0;
setInterval(() => {
    digitalWrite(pins[i], 1);
    console.log(pins[i]);
    setTimeout(() => {
        digitalWrite(pins[i], 0); 
        i++;
    }, 2000);
}, 2500);