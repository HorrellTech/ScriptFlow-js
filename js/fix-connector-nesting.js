/**
 * Fix for connector nesting behavior in ScriptFlow
 * Ensures proper nesting when connecting 'out' to 'in' connectors
 */

(function() {
    // Wait for ScriptFlow to be fully initialized
    const ensureScriptFlowReady = (callback) => {
      if (window.scriptFlow) {
        callback(window.scriptFlow);
      } else {
        setTimeout(() => ensureScriptFlowReady(callback), 100);
      }
    };
  
    ensureScriptFlowReady((sf) => {
      // Override connection finisher to fix nesting behavior
      const originalFinishConnection = sf.finishConnection;
      sf.finishConnection = function(e) {
        if (!this.isCreatingConnection) return;
        
        // Find if we're over a connector hitbox or connector
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) {
          // Not over a valid element, remove temp connection
          if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
          }
          this.isCreatingConnection = false;
          return;
        }
        
        // Check if we're over a connector element or its hitbox
        const connector = element.closest('.sf-connector') || 
                        element.querySelector('.sf-connector') || 
                        element.closest('.sf-connector-hitbox')?.querySelector('.sf-connector');
                        
        if (!connector) {
          // Not over a connector, remove temp connection
          if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
          }
          this.isCreatingConnection = false;
          return;
        }
        
        const endBlockId = connector.dataset.blockId;
        const endType = connector.dataset.connectorType;
        const endName = connector.dataset.connectorName;
        
        // Make sure we're connecting from output to input (or input to output)
        if (this.connectionStartType === endType) {
          // Cannot connect output to output or input to input
          if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
          }
          this.isCreatingConnection = false;
          return;
        }
        
        // Determine source and destination based on connector types
        let sourceBlockId, sourceConnector, destBlockId, destConnector;
        
        if (this.connectionStartType === 'output') {
          sourceBlockId = this.connectionStartBlock.id;
          sourceConnector = this.connectionStartName;
          destBlockId = endBlockId;
          destConnector = endName;
        } else {
          sourceBlockId = endBlockId;
          sourceConnector = endName;
          destBlockId = this.connectionStartBlock.id;
          destConnector = this.connectionStartName;
        }
        
        // Check if this connection already exists
        const existingConnection = this.connections.find(conn => 
          conn.sourceBlockId === sourceBlockId && 
          conn.sourceConnector === sourceConnector &&
          conn.destBlockId === destBlockId &&
          conn.destConnector === destConnector
        );
        
        if (existingConnection) {
          // Connection already exists, cleanup
          if (this.tempConnection) {
            this.tempConnection.remove();
            this.tempConnection = null;
          }
          this.isCreatingConnection = false;
          return;
        }
        
        // Create new connection
        const connectionId = this.generateUniqueId();
        const connection = {
          id: connectionId,
          sourceBlockId,
          sourceConnector,
          destBlockId,
          destConnector
        };
        
        this.connections.push(connection);
        
        // Remove temporary connection line
        if (this.tempConnection) {
          this.tempConnection.remove();
          this.tempConnection = null;
        }
        
        // Show success notification
        this.showNotification(`Connected ${sourceConnector} to ${destConnector}`, 'success');
        
        // Render the new connection
        this.renderConnection(connection);
        
        // Apply nesting specifically for flow connections
        if ((sourceConnector === 'out' && destConnector === 'in') || 
            (sourceConnector === 'in' && destConnector === 'out')) {
          // Ensure proper nesting by forcing a rebuild of the block hierarchy
          this.processBlockConnections();
          
          // Apply visual nesting indicators
          const sourceBlock = this.blocks.find(b => b.id === sourceBlockId);
          const destBlock = this.blocks.find(b => b.id === destBlockId);
          
          if (sourceBlock && destBlock) {
            // Create parent-child relationship
            if (sourceConnector === 'out' && destConnector === 'in') {
              // Source is parent, destination is child
              if (!sourceBlock.childBlocks) sourceBlock.childBlocks = [];
              if (!sourceBlock.childBlocks.includes(destBlock.id)) {
                sourceBlock.childBlocks.push(destBlock.id);
              }
              destBlock.parentBlock = sourceBlock.id;
              destBlock.isNested = true;
            } else {
              // Destination is parent, source is child
              if (!destBlock.childBlocks) destBlock.childBlocks = [];
              if (!destBlock.childBlocks.includes(sourceBlock.id)) {
                destBlock.childBlocks.push(sourceBlock.id);
              }
              sourceBlock.parentBlock = destBlock.id;
              sourceBlock.isNested = true;
            }
          }
        }
        
        // End connection creation
        this.isCreatingConnection = false;
      };
  
      // Enhanced processBlockConnections to ensure proper nesting
      sf.processBlockConnections = function() {
        // Reset all nesting relationships before rebuilding them
        this.blocks.forEach(block => {
          block.isNested = false;
          block.isConnectedToClass = false;
          block.childBlocks = [];
          block.parentBlock = null;
          block.classMethod = false;
        });
        
        // First pass: Handle flow connections (out->in)
        for (const connection of this.connections) {
          // Process flow connections first to establish parent-child relationships
          if (connection.sourceConnector === 'out' && connection.destConnector === 'in') {
            const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
            const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
            
            if (sourceBlock && destBlock) {
              // Mark destination block as nested
              destBlock.isNested = true;
              destBlock.parentBlock = sourceBlock.id;
              
              // Add destination to source's child blocks
              if (!sourceBlock.childBlocks) sourceBlock.childBlocks = [];
              if (!sourceBlock.childBlocks.includes(destBlock.id)) {
                sourceBlock.childBlocks.push(destBlock.id);
              }
              
              // Apply visual indication of nesting
              const destElement = document.getElementById(`block-${destBlock.id}`);
              if (destElement) {
                destElement.dataset.nested = "true";
              }
            }
          }
        }
        
        // Second pass: Handle class structure connections
        for (const connection of this.connections) {
          const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
          const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
          
          if (!sourceBlock || !destBlock) continue;
          
          // Class connection (any connector from class to a method-type block)
          if (sourceBlock.type === 'class') {
            // These are blocks that should be part of the class
            if (destBlock.type === 'constructor' || 
                destBlock.type === 'function' ||
                destBlock.type === 'getter' ||
                destBlock.type === 'setter') {
              
              destBlock.isConnectedToClass = true;
              destBlock.classMethod = true;
            }
          }
        }
        
        // Third pass: Handle data connections for inputs/outputs
        for (const connection of this.connections) {
          // Skip flow connections already handled
          if (connection.destConnector === 'in' || connection.sourceConnector === 'out') continue;
          
          const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
          const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
          
          if (sourceBlock && destBlock) {
            // Set input value on destination block
            if (!destBlock.inputs) destBlock.inputs = {};
            destBlock.inputs[connection.destConnector] = sourceBlock.id;
            
            // Set output target on source block
            if (!sourceBlock.outputs) sourceBlock.outputs = {};
            sourceBlock.outputs[connection.sourceConnector] = destBlock.id;
          }
        }
        
        // Add CSS styling for nested blocks
        this.applyNestingStyles();
      };
      
      // Add visual styling for nested blocks
      sf.applyNestingStyles = function() {
        // Remove existing nesting styles
        const existingStyle = document.getElementById('sf-nesting-styles');
        if (existingStyle) existingStyle.remove();
        
        // Create styles for nesting indicators
        const style = document.createElement('style');
        style.id = 'sf-nesting-styles';
        style.textContent = `
          /* Visual indicator for nested blocks */
          .sf-block[data-nested="true"] {
            border-left: 3px solid rgba(52, 152, 219, 0.9) !important;
          }
          
          /* Connection styling for flow vs data connections */
          .sf-connection-path[data-connection-type="flow"] {
            stroke-dasharray: none !important;
            stroke-width: 2.5px !important;
          }
          
          .sf-connection-path[data-connection-type="data"] {
            stroke-dasharray: none !important;
            stroke-width: 2px !important;
          }
        `;
        document.head.appendChild(style);
        
        // Apply nested attribute to all blocks
        this.blocks.forEach(block => {
          const blockEl = document.getElementById(`block-${block.id}`);
          if (blockEl) {
            if (block.isNested) {
              blockEl.setAttribute('data-nested', 'true');
            } else {
              blockEl.removeAttribute('data-nested');
            }
          }
        });
      };
      
      // Override the code generation process to respect the nesting
      sf.generateFlowCode = function() {
        // Apply correct nesting before generating code
        this.processBlockConnections();
        
        // Create structures to track processed blocks
        const processedBlocks = new Set();
        let finalCode = '';
        
        // Find root blocks (blocks with no incoming connections to their 'in' connector)
        const rootBlocks = this.blocks.filter(block => {
          // A root block doesn't have any connection to its 'in' connector
          const hasInConnection = this.connections.some(conn => 
            conn.destBlockId === block.id && conn.destConnector === 'in'
          );
          
          return !hasInConnection;
        });
        
        // Recursive function to generate code for a block and its nested children
        const generateBlockTreeCode = (block, depth = 0) => {
          if (!block || processedBlocks.has(block.id)) return '';
          
          // Mark this block as processed
          processedBlocks.add(block.id);
          
          // Process child blocks that are connected via out->in (nested blocks)
          if (block.childBlocks && block.childBlocks.length > 0) {
            this.processChildBlocksForBlock(block, processedBlocks, generateBlockTreeCode, depth);
          }
          
          // Generate code for this block using its template
          return this.generateBlockCode(block);
        };
        
        // Process children for specific block and collect their content
        this.processChildBlocksForBlock = (block, processedBlocks, generateBlockTreeCode, depth) => {
          if (!block.childBlocks || block.childBlocks.length === 0) {
            block.childBlocksContent = '';
            return;
          }
          
          let childContent = '';
          for (const childId of block.childBlocks) {
            const childBlock = this.blocks.find(b => b.id === childId);
            if (!childBlock) continue;
            
            // Generate code for this child
            const childCode = generateBlockTreeCode(childBlock, depth + 1);
            if (childCode && childCode.trim()) {
              childContent += childCode + '\n';
            }
          }
          
          block.childBlocksContent = childContent.trim();
        };
        
        // Start with root blocks
        if (rootBlocks.length > 0) {
          for (const rootBlock of rootBlocks) {
            // Skip blocks that have already been processed
            if (processedBlocks.has(rootBlock.id)) continue;
            
            const blockCode = generateBlockTreeCode(rootBlock);
            if (blockCode && blockCode.trim()) {
              finalCode += blockCode + '\n\n';
            }
          }
        } else if (this.blocks.length > 0) {
          // If no root blocks but we have blocks, just process them all
          for (const block of this.blocks) {
            if (processedBlocks.has(block.id)) continue;
            
            const blockCode = generateBlockTreeCode(block);
            if (blockCode && blockCode.trim()) {
              finalCode += blockCode + '\n\n';
            }
          }
        }
        
        return finalCode.trim();
      };
      
      // Apply the fixed connection processing immediately
      sf.processBlockConnections();
      sf.applyNestingStyles();
      
      console.log("Fixed nesting for out->in connections in ScriptFlow");
    });
  })();