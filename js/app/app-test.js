const ProxyREPL = require('ModuleBaseRouteREPL.min');
const Sub = require('EnvEmulation.min').Sub;
const CCS = require('EnvEmulation.min').CCS;
let proxy = new ProxyREPL();

const ccs = new CCS(proxy);
let s1 = new Sub('10');
let s2 = new Sub('11');
let s3 = new Sub('12');
ccs.AddSub(s1);
ccs.AddSub(s2);
ccs.AddSub(s3);
//ccs.Connect(); //вызывать после таймаута

