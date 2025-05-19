/**
 * Block library initialization for ScriptFlow
 * This file contains all the block definitions used in the ScriptFlow editor
 */

// Utility function to safely handle message inputs
function getSafeMessageInput(input, defaultValue = "''") {
    if (!input) return defaultValue;
    
    const trimmedInput = input.trim();
    
    // If it's already a string literal
    if ((trimmedInput.startsWith('"') && trimmedInput.endsWith('"')) || 
        (trimmedInput.startsWith("'") && trimmedInput.endsWith("'")) ||
        (trimmedInput.startsWith("`") && trimmedInput.endsWith("`"))) {
        return trimmedInput;
    }
    
    // If it's an if/loop statement, just return empty string
    if (/^(if|for|while|switch)\s*\(/.test(trimmedInput)) {
        return defaultValue;
    }
    
    // If it's a variable or expression with operators
    if (/^[\w$]+$/.test(trimmedInput) || 
        trimmedInput.includes('+') || 
        trimmedInput.includes('-') || 
        trimmedInput.includes('*') || 
        trimmedInput.includes('/') ||
        trimmedInput.includes('===') || 
        trimmedInput.includes('==')) {
        return trimmedInput;
    }
    
    // Default case - wrap in quotes if not already a complex expression
    return trimmedInput.includes('(') ? trimmedInput : `"${trimmedInput}"`;
}

function initializeBlockLibrary() {

    return {
        basics: {
            name: "Basics",
            blocks: {
                class: {
                    name: "class",
                    category: "basics",
                    inputs: ["in"],
                    outputs: ["out"],
                    options: [
                        { name: "name", type: "text", default: "MyClass" },
                        { name: "extends", type: "text", default: "" }
                    ],
                    template: (block) => {
                        const className = block.options.name || 'MyClass';
                        // Generate the class with proper indentation for methods
                        let classBody = block.childBlocksContent || '';
                        
                        // Wrap in class declaration
                        return `class ${className} {\n  ${classBody.split('\n').join('\n  ')}\n}`;
                    }
                },
                constructor: {
                    name: "constructor",
                    category: "basics",
                    inputs: ["in"],
                    outputs: ["out"],
                    options: [
                        { 
                            name: "parameters", 
                            type: "propertyList",
                            default: [],
                            addLabel: "Add Parameter", 
                            propertyTemplate: { name: "param", value: "" } 
                        }
                    ],
                    template: (block) => {
                        // Gather parameters and format them
                        const params = block.options.parameters ? 
                            block.options.parameters.map(p => p.name).join(', ') : '';
                            
                        // Get content for method body
                        const childContent = block.childBlocksContent || '// Constructor code';
                        
                        // Generate proper constructor - no "function" keyword
                        return `constructor(${params}) {\n    ${childContent.split('\n').join('\n    ')}\n  }`;
                    }
                },
                function: {
                    name: "function",
                    category: "basics",
                    inputs: ["in"],
                    outputs: ["out", "return"],
                    options: [
                        { name: "name", type: "text", default: "myCustomScript" },
                        { 
                            name: "parameters", 
                            type: "propertyList",
                            default: [{ name: "param1", value: "" }],
                            addLabel: "Add Parameter", 
                            propertyTemplate: { name: "newParam", value: "" } 
                        },
                    ],
                    template: (block) => {
                        // Gather parameters and format them
                        const params = block.options.parameters ? 
                            block.options.parameters.map(p => p.name).join(', ') : '';
                            
                        // Get content for method body
                        const childContent = block.childBlocksContent || '// Method code';
                        const name = block.options.name || 'myCustomScript';
                        
                        // Check if this is a class method
                        if (block.classMethod || block.isConnectedToClass) {
                            // Class method without "function" keyword
                            return `${name}(${params}) {\n    ${childContent.split('\n').join('\n    ')}\n  }`;
                        } else {
                            // Regular standalone function
                            return `function ${name}(${params}) {\n  ${childContent.split('\n').join('\n  ')}\n}`;
                        }
                    }
                },
                bridge: {
                    name: "bridge",
                    category: "basics",
                    inputs: ["in"],
                    outputs: ["out"],
                    options: [
                        { name: "comment", type: "text", default: "// This is a comment to explain the bridge" }
                    ],
                    template: (block) => {
                        // Simply output the content of any child blocks
                        const body = block.childBlocksContent || '// Bridge content';
                        return body;
                    }
                },
                getter: {
                    name: "getter",
                    category: "basics",
                    inputs: ["in"],
                    outputs: ["out", "return"],
                    options: [
                        { name: "name", type: "text", default: "myProperty" },
                        { name: "static", type: "select", options: ["false", "true"], default: "false" }
                    ],
                    template: (block) => {
                        const isStatic = block.options.static === "true" ? "static " : "";
                        const returnStmt = block.outputs.return || 'this._' + (block.options.name || 'myProperty');
                        
                        if (block.isConnectedToClass) {
                            return `  ${isStatic}get ${block.options.name || 'myProperty'}() {\n    return ${returnStmt};\n  }`;
                        } else {
                            return `${isStatic}get ${block.options.name || 'myProperty'}() {\n  return ${returnStmt};\n}`;
                        }
                    }
                },
                setter: {
                    name: "setter",
                    category: "basics",
                    inputs: ["in", "value"],
                    outputs: ["out"],
                    options: [
                        { name: "name", type: "text", default: "myProperty" },
                        { name: "static", type: "select", options: ["false", "true"], default: "false" }
                    ],
                    template: (block) => {
                        const isStatic = block.options.static === "true" ? "static " : "";
                        const value = block.inputs.value || 'value';
                        
                        if (block.isConnectedToClass) {
                            return `  ${isStatic}set ${block.options.name || 'myProperty'}(value) {\n    this._${block.options.name || 'myProperty'} = ${value};\n  }`;
                        } else {
                            return `${isStatic}set ${block.options.name || 'myProperty'}(value) {\n  this._${block.options.name || 'myProperty'} = ${value};\n}`;
                        }
                    }
                },
                statement: {
                    name: "statement",
                    category: "basics",
                    inputs: ["in", "expression"],
                    outputs: ["out"],
                    template: (block) => {
                        const expr = block.inputs.expression || '';
                        return `${expr};`;
                    }
                },
                commentBlock: {
                    name: "comment block",
                    category: "basics",
                    inputs: ["in"],
                    outputs: ["out"],
                    options: [
                        { name: "text", type: "multiline", default: "This is a multi-line comment" }
                    ],
                    template: (block) => {
                        const lines = (block.options.text || '').split('\n');
                        if (lines.length > 1) {
                            return `/*\n * ${lines.join('\n * ')}\n */`;
                        } else {
                            return `// ${block.options.text || ''}`;
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
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "value", type: "number", default: "0" }
                    ],
                    template: (block) => `${block.options.value || '0'}`
                },
                text: {
                    name: "Text",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "value", type: "text", default: "text" }
                    ],
                    template: (block) => `"${block.options.value || ''}"`
                },
                boolean: {
                    name: "Boolean",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "value", type: "select", options: ["true", "false"], default: "true" }
                    ],
                    template: (block) => `${block.options.value || 'true'}`
                },
                array: {
                    name: "Array",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
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
                    inputs: ["in"],
                    outputs: ["out", "value"],
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
                    inputs: ["in", "condition"],
                    outputs: ["out", "true", "false"],
                    template: (block) => {
                        // Get condition from input or a connected block
                        const condition = block.inputs.condition || 'true';
                        
                        // Get content for true branch
                        const trueBranch = block.outputs.true || '';
                        
                        // Get content for false branch if it exists
                        const falseBranch = block.outputs.false || '';
                        
                        let code = `if (${condition}) {\n`;
                        code += `  ${trueBranch.split('\n').join('\n  ')}\n`;
                        code += `}`;
                        
                        // Add else branch if present
                        if (falseBranch && falseBranch.trim()) {
                            code += ` else {\n  ${falseBranch.split('\n').join('\n  ')}\n}`;
                        }
                        
                        return code;
                    }
                },
                ternary: {
                    name: "Ternary Operator",
                    category: "logic",
                    inputs: ["in", "condition", "trueValue", "falseValue"],
                    outputs: ["out", "result"],
                    template: (block) => {
                        const condition = block.inputs.condition || 'true';
                        const trueValue = block.inputs.trueValue || "'true'";
                        const falseValue = block.inputs.falseValue || "'false'";
                        
                        return `(${condition} ? ${trueValue} : ${falseValue})`;
                    }
                },
                comparison: {
                    name: "Comparison",
                    category: "operators",
                    inputs: ["in", "leftOperand", "rightOperand"],
                    outputs: ["out", "result"],
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
                    inputs: ["in", "value1", "value2"],
                    outputs: ["out", "result"],
                    template: (block) => `(${block.inputs.value1 || 'true'} && ${block.inputs.value2 || 'true'})`
                },
                or: {
                    name: "OR",
                    category: "logic",
                    inputs: ["in", "value1", "value2"],
                    outputs: ["out", "result"],
                    template: (block) => `(${block.inputs.value1 || 'false'} || ${block.inputs.value2 || 'false'})`
                },
                not: {
                    name: "NOT",
                    category: "logic",
                    inputs: ["in", "value"],
                    outputs: ["out", "result"],
                    template: (block) => `!(${block.inputs.value || 'true'})`
                },
                arithmetic: {
                    name: "Arithmetic",
                    category: "operators",
                    inputs: ["in", "leftOperand", "rightOperand"],
                    outputs: ["out", "result"],
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
                    inputs: ["in", "leftOperand", "rightOperand"],
                    outputs: ["out", "result"],
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
                    inputs: ["in", "value1", "value2"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "operator", type: "select", options: ["+", "-", "*", "/", "%"] }
                    ],
                    template: (block) => `(${block.inputs.value1 || '0'} ${block.options.operator || '+'} ${block.inputs.value2 || '0'})`
                },
                random: {
                    name: "Random Number",
                    category: "math",
                    inputs: ["in", "min", "max"],
                    outputs: ["out", "result"],
                    template: (block) => `Math.floor(Math.random() * (${block.inputs.max || '100'} - ${block.inputs.min || '0'} + 1) + ${block.inputs.min || '0'})`
                },
                round: {
                    name: "Round Number",
                    category: "math",
                    inputs: ["in", "value"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "mode", type: "select", options: ["round", "floor", "ceil"], default: "round" }
                    ],
                    template: (block) => `Math.${block.options.mode || 'round'}(${block.inputs.value || '0'})`
                },
                mathFunction: {
                    name: "Math Function",
                    category: "math",
                    inputs: ["in", "value"],
                    outputs: ["out", "result"],
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
                    inputs: ["in", "value"],
                    outputs: ["out"],
                    options: [
                        { name: "name", type: "text", default: "myVar" },
                        { name: "type", type: "select", options: ["let", "const", "var"], default: "let" }
                    ],
                    template: (block) => `${block.options.type || 'let'} ${block.options.name || 'myVar'} = ${block.inputs.value || 'undefined'};`
                },
                get: {
                    name: "Get Variable",
                    category: "variable",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "name", type: "text", default: "myVar" }
                    ],
                    template: (block) => `${block.options.name || 'myVar'}`
                },
                set: {
                    name: "Set Variable",
                    category: "variable",
                    inputs: ["in", "value"],
                    outputs: ["out"],
                    options: [
                        { name: "name", type: "text", default: "myVar" }
                    ],
                    template: (block) => `${block.options.name || 'myVar'} = ${block.inputs.value || 'undefined'};`
                },
                increment: {
                    name: "Increment Variable",
                    category: "variable",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "name", type: "text", default: "myVar" },
                        { name: "type", type: "select", options: ["++", "--"], default: "++" },
                        { name: "position", type: "select", options: ["prefix", "postfix"], default: "postfix" }
                    ],
                    template: (block) => {
                        const name = block.options.name || 'myVar';
                        const type = block.options.type || '++';
                        const position = block.options.position || 'postfix';
                        
                        return position === 'prefix' ? `${type}${name}` : `${name}${type}`;
                    }
                }
            }
        },
        control: {
            name: "Control Flow",
            blocks: {
                loop: {
                    name: "For Loop",
                    category: "control",
                    inputs: ["in", "iterations"],
                    outputs: ["out"],
                    options: [
                        { name: "counter", type: "text", default: "i" }
                    ],
                    template: (block) => {
                        const iterations = block.inputs.iterations || '10';
                        const body = '// Child blocks go here';
                        const counter = block.options.counter || 'i';
                        
                        return `for(let ${counter} = 0; ${counter} < ${iterations}; ${counter}++) {\n  ${body}\n}`;
                    }
                },
                while: {
                    name: "While Loop",
                    category: "control",
                    inputs: ["in", "condition"],
                    outputs: ["out"],
                    template: (block) => {
                        const condition = block.inputs.condition || 'true';
                        const body = '// Child blocks go here';
                        
                        return `while(${condition}) {\n  ${body}\n}`;
                    }
                },
                doWhile: {
                    name: "Do-While Loop",
                    category: "control",
                    inputs: ["in", "condition"],
                    outputs: ["out"],
                    template: (block) => {
                        const condition = block.inputs.condition || 'true';
                        const body = '// Child blocks go here';
                        
                        return `do {\n  ${body}\n} while(${condition});`;
                    }
                },
                forIn: {
                    name: "For-In Loop",
                    category: "control",
                    inputs: ["in", "object"],
                    outputs: ["out"],
                    options: [
                        { name: "key", type: "text", default: "key" }
                    ],
                    template: (block) => {
                        const object = block.inputs.object || '{}';
                        const key = block.options.key || 'key';
                        const body = '// Child blocks go here';
                        
                        return `for(const ${key} in ${object}) {\n  ${body}\n}`;
                    }
                },
                forOf: {
                    name: "For-Of Loop",
                    category: "control",
                    inputs: ["in", "iterable"],
                    outputs: ["out"],
                    options: [
                        { name: "item", type: "text", default: "item" }
                    ],
                    template: (block) => {
                        const iterable = block.inputs.iterable || '[]';
                        const item = block.options.item || 'item';
                        const body = '// Child blocks go here';
                        
                        return `for(const ${item} of ${iterable}) {\n  ${body}\n}`;
                    }
                },
                advancedLoop: {    
                    name: "Advanced For Loop",
                    category: "control",
                    inputs: ["in", "initialization", "condition", "increment"],
                    outputs: ["out"],
                    options: [
                        { name: "style", type: "select", options: ["standard", "forEach"], default: "standard" }
                    ],
                    template: (block) => {
                        const style = block.options.style || 'standard';
                        const init = block.inputs.initialization || 'let i = 0';
                        const condition = block.inputs.condition || 'i < 10';
                        const increment = block.inputs.increment || 'i++';
                        const body = '// Child blocks go here';
                        
                        if (style === 'forEach') {
                            return `${init}.forEach((item, index) => {\n  ${body}\n})`;
                        } else {
                            return `for (${init}; ${condition}; ${increment}) {\n  ${body}\n}`;
                        }
                    }
                },
                forEach: {
                    name: "For Each",
                    category: "control",
                    inputs: ["in", "array"],
                    outputs: ["out"],
                    options: [
                        { name: "item", type: "text", default: "item" },
                        { name: "index", type: "text", default: "index" }
                    ],
                    template: (block) => {
                        const array = block.inputs.array || '[]';
                        const item = block.options.item || 'item';
                        const index = block.options.index || 'index';
                        const body = '// Child blocks go here';
                        
                        return `${array}.forEach((${item}, ${index}) => {\n  ${body}\n});`;
                    }
                },
                switch: {
                    name: "Switch Statement",
                    category: "control",
                    inputs: ["in", "value", "case1", "case2", "default"],
                    outputs: ["out", "body1", "body2", "defaultBody"],
                    template: (block) => {
                        const value = block.inputs.value || 'value';
                        const case1 = block.inputs.case1 || '1';
                        const case2 = block.inputs.case2 || '2';
                        const body1 = block.outputs.body1 || '// Case 1';
                        const body2 = block.outputs.body2 || '// Case 2';
                        const defaultBody = block.outputs.defaultBody || '// Default case';
                        
                        return `switch(${value}) {\n  case ${case1}:\n    ${body1.split('\n').join('\n    ')}\n    break;\n  case ${case2}:\n    ${body2.split('\n').join('\n    ')}\n    break;\n  default:\n    ${defaultBody.split('\n').join('\n    ')}\n}`;
                    }
                },
                break: {
                    name: "Break",
                    category: "control",
                    inputs: ["in"],
                    outputs: [],
                    template: (block) => `break;`
                },
                continue: {
                    name: "Continue",
                    category: "control",
                    inputs: ["in"],
                    outputs: [],
                    template: (block) => `continue;`
                },
                try: {
                    name: "Try-Catch",
                    category: "control",
                    inputs: ["in"],
                    outputs: ["out", "catchBlock", "finallyBlock"],
                    options: [
                        { name: "errorVar", type: "text", default: "error" }
                    ],
                    template: (block) => {
                        const tryBlock = '// Child blocks go here';
                        const catchBlock = block.outputs.catchBlock || '// Catch block';
                        const finallyBlock = block.outputs.finallyBlock;
                        const errorVar = block.options.errorVar || 'error';
                        
                        let code = `try {\n  ${tryBlock}\n} catch(${errorVar}) {\n  ${catchBlock.split('\n').join('\n  ')}\n}`;
                        
                        if (finallyBlock) {
                            code += ` finally {\n  ${finallyBlock.split('\n').join('\n  ')}\n}`;
                        }
                        
                        return code;
                    }
                },
                throw: {
                    name: "Throw Exception",
                    category: "control",
                    inputs: ["in", "error"],
                    outputs: [],
                    template: (block) => `throw ${block.inputs.error || 'new Error("Exception occurred")'};`
                }
            }
        },
        functions: {
            name: "Functions",
            blocks: {
                declare: {
                    name: "Declare Function",
                    category: "function",
                    inputs: ["in"],
                    outputs: ["out"],
                    options: [
                        { name: "name", type: "text", default: "myFunction" },
                        { name: "params", type: "text", default: "" }
                    ],
                    template: (block) => {
                        const name = block.options.name || 'myFunction';
                        const params = block.options.params || '';
                        const body = '// Child blocks go here';
                        
                        return `function ${name}(${params}) {\n  ${body}\n}`;
                    }
                },
                call: {
                    name: "Call Function",
                    category: "function",
                    inputs: ["in", "params"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "name", type: "text", default: "myFunction" }
                    ],
                    template: (block) => `${block.options.name || 'myFunction'}(${block.inputs.params || ''})`
                },
                return: {
                    name: "Return Statement",
                    category: "function",
                    inputs: ["in", "value"],
                    outputs: [],
                    template: (block) => `return ${block.inputs.value || 'null'};`
                },
                arrow: {
                    name: "Arrow Function",
                    category: "function",
                    inputs: ["in"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "params", type: "text", default: "" },
                        { name: "concise", type: "select", options: ["false", "true"], default: "false" }
                    ],
                    template: (block) => {
                        const params = block.options.params || '';
                        const body = '// Child blocks go here';
                        const isConcise = block.options.concise === "true";
                        
                        if (isConcise) {
                            return `(${params}) => ${body}`;
                        } else {
                            return `(${params}) => {\n  ${body}\n}`;
                        }
                    }
                },
                callback: {
                    name: "Callback Function",
                    category: "function",
                    inputs: ["in"],
                    outputs: ["out"],
                    options: [
                        { name: "params", type: "text", default: "" },
                        { name: "arrow", type: "select", options: ["true", "false"], default: "true" }
                    ],
                    template: (block) => {
                        const params = block.options.params || '';
                        const body = '// Child blocks go here';
                        const isArrow = block.options.arrow === "true";
                        
                        if (isArrow) {
                            return `(${params}) => {\n  ${body}\n}`;
                        } else {
                            return `function(${params}) {\n  ${body}\n}`;
                        }
                    }
                }
            }
        },
        dom: {
            name: "DOM Manipulation",
            blocks: {
                querySelector: {
                    name: "Query Selector",
                    category: "dom",
                    inputs: ["in", "selector"],
                    outputs: ["out", "element"],
                    template: (block) => `document.querySelector(${block.inputs.selector || "'element'"})`
                },
                querySelectorAll: {
                    name: "Query Selector All",
                    category: "dom",
                    inputs: ["in", "selector"],
                    outputs: ["out", "elements"],
                    template: (block) => `document.querySelectorAll(${block.inputs.selector || "'elements'"})`
                },
                getElementById: {
                    name: "Get Element By ID",
                    category: "dom",
                    inputs: ["in", "id"],
                    outputs: ["out", "element"],
                    template: (block) => `document.getElementById(${block.inputs.id || "'elementId'"})`
                },
                getElementsByClassName: {
                    name: "Get Elements By Class",
                    category: "dom",
                    inputs: ["in", "className"],
                    outputs: ["out", "elements"],
                    template: (block) => `document.getElementsByClassName(${block.inputs.className || "'className'"})`
                },
                addEventListener: {
                    name: "Add Event Listener",
                    category: "dom",
                    inputs: ["in", "element", "eventType", "callback"],
                    outputs: ["out"],
                    template: (block) => {
                        const element = block.inputs.element || 'element';
                        const eventType = block.inputs.eventType || "'click'";
                        const callback = block.inputs.callback || 'event => { // Handle event }';
                        
                        return `${element}.addEventListener(${eventType}, ${callback});`;
                    }
                },
                createElement: {
                    name: "Create Element",
                    category: "dom",
                    inputs: ["in", "tag"],
                    outputs: ["out", "element"],
                    template: (block) => `document.createElement(${block.inputs.tag || "'div'"})`
                },
                setAttribute: {
                    name: "Set Attribute",
                    category: "dom",
                    inputs: ["in", "element", "name", "value"],
                    outputs: ["out"],
                    template: (block) => `${block.inputs.element || 'element'}.setAttribute(${block.inputs.name || "'attr'"}, ${block.inputs.value || "'value'"});`
                },
                innerHTML: {
                    name: "Set Inner HTML",
                    category: "dom",
                    inputs: ["in", "element", "content"],
                    outputs: ["out"],
                    template: (block) => `${block.inputs.element || 'element'}.innerHTML = ${block.inputs.content || "'content'"};`
                },
                textContent: {
                    name: "Set Text Content",
                    category: "dom",
                    inputs: ["in", "element", "content"],
                    outputs: ["out"],
                    template: (block) => `${block.inputs.element || 'element'}.textContent = ${block.inputs.content || "'content'"};`
                },
                appendChild: {
                    name: "Append Child",
                    category: "dom",
                    inputs: ["in", "parent", "child"],
                    outputs: ["out"],
                    template: (block) => `${block.inputs.parent || 'parent'}.appendChild(${block.inputs.child || 'child'});`
                },
                removeChild: {
                    name: "Remove Child",
                    category: "dom",
                    inputs: ["in", "parent", "child"],
                    outputs: ["out"],
                    template: (block) => `${block.inputs.parent || 'parent'}.removeChild(${block.inputs.child || 'child'});`
                },
                style: {
                    name: "Set Style",
                    category: "dom",
                    inputs: ["in", "element", "value"],
                    outputs: ["out"],
                    options: [
                        { name: "property", type: "text", default: "backgroundColor" }
                    ],
                    template: (block) => `${block.inputs.element || 'element'}.style.${block.options.property || 'backgroundColor'} = ${block.inputs.value || "'value'"};`
                }
            }
        },
        utilities: {
            name: "Utilities",
            blocks: {
                consoleLog: {
                    name: "Console Log",
                    category: "utilities",
                    inputs: ["in", "message"],
                    outputs: ["out"],
                    options: [
                        { name: "label", type: "text", default: "" }
                    ],
                    template: (block) => {
                        // Get message input safely
                        let message = getSafeMessageInput(block.inputs.message);
                        
                        // Add label if provided
                        const label = block.options.label ? 
                            (block.options.label + ': ') : '';
                        
                        if (label) {
                            return `console.log("${label}", ${message});`;
                        } else {
                            return `console.log(${message});`;
                        }
                    }
                },
                consoleError: {
                    name: "Console Error",
                    category: "utilities",
                    inputs: ["in", "message"],
                    outputs: ["out"],
                    options: [
                        { name: "label", type: "text", default: "" }
                    ],
                    template: (block) => {
                        // Get message input safely
                        let message = getSafeMessageInput(block.inputs.message);
                        
                        // Add label if provided
                        const label = block.options.label ? 
                            (block.options.label + ': ') : '';
                        
                        if (label) {
                            return `console.error("${label}", ${message});`;
                        } else {
                            return `console.error(${message});`;
                        }
                    }
                },
                consoleWarn: {
                    name: "Console Warning",
                    category: "utilities",
                    inputs: ["in", "message"],
                    outputs: ["out"],
                    options: [
                        { name: "label", type: "text", default: "" }
                    ],
                    template: (block) => {
                        // Get message input safely
                        let message = getSafeMessageInput(block.inputs.message);
                        
                        // Add label if provided
                        const label = block.options.label ? 
                            (block.options.label + ': ') : '';
                        
                        if (label) {
                            return `console.warn("${label}", ${message});`;
                        } else {
                            return `console.warn(${message});`;
                        }
                    }
                },
                consoleInfo: {
                    name: "Console Info",
                    category: "utilities", 
                    inputs: ["in", "message"],
                    outputs: ["out"],
                    options: [
                        { name: "label", type: "text", default: "" }
                    ],
                    template: (block) => {
                        // Get message input safely
                        let message = getSafeMessageInput(block.inputs.message);
                        
                        // Add label if provided
                        const label = block.options.label ? 
                            (block.options.label + ': ') : '';
                        
                        if (label) {
                            return `console.info("${label}", ${message});`;
                        } else {
                            return `console.info(${message});`;
                        }
                    }
                },
                alert: {
                    name: "Alert",
                    category: "utilities",
                    inputs: ["in", "message"],
                    outputs: ["out"],
                    template: (block) => {
                        // Get message input safely
                        let message = getSafeMessageInput(block.inputs.message);
                        return `alert(${message});`;
                    }
                },
                // Message block (for use with alerts, console.log, etc.)
                message: {
                    name: "Message",
                    category: "inputs",
                    outputs: ["value"],
                    options: [
                        { name: "text", type: "text", default: "Hello World" },
                        { name: "type", type: "select", options: ["double-quote", "single-quote", "backtick"], default: "double-quote" }
                    ],
                    template: (block) => {
                        const text = block.options.text || '';
                        // Escape quotes based on selected quote type
                        const escapedText = text
                            .replace(/\\/g, '\\\\')
                            .replace(/"/g, '\\"')
                            .replace(/'/g, "\\'");
                            
                        switch(block.options.type) {
                            case 'single-quote': return `'${escapedText}'`;
                            case 'backtick': return `\`${escapedText}\``;
                            default: return `"${escapedText}"`;
                        }
                    }
                },
                confirm: {
                    name: "Confirm Dialog",
                    category: "utilities",
                    inputs: ["in", "message"],
                    outputs: ["out", "result"],
                    template: (block) => {
                        // Get message input safely
                        let message = getSafeMessageInput(block.inputs.message, "'Are you sure?'");
                        return `confirm(${message})`;
                    }
                },
                prompt: {
                    name: "Prompt Dialog",
                    category: "utilities",
                    inputs: ["in", "message", "default"],
                    outputs: ["out", "result"],
                    template: (block) => {
                        // Get message input safely
                        let message = getSafeMessageInput(block.inputs.message, "'Enter value:'");
                        let defaultValue = getSafeMessageInput(block.inputs.default, "''");
                        return `prompt(${message}, ${defaultValue})`;
                    }
                },
                timer: {
                    name: "Create Timer",
                    category: "utilities",
                    inputs: ["in", "delay", "callback"],
                    outputs: ["out", "timerId"],
                    options: [
                        { name: "type", type: "select", options: ["timeout", "interval"], default: "timeout" }
                    ],
                    template: (block) => {
                        const type = block.options.type === "interval" ? "setInterval" : "setTimeout";
                        const delay = block.inputs.delay || '1000';
                        const callback = block.inputs.callback || '() => { /* Timer callback */ }';
                        
                        return `${type}(${callback}, ${delay})`;
                    }
                },
                clearTimer: {
                    name: "Clear Timer",
                    category: "utilities",
                    inputs: ["in", "timerId"],
                    outputs: ["out"],
                    options: [
                        { name: "type", type: "select", options: ["timeout", "interval"], default: "timeout" }
                    ],
                    template: (block) => {
                        const type = block.options.type === "interval" ? "clearInterval" : "clearTimeout";
                        return `${type}(${block.inputs.timerId || 'timerId'});`;
                    }
                },
                formattedLog: {
                    name: "Formatted Log",
                    category: "utilities",
                    inputs: ["in", "template", "var1", "var2", "var3"],
                    outputs: ["out"],
                    options: [
                        { name: "type", type: "select", options: ["log", "info", "warn", "error"], default: "log" }
                    ],
                    template: (block) => {
                        let template = getSafeMessageInput(block.inputs.template, "'%s'");
                        
                        // Create array of arguments
                        const args = [];
                        
                        if (block.inputs.var1) args.push(block.inputs.var1);
                        if (block.inputs.var2) args.push(block.inputs.var2);
                        if (block.inputs.var3) args.push(block.inputs.var3);
                        
                        const argsList = args.length > 0 ? 
                            `, ${args.join(', ')}` : '';
                        
                        return `console.${block.options.type}(${template}${argsList});`;
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
                    inputs: ["in", "json"],
                    outputs: ["out", "object"],
                    template: (block) => `JSON.parse(${block.inputs.json || "'{}'"})` 
                },
                jsonStringify: {
                    name: "Stringify JSON",
                    category: "data",
                    inputs: ["in", "object"],
                    outputs: ["out", "json"],
                    options: [
                        { name: "pretty", type: "select", options: ["false", "true"], default: "false" }
                    ],
                    template: (block) => {
                        const object = block.inputs.object || "{}";
                        const pretty = block.options.pretty === "true" ? ", null, 2" : "";
                        return `JSON.stringify(${object}${pretty})`;
                    }
                },
                arrayMap: {
                    name: "Array Map",
                    category: "data",
                    inputs: ["in", "array"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "itemName", type: "text", default: "item" },
                        { name: "indexName", type: "text", default: "index" }
                    ],
                    template: (block) => {
                        const array = block.inputs.array || '[]';
                        const itemName = block.options.itemName || 'item';
                        const indexName = block.options.indexName || 'index';
                        const result = block.outputs.result || itemName;
                        
                        return `${array}.map((${itemName}, ${indexName}) => {\n  return ${result};\n})`;
                    }
                },
                arrayFilter: {
                    name: "Array Filter",
                    category: "data",
                    inputs: ["in", "array"],
                    outputs: ["out", "condition"],
                    options: [
                        { name: "itemName", type: "text", default: "item" },
                        { name: "indexName", type: "text", default: "index" }
                    ],
                    template: (block) => {
                        const array = block.inputs.array || '[]';
                        const itemName = block.options.itemName || 'item';
                        const indexName = block.options.indexName || 'index';
                        const condition = block.outputs.condition || 'true';
                        
                        return `${array}.filter((${itemName}, ${indexName}) => {\n  return ${condition};\n})`;
                    }
                },
                arrayReduce: {
                    name: "Array Reduce",
                    category: "data",
                    inputs: ["in", "array", "initialValue"],
                    outputs: ["out", "reducer"],
                    options: [
                        { name: "accumulator", type: "text", default: "acc" },
                        { name: "currentValue", type: "text", default: "curr" },
                        { name: "indexName", type: "text", default: "index" }
                    ],
                    template: (block) => {
                        const array = block.inputs.array || '[]';
                        const acc = block.options.accumulator || 'acc';
                        const curr = block.options.currentValue || 'curr';
                        const idx = block.options.indexName || 'index';
                        const reducer = block.outputs.reducer || acc;
                        const initial = block.inputs.initialValue || '0';
                        
                        return `${array}.reduce((${acc}, ${curr}, ${idx}) => {\n  return ${reducer};\n}, ${initial})`;
                    }
                },
                arrayFind: {
                    name: "Array Find",
                    category: "data",
                    inputs: ["in", "array"],
                    outputs: ["out", "condition"],
                    options: [
                        { name: "itemName", type: "text", default: "item" }
                    ],
                    template: (block) => {
                        const array = block.inputs.array || '[]';
                        const itemName = block.options.itemName || 'item';
                        const condition = block.outputs.condition || 'true';
                        
                        return `${array}.find(${itemName} => {\n  return ${condition};\n})`;
                    }
                },
                objectKeys: {
                    name: "Object Keys",
                    category: "data",
                    inputs: ["in", "object"],
                    outputs: ["out", "keys"],
                    template: (block) => `Object.keys(${block.inputs.object || '{}'})`
                },
                objectValues: {
                    name: "Object Values",
                    category: "data",
                    inputs: ["in", "object"],
                    outputs: ["out", "values"],
                    template: (block) => `Object.values(${block.inputs.object || '{}'})`
                },
                objectEntries: {
                    name: "Object Entries",
                    category: "data",
                    inputs: ["in", "object"],
                    outputs: ["out", "entries"],
                    template: (block) => `Object.entries(${block.inputs.object || '{}'})`
                },
                objectFromEntries: {
                    name: "Object From Entries",
                    category: "data",
                    inputs: ["in", "entries"],
                    outputs: ["out", "object"],
                    template: (block) => `Object.fromEntries(${block.inputs.entries || '[]'})`
                },
                arraySort: {
                    name: "Array Sort",
                    category: "data",
                    inputs: ["in", "array", "compareFn"],
                    outputs: ["out", "result"],
                    template: (block) => {
                        const array = block.inputs.array || '[]';
                        const compareFn = block.inputs.compareFn;
                        
                        if (compareFn) {
                            return `${array}.sort(${compareFn})`;
                        } else {
                            return `${array}.sort()`;
                        }
                    }
                }
            }
        },
        async: {
            name: "Async",
            blocks: {
                fetch: {
                    name: "Fetch API",
                    category: "async",
                    inputs: ["in", "url", "options"],
                    outputs: ["out", "response", "error"],
                    template: (block) => {
                        const url = block.inputs.url || "'https://api.example.com'";
                        const options = block.inputs.options;
                        const responseHandler = block.outputs.response || '// Handle response data';
                        const errorHandler = block.outputs.error || 'console.error("Error:", error)';
                        
                        return `fetch(${url}${options ? ', ' + options : ''})
  .then(response => response.json())
  .then(data => {
    ${responseHandler}
  })
  .catch(error => {
    ${errorHandler}
  });`;
                    }
                },
                setTimeout: {
                    name: "Set Timeout",
                    category: "async",
                    inputs: ["in", "delay"],
                    outputs: ["out", "callback"],
                    template: (block) => {
                        const delay = block.inputs.delay || '1000';
                        const callback = block.outputs.callback || '// Timeout callback';
                        
                        return `setTimeout(() => {\n  ${callback}\n}, ${delay});`;
                    }
                },
                promise: {
                    name: "Create Promise",
                    category: "async",
                    inputs: ["in"],
                    outputs: ["out", "resolve", "reject"],
                    template: (block) => {
                        const resolve = block.outputs.resolve || '// Resolve code';
                        const reject = block.outputs.reject || '// Reject code';
                        
                        return `new Promise((resolve, reject) => {\n  ${resolve}\n  // If error:\n  ${reject}\n})`;
                    }
                },
                promiseThen: {
                    name: "Promise Then",
                    category: "async",
                    inputs: ["in", "promise"],
                    outputs: ["out", "result", "error"],
                    template: (block) => {
                        const promise = block.inputs.promise || 'somePromise()';
                        const result = block.outputs.result || '// Handle result';
                        const error = block.outputs.error || '// Handle error';
                        
                        return `${promise}.then(result => {\n  ${result}\n}).catch(error => {\n  ${error}\n})`;
                    }
                },
                asyncFunction: {
                    name: "Async Function",
                    category: "async",
                    inputs: ["in"],
                    outputs: ["out"],
                    options: [
                        { name: "name", type: "text", default: "asyncFunction" },
                        { name: "params", type: "text", default: "" }
                    ],
                    template: (block) => {
                        const name = block.options.name || 'asyncFunction';
                        const params = block.options.params || '';
                        const body = '// Child blocks go here';
                        
                        return `async function ${name}(${params}) {\n  ${body}\n}`;
                    }
                },
                awaitExpression: {
                    name: "Await Expression",
                    category: "async",
                    inputs: ["in", "promise"],
                    outputs: ["out", "result"],
                    template: (block) => {
                        const promise = block.inputs.promise || 'somePromise()';
                        const result = block.outputs.result || '// Use result';
                        
                        return `try {\n  const result = await ${promise};\n  ${result}\n} catch (error) {\n  console.error('Error:', error);\n}`;
                    }
                }
            }
        },
        storage: {
            name: "Storage",
            blocks: {
                localStorage: {
                    name: "Local Storage",
                    category: "storage",
                    inputs: ["in", "key", "value"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "operation", type: "select", options: ["get", "set", "remove"], default: "get" }
                    ],
                    template: (block) => {
                        const operation = block.options.operation || 'get';
                        const key = block.inputs.key || "'key'";
                        
                        if (operation === 'get') {
                            return `localStorage.getItem(${key})`;
                        } else if (operation === 'set') {
                            const value = block.inputs.value || "'value'";
                            return `localStorage.setItem(${key}, ${value});`;
                        } else {
                            return `localStorage.removeItem(${key});`;
                        }
                    }
                },
                sessionStorage: {
                    name: "Session Storage",
                    category: "storage",
                    inputs: ["in", "key", "value"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "operation", type: "select", options: ["get", "set", "remove"], default: "get" }
                    ],
                    template: (block) => {
                        const operation = block.options.operation || 'get';
                        const key = block.inputs.key || "'key'";
                        
                        if (operation === 'get') {
                            return `sessionStorage.getItem(${key})`;
                        } else if (operation === 'set') {
                            const value = block.inputs.value || "'value'";
                            return `sessionStorage.setItem(${key}, ${value});`;
                        } else {
                            return `sessionStorage.removeItem(${key});`;
                        }
                    }
                },
                cookie: {
                    name: "Cookie",
                    category: "storage",
                    inputs: ["in", "name", "value", "days"],
                    outputs: ["out", "result"],
                    options: [
                        { name: "operation", type: "select", options: ["get", "set", "delete"], default: "get" }
                    ],
                    template: (block) => {
                        const operation = block.options.operation || 'get';
                        const name = block.inputs.name || "'cookieName'";
                        
                        if (operation === 'get') {
                            return `(function() {
  const name = ${name} + "=";
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
})()`;
                        } else if (operation === 'set') {
                            const value = block.inputs.value || "'cookieValue'";
                            const days = block.inputs.days || '1';
                            return `(function() {
  const d = new Date();
  d.setTime(d.getTime() + (${days} * 24 * 60 * 60 * 1000));
  const expires = "expires="+ d.toUTCString();
  document.cookie = ${name} + "=" + ${value} + ";" + expires + ";path=/";
})()`;
                        } else {
                            return `document.cookie = ${name} + "=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";`;
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
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "value", type: "number", default: "0" }
                    ],
                    template: (block) => `${block.options.value || '0'}`
                },
                float: {
                    name: "Float",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "value", type: "number", default: "0.0" }
                    ],
                    template: (block) => `${parseFloat(block.options.value) || 0.0}`
                },
                text: {
                    name: "Text",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "value", type: "text", default: "text" }
                    ],
                    template: (block) => `"${block.options.value || ''}"`
                },
                // Multiline text block
                multilineText: {
                    name: "Multiline Text",
                    category: "inputs",
                    outputs: ["value"],
                    options: [
                        { name: "text", type: "multiline", default: "Line 1\nLine 2\nLine 3" },
                        { name: "type", type: "select", options: ["backtick", "double-quote", "single-quote"], default: "backtick" }
                    ],
                    template: (block) => {
                        const text = block.options.text || '';
                        
                        // Different handling for different quote types
                        switch(block.options.type) {
                            case 'single-quote':
                                // Join with escaped newlines for single quotes
                                return "'" + text.split('\n').join("\\n' + \n'") + "'";
                            case 'double-quote':
                                // Join with escaped newlines for double quotes
                                return '"' + text.split('\n').join('\\n" + \n"') + '"';
                            case 'backtick':
                                // Use template literals for clean multiline
                                return `\`${text}\``;
                            default:
                                return `\`${text}\``;
                        }
                    }
                },
                // Code snippet block (using CodeMirror)
                codeSnippet: {
                    name: "Code Snippet",
                    category: "inputs",
                    outputs: ["value"],
                    options: [
                        { name: "code", type: "code", default: "// Write JavaScript code here\nreturn 42;" }
                    ],
                    template: (block) => {
                        const code = block.options.code || '// Empty code snippet';
                        // For code that should be represented as a string
                        return `\`${code.replace(/`/g, '\\`')}\``;
                    }
                },
                string: {
                    name: "String",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
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
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "value", type: "select", options: ["true", "false"], default: "true" }
                    ],
                    template: (block) => `${block.options.value || 'true'}`
                },
                array: {
                    name: "Array",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
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
                    inputs: ["in"],
                    outputs: ["out", "value"],
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
                    inputs: ["in"],
                    outputs: ["out", "value"],
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
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    options: [
                        { name: "pattern", type: "text", default: "\\w+" },
                        { name: "flags", type: "text", default: "g" }
                    ],
                    template: (block) => `/${block.options.pattern || '\\w+'}/${block.options.flags || 'g'}`
                },
                null: {
                    name: "Null",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    template: (block) => `null`
                },
                undefined: {
                    name: "Undefined",
                    category: "inputs",
                    inputs: ["in"],
                    outputs: ["out", "value"],
                    template: (block) => `undefined`
                },
                templateString: {
                    name: "Template String",
                    category: "inputs",
                    outputs: ["value"],
                    inputs: ["var1", "var2", "var3"],
                    options: [
                        { name: "template", type: "multiline", default: "Hello, ${var1}!\nWelcome to ${var2}.\nYour ID is: ${var3}" }
                    ],
                    template: (block) => {
                        const template = block.options.template || '';
                        
                        // Process template by replacing placeholders with connected values
                        let processedTemplate = template;
                        
                        // Replace any connected variables
                        if (block.inputs.var1) {
                            processedTemplate = processedTemplate.replace(/\${var1}/g, '${' + block.inputs.var1 + '}');
                        }
                        if (block.inputs.var2) {
                            processedTemplate = processedTemplate.replace(/\${var2}/g, '${' + block.inputs.var2 + '}');
                        }
                        if (block.inputs.var3) {
                            processedTemplate = processedTemplate.replace(/\${var3}/g, '${' + block.inputs.var3 + '}');
                        }
                        
                        // Return the template string
                        return `\`${processedTemplate}\``;
                    }
                }
            }
        }
    };
}