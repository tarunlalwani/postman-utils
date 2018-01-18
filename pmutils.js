if (typeof PMUtil === "undefined") {
    console.log("Initializing PMUtil for current session");

    PMUtil = function () {
        this.cache = {};

        this.fetch = (url) => new Promise((resolve, reject) => pm.sendRequest(url, (err, res) => err ? reject([err, res]): resolve([err, res])))

        this.get = this.fetch;

        this.getBodyTemplate = (url) => url in this.cache ? cache[url] : this.get(url).then((err,res) => this.cache[url] = res.text() )

        this.loadEnvironment = (url) => {
            return new Promise( (resolve) => this.get(url).then(([err,res]) => {
                var values = res.json().values;
                for (var key in values)
                    values[key].enabled ? pm.environment.set(values[key].key, values[key].value): null

                resolve();
            }));
        };
        this.randomGenerator = () => {
            console.log("I generate random data");
        }
    };

    pmutil = new PMUtil();
} else {
    console.log("PMUtils already loaded");
    console.log(pmutil.randomGenerator());
}
