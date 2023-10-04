let CRC32 = require("crc-32");

function addCRC(str) {
    let obj = JSON.parse(str);
    obj.MetaData.CRC = CRC32.str(str)>>>0;
    return JSON.stringify(obj);
}

function getWriteCommand(evName, ...commands) {
    let o = ({
        "MetaData": {
            "ID": 'nikita',
            "Command": []
        }
    });
    commands.forEach(com => {
        console.log([com]);
        o.MetaData.Command.push({"com": evName, "arg": [com]});
    });
    return JSON.stringify(o);
}
let c = `let i = setInterval(()=>process.memory(), 250)`;
let a = '{"MetaData":{"ID":"nikita","Command":[{"com":"sensor-sub","arg":[]}],"CRC":3814734421}}';
console.log(addCRC(getWriteCommand('repl-write', c)));
