if (typeof PMUtil === "undefined") {
    let globalEval = eval;
    PMUtil = function () {
        let self = this;
        let debug = false;
        let logs = [];

        const uuidv4 = require('uuid').v4;

        log = function (...msg) {
            if (debug)
                console.log(...msg);
            logs.push(msg);
        };

        this.getLogs = () => logs;

        this.log = log;

        cache = {};

        this.fetch = (url) => new Promise((resolve, reject) => pm.sendRequest(url, (err, res) => err ? reject(err) : resolve(res)));

        this.get = this.fetch;

        this.getJSON = async url => {
            if (url in cache) {
                return JSON.parse(cache[url]);
            }

            let res = await this.get(url);
            cache[url] = res.text();
            return res.json();
        };
        // async function loadJSONGitFolder(url, pattern) {
        //     return "tarun";
        // }
        this.loadGitFolder = async (url, pattern) => {
            pattern = pattern || ".*";
            pattern = typeof pattern === "string" ? new RegExp(pattern) : pattern
            let git_api_url = url
                .replace("//github.com/", "//api.github.com/repos/")
                .replace(/^((.*)\/tree\/([^/]+)\/(.*)$)/, "$2/contents/$4?ref=$3");


            setTimeout(function () {

            }, 2000);
            const data = await self.getJSON(git_api_url);

            log("loadJSONGitFolder.data", data);
            for (const file of data) {
                let res = await this.getTemplate(file["download_url"]);
                cache[file.name] = res;
                cache[file.download_url] = res;
            }

        };

        this.getTemplate = async url => {
            if (url in cache) {
                return cache[url];
            }
            let res = await this.get(url)
            cache[url] = res.text();
            return cache[url];
        }

        this.loadScript = async url => globalEval(await this.getTemplate(url));

        this.loadEnvironment = async url => {
            let data = await this.getJSON(url);
            let values = data.values;
            for (const key in values)
                values[key].enabled ? pm.environment.set(values[key].key, values[key].value) : null
        };

        this.rand = {
            $randomInt: function (min, max) {
                if (!min) {
                    min = 0;
                    max = 100;
                }
                if (!max) {
                    max = min;
                    min = 1;
                }
                return Math.floor(min + Math.random() * (max + 1 - min));
            },
            $randomStringC: function (min, max, set = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
                return this.$randomString(min, max, set)
            },
            $randomStringS: function (min, max, set = 'abcdefghijklmnopqrstuvwxyz') {
                return this.$randomString(min, max, set)
            },
            $randomString: function (min, max, set = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz') {
                if (!min) {
                    min = 12;
                    max = 12;
                }
                if (!max) {
                    max = min;
                }
                let length = this.$randomInt(min, max);
                let text = "";

                for (let i = 0; i < length; i++)
                    text += set.charAt(Math.floor(Math.random() * set.length));
                return text;
            },
            $randomAlpha: function (min, max, set = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
                return this.$randomString(min, max, set);
            },
            $randomAlphaS: function (min, max, set = 'abcdefghijklmnopqrstuvwxyz0123456789') {
                return this.$randomString(min, max, set)
            },
            $randomAlphaC: function (min, max, set = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
                return this.$randomString(min, max, set)
            },
            $GUID: (length) => uuidv4().substr(0, length),
            $GUIDWD: (length) => uuidv4().replace(/-/g, '').substr(0, length),

        }

        this.resolveParams = (v, resolvePMVariables) => {
            resolvePMVariables = resolvePMVariables || false;
            let paramPattern;
            if (resolvePMVariables) {
                paramPattern = /({{(\$?[a-z_]+)(?:\((['"a-z0-9, ]+)\))?}})/ig;
            } else {
                paramPattern = /({{(\$[a-z_]+)(?:\((['"a-z0-9, ]+)\))?}})/ig;
            }

            do {
                paramPattern.lastIndex = 0;
                let m;
                if (m = paramPattern.exec(v)) {
                    let [, replacer, funcName, call,] = m;

                    if (funcName in this.rand) {
                        let callParams;

                        if (!call) {
                            callParams = null;
                        }
                        else {
                            callParams = call.split(",").map((data) => {
                                if (!isNaN(data)) {
                                    data = parseFloat(data);
                                }
                                return data;
                            });
                        }

                        let replace_data = this.rand[funcName].apply(this.rand, callParams);
                        v = v.replace(replacer, replace_data)
                    } else {
                        console.log("we are looking for " + funcName)
                        v = v.replace(replacer, pm.variables.get(funcName))
                    }
                }
            } while (m)
            return v;
        }

        this.loadRandomEnvironmentVariables = () => {
            for (const variable in pm.environment.toObject()) {
                if (variable.startsWith("_")) {
                    pm.environment.set(variable.substr(1), this.resolveParams(pm.environment.get(variable)));
                }
            }
        };

        const JSONPath = function () {
            this.pathToArray = path => path
                .split(/[.\[]/)
                .map(f => {
                    let v = f;
                    if (v !== '' && !isNaN(v) && isFinite(v))
                        v = parseFloat(v);
                    else
                        v = f.replace(/^['"]|['"]$/g, '')
                    return v
                })
                .filter(f => f !== '');

            this.get = (obj, path) => {
                let path2 = this.pathToArray(path)
                let data = path2.reduce((a, b) => {
                    if (a == "$")
                        a = obj;
                    return a[b];
                })

                return data;
            }

            this.set = (obj, path, value) => {
                path = this.pathToArray(path)
                let lastObject = path.slice(0, -1).reduce((a, b) => {
                    if (a == "$")
                        a = obj;
                    return a[b];
                })

                lastObject[path[path.length - 1]] = value
                return value;
            }

            this.remove = (obj, path) => {
                path = this.pathToArray(path)
                let lastObject = path.slice(0, -1).reduce((a, b) => {
                    if (a == "$")
                        a = obj;
                    return a[b];
                })

                delete lastObject[path[path.length - 1]]
            }
        }

        this.jp = new JSONPath();

        this.getRequestMetadata = () => {
            let description = postman["__execution"].request.description.content;
            log("description", description)
            let m = /META((.|\r|\n)+)<<<META/i.exec(description)
            log("Match found", m)
            if (!m)
                return {}
            return JSON.parse(m[1]);
        }
        
        this.processMetadata = async metaData => {
            // if this is the first request then we should process the random variable generation
            if ('template' in metaData) {
                pm.environment.set('postBody', await this.getTemplate(metaData['template']))
            }
            
            if ('random' in metaData) {
                for (key in metaData['random']) {
                    pm.environment.set(key, this.resolveParams(metaData['random'][key]))
                }
            }
            
            if ('load_random_environment' in metaData) {
                if (metaData['load_random_environment'])
                   this.loadRandomEnvironmentVariables();
            }
        }
    }


    pmutil = new PMUtil()
    log = pmutil.log;
} else {
    log("PMUtils already loaded");

}
