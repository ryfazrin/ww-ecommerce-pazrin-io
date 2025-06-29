const resolves = new Map;

const swMessageError = (accessReq, $error$) => ({
    $msgId$: accessReq.$msgId$,
    $error$: $error$
});

const httpRequestFromWebWorker = req => new Promise((async resolve => {
    const accessReq = await req.clone().json();
    const responseData = await (accessReq => new Promise((async resolve => {
        const clients = await self.clients.matchAll();
        const client = [ ...clients ].sort(((a, b) => a.url > b.url ? -1 : a.url < b.url ? 1 : 0))[0];
        if (client) {
            const timeout = 12e4;
            const msgResolve = [ resolve, setTimeout((() => {
                resolves.delete(accessReq.$msgId$);
                resolve(swMessageError(accessReq, "Timeout"));
            }), timeout) ];
            resolves.set(accessReq.$msgId$, msgResolve);
            client.postMessage(accessReq);
        } else {
            resolve(swMessageError(accessReq, "NoParty"));
        }
    })))(accessReq);
    resolve(response(JSON.stringify(responseData), "application/json"));
}));

const response = (body, contentType) => new Response(body, {
    headers: {
        "content-type": contentType || "text/html",
        "Cache-Control": "no-store"
    }
});

const logCallStack = (context) => {
    try {
        const stack = new Error().stack.split('\n').slice(1);
        const depth = stack.length;
        self._callStackDepths = self._callStackDepths || [];
        self._callStackDepths.push(depth);
        console.log(`[CallStack][ServiceWorker][${context}] Kedalaman: ${depth}`);
        // console.trace();
    } catch (e) {}
};

self.oninstall = () => self.skipWaiting();

self.onactivate = () => self.clients.claim();

self.onmessage = ev => {
    const accessRsp = ev.data;
    const r = resolves.get(accessRsp.$msgId$);
    if (r) {
        resolves.delete(accessRsp.$msgId$);
        clearTimeout(r[1]);
        r[0](accessRsp);
    }
};

self.onfetch = ev => {
    logCallStack('onfetch');
    const req = ev.request;
    const url = new URL(req.url);
    const pathname = url.pathname;
    if (pathname.endsWith("sw.html")) {
        ev.respondWith(response('<!DOCTYPE html><html><head><meta charset="utf-8"><script src="./tool-web-worker-sandbox-sw.js"><\/script></head></html>'));
    } else {
        pathname.endsWith("ferntown") && ev.respondWith(httpRequestFromWebWorker(req));
    }
};
