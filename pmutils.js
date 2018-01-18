if (typeof PMUtil === "undefined") {
    console.log("Initializing PMUtil for current session");
    
    PMUtil = function () {
        this.loadEnvironmentVariables = (url) => {
            
        }   
        this.randomGenerator = () => {
            console.log("I generate random data");
        }
    }
    
    pmutil = new PMUtil();
} else {
    console.log("PMUtils already loaded");
    console.log(pmutil.randomGenerator());
}
