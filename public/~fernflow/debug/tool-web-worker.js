!function(win, doc, nav, top, useAtomics, config, libPath, timeout, scripts, sandbox, mainForwardFn, isReady) {
    function logCallStack(context) {
        try {
            const stack = new Error().stack.split('\n').slice(1);
            const depth = stack.length;
            window._callStackDepths = window._callStackDepths || [];
            window._callStackDepths.push(depth);
            console.log(`[CallStack][Main][${context}] Kedalaman: ${depth}`);
            // console.trace();
        } catch (e) {}
    }
    function ready() {
        logCallStack('ready');
        if (!isReady) {
            isReady = 1;
            libPath = (config.lib || "/~fernflow/") + (false !== config.debug ? "debug/" : "");
            if ("/" == libPath[0]) {
                scripts = doc.querySelectorAll('script[type="text/toolwebworker"]');
                if (top != win) {
                    top.dispatchEvent(new CustomEvent("pt1", {
                        detail: win
                    }));
                } else if (scripts.length) {
                    timeout = setTimeout(fallback, 6e4);
                    doc.addEventListener("pt0", clearFallback);
                    useAtomics ? loadSandbox(1) : nav.serviceWorker ? nav.serviceWorker.register(libPath + "tool-web-worker-sw.js", {
                        scope: libPath
                    }).then((function(swRegistration) {
                        if (swRegistration.active) {
                            loadSandbox();
                        } else if (swRegistration.installing) {
                            swRegistration.installing.addEventListener("statechange", (function(ev) {
                                "activated" == ev.target.state && loadSandbox();
                            }));
                        } else {
                            console.warn(swRegistration);
                        }
                    }), console.error) : fallback();
                }
            } else {
                console.warn('Fernflow config.lib url must start with "/"');
            }
        }
    }
    function loadSandbox(isAtomics) {
        sandbox = doc.createElement(isAtomics ? "script" : "iframe");
        if (!isAtomics) {
            sandbox.setAttribute("style", "display:block;width:0;height:0;border:0;visibility:hidden");
            sandbox.setAttribute("aria-hidden", !0);
        }
        sandbox.src = libPath + "tool-web-worker-" + (isAtomics ? "atomics.js" : "sandbox-sw.html?" + Date.now());
        doc.body.appendChild(sandbox);
    }
    function fallback(i, script) {
        console.warn("Fernflow script fallback");
        clearFallback();
        for (i = 0; i < scripts.length; i++) {
            script = doc.createElement("script");
            script.innerHTML = scripts[i].innerHTML;
            doc.head.appendChild(script);
        }
    }
    function clearFallback() {
        clearTimeout(timeout);
    }
    config = win.fernflow || {};
    top == win && (config.forward || []).map((function(forwardProps) {
        mainForwardFn = win;
        forwardProps.split(".").map((function(_, i, forwardPropsArr) {
            mainForwardFn = mainForwardFn[forwardPropsArr[i]] = i + 1 < forwardPropsArr.length ? "push" == forwardPropsArr[i + 1] ? [] : mainForwardFn[forwardPropsArr[i]] || {} : function() {
                (win._fernf = win._fernf || []).push(forwardPropsArr, arguments);
            };
        }));
    }));
    if ("complete" == doc.readyState) {
        ready();
    } else {
        win.addEventListener("DOMContentLoaded", ready);
        win.addEventListener("load", ready);
    }
}(window, document, navigator, top, top.crossOriginIsolated);
