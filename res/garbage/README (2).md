# ModuleRouteREPL
////

# Лицензия
////

# Описание
<div style = "font-family: 'Open Sans', sans-serif; font-size: 16px; color: #555">

ModuleProxyWS - один из модулей, обеспечивающий коммуникацию между автономной платформой и внешней средой в рамках фреймворка EcoLight. 
Берёт управление над средствами REPL (интерактивной консоли) в Espruino Web IDE (далее - EWI): перехватывает, фильтрует и пересылает входящие и исходящие сообщения. 

Представляет из себя не самостоятельное звено, а прокси (прослойку) к объекту [**ClassWSServer**](https://github.com/Konkery/ModuleWebSocketServer/blob/main/README.md) (далее - WSS), которая управляет двунаправленным обменом данными между **WSS** и службами *RouteREPL*, *Sensor*, *Process*.
Перехваченные сообщения упаковывает либо распаковывает в соотвтетствии с протоколом [LHP](https://github.com/Konkery/ModuleLHP/blob/main/README.md) (Light Horizon Protocol).

### **Конструктор**
Объект создается как глобальная переменная:
```js
ClassRouteREPL = require("");
RouteREPL = new ClassRouteREPL();
```

### **Поля**
- <mark style="background-color: lightblue">_InBuffer</mark> - буффер-строка, через которую посимвольно проходит консольный ввод;
- <mark style="background-color: lightblue">_DefConsole</mark> - ссылка на инстанциированный объект UART шины, которая используется для текстового ввода и вывода;
- <mark style="background-color: lightblue">_IncrVal</mark> - инкремент, который используется для нумерации вых.сообщений;
- <mark style="background-color: lightblue">_MasterID</mark> - строка, в которой хранится ID мастер-устройства;     
- <mark style="background-color: lightblue">_IsOn</mark> - булевый флаг, который взводится при запуске RouteREPL (при появлении первого подписчика).     

### **События**
События, которые перехватывает *RouteREPL*:
- <mark style="background-color: lightblue">Object.on('repl-sub')</mark> - появление нового подписчика. Обработчик запускает работу RouteREPL, вызовом метода *RouteOn()*;
- <mark style="background-color: lightblue">Object.on('repl-write')</mark> - пришли команды на REPL. Обработчик отпраляет команды на исполнение если они пришли от мастер-устройства; 
- <mark style="background-color: lightblue">Object.on('repl-cm')</mark> - смена мастера. Обработчик обновляет значение поля *_MasterID*; 
- <mark style="background-color: lightblue">LoopbackB.on('data')</mark> - перехват и обработка данных, поступающих с REPL (Замечание! Имеется ввиду REPL как часть EWI но не модуль RouteREPL);
- <mark style="background-color: lightblue">[_DefConsole].on('data')</mark> - перехват и обработка данных, поступающих с консоли. Явялется событием шины, которая сохраняется в поле *_DefConsole*.  

### **Методы**
- <mark style="background-color: lightblue">InitEvents()</mark> - включает обработку событий "repl-cm", "repl-write";
- <mark style="background-color: lightblue">LoopbackBHandler(data)</mark> - метод-обработчик события, вызываемого по поступлению данных из REPL на LoopbackB;
- <mark style="background-color: lightblue">DefConsoleHandler(data)</mark> - метод-обработчик события, вызываемого по поступлению данных со стандартной консоли;
- <mark style="background-color: lightblue">RouteOn()</mark> - инициирует перехват консоли, инициализацию некоторых обработчиков событий;
- <mark style="background-color: lightblue">Receive(command)</mark> - отправка команды на непосредственно выполнение;
- <mark style="background-color: lightblue">ChangeMaster(id)</mark> - метод, который обновляет поле *_MasterID* и создает оповещение об этом;
- <mark style="background-color: lightblue">SetOff()</mark> - возвращает работу консоли в состояние по умолчанию (как при самом запуске EWI). Предусмотрен сугубо для отладки; 
- <mark style="background-color: lightblue">ToMsgPattern(str, id)</mark> - форматирует выходное сообщение.


### **Примеры**
 ```js
 const err = require('https://raw.githubusercontent.com/Konkery/ModuleAppError/main/js/module/ModuleAppError.min.js');
//const wifi_class = require('https://raw.githubusercontent.com/AlexGlgr/ModuleMiddleWIFIesp8266/fork-Alexander/js/module/ClassMiddleWIFIesp8266.min.js');
require('https://raw.githubusercontent.com/Konkery/ModuleAppMath/main/js/module/ModuleAppMath.min.js').is();

const wifi_class = require('https://raw.githubusercontent.com/Nicktonious/ModuleBaseRouteREPL/fork-nikita/js/module/wifi_test_new.min.js');


const UARTBus = require ('https://raw.githubusercontent.com/AlexGlgr/ModuleBaseUARTbus/fork-Alexander/js/module/ClassBaseUARTBus.min.js');
const ws_server = require('https://raw.githubusercontent.com/AlexGlgr/ModuleWebSocketServer/fork-Alexander/js/module/ClassWebSocketServer.min.js');
//const ws_server = require('https://raw.githubusercontent.com/Nicktonious/ModuleBaseRouteREPL/fork-nikita/js/module/ClassWebSocketServer.min.js');
const ProxyWS = require('https://raw.githubusercontent.com/Nicktonious/ModuleBaseRouteREPL/fork-nikita/js/module/ModuleProxyWS%20prototype.min.js');
const repl_class = require('https://raw.githubusercontent.com/Nicktonious/ModuleBaseRouteREPL/fork-nikita/js/module/ModuleRouteREPL.min.js');

let wifi;
let server;
let repl;
let sensor_interval;

try {
  //let bus = new Serial();
  //bus.setup(115200, {rx: P0, tx: P1, ck: B12});
  //Serial3.setup(115200);
  Serial1.setup(115200);
  wifi = new wifi_class(Serial2);
  repl = new repl_class();

  setTimeout( () => {
    server = new ws_server();
  }, 7000);

}
  catch(e) {
    console.log('Error!' + e);
}
 ```
</div>