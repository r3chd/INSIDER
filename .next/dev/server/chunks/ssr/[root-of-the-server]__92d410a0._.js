module.exports = [
"[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("react/jsx-dev-runtime", () => require("react/jsx-dev-runtime"));

module.exports = mod;
}),
"[externals]/socket.io-client [external] (socket.io-client, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("socket.io-client");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/socket.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "socket",
    ()=>socket
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/socket.io-client [external] (socket.io-client, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
const isBrowser = ("TURBOPACK compile-time value", "undefined") !== "undefined";
const socket = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : {};
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/Menu.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Menu
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
;
function Menu({ onStartGame }) {
    // We'll attach the start logic here, likely listening for the SPACE key
    // You would typically use a useEffect hook and a state handler here 
    // to manage key presses, but for simplicity, we keep the UI structure.
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        id: "menu",
        className: "active",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                children: "hm"
            }, void 0, false, {
                fileName: "[project]/components/Menu.jsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: "Press SPACE to start"
            }, void 0, false, {
                fileName: "[project]/components/Menu.jsx",
                lineNumber: 11,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/Menu.jsx",
        lineNumber: 9,
        columnNumber: 5
    }, this);
}
}),
"[project]/components/Game.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Game
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/socket.io-client [external] (socket.io-client, esm_import)"); // Import the client library
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
'use client'; // This must be a Client Component
;
;
;
const SOCKET_SERVER_URL = 'https://localhost:4000';
const socket = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io$2d$client__$5b$external$5d$__$28$socket$2e$io$2d$client$2c$__esm_import$29$__["io"])(SOCKET_SERVER_URL);
function Game() {
    const [playerList, setPlayerList] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])([]);
    const [gameMessage, setGameMessage] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])('Hey Chat');
    // This useEffect hook handles the client-side Socket.IO logic
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        // 1. Listen for player list updates or other game events
        socket.on('player_update', (list)=>{
            setPlayerList(list);
        });
        // 2. Add other Socket.IO listeners here (e.g., 'game_state_update')
        // For now, we'll keep the connection simple.
        // 3. Cleanup function to disconnect listeners when component unmounts
        return ()=>{
            socket.off('player_update');
        // socket.disconnect(); // Only disconnect if you want the connection to close fully
        };
    }, []);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        id: "game",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("h1", {
                children: gameMessage
            }, void 0, false, {
                fileName: "[project]/components/Game.jsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
                id: "board"
            }, void 0, false, {
                fileName: "[project]/components/Game.jsx",
                lineNumber: 33,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/Game.jsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/node:http [external] (node:http, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("node:http", () => require("node:http"));

module.exports = mod;
}),
"[externals]/socket.io [external] (socket.io, esm_import)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

const mod = await __turbopack_context__.y("socket.io");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/server.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$http__$5b$external$5d$__$28$node$3a$http$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:http [external] (node:http, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io__$5b$external$5d$__$28$socket$2e$io$2c$__esm_import$29$__ = __turbopack_context__.i("[externals]/socket.io [external] (socket.io, esm_import)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io__$5b$external$5d$__$28$socket$2e$io$2c$__esm_import$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io__$5b$external$5d$__$28$socket$2e$io$2c$__esm_import$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const dev = ("TURBOPACK compile-time value", "development") !== "production";
const hostname = "localhost";
const port = 3000;
const app = (void 0)({
    dev,
    hostname,
    port
});
const handler = app.getRequestHandler();
const players = {};
app.prepare().then(()=>{
    const httpServer = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$http__$5b$external$5d$__$28$node$3a$http$2c$__cjs$29$__["createServer"])(handler);
    const io = new __TURBOPACK__imported__module__$5b$externals$5d2f$socket$2e$io__$5b$external$5d$__$28$socket$2e$io$2c$__esm_import$29$__["Server"](httpServer);
    io.on("connection", (socket)=>{
        console.log('user connected');
        players[socket.id] = {};
        io.emit('playerUpdate', players);
        socket.on("disconnect", (reason)=>{
            console.log("user disconnected");
            delete players[socket.id];
            io.emit('playerUpdate', players);
        });
    });
    httpServer.once("error", (err)=>{
        console.error(err);
        process.exit(1);
    }).listen(port, ()=>{
        console.log(`> Ready on http://${hostname}:${port}`);
    });
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/components/Status.jsx [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Status
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$server$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/server.js [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$server$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$server$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
const socket = (0, __TURBOPACK__imported__module__$5b$project$5d2f$server$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["io"])();
function Status({}) {
    // We'll attach the start logic here, likely listening for the SPACE key
    // You would typically use a useEffect hook and a state handler here 
    // to manage key presses, but for simplicity, we keep the UI structure.
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        __TURBOPACK__imported__module__$5b$project$5d2f$server$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["io"].on("playerUpdate", (backendPlayers)=>{
            document.getElementById("aaa").innerText = 'Players: ${Object.keys(players).length}';
        });
    });
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        id: "menu",
        className: "active",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
            children: [
                "State: ",
                '' + isConnected
            ]
        }, void 0, true, {
            fileName: "[project]/components/Status.jsx",
            lineNumber: 20,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/components/Status.jsx",
        lineNumber: 19,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/models/Player.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>Player
]);
class Player {
    constructor(id){
        this.id = id;
    // DO THIS LATER
    }
}
}),
"[project]/pages/index.js [ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {

__turbopack_context__.s([
    "default",
    ()=>Home
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react/jsx-dev-runtime [external] (react/jsx-dev-runtime, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/react [external] (react, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/socket.js [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Menu$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Menu.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Game$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Game.jsx [ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Status$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/components/Status.jsx [ssr] (ecmascript)");
// do i need this
var __TURBOPACK__imported__module__$5b$project$5d2f$models$2f$Player$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/models/Player.js [ssr] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Game$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Status$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Game$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Status$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
function Home() {
    const [isConnected, setIsConnected] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])(false);
    const [transport, setTransport] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useState"])("N/A");
    (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react__$5b$external$5d$__$28$react$2c$__cjs$29$__["useEffect"])(()=>{
        if (__TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["socket"].connected) {
            onConnect();
        }
        function onConnect() {
            setIsConnected(true);
            setTransport(__TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["socket"].io.engine.transport.name);
            __TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["socket"].io.engine.on("upgrade", (transport)=>{
                setTransport(transport.name);
            });
        }
        function onDisconnect() {
            setIsConnected(false);
            setTransport("N/A");
        }
        __TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["socket"].on("connect", onConnect);
        __TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["socket"].on("disconnect", onDisconnect);
        return ()=>{
            __TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["socket"].off("connect", onConnect);
            __TURBOPACK__imported__module__$5b$project$5d2f$socket$2e$js__$5b$ssr$5d$__$28$ecmascript$29$__["socket"].off("disconnect", onDisconnect);
        };
    }, []);
    //   const [isGameActive, setIsGameActive] = useState(false);
    //   // Function to transition from Menu to Game
    //   const handleStartGame = () => {
    //     setIsGameActive(prev => !prev);
    //     // space bar now toggles
    //     // setIsGameActive(true); is also fine
    //   };
    //   // Add a listener for the SPACE key, as specified in the original HTML
    //   useEffect(() => {
    //     const handleKeyDown = (event) => {
    //       if (event.code === 'Space' && !isGameActive) {
    //         handleStartGame();
    //       }
    //     };
    //     document.addEventListener('keydown', handleKeyDown);
    //     // return () => {
    //     //   document.removeEventListener('keydown', handleKeyDown);
    //     // };
    //   }, [isGameActive]); // Re-run effect if isGameActive changes, ever
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])("p", {
                children: "home"
            }, void 0, false, {
                fileName: "[project]/pages/index.js",
                lineNumber: 69,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Menu$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/pages/index.js",
                lineNumber: 70,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Game$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/pages/index.js",
                lineNumber: 72,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$externals$5d2f$react$2f$jsx$2d$dev$2d$runtime__$5b$external$5d$__$28$react$2f$jsx$2d$dev$2d$runtime$2c$__cjs$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$components$2f$Status$2e$jsx__$5b$ssr$5d$__$28$ecmascript$29$__["default"], {}, void 0, false, {
                fileName: "[project]/pages/index.js",
                lineNumber: 74,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/pages/index.js",
        lineNumber: 68,
        columnNumber: 5
    }, this);
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__92d410a0._.js.map