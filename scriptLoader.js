// Set requirement constant
let fileSystem = require('fs');
let jsYaml = require('js-yaml');
let lineReader = require('line-reader');
let path = require('path');
let yaml = require('yaml');

let scriptLoader = class{

    constructor() {
        this.initialiseScriptLoader();
    }

    initialiseScriptLoader(){

        new consoleJS('info', 'ScriptLoader', 'Initialising ScriptLoader...');

        if(fileSystem.existsSync(path.resolve(__dirname)+'/custom.yml') == false){
            new consoleJS('warn', 'ScriptLoader', 'Unable to locate custom.yml!');
            setTimeout(() => {
                this.customYml('build');
            },1500);
        }else{
            new consoleJS('info', 'ScriptLoader', 'Located custom.yml...');
            setTimeout(() => {
                this.customYml('scan');
            },1500);
        }

    }

    customYml(method){
        switch (method){
            case 'build':
                let base = {
                    Version: '1.0.0-Rev1',
                    enable: true,
                    enableByDefault: true,
                    installedScripts:{}
                }
                new consoleJS('info', 'ScriptLoader', 'Scanning ./scripts directory for mod scripts.');

                fileSystem.readdir(path.resolve(__dirname, './scripts/'), function( err, scripts) {
                    if(err) console.error(err);
                    scripts.forEach(function (script){
                        let scriptName = script.replace('.js', '');
                        base['installedScripts'][scriptName] = {
                            enabled: true
                        };
                        fileSystem.readFile(path.resolve(__dirname, './scripts')+'/'+script, function (err, contents) {
                            if(err) console.error(err);
                            let array = contents.toString().split('\n');
                            let i = '';
                            for(i in array){
                                if(array[i].includes('// ScriptLoad | START')) {
                                    new consoleJS('info', 'ScriptLoader', 'Found: '+script+'...');
                                }
                                if(array[i].includes('// Option: ')){
                                    let optionName = array[i].replace('// Option: ', '').replace(': true|false', '');
                                    base['installedScripts'][scriptName][optionName] = false;

                                }
                            }

                            let baseJS = JSON.stringify(base, null, 4);
                            let basePR = JSON.parse(baseJS);
                            let yamlPR = jsYaml.dump(basePR);

                            fileSystem.writeFile('./custom.yml', yamlPR, (err) => {
                                if(err) console.error(err);
                            });

                        });

                    });

                });

                this.initScripts();
            case 'scan':
                let C = this.readConfig();
                let scripts = Object.keys(C.installedScripts);
                for(let script of scripts){
                    fileSystem.readdir(path.resolve(__dirname, './scripts/'), function( err, dirScripts) {
                        if (err) console.error(err);
                        dirScripts.forEach(function (dirScript) {
                            let jsScript = dirScript.replace('.js','');
                            if(jsScript != script){
                                C['installedScripts'][jsScript] = {
                                    enabled: true
                                };
                            }
                            fileSystem.readFile(path.resolve(__dirname, './scripts')+'/'+dirScript, function (err, contents) {
                                if(err) console.error(err);
                                let array = contents.toString().split('\n');
                                let i = '';
                                for(i in array){
                                    if(array[i].includes('// ScriptLoad | START')) {
                                        //new consoleJS('info', 'ScriptLoader', 'Found: '+dirScript+'...');
                                    }
                                    if(array[i].includes('// Option: ')){
                                        let optionName = array[i].replace('// Option: ', '').replace(': true|false', '');
                                        C['installedScripts'][jsScript][optionName] = false;

                                    }
                                }

                                let baseJS = JSON.stringify(C, null, 4);
                                let basePR = JSON.parse(baseJS);
                                let yamlPR = jsYaml.dump(basePR);

                                fileSystem.writeFile('./custom.yml', yamlPR, (err) => {
                                    if(err) console.error(err);
                                });

                            });
                        });
                    });
                }
                this.initScripts();
        }
    }

    initScripts(){
        let C = this.readConfig();
        if(C.enable === false){
            new consoleJS('warn', 'ScriptLoader', 'Scripts are currently Disabled!');
            return 0;
        }else{
            new consoleJS('info','ScriptLoader','Scripts are Enabled');
        }

        let scripts = Object.keys(C.installedScripts);
        for(let script of scripts){
            let enabledScript = eval(`C.installedScripts.${script}.enabled`);
            if(enabledScript === undefined){
                enabledScript = C.enableByDefault;
                new consoleJS('info','ScriptLoader',`The script ${script} has been auto-enabled.`);
            }
            new consoleJS('info','ScriptLoader',`Script ${script} is ${(enabledScript) ? 'Enabled' : 'Disabled'}`);

            if(enabledScript === true){
                require(`./scripts/${script}.js`);
            }
        }
    }

    readConfig(){
        try {
            let loadCustom = fileSystem.readFileSync(path.resolve(__dirname, './custom.yml'), 'utf8');
            let customYML = yaml.parse(loadCustom);
            return customYML;
        }catch(err) {
            throw(err);
        }
    }
}

let consoleJS = class{

    constructor(type, script, message) {
        this.type = type;
        this.script = script;
        this.message = message;

        let iJSo = '';
        let wJSo = '';

        // Set Date Constants
        let currentDT = new Date();
        let thisYear = currentDT.getFullYear();
        let thismonth = ("0" + currentDT.getMonth() + 1).slice(-2);
        let thisdate = ("0" + currentDT.getDate()).slice(-2);
        let thishour = ("0" + currentDT.getHours()).slice(-2);
        let thisminute = ("0" + currentDT.getMinutes()).slice(-2);
        let thissecond = ("0" + currentDT.getSeconds()).slice(-2);

        // Create Console Timestamp Constant
        let timeStamp = thisYear+'-'+thismonth+'-'+thisdate+' '+thishour+':'+thisminute+':'+thissecond;

        if(type === 'info'){
            iJSo += '['+timeStamp;
            iJSo += ' '+this.colour('aqua')+'INFO'+this.colour();
            iJSo += '][';
            iJSo += this.colour('yellow')+script+this.colour()+'] ';
            iJSo += message;

            return console.log(iJSo);
        }

        if(type === 'warn'){
            wJSo += '['+timeStamp;
            wJSo += ' '+this.colour('red')+'WARN'+this.colour();
            wJSo += '][';
            wJSo += this.colour('yellow')+script+this.colour()+'] ';
            wJSo += message;

            return console.log(wJSo);
        }
    }

    colour(consoleColour){

        switch (consoleColour){
            case 'white':
                return '\x1b[38;2;255;255;255m';
            case 'black':
                return '\x1b[38;2;0;0;0m';
            case 'red':
                return '\x1b[38;2;255;85;85m';
            case 'aqua':
                return '\x1b[38;2;85;255;255m';
            case 'yellow':
                return '\x1b[38;2;255;255;85m';
            default:
                return '\x1b[0m';
        }

    }
}

new scriptLoader();