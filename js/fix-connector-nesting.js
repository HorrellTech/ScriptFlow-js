/**
 * Fix for block nesting in ScriptFlow
 * Ensures that blocks connected by out->in connectors are properly nested
 */

(function() {
  // Wait for ScriptFlow to be fully initialized
  const ensureScriptFlowReady = (callback) => {
    if (window.scriptFlow && window.scriptFlow.initialized) {
      callback(window.scriptFlow);
    } else {
      setTimeout(() => ensureScriptFlowReady(callback), 100);
    }
  };

  ensureScriptFlowReady((sf) => {
    console.log("Applying nesting fix to ScriptFlow...");

    // Save reference to the original template processor
    const originalProcessTemplate = sf.processTemplate;

    // Override the template processor to properly handle child content
    sf.processTemplate = function(template, block) {
      // First, ensure the template has a placeholder for child content
      if (!template.includes('{{childBlocksContent}}') && 
          block.type !== 'log' && 
          block.type !== 'console' &&
          block.type !== 'var' &&
          block.type !== 'const' &&
          block.type !== 'let' &&
          block.type !== 'return' &&
          block.hasOwnProperty('childBlocksContent') && 
          block.childBlocksContent) {
        
        // For blocks that should have content inside braces
        if (template.includes('{') && template.includes('}')) {
          // Find the last closing brace and insert content before it
          const lastCloseBrace = template.lastIndexOf('}');
          if (lastCloseBrace !== -1) {
            template = template.substring(0, lastCloseBrace) + 
                      '\n  {{childBlocksContent}}\n' + 
                      template.substring(lastCloseBrace);
          }
        } 
        // For blocks that end with a semicolon
        else if (template.trim().endsWith(';')) {
          // Insert before the semicolon
          template = template.replace(/;$/, '\n  {{childBlocksContent}}\n;');
        }
        // Otherwise just append at the end
        else {
          template += '\n  {{childBlocksContent}}\n';
        }
      }
      
      // Now process the template with the original function
      return originalProcessTemplate.call(this, template, block);
    };

    // Override the generateFlowCode method
    sf.generateFlowCode = function() {
      console.log("Generating flow code with fixed nesting...");
      
      // Reset all nesting info
      this.blocks.forEach(block => {
        block.childBlocks = [];
        block.parentBlock = null;
        block.isNested = false;
        block.childBlocksContent = '';
      });
      
      // Process connections to establish nesting relationships
      this.processBlockConnections();
      
      // Track processed blocks to avoid duplicates
      const processedBlocks = new Set();
      let finalCode = '';
      
      // Find root blocks (no incoming connections to 'in' connector and not a class method)
      const rootBlocks = this.blocks.filter(block => {
        return !this.connections.some(conn => 
          conn.destBlockId === block.id && conn.destConnector === 'in'
        ) && !block.classMethod;
      });
      
      // Process each root block and its children
      for (const rootBlock of rootBlocks) {
        // Before generating code, make sure we build all children content
        this.buildBlockChildContent(rootBlock, 0, processedBlocks);
        
        // Now generate the code with properly nested children
        const blockCode = this.generateBlockCode(rootBlock);
        if (blockCode) {
          finalCode += blockCode + '\n\n';
          processedBlocks.add(rootBlock.id);
        }
      }
      
      return finalCode.trim();
    };

    // Add a method to build child content recursively
    sf.buildBlockChildContent = function(block, indentLevel = 0, processedBlocks = new Set()) {
      if (!block || processedBlocks.has(block.id)) return '';
      
      // For safety, check for circular references
      if (this._checkingBlockPath && this._checkingBlockPath.has(block.id)) {
        console.warn(`Circular reference detected for block ${block.id}. Skipping.`);
        return '';
      }
      
      // Initialize path tracking if needed
      if (!this._checkingBlockPath) this._checkingBlockPath = new Set();
      this._checkingBlockPath.add(block.id);
      
      try {
        // Find all out->in connections from this block
        const childConnections = this.connections.filter(conn => 
          conn.sourceBlockId === block.id && 
          conn.sourceConnector === 'out' && 
          conn.destConnector === 'in'
        );
        
        // Extract child blocks
        const childBlocks = childConnections.map(conn => 
          this.blocks.find(b => b.id === conn.destBlockId)
        ).filter(b => b != null);
        
        // Store the child blocks array for use in templates
        block.childBlocks = childBlocks.map(b => b.id);
        
        // Set proper indentation
        const indent = '  '.repeat(indentLevel + 1);
        
        // Build content for all children
        let childContent = '';
        
        for (const childBlock of childBlocks) {
          // Skip if we've already processed this block
          if (processedBlocks.has(childBlock.id)) continue;
          
          // Mark this child as having a parent
          childBlock.parentBlock = block.id;
          childBlock.isNested = true;
          
          // Process this child's own children first
          this.buildBlockChildContent(childBlock, indentLevel + 1, processedBlocks);
          
          // Generate the code for this child
          const childBlockCode = this.generateBlockCode(childBlock);
          if (childBlockCode) {
            childContent += indent + childBlockCode + '\n';
            processedBlocks.add(childBlock.id);
          }
        }
        
        // Store the generated child content in the block
        block.childBlocksContent = childContent;
        
        return childContent;
      } finally {
        // Always clean up path tracking
        this._checkingBlockPath.delete(block.id);
      }
    };

    // Try to fix block templates if they exist
    try {
      if (sf.blockTemplates && Array.isArray(sf.blockTemplates)) {
        // Fix special case for if statements
        const ifIdx = sf.blockTemplates.findIndex(t => t && t.type === 'if');
        if (ifIdx !== -1) {
          // Make sure the if block template properly includes child content
          sf.blockTemplates[ifIdx] = {
            ...sf.blockTemplates[ifIdx],
            template: 'if ({{condition}}) {\n  {{childBlocksContent}}\n}'
          };
        }
        
        // Fix special case for alert statements
        const alertIdx = sf.blockTemplates.findIndex(t => t && t.type === 'alert');
        if (alertIdx !== -1) {
          // Make sure alert properly handles its message
          sf.blockTemplates[alertIdx] = {
            ...sf.blockTemplates[alertIdx],
            template: 'alert({{message}})'
          };
        }
      }
    } catch (e) {
      console.error("Error fixing block templates:", e);
    }

    // Make sure processBlockConnections can handle connections properly
    if (!sf.processBlockConnections) {
      sf.processBlockConnections = function() {
        console.log("Setting up block connections");
        // Add basic structure handling
        this.blocks.forEach(block => {
          block.childBlocks = [];
          block.parentBlock = null;
        });
        
        // Process out->in connections
        for (const connection of this.connections) {
          if (connection.sourceConnector === 'out' && connection.destConnector === 'in') {
            const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
            const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
            
            if (sourceBlock && destBlock) {
              sourceBlock.childBlocks.push(destBlock.id);
              destBlock.parentBlock = sourceBlock.id;
              destBlock.isNested = true;
            }
          }
        }
      };
    }

    // Apply the fix immediately to ensure connection structure is updated
    try {
      sf.processBlockConnections();
      console.log("Fixed block nesting in ScriptFlow");
    } catch (e) {
      console.error("Error applying nesting fix:", e);
    }
  });
})();