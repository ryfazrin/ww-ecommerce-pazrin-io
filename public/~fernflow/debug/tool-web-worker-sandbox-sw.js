(window => {
    const isPromise = v => "object" == typeof v && v && v.then;
    const noop = () => {};
    const len = obj => obj.length;
    const getConstructorName = obj => {
        try {
            return obj.constructor.name;
        } catch (e) {}
        return "";
    };
    const startsWith = (str, val) => str.startsWith(val);
    const isValidMemberName = memberName => !(startsWith(memberName, "webkit") || startsWith(memberName, "toJSON") || startsWith(memberName, "constructor") || startsWith(memberName, "toString") || startsWith(memberName, "_"));
    const randomId = () => Math.round(999999999 * Math.random() + 4);
    const InstanceIdKey = Symbol();
    const CreatedKey = Symbol();
    const instances = new Map;
    const mainRefs = new Map;
    const winCtxs = {};
    const windowIds = new WeakMap;
    const getAndSetInstanceId = (instance, instanceId, nodeName) => {
        if (instance) {
            if (instance === instance.window) {
                return 0;
            }
            if ("#document" === (nodeName = instance.nodeName)) {
                return 1;
            }
            if ("HTML" === nodeName) {
                return 2;
            }
            if ("HEAD" === nodeName) {
                return 3;
            }
            if ("BODY" === nodeName) {
                return 4;
            }
            "number" != typeof (instanceId = instance[InstanceIdKey]) && setInstanceId(instance, instanceId = randomId());
            return instanceId;
        }
        return -1;
    };
    const getInstance = (winId, instanceId, winCtx, win, doc) => {
        winCtx = winCtxs[winId];
        if (winCtx) {
            win = winCtx.$window$;
            if (win) {
                doc = win.document;
                return 0 === instanceId ? win : 1 === instanceId ? doc : 2 === instanceId ? doc.documentElement : 3 === instanceId ? doc.head : 4 === instanceId ? doc.body : instances.get(instanceId);
            }
        }
    };
    const setInstanceId = (instance, instanceId, now) => {
        if (instance) {
            instances.set(instanceId, instance);
            instance[InstanceIdKey] = instanceId;
            instance[CreatedKey] = now = Date.now();
            if (now > lastCleanup + 5e3) {
                instances.forEach(((storedInstance, instanceId) => {
                    storedInstance[CreatedKey] < lastCleanup && storedInstance.nodeType && !storedInstance.isConnected && instances.delete(instanceId);
                }));
                lastCleanup = now;
            }
        }
    };
    let lastCleanup = 0;
    const mainWindow = window.parent;
    const doc = document;
    const config = mainWindow.fernflow || {};
    const libPath = (config.lib || "/~fernflow/") + "debug/";
    const logMain = msg => {
        console.debug.apply(console, [ "%cMain 🌎", "background: #717171; color: white; padding: 2px 3px; border-radius: 2px; font-size: 0.8em;", msg ]);
    };
    const winIds = [];
    const normalizedWinId = winId => {
        winIds.includes(winId) || winIds.push(winId);
        return winIds.indexOf(winId) + 1;
    };
    const serializeForWorker = ($winId$, value, added, type, cstrName) => void 0 !== value && (type = typeof value) ? "string" === type || "number" === type || "boolean" === type || null == value ? [ 0, value ] : "function" === type ? [ 6 ] : (added = added || new Set) && Array.isArray(value) ? added.has(value) ? [ 1, [] ] : added.add(value) && [ 1, value.map((v => serializeForWorker($winId$, v, added))) ] : "object" === type ? "" === (cstrName = getConstructorName(value)) ? [ 2, {} ] : "Window" === cstrName ? [ 3, {
        $winId$: $winId$,
        $instanceId$: 0
    } ] : "HTMLCollection" === cstrName || "NodeList" === cstrName ? [ 7, Array.from(value).map((v => serializeForWorker($winId$, v, added)[1])) ] : cstrName.endsWith("Event") ? [ 5, serializeObjectForWorker($winId$, value, added) ] : "CSSRuleList" === cstrName ? [ 12, Array.from(value).map(serializeCssRuleForWorker) ] : startsWith(cstrName, "CSS") && cstrName.endsWith("Rule") ? [ 11, serializeCssRuleForWorker(value) ] : "CSSStyleDeclaration" === cstrName ? [ 13, serializeObjectForWorker($winId$, value, added) ] : "Attr" === cstrName ? [ 10, [ value.name, value.value ] ] : value.nodeType ? [ 3, {
        $winId$: $winId$,
        $instanceId$: getAndSetInstanceId(value),
        $nodeName$: value.nodeName
    } ] : [ 2, serializeObjectForWorker($winId$, value, added, true, true) ] : void 0 : value;
    const serializeObjectForWorker = (winId, obj, added, includeFunctions, includeEmptyStrings, serializedObj, propName, propValue) => {
        serializedObj = {};
        if (!added.has(obj)) {
            added.add(obj);
            for (propName in obj) {
                if (isValidMemberName(propName)) {
                    propValue = obj[propName];
                    (includeFunctions || "function" != typeof propValue) && (includeEmptyStrings || "" !== propValue) && (serializedObj[propName] = serializeForWorker(winId, propValue, added));
                }
            }
        }
        return serializedObj;
    };
    const serializeCssRuleForWorker = cssRule => {
        let obj = {};
        let key;
        for (key in cssRule) {
            validCssRuleProps.includes(key) && (obj[key] = cssRule[key]);
        }
        return obj;
    };
    const deserializeFromWorker = (worker, serializedTransfer, serializedType, serializedValue) => {
        if (serializedTransfer) {
            serializedType = serializedTransfer[0];
            serializedValue = serializedTransfer[1];
            return 0 === serializedType ? serializedValue : 4 === serializedType ? deserializeRefFromWorker(worker, serializedValue) : 1 === serializedType ? serializedValue.map((v => deserializeFromWorker(worker, v))) : 3 === serializedType ? getInstance(serializedValue.$winId$, serializedValue.$instanceId$) : 5 === serializedType ? constructEvent(deserializeObjectFromWorker(worker, serializedValue)) : 2 === serializedType ? deserializeObjectFromWorker(worker, serializedValue) : 8 === serializedType ? serializedValue : 9 === serializedType ? new window[serializedTransfer[2]](serializedValue) : void 0;
        }
    };
    const deserializeRefFromWorker = (worker, {$winId$: $winId$, $instanceId$: $instanceId$, $refId$: $refId$}, ref) => {
        ref = mainRefs.get($refId$);
        if (!ref) {
            ref = function(...args) {
                worker.postMessage([ 7, {
                    $winId$: $winId$,
                    $instanceId$: $instanceId$,
                    $refId$: $refId$,
                    $thisArg$: serializeForWorker($winId$, this),
                    $args$: serializeForWorker($winId$, args)
                } ]);
            };
            mainRefs.set($refId$, ref);
        }
        return ref;
    };
    const constructEvent = eventProps => new ("detail" in eventProps ? CustomEvent : Event)(eventProps.type, eventProps);
    const deserializeObjectFromWorker = (worker, serializedValue, obj, key) => {
        obj = {};
        for (key in serializedValue) {
            obj[key] = deserializeFromWorker(worker, serializedValue[key]);
        }
        return obj;
    };
    const validCssRuleProps = "cssText,selectorText,href,media,namespaceURI,prefix,name,conditionText".split(",");
    const logCallStack = (context) => {
        try {
            const stack = new Error().stack.split('\n').slice(1); // buang baris pertama (pesan error)
            const depth = stack.length;
            self._callStackDepths = self._callStackDepths || [];
            self._callStackDepths.push(depth);
            console.log(`[CallStack][Worker][${context}] Kedalaman: ${depth}`);
            // console.trace(); // opsional, jika ingin tetap tampilkan trace
        } catch (e) {}
    };
    const mainAccessHandler = async (worker, accessReq) => {
        logCallStack('mainAccessHandler');
        let accessRsp = {
            $msgId$: accessReq.$msgId$
        };
        let totalTasks = len(accessReq.$tasks$);
        let i = 0;
        let task;
        let winId;
        let applyPath;
        let instance;
        let rtnValue;
        let isLast;
        for (;i < totalTasks; i++) {
            try {
                isLast = i === totalTasks - 1;
                task = accessReq.$tasks$[i];
                winId = task.$winId$;
                applyPath = task.$applyPath$;
                winCtxs[winId] || await new Promise((resolve => {
                    let check = 0;
                    let callback = () => {
                        winCtxs[winId] || check++ > 999 ? resolve() : setTimeout(callback, 9);
                    };
                    callback();
                }));
                if (1 === applyPath[0] && applyPath[1] in winCtxs[winId].$window$) {
                    setInstanceId(new winCtxs[winId].$window$[applyPath[1]](...deserializeFromWorker(worker, applyPath[2])), task.$instanceId$);
                } else {
                    instance = getInstance(winId, task.$instanceId$);
                    if (instance) {
                        rtnValue = applyToInstance(worker, instance, applyPath, isLast, task.$groupedGetters$);
                        task.$assignInstanceId$ && setInstanceId(rtnValue, task.$assignInstanceId$);
                        if (isPromise(rtnValue)) {
                            rtnValue = await rtnValue;
                            accessRsp.$isPromise$ = true;
                        }
                        accessRsp.$rtnValue$ = serializeForWorker(winId, rtnValue);
                    } else {
                        accessRsp.$error$ = `Error finding instance "${task.$instanceId$}" on window ${normalizedWinId(winId)} (${winId})`;
                        console.error(accessRsp.$error$, task);
                    }
                }
            } catch (e) {
                isLast ? accessRsp.$error$ = String(e.stack || e) : console.error(e);
            }
        }
        return accessRsp;
    };
    const applyToInstance = (worker, instance, applyPath, isLast, groupedGetters) => {
        let i = 0;
        let l = len(applyPath);
        let next;
        let current;
        let previous;
        let args;
        let groupedRtnValues;
        for (;i < l; i++) {
            current = applyPath[i];
            next = applyPath[i + 1];
            previous = applyPath[i - 1];
            try {
                if (!Array.isArray(next)) {
                    if ("string" == typeof current || "number" == typeof current) {
                        if (i + 1 === l && groupedGetters) {
                            groupedRtnValues = {};
                            groupedGetters.map((propName => groupedRtnValues[propName] = instance[propName]));
                            return groupedRtnValues;
                        }
                        instance = instance[current];
                    } else {
                        if (0 === next) {
                            instance[previous] = deserializeFromWorker(worker, current);
                            return;
                        }
                        if ("function" == typeof instance[previous]) {
                            args = deserializeFromWorker(worker, current);
                            "insertRule" === previous && args[1] > len(instance.cssRules) && (args[1] = len(instance.cssRules));
                            instance = instance[previous].apply(instance, args);
                            if ("play" === previous) {
                                return Promise.resolve();
                            }
                        }
                    }
                }
            } catch (err) {
                if (isLast) {
                    throw err;
                }
                console.debug("Non-blocking setter error:", err);
            }
        }
        return instance;
    };
    const registerWindow = (worker, $winId$, $window$) => {
        if (!windowIds.has($window$)) {
            windowIds.set($window$, $winId$);
            const doc = $window$.document;
            const history = $window$.history;
            const $parentWinId$ = windowIds.get($window$.parent);
            const sendInitEnvData = () => worker.postMessage([ 3, {
                $winId$: $winId$,
                $parentWinId$: $parentWinId$,
                $url$: doc.baseURI
            } ]);
            const pushState = history.pushState.bind(history);
            const replaceState = history.replaceState.bind(history);
            const onLocationChange = () => setTimeout((() => worker.postMessage([ 11, $winId$, doc.baseURI ])));
            history.pushState = (data, _, url) => {
                pushState(data, _, url);
                onLocationChange();
            };
            history.replaceState = (data, _, url) => {
                replaceState(data, _, url);
                onLocationChange();
            };
            $window$.addEventListener("popstate", onLocationChange);
            $window$.addEventListener("hashchange", onLocationChange);
            winCtxs[$winId$] = {
                $winId$: $winId$,
                $window$: $window$
            };
            winCtxs[$winId$].$startTime$ = performance.now();
            {
                const winType = $winId$ === $parentWinId$ ? "top" : "iframe";
                logMain(`Registered ${winType} window ${normalizedWinId($winId$)} (${$winId$})`);
            }
            "complete" === doc.readyState ? sendInitEnvData() : $window$.addEventListener("load", sendInitEnvData);
        }
    };
    const readNextScript = (worker, winCtx) => {
        let $winId$ = winCtx.$winId$;
        let win = winCtx.$window$;
        let doc = win.document;
        let scriptSelector = 'script[type="text/toolwebworker"]:not([data-ptid]):not([data-pterror])';
        let scriptElm;
        let $instanceId$;
        let scriptData;
        if (doc && doc.body) {
            scriptElm = doc.querySelector('script[type="text/toolwebworker"]:not([data-ptid]):not([data-pterror]):not([async]):not([defer])');
            scriptElm || (scriptElm = doc.querySelector(scriptSelector));
            if (scriptElm) {
                scriptElm.dataset.ptid = $instanceId$ = getAndSetInstanceId(scriptElm, $winId$);
                scriptData = {
                    $winId$: $winId$,
                    $instanceId$: $instanceId$
                };
                if (scriptElm.src) {
                    scriptData.$url$ = scriptElm.src;
                    scriptData.$orgUrl$ = scriptElm.dataset.ptsrc || scriptElm.src;
                } else {
                    scriptData.$content$ = scriptElm.innerHTML;
                }
                worker.postMessage([ 5, scriptData ]);
            } else {
                if (!winCtx.$isInitialized$) {
                    winCtx.$isInitialized$ = 1;
                    ((worker, $winId$, win) => {
                        let queuedForwardCalls = win._fernf;
                        let forwards = (win.fernflow || {}).forward || [];
                        let i;
                        let mainForwardFn;
                        let forwardCall = ($forward$, args) => worker.postMessage([ 8, {
                            $winId$: $winId$,
                            $forward$: $forward$,
                            $args$: serializeForWorker($winId$, Array.from(args))
                        } ]);
                        win._fernf = void 0;
                        forwards.map((forwardProps => {
                            mainForwardFn = win;
                            forwardProps.split(".").map(((_, i, arr) => {
                                mainForwardFn = mainForwardFn[arr[i]] = i + 1 < len(arr) ? mainForwardFn[arr[i]] || ("push" === arr[i + 1] ? [] : {}) : (...args) => forwardCall(arr, args);
                            }));
                        }));
                        if (queuedForwardCalls) {
                            for (i = 0; i < len(queuedForwardCalls); i += 2) {
                                forwardCall(queuedForwardCalls[i], queuedForwardCalls[i + 1]);
                            }
                        }
                    })(worker, $winId$, win);
                    doc.dispatchEvent(new CustomEvent("pt0"));
                    {
                        const winType = win === win.top ? "top" : "iframe";
                        logMain(`Executed ${winType} window ${normalizedWinId($winId$)} environment scripts in ${(performance.now() - winCtx.$startTime$).toFixed(1)}ms`);
                    }
                }
                worker.postMessage([ 6, $winId$ ]);
            }
        } else {
            requestAnimationFrame((() => readNextScript(worker, winCtx)));
        }
    };
    const onMessageFromWebWorker = (worker, msg, winCtx) => {
        if (2 === msg[0]) {
            registerWindow(worker, randomId(), mainWindow);
        } else {
            winCtx = winCtxs[msg[1]];
            winCtx && (5 === msg[0] ? requestAnimationFrame((() => readNextScript(worker, winCtx))) : 4 === msg[0] && ((worker, winCtx, instanceId, errorMsg, script) => {
                script = winCtx.$window$.document.querySelector(`[data-ptid="${instanceId}"]`);
                script && (errorMsg ? script.dataset.pterror = errorMsg : script.type += "-x");
                readNextScript(worker, winCtx);
            })(worker, winCtx, msg[2], msg[3]));
        }
    };
    const readMainPlatform = () => {
        const startTime = performance.now();
        const docImpl = doc.implementation.createHTMLDocument();
        const textNode = docImpl.createTextNode("");
        const comment = docImpl.createComment("");
        const frag = docImpl.createDocumentFragment();
        const svg = docImpl.createElementNS("http://www.w3.org/2000/svg", "svg");
        const intersectionObserver = getGlobalConstructor(mainWindow, "IntersectionObserver");
        const mutationObserver = getGlobalConstructor(mainWindow, "MutationObserver");
        const resizeObserver = getGlobalConstructor(mainWindow, "ResizeObserver");
        const perf = mainWindow.performance;
        const screen = mainWindow.screen;
        const elms = Object.getOwnPropertyNames(mainWindow).filter((c => /^HTML.+Element$/.test(c))).map((htmlCstrName => [ docImpl.createElement(getHtmlTagNameFromConstructor(htmlCstrName)) ]));
        const elm = elms[0][0];
        const impls = [ [ mainWindow.history ], [ perf ], [ perf.navigation ], [ perf.timing ], [ screen ], [ screen.orientation ], [ intersectionObserver, 12 ], [ mutationObserver, 12 ], [ resizeObserver, 12 ], [ textNode ], [ comment ], [ frag ], [ elm ], [ elm.attributes ], [ elm.classList ], [ elm.dataset ], [ elm.style ], [ svg ], [ docImpl ], [ docImpl.doctype ], ...elms ].filter((implData => implData[0])).map((implData => {
            const impl = implData[0];
            const interfaceType = implData[1];
            const cstrName = getConstructorName(impl);
            const CstrPrototype = mainWindow[cstrName].prototype;
            return [ cstrName, CstrPrototype, impl, interfaceType ];
        }));
        const $interfaces$ = [ readImplementation("Window", mainWindow), readImplementation("Node", textNode) ];
        const $config$ = JSON.stringify(config, ((k, v) => {
            if ("function" == typeof v) {
                v = String(v);
                v.startsWith(k + "(") && (v = "function " + v);
            }
            return v;
        }));
        const initWebWorkerData = {
            $config$: $config$,
            $libPath$: new URL(libPath, mainWindow.location) + "",
            $interfaces$: $interfaces$,
            $localStorage$: readStorage("localStorage"),
            $sessionStorage$: readStorage("sessionStorage")
        };
        impls.map((([cstrName, CstrPrototype, impl, intefaceType]) => readOwnImplementation($interfaces$, cstrName, CstrPrototype, impl, intefaceType)));
        logMain(`Read ${$interfaces$.length} interfaces in ${(performance.now() - startTime).toFixed(1)}ms`);
        return initWebWorkerData;
    };
    const readImplementation = (cstrName, impl, memberName) => {
        let interfaceMembers = [];
        let interfaceInfo = [ cstrName, "Object", interfaceMembers ];
        for (memberName in impl) {
            readImplementationMember(interfaceMembers, impl, memberName);
        }
        return interfaceInfo;
    };
    const readOwnImplementation = (interfaces, cstrName, CstrPrototype, impl, interfaceType) => {
        if ("Object" !== cstrName && !interfaces.some((i => i[0] === cstrName))) {
            const SuperCstr = Object.getPrototypeOf(CstrPrototype);
            const superCstrName = getConstructorName(SuperCstr);
            const interfaceMembers = [];
            readOwnImplementation(interfaces, superCstrName, SuperCstr, impl, interfaceType);
            Object.keys(Object.getOwnPropertyDescriptors(CstrPrototype)).map((memberName => readImplementationMember(interfaceMembers, impl, memberName)));
            interfaces.push([ cstrName, superCstrName, interfaceMembers, interfaceType, impl.nodeName ]);
        }
    };
    const readImplementationMember = (interfaceMembers, implementation, memberName, value, memberType, cstrName) => {
        try {
            if (isValidMemberName(memberName) && isNaN(memberName[0]) && "all" !== memberName) {
                value = implementation[memberName];
                memberType = typeof value;
                if ("function" === memberType) {
                    (String(value).includes("[native") || Object.getPrototypeOf(implementation)[memberName]) && interfaceMembers.push([ memberName, 5 ]);
                } else if ("object" === memberType && null != value) {
                    cstrName = getConstructorName(value);
                    "Object" !== cstrName && self[cstrName] && interfaceMembers.push([ memberName, value.nodeType || cstrName ]);
                } else {
                    "symbol" !== memberType && (memberName.toUpperCase() === memberName ? interfaceMembers.push([ memberName, 6, value ]) : interfaceMembers.push([ memberName, 6 ]));
                }
            }
        } catch (e) {
            console.warn(e);
        }
    };
    const htmlConstructorToTagMap = {
        Anchor: "A",
        DList: "DL",
        Image: "IMG",
        OList: "OL",
        Paragraph: "P",
        TableCaption: "CAPTION",
        TableCell: "TD",
        TableCol: "COLGROUP",
        TableRow: "TR",
        TableSection: "TBODY",
        UList: "UL"
    };
    const getHtmlTagNameFromConstructor = t => {
        t = t.slice(4).replace("Element", "");
        return htmlConstructorToTagMap[t] || t;
    };
    const readStorage = storageName => {
        let items = [];
        let i = 0;
        let l = len(mainWindow[storageName]);
        let key;
        for (;i < l; i++) {
            key = mainWindow[storageName].key(i);
            items.push([ key, mainWindow[storageName].getItem(key) ]);
        }
        return items;
    };
    const getGlobalConstructor = (mainWindow, cstrName) => void 0 !== mainWindow[cstrName] ? new mainWindow[cstrName](noop) : 0;
    let worker;
    (receiveMessage => {
        const swContainer = window.navigator.serviceWorker;
        return swContainer.getRegistration().then((swRegistration => {
            swContainer.addEventListener("message", (ev => receiveMessage(ev.data, (accessRsp => swRegistration.active && swRegistration.active.postMessage(accessRsp)))));
            return (worker, msg) => {
                0 === msg[0] ? worker.postMessage([ 1, readMainPlatform() ]) : onMessageFromWebWorker(worker, msg);
            };
        }));
    })(((accessReq, responseCallback) => mainAccessHandler(worker, accessReq).then(responseCallback))).then((onMessageHandler => {
        if (onMessageHandler) {
            worker = new Worker(libPath + "tool-web-worker-ww-sw.js", {
                name: "Tool-web-worker"
            });
            worker.onmessage = ev => {
                const msg = ev.data;
                10 === msg[0] ? mainAccessHandler(worker, msg[1]) : onMessageHandler(worker, msg);
            };
            logMain("Created Fernflow web worker (0.2.0)");
            worker.onerror = ev => console.error("Web Worker Error", ev);
            mainWindow.addEventListener("pt1", (ev => registerWindow(worker, getAndSetInstanceId(ev.detail.frameElement), ev.detail)));
        }
    }));
})(window);
