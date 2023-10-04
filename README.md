# ModuleRouteREPL
////

# Лицензия
////

# Описание
<div style = "font-family: 'Open Sans', sans-serif; font-size: 16px; color: #555">

ModuleRouteREPL - один из модулей, обеспечивающий коммуникацию между автономной платформой и внешней средой в рамках фреймворка EcoLight. 
Берёт управление над средствами REPL (интерактивной консоли) в Espruino Web IDE (далее - EWI): перехватывает, фильтрует и пересылает входящие и исходящие сообщения. Работает в качестве службы, на которую пользователю со стороны Websocket сервера необходимо подписаться чтобы запустить процесс получения сообщений. Таким образом RouteREPL реализует паттерн Observer (один источник - много слушателей).
Перехват и рассылка выполняется по событийной модели. Список событий приведен ниже.

<div align='center'>
    <img src=''>
</div>

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

- <mark style="background-color: lightblue">Object.on('repl-read')</mark> - событие, которое вызывает *RouteREPL* при выводе данных в консоль. Это событие далее перехватывает *ProxyWS*.


### **Методы**
- <mark style="background-color: lightblue">InitEvents()</mark> - включает обработку событий "repl-cm", "repl-write";
- <mark style="background-color: lightblue">LoopbackBHandler(data)</mark> - метод-обработчик события, вызываемого по поступлению данных из REPL на LoopbackB;
- <mark style="background-color: lightblue">DefConsoleHandler(data)</mark> - метод-обработчик события, вызываемого по поступлению данных со стандартной консоли;
- <mark style="background-color: lightblue">RouteOn()</mark> - инициирует перехват консоли, инициализацию некоторых обработчиков событий;
- <mark style="background-color: lightblue">Receive(command)</mark> - отправка команды на непосредственно выполнение;
- <mark style="background-color: lightblue">ChangeMaster(id)</mark> - метод, который обновляет поле *_MasterID* и создает оповещение об этом;
- <mark style="background-color: lightblue">SetOff()</mark> - возвращает работу консоли в состояние по умолчанию (как при самом запуске EWI). Предусмотрен сугубо для отладки; 
- <mark style="background-color: lightblue">ToMsgPattern(str, id)</mark> - форматирует выходное сообщение.

### **Приницип перехвата консоли**
По умолчанию передача данных на консоль или с неё выглядит так:
<div align='center'>
    <img src='./res/console default.png' alt='Image not found'>
</div>
Для реализации функционала *RouteREPL* необходимо перехватить поток передачи данных и провести его уже через обработчики модуля.

```js
//сохранение ссылки на UART-шину, на которой по умолчанию установлена консоль 
let defConsole = eval(E.getConsole());

///установка консоли на виртуальную шину
E.setConsole(LoopbackA);

LoopbackB.on('data', data => {
    ///обработка всех сообщений, которые выводятся на консоль
});

defConsole.on('data', data => {
    //обработка данных, которые вводятся через EWI
});
```
Тогда диаграмма взаимодействия компонентов будет выглядеть так:
<div align='center'>
    <img src='./res/console interceped.png' alt='Image not found'>
</div>

### **Примеры**
Запуск системы для обмена между консолью и Websocket сервером
```js
//импорт модулей
const ClassWifi = require('https://raw.githubusercontent.com/AlexGlgr/ModuleMiddleWIFIesp8266/fork-Alexander/js/module/ClassMiddleWIFIesp8266.min.js');
const ClassUARTbus = require ('https://raw.githubusercontent.com/AlexGlgr/ModuleBaseUARTbus/fork-Alexander/js/module/ClassBaseUARTBus.min.js');
const ClassWSS = require('https://raw.githubusercontent.com/AlexGlgr/ModuleWebSocketServer/fork-Alexander/js/module/ClassWebSocketServer.min.js');
const ProxyWS = require('https://raw.githubusercontent.com/Nicktonious/ModuleBaseRouteREPL/fork-nikita/js/module/ModuleProxyWS%20prototype.min.js');
const ClassRouteREPL = require('https://raw.githubusercontent.com/Nicktonious/ModuleBaseRouteREPL/fork-nikita/js/module/ModuleRouteREPL.min.js');

let wifi;
let server;
let repl;

try {
    // настройка шины
    let UARTbus = new ClassUARTbus();
    let bus = UARTbus.AddBus({rx: A0, tx: B2, baudrate: 115200}).IDbus;
    
    //создание объекта wifi
    wifi = new ClassWifi(bus);
    //объект RouteREPL
    repl = new ClassRouteREPL();

    setTimeout( () => {
        //запуск сервера
        server = new ClassWSS();
    }, 7000);

} catch(e) {
        console.log('Error!' + e);
}
```
Далее необходимо отправить с сервера команды:
```js
//подписка на службу REPL. После корректной отправки этой команды на сервер начнут приходить логи с консоли 
ws.send(`{"MetaData":{"ID":"nikita","Command":[{"com":"repl-sub","arg":[]}],"CRC":1592949337}}`);
//смена мастер-устройства. После корректной отправки этой команды можно отправлять с сервера команды службе REPL
ws.send(`{"MetaData":{"ID":"nikita","Command":[{"com":"repl-cm","arg":[]}],"CRC":225499666}}`);

//пример отправки команды в систему
ws.send('{"MetaData":{"ID":"nikita","Command":[{"com":"repl-write","arg":["console.log(`5454`)"]}],"CRC":1231993470}}');
```

</div>