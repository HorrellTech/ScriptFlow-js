# ScriptFlow

ScriptFlow is a visual JavaScript scripting tool that allows users to create JavaScript functionalities using an intuitive drag-and-drop interface.

## Features

- Visual block-based programming interface
- Drag-and-drop functionality
- Built-in JavaScript function blocks
- Easy integration into any webpage
- Export generated JavaScript code
- Extensible block system

## Getting Started

### Installation

1. Include the ScriptFlow CSS and JavaScript files in your HTML:

```html
<link rel="stylesheet" href="css/scriptflow.css">
<script src="js/scriptflow.js"></script>
```

2. Initialize ScriptFlow and set up a callback function for the generated code:

```javascript
const scriptFlow = new ScriptFlow({
    onCodeGenerated: (code) => {
        // Do something with the generated code
        console.log(code);
    }
});
```

3. Add a button to open the ScriptFlow editor:

```html
<button onclick="openScriptFlowModal()">Open ScriptFlow Editor</button>
```

## Usage

1. Click the button to open the ScriptFlow editor.
2. Drag function blocks from the palette on the left to the canvas.
3. Connect blocks by dragging from output connectors to input connectors.
4. Configure block properties by modifying the input fields within each block.
5. Click "Generate Code" to create JavaScript code from your visual script.
6. Click "Export Code" to download the JavaScript file.

## Extending ScriptFlow

### Adding Custom Blocks

You can extend ScriptFlow with your own custom blocks by adding them to the block library:

```javascript
// Get a reference to the ScriptFlow instance
const scriptFlow = window.scriptFlow;

// Add a new category
scriptFlow.blockLibrary.myCategory = {
    name: "My Custom Blocks",
    blocks: {
        myBlock: {
            name: "My Custom Block",
            category: "myCategory",
            inputs: ["input1", "input2"],
            outputs: ["output1"],
            options: [
                { name: "option1", type: "text", default: "default value" },
                { name: "option2", type: "select", options: ["option1", "option2"] }
            ],
            template: (block) => `
                // Custom JavaScript code template
                const result = customFunction(
                    ${block.inputs.input1 || 'undefined'}, 
                    ${block.inputs.input2 || 'undefined'},
                    ${block.options.option1 || 'default value'}
                );
                return result;
            `
        }
    }
};

// Re-render the palette to show the new blocks
scriptFlow.renderPalette();
```

### Block Template Properties

When creating custom blocks, you can define the following properties:

- `name`: Display name for the block
- `category`: Category the block belongs to
- `inputs`: Array of input connector names
- `outputs`: Array of output connector names
- `options`: Array of configurable options for the block
- `template`: Function that returns JavaScript code template

## Block Categories

ScriptFlow comes with the following built-in block categories:

- **Logic**: Conditional statements and comparisons
- **Math**: Arithmetic operations and math functions
- **Variables**: Variable declaration and manipulation
- **Control Flow**: Loops and flow control
- **Functions**: Function declaration and calling
- **DOM**: Document Object Model manipulation

## License

MIT License
