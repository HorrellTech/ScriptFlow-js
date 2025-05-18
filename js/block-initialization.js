/**
 * Block library initialization for ScriptFlow
 * This file contains all the block definitions used in the ScriptFlow editor
 */

function initializeBlockLibrary() {
    return {
        basics: {
            name: "Basics",
            blocks: {
                program: {
                    name: "Program",
                    category: "basics",
                    inputs: ["body"],
                    outputs: [],
                    template: (block) => {
                        return `// Program Start
${block.inputs.body || '// Add code here'}
// Program End`;
                    }
                },
                statement: {
                    name: "Statement",
                    category: "basics",
                    inputs: ["expression"],
                    outputs: ["next"],
                    template: (block) => {
                        return `${block.inputs.expression || ''};`;
                    }
                }
            }
        },
        inputs: {
            name: "Inputs",
            blocks: {
                number: {
                    name: "Number",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "number", default: "0" }
                    ],
                    template: (block) => `${block.options.value || '0'}`
                },
                text: {
                    name: "Text",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "text", default: "text" }
                    ],
                    template: (block) => `"${block.options.value || ''}"`
                },
                boolean: {
                    name: "Boolean",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "select", options: ["true", "false"], default: "true" }
                    ],
                    template: (block) => `${block.options.value || 'true'}`
                },
                array: {
                    name: "Array",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "items", type: "text", default: "1,2,3" }
                    ],
                    template: (block) => {
                        const items = block.options.items || '';
                        return `[${items}]`;
                    }
                },
                object: {
                    name: "Object",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "json", type: "text", default: '{"key": "value"}' }
                    ],
                    template: (block) => {
                        try {
                            // Try to parse as JSON to validate
                            JSON.parse(block.options.json || '{}');
                            return block.options.json || '{}';
                        } catch (e) {
                            return '{}';
                        }
                    }
                }
            }
        },
        logic: {
            name: "Logic",
            blocks: {
                if: {
                    name: "If Condition",
                    category: "logic",
                    inputs: ["condition", "trueBranch", "falseBranch"],
                    outputs: ["next"],
                    template: (block) => {
                        const condition = block.inputs.condition || 'true';
                        const trueBranch = block.inputs.trueBranch || '';
                        const falseBranch = block.inputs.falseBranch || '';
                        
                        let code = `if (${condition}) {\n`;
                        if (trueBranch) {
                            code += `  ${trueBranch.split('\n').join('\n  ')}\n`;
                        }
                        code += `}`;
                        
                        if (falseBranch) {
                            code += ` else {\n  ${falseBranch.split('\n').join('\n  ')}\n}`;
                        }
                        
                        return code;
                    }
                },
                comparison: {
                    name: "Comparison",
                    category: "operators",
                    inputs: ["leftOperand", "rightOperand"],
                    outputs: ["result"],
                    options: [
                        { name: "operator", type: "select", options: ["===", "!==", "==", "!=", ">", "<", ">=", "<="], default: "===" }
                    ],
                    template: (block) => {
                        const left = block.inputs.leftOperand || '0';
                        const right = block.inputs.rightOperand || '0';
                        const operator = block.options.operator || '===';
                        
                        return `(${left} ${operator} ${right})`;
                    }
                },
                and: {
                    name: "AND",
                    category: "logic",
                    inputs: ["value1", "value2"],
                    outputs: ["result"],
                    template: (block) => `(${block.inputs.value1 || 'true'} && ${block.inputs.value2 || 'true'})`
                },
                or: {
                    name: "OR",
                    category: "logic",
                    inputs: ["value1", "value2"],
                    outputs: ["result"],
                    template: (block) => `(${block.inputs.value1 || 'false'} || ${block.inputs.value2 || 'false'})`
                },
                not: {
                    name: "NOT",
                    category: "logic",
                    inputs: ["value"],
                    outputs: ["result"],
                    template: (block) => `!(${block.inputs.value || 'true'})`
                },
                arithmetic: {
                    name: "Arithmetic",
                    category: "operators",
                    inputs: ["leftOperand", "rightOperand"],
                    outputs: ["result"],
                    options: [
                        { name: "operator", type: "select", options: ["+", "-", "*", "/", "%"], default: "+" }
                    ],
                    template: (block) => {
                        const left = block.inputs.leftOperand || '0';
                        const right = block.inputs.rightOperand || '0';
                        const operator = block.options.operator || '+';
                        
                        return `(${left} ${operator} ${right})`;
                    }
                },
                logical: {
                    name: "Logical",
                    category: "operators",
                    inputs: ["leftOperand", "rightOperand"],
                    outputs: ["result"],
                    options: [
                        { name: "operator", type: "select", options: ["&&", "||", "!"], default: "&&" }
                    ],
                    template: (block) => {
                        const left = block.inputs.leftOperand || 'true';
                        const operator = block.options.operator || '&&';
                        
                        if (operator === '!') {
                            return `(!${left})`;
                        } else {
                            const right = block.inputs.rightOperand || 'true';
                            return `(${left} ${operator} ${right})`;
                        }
                    }
                }
            }
        },
        math: {
            name: "Math",
            blocks: {
                arithmetic: {
                    name: "Arithmetic Operation",
                    category: "math",
                    inputs: ["value1", "value2"],
                    outputs: ["result"],
                    options: [
                        { name: "operator", type: "select", options: ["+", "-", "*", "/", "%"] }
                    ],
                    template: (block) => `
                        (${block.inputs.value1 || '0'} ${block.options.operator || '+'} ${block.inputs.value2 || '0'})
                    `
                },
                random: {
                    name: "Random Number",
                    category: "math",
                    inputs: ["min", "max"],
                    outputs: ["result"],
                    template: (block) => `
                        Math.floor(Math.random() * (${block.inputs.max || '100'} - ${block.inputs.min || '0'} + 1) + ${block.inputs.min || '0'})
                    `
                },
                round: {
                    name: "Round Number",
                    category: "math",
                    inputs: ["value"],
                    outputs: ["result"],
                    options: [
                        { name: "mode", type: "select", options: ["round", "floor", "ceil"], default: "round" }
                    ],
                    template: (block) => `Math.${block.options.mode || 'round'}(${block.inputs.value || '0'})`
                },
                mathFunction: {
                    name: "Math Function",
                    category: "math",
                    inputs: ["value"],
                    outputs: ["result"],
                    options: [
                        { name: "function", type: "select", options: ["abs", "sqrt", "sin", "cos", "tan", "log"], default: "abs" }
                    ],
                    template: (block) => `Math.${block.options.function || 'abs'}(${block.inputs.value || '0'})`
                }
            }
        },
        variables: {
            name: "Variables",
            blocks: {
                declare: {
                    name: "Declare Variable",
                    category: "variable",
                    inputs: ["value"],
                    outputs: [],
                    options: [
                        { name: "name", type: "text", default: "myVar" },
                        { name: "type", type: "select", options: ["let", "const", "var"] }
                    ],
                    template: (block) => `
                        ${block.options.type || 'let'} ${block.options.name || 'myVar'} = ${block.inputs.value || 'undefined'};
                    `
                },
                get: {
                    name: "Get Variable",
                    category: "variable",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "name", type: "text", default: "myVar" }
                    ],
                    template: (block) => `${block.options.name || 'myVar'}`
                },
                set: {
                    name: "Set Variable",
                    category: "variable",
                    inputs: ["value"],
                    outputs: [],
                    options: [
                        { name: "name", type: "text", default: "myVar" }
                    ],
                    template: (block) => `${block.options.name || 'myVar'} = ${block.inputs.value || 'undefined'};`
                }
            }
        },
        control: {
            name: "Control Flow",
            blocks: {
                loop: {
                    name: "For Loop",
                    category: "control",
                    inputs: ["iterations", "body"],
                    outputs: ["next"],
                    options: [
                        { name: "counter", type: "text", default: "i" }
                    ],
                    template: (block) => {
                        const iterations = block.inputs.iterations || '10';
                        const body = block.inputs.body || '// Loop body';
                        const counter = block.options.counter || 'i';
                        
                        return `for(let ${counter} = 0; ${counter} < ${iterations}; ${counter}++) {\n  ${body.split('\n').join('\n  ')}\n}`;
                    }
                },
                while: {
                    name: "While Loop",
                    category: "control",
                    inputs: ["condition", "body"],
                    outputs: ["next"],
                    template: (block) => {
                        const condition = block.inputs.condition || 'true';
                        const body = block.inputs.body || '// Loop body';
                        
                        return `while(${condition}) {\n  ${body.split('\n').join('\n  ')}\n}`;
                    }
                },
                ifStatement: {
                    name: "If Statement",
                    category: "control",
                    inputs: ["condition", "thenBody", "elseBody"],
                    outputs: ["next"],
                    template: (block) => {
                        const condition = block.inputs.condition || 'true';
                        const thenBlock = block.inputs.thenBody || '';
                        const elseBlock = block.inputs.elseBody || '';
                        
                        let code = `if (${condition}) {\n`;
                        if (thenBlock) {
                            code += `  ${thenBlock.split('\n').join('\n  ')}\n`;
                        }
                        code += `}`;
                        
                        if (elseBlock) {
                            code += ` else {\n  ${elseBlock.split('\n').join('\n  ')}\n}`;
                        }
                        
                        return code;
                    }
                },
                forLoop: {
                    name: "For Loop",
                    category: "control",
                    inputs: ["initialization", "condition", "increment", "body"],
                    outputs: ["next"],
                    options: [
                        { name: "style", type: "select", options: ["standard", "forEach"], default: "standard" }
                    ],
                    template: (block) => {
                        const style = block.options.style || 'standard';
                        const init = block.inputs.initialization || 'let i = 0';
                        const condition = block.inputs.condition || 'i < 10';
                        const increment = block.inputs.increment || 'i++';
                        const body = block.inputs.body || '// Loop body';
                        
                        if (style === 'forEach') {
                            return `${init}.forEach((item, index) => {\n  ${body.split('\n').join('\n  ')}\n})`;
                        } else {
                            return `for (${init}; ${condition}; ${increment}) {\n  ${body.split('\n').join('\n  ')}\n}`;
                        }
                    }
                },
                forEach: {
                    name: "For Each",
                    category: "control",
                    inputs: ["array"],
                    outputs: ["body"],
                    options: [
                        { name: "item", type: "text", default: "item" }
                    ],
                    template: (block) => `
                        ${block.inputs.array || '[]'}.forEach(${block.options.item || 'item'} => {
                            ${block.outputs.body || '// Loop body'}
                        });
                    `
                },
                switch: {
                    name: "Switch Statement",
                    category: "control",
                    inputs: ["value", "case1", "case2", "default"],
                    outputs: ["body1", "body2", "defaultBody"],
                    template: (block) => `
                        switch(${block.inputs.value || 'value'}) {
                            case ${block.inputs.case1 || '1'}:
                                ${block.outputs.body1 || '// Case 1'}
                                break;
                            case ${block.inputs.case2 || '2'}:
                                ${block.outputs.body2 || '// Case 2'}
                                break;
                            default:
                                ${block.outputs.defaultBody || '// Default case'}
                        }
                    `
                }
            }
        },
        functions: {
            name: "Functions",
            blocks: {
                declare: {
                    name: "Declare Function",
                    category: "function",
                    inputs: [],
                    outputs: ["body"],
                    options: [
                        { name: "name", type: "text", default: "myFunction" },
                        { name: "params", type: "text", default: "" }
                    ],
                    template: (block) => `
                        function ${block.options.name || 'myFunction'}(${block.options.params || ''}) {
                            ${block.outputs.body || '// Function body'}
                        }
                    `
                },
                call: {
                    name: "Call Function",
                    category: "function",
                    inputs: ["params"],
                    outputs: ["result"],
                    options: [
                        { name: "name", type: "text", default: "myFunction" }
                    ],
                    template: (block) => `${block.options.name || 'myFunction'}(${block.inputs.params || ''})`
                },
                return: {
                    name: "Return Statement",
                    category: "function",
                    inputs: ["value"],
                    outputs: [],
                    template: (block) => `return ${block.inputs.value || 'null'};`
                },
                arrow: {
                    name: "Arrow Function",
                    category: "function",
                    inputs: [],
                    outputs: ["body"],
                    options: [
                        { name: "params", type: "text", default: "" }
                    ],
                    template: (block) => `(${block.options.params || ''}) => {
                        ${block.outputs.body || '// Function body'}
                    }`
                }
            }
        },
        dom: {
            name: "DOM Manipulation",
            blocks: {
                querySelector: {
                    name: "Query Selector",
                    category: "dom",
                    inputs: ["selector"],
                    outputs: ["element"],
                    template: (block) => `document.querySelector(${block.inputs.selector || "'element'"})`
                },
                querySelectorAll: {
                    name: "Query Selector All",
                    category: "dom",
                    inputs: ["selector"],
                    outputs: ["elements"],
                    template: (block) => `document.querySelectorAll(${block.inputs.selector || "'elements'"})`
                },
                addEventListener: {
                    name: "Add Event Listener",
                    category: "dom",
                    inputs: ["element", "eventType"],
                    outputs: ["callback"],
                    template: (block) => `
                        ${block.inputs.element || 'element'}.addEventListener(${block.inputs.eventType || "'click'"}, (event) => {
                            ${block.outputs.callback || '// Event handler code'}
                        });
                    `
                },
                createElement: {
                    name: "Create Element",
                    category: "dom",
                    inputs: ["tag"],
                    outputs: ["element"],
                    template: (block) => `document.createElement(${block.inputs.tag || "'div'"})`
                },
                setAttribute: {
                    name: "Set Attribute",
                    category: "dom",
                    inputs: ["element", "name", "value"],
                    outputs: [],
                    template: (block) => `${block.inputs.element || 'element'}.setAttribute(${block.inputs.name || "'attr'"}, ${block.inputs.value || "'value'"});`
                },
                innerHTML: {
                    name: "Set Inner HTML",
                    category: "dom",
                    inputs: ["element", "content"],
                    outputs: [],
                    template: (block) => `${block.inputs.element || 'element'}.innerHTML = ${block.inputs.content || "'content'"};`
                },
                appendChild: {
                    name: "Append Child",
                    category: "dom",
                    inputs: ["parent", "child"],
                    outputs: [],
                    template: (block) => `${block.inputs.parent || 'parent'}.appendChild(${block.inputs.child || 'child'});`
                }
            }
        },
        utilities: {
            name: "Utilities",
            blocks: {
                consoleLog: {
                    name: "Console Log",
                    category: "utilities",
                    inputs: ["value"],
                    outputs: [],
                    template: (block) => `
                        console.log(${block.inputs.value || "''"});
                    `
                },
                consoleError: {
                    name: "Console Error",
                    category: "utilities",
                    inputs: ["value"],
                    outputs: [],
                    template: (block) => `console.error(${block.inputs.value || "''"});`
                },
                alert: {
                    name: "Alert",
                    category: "utilities",
                    inputs: ["message"],
                    options: [
                        { name: "Alert Text", type: "text", default: "Warning!!!" }
                    ],
                    outputs: [],
                    template: (block) => `
                        alert(${block.inputs.message || "''"});
                    `
                },
                confirm: {
                    name: "Confirm Dialog",
                    category: "utilities",
                    inputs: ["message"],
                    outputs: ["result"],
                    template: (block) => `confirm(${block.inputs.message || "'Are you sure?'"})`
                },
                prompt: {
                    name: "Prompt Dialog",
                    category: "utilities",
                    inputs: ["message", "default"],
                    outputs: ["result"],
                    template: (block) => `prompt(${block.inputs.message || "'Enter value:'"}, ${block.inputs.default || "''"})`
                },
                timer: {
                    name: "Create Timer",
                    category: "utilities",
                    inputs: ["delay"],
                    outputs: ["callback"],
                    options: [
                        { name: "type", type: "select", options: ["timeout", "interval"], default: "timeout" }
                    ],
                    template: (block) => {
                        const type = block.options.type === "interval" ? "setInterval" : "setTimeout";
                        return `${type}(() => {
                            ${block.outputs.callback || '// Timer callback'}
                        }, ${block.inputs.delay || '1000'});`;
                    }
                }
            }
        },
        data: {
            name: "Data",
            blocks: {
                jsonParse: {
                    name: "Parse JSON",
                    category: "data",
                    inputs: ["json"],
                    outputs: ["object"],
                    template: (block) => `
                        JSON.parse(${block.inputs.json || "'{}'"})
                    `
                },
                jsonStringify: {
                    name: "Stringify JSON",
                    category: "data",
                    inputs: ["object"],
                    outputs: ["json"],
                    template: (block) => `
                        JSON.stringify(${block.inputs.object || "{}"})
                    `
                },
                arrayMap: {
                    name: "Array Map",
                    category: "data",
                    inputs: ["array"],
                    outputs: ["result"],
                    options: [
                        { name: "itemName", type: "text", default: "item" }
                    ],
                    template: (block) => `
                        ${block.inputs.array || '[]'}.map(${block.options.itemName || 'item'} => {
                            return ${block.outputs.result || block.options.itemName || 'item'};
                        })
                    `
                },
                arrayFilter: {
                    name: "Array Filter",
                    category: "data",
                    inputs: ["array"],
                    outputs: ["condition"],
                    options: [
                        { name: "itemName", type: "text", default: "item" }
                    ],
                    template: (block) => `
                        ${block.inputs.array || '[]'}.filter(${block.options.itemName || 'item'} => {
                            return ${block.outputs.condition || 'true'};
                        })
                    `
                },
                arrayReduce: {
                    name: "Array Reduce",
                    category: "data",
                    inputs: ["array", "initialValue"],
                    outputs: ["reducer"],
                    options: [
                        { name: "accumulator", type: "text", default: "acc" },
                        { name: "currentValue", type: "text", default: "curr" }
                    ],
                    template: (block) => `
                        ${block.inputs.array || '[]'}.reduce((${block.options.accumulator || 'acc'}, ${block.options.currentValue || 'curr'}) => {
                            return ${block.outputs.reducer || block.options.accumulator || 'acc'};
                        }, ${block.inputs.initialValue || '0'})
                    `
                },
                objectKeys: {
                    name: "Object Keys",
                    category: "data",
                    inputs: ["object"],
                    outputs: ["keys"],
                    template: (block) => `Object.keys(${block.inputs.object || '{}'})`
                },
                objectValues: {
                    name: "Object Values",
                    category: "data",
                    inputs: ["object"],
                    outputs: ["values"],
                    template: (block) => `Object.values(${block.inputs.object || '{}'})`
                }
            }
        },
        async: {
            name: "Async",
            blocks: {
                fetch: {
                    name: "Fetch API",
                    category: "async",
                    inputs: ["url"],
                    outputs: ["response"],
                    template: (block) => `
                        fetch(${block.inputs.url || "'https://api.example.com'"})
                            .then(response => response.json())
                            .then(data => {
                                ${block.outputs.response || '// Handle response data'}
                            })
                            .catch(error => {
                                console.error('Error:', error);
                            });
                    `
                },
                setTimeout: {
                    name: "Set Timeout",
                    category: "async",
                    inputs: ["delay"],
                    outputs: ["callback"],
                    template: (block) => `
                        setTimeout(() => {
                            ${block.outputs.callback || '// Timeout callback'}
                        }, ${block.inputs.delay || '1000'});
                    `
                },
                promise: {
                    name: "Create Promise",
                    category: "async",
                    inputs: [],
                    outputs: ["resolve", "reject"],
                    template: (block) => `
                        new Promise((resolve, reject) => {
                            ${block.outputs.resolve || '// Resolve code'}
                            // If error:
                            ${block.outputs.reject || '// Reject code'}
                        })
                    `
                },
                asyncFunction: {
                    name: "Async Function",
                    category: "async",
                    inputs: [],
                    outputs: ["body"],
                    options: [
                        { name: "name", type: "text", default: "asyncFunction" },
                        { name: "params", type: "text", default: "" }
                    ],
                    template: (block) => `
                        async function ${block.options.name || 'asyncFunction'}(${block.options.params || ''}) {
                            ${block.outputs.body || '// Async function body'}
                        }
                    `
                },
                awaitExpression: {
                    name: "Await Expression",
                    category: "async",
                    inputs: ["promise"],
                    outputs: ["result"],
                    template: (block) => `
                        try {
                            const result = await ${block.inputs.promise || 'somePromise()'};
                            ${block.outputs.result || '// Use result'}
                        } catch (error) {
                            console.error('Error:', error);
                        }
                    `
                }
            }
        },
        storage: {
            name: "Storage",
            blocks: {
                localStorage: {
                    name: "Local Storage",
                    category: "storage",
                    inputs: ["key", "value"],
                    outputs: [],
                    options: [
                        { name: "operation", type: "select", options: ["get", "set", "remove"], default: "get" }
                    ],
                    template: (block) => {
                        const operation = block.options.operation || 'get';
                        if (operation === 'get') {
                            return `localStorage.getItem(${block.inputs.key || "'key'"})`;
                        } else if (operation === 'set') {
                            return `localStorage.setItem(${block.inputs.key || "'key'"}, ${block.inputs.value || "'value'"});`;
                        } else {
                            return `localStorage.removeItem(${block.inputs.key || "'key'"});`;
                        }
                    }
                },
                sessionStorage: {
                    name: "Session Storage",
                    category: "storage",
                    inputs: ["key", "value"],
                    outputs: [],
                    options: [
                        { name: "operation", type: "select", options: ["get", "set", "remove"], default: "get" }
                    ],
                    template: (block) => {
                        const operation = block.options.operation || 'get';
                        if (operation === 'get') {
                            return `sessionStorage.getItem(${block.inputs.key || "'key'"})`;
                        } else if (operation === 'set') {
                            return `sessionStorage.setItem(${block.inputs.key || "'key'"}, ${block.inputs.value || "'value'"});`;
                        } else {
                            return `sessionStorage.removeItem(${block.inputs.key || "'key'"});`;
                        }
                    }
                },
                cookie: {
                    name: "Cookie",
                    category: "storage",
                    inputs: ["name", "value", "days"],
                    outputs: [],
                    options: [
                        { name: "operation", type: "select", options: ["get", "set", "delete"], default: "get" }
                    ],
                    template: (block) => {
                        const operation = block.options.operation || 'get';
                        if (operation === 'get') {
                            return `
                                (function() {
                                    const name = ${block.inputs.name || "'cookieName'"} + "=";
                                    const decodedCookie = decodeURIComponent(document.cookie);
                                    const ca = decodedCookie.split(';');
                                    for(let i = 0; i < ca.length; i++) {
                                        let c = ca[i];
                                        while (c.charAt(0) == ' ') {
                                            c = c.substring(1);
                                        }
                                        if (c.indexOf(name) == 0) {
                                            return c.substring(name.length, c.length);
                                        }
                                    }
                                    return "";
                                })()
                            `;
                        } else if (operation === 'set') {
                            return `
                                (function() {
                                    const d = new Date();
                                    d.setTime(d.getTime() + (${block.inputs.days || '1'} * 24 * 60 * 60 * 1000));
                                    const expires = "expires="+ d.toUTCString();
                                    document.cookie = ${block.inputs.name || "'cookieName'"} + "=" + ${block.inputs.value || "'cookieValue'"} + ";" + expires + ";path=/";
                                })()
                            `;
                        } else {
                            return `
                                document.cookie = ${block.inputs.name || "'cookieName'"} + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                            `;
                        }
                    }
                }
            }
        },
        inputs: {
            name: "Inputs",
            blocks: {
                number: {
                    name: "Number",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "number", default: "0" }
                    ],
                    template: (block) => `${block.options.value || '0'}`
                },
                float: {
                    name: "Float",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "number", default: "0.0" }
                    ],
                    template: (block) => `${parseFloat(block.options.value) || 0.0}`
                },
                text: {
                    name: "Text",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "text", default: "text" }
                    ],
                    template: (block) => `"${block.options.value || ''}"`
                },
                string: {
                    name: "String",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "text", default: "" },
                        { name: "type", type: "select", options: ["double-quote", "single-quote", "backtick"], default: "double-quote" }
                    ],
                    template: (block) => {
                        const val = block.options.value || '';
                        switch(block.options.type) {
                            case 'single-quote': return `'${val}'`;
                            case 'backtick': return `\`${val}\``;
                            default: return `"${val}"`;
                        }
                    }
                },
                boolean: {
                    name: "Boolean",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "value", type: "select", options: ["true", "false"], default: "true" }
                    ],
                    template: (block) => `${block.options.value || 'true'}`
                },
                array: {
                    name: "Array",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "items", type: "text", default: "1,2,3" }
                    ],
                    template: (block) => {
                        const items = block.options.items || '';
                        return `[${items}]`;
                    }
                },
                object: {
                    name: "Object",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "json", type: "text", default: '{"key": "value"}' }
                    ],
                    template: (block) => {
                        try {
                            // Try to parse as JSON to validate
                            JSON.parse(block.options.json || '{}');
                            return block.options.json || '{}';
                        } catch (e) {
                            return '{}';
                        }
                    }
                },
                date: {
                    name: "Date",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "type", type: "select", options: ["now", "custom"], default: "now" },
                        { name: "dateString", type: "text", default: "2025-01-01" }
                    ],
                    template: (block) => {
                        if (block.options.type === 'now') {
                            return 'new Date()';
                        } else {
                            return `new Date("${block.options.dateString || ''}")`;
                        }
                    }
                },
                regexp: {
                    name: "Regular Expression",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    options: [
                        { name: "pattern", type: "text", default: "\\w+" },
                        { name: "flags", type: "text", default: "g" }
                    ],
                    template: (block) => `/${block.options.pattern || '\\w+'}/${block.options.flags || 'g'}`
                },
                null: {
                    name: "Null",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    template: (block) => `null`
                },
                undefined: {
                    name: "Undefined",
                    category: "inputs",
                    inputs: [],
                    outputs: ["value"],
                    template: (block) => `undefined`
                },
                template: {
                    name: "Template String",
                    category: "inputs",
                    inputs: ["expression"],
                    outputs: ["value"],
                    options: [
                        { name: "template", type: "text", default: "Hello ${name}!" }
                    ],
                    template: (block) => {
                        // Replace ${...} placeholders with actual inputs
                        const template = block.options.template || '';
                        if (block.inputs.expression) {
                            return `\`${template.replace(/\${.*?}/g, '${' + block.inputs.expression + '}')}\``;
                        } else {
                            return `\`${template}\``;
                        }
                    }
                }
            }
        }
    };
}