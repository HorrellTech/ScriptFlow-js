/**
 * Simplified connection system for ScriptFlow
 * This file provides a more intuitive connection handling system
 */

(function() {
    // Wait for ScriptFlow to initialize
    window.addEventListener('DOMContentLoaded', () => {
      if (!window.scriptFlow) {
        console.error("ScriptFlow not initialized");
        return;
      }
  
      console.log("Initializing simplified connection system...");
      
      const sf = window.scriptFlow;
      
      // Override connection processing function with simpler approach
      sf.processBlockConnections = function() {
        // Reset all block relationships
        this.blocks.forEach(block => {
          // Reset child relationships
          block.childBlocks = [];
          block.isNested = false;
          block.parentBlock = null;
          
          // Clear inputs but preserve any manually set values
          const savedInputs = {...block.inputs};
          block.inputs = {};
          
          // Restore any manually set input values
          Object.keys(savedInputs).forEach(key => {
            if (typeof savedInputs[key] !== 'object' || !savedInputs[key].blockId) {
              block.inputs[key] = savedInputs[key];
            }
          });
        });
        
        // Process all connections
        for (const connection of this.connections) {
          const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
          const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
          
          if (!sourceBlock || !destBlock) continue;
          
          // Process flow connections (out -> in)
          if (connection.sourceConnector === 'out' && connection.destConnector === 'in') {
            // Create parent-child relationship for flow connections
            if (!sourceBlock.childBlocks) sourceBlock.childBlocks = [];
            sourceBlock.childBlocks.push(destBlock.id);
            destBlock.isNested = true;
            destBlock.parentBlock = sourceBlock.id;
          } 
          // Process data connections (anything except out -> in)
          else {
            // Store the connection directly as a reference to the source block and connector
            destBlock.inputs[connection.destConnector] = {
              blockId: sourceBlock.id,
              connector: connection.sourceConnector
            };
          }
        }
      };
      
      // Simplified code generation based on processed connections
      sf.generateBlockWithChildren = function(block, processedBlocks = new Set()) {
        if (!block || processedBlocks.has(block.id)) return '';
        
        // Mark this block as processed
        processedBlocks.add(block.id);
        
        // Process input values for this block
        this.resolveBlockInputs(block, processedBlocks);
        
        // Generate child blocks content
        let childContent = '';
        if (block.childBlocks && block.childBlocks.length > 0) {
          const childBlocks = block.childBlocks
            .map(id => this.blocks.find(b => b.id === id))
            .filter(Boolean)
            .sort((a, b) => a.y - b.y); // Order by vertical position
          
          for (const child of childBlocks) {
            if (!processedBlocks.has(child.id)) {
              const childCode = this.generateBlockWithChildren(child, processedBlocks);
              if (childCode) {
                childContent += childCode + '\n';
              }
            }
          }
        }
        
        // Store child content for template usage
        block.childBlocksContent = childContent.trim();
        
        // Get the block definition
        const blockDef = this.blockLibrary[block.category]?.blocks[block.type];
        if (!blockDef) return `/* Block ${block.id} has no definition */`;
        
        // Call the template function if available
        if (typeof blockDef.template === 'function') {
          try {
            return blockDef.template(block);
          } catch (error) {
            return `/* Error generating code for ${block.id}: ${error.message} */`;
          }
        }
        
        return `/* No template for ${block.category}.${block.type} */`;
      };
  
      // Improved input value resolution
      sf.resolveBlockInputs = function(block, processedBlocks = new Set()) {
        if (!block || !block.inputs) return;
        
        // Process all inputs - convert connection references to actual values
        for (const [inputName, inputValue] of Object.entries(block.inputs)) {
          // Skip if already processed or not a connection reference
          if (typeof inputValue !== 'object' || !inputValue.blockId) continue;
          
          // Find source block
          const sourceBlock = this.blocks.find(b => b.id === inputValue.blockId);
          if (!sourceBlock) continue;
          
          // Prevent circular references
          if (processedBlocks.has(sourceBlock.id)) {
            block.inputs[inputName] = `/* Circular reference to ${sourceBlock.id} */`;
            continue;
          }
          
          // Process the source block's inputs first
          const newProcessedBlocks = new Set(processedBlocks);
          newProcessedBlocks.add(block.id); // Prevent back-references
          this.resolveBlockInputs(sourceBlock, newProcessedBlocks);
          
          try {
            // Generate code for the source block
            const sourceBlockDef = this.blockLibrary[sourceBlock.category]?.blocks[sourceBlock.type];
            if (sourceBlockDef && typeof sourceBlockDef.template === 'function') {
              // Get the source block's output as the input value
              const sourceCode = sourceBlockDef.template(sourceBlock);
              block.inputs[inputName] = sourceCode;
            } else {
              block.inputs[inputName] = `/* No template for ${sourceBlock.category}.${sourceBlock.type} */`;
            }
          } catch (error) {
            console.error(`Error resolving input for ${block.id}.${inputName}:`, error);
            block.inputs[inputName] = `/* Error: ${error.message} */`;
          }
        }
      };
  
      // Enhance the finish connection function to show clearer feedback
      const originalFinishConnection = sf.finishConnection;
      sf.finishConnection = function(e) {
        const result = originalFinishConnection.call(this, e);
        
        // After connection is made, update visual feedback
        setTimeout(() => {
          this.processBlockConnections(); // Process connections immediately
          
          // Update affected blocks' visuals
          if (this.connectionStartBlock) {
            const blockEl = document.getElementById(`block-${this.connectionStartBlock.id}`);
            if (blockEl) {
              blockEl.classList.add('sf-block-connected');
              setTimeout(() => {
                blockEl.classList.remove('sf-block-connected');
              }, 500);
            }
          }
        }, 50);
        
        return result;
      };
  
      // Add visual feedback for connections
      const connectionStyle = document.createElement('style');
      connectionStyle.textContent = `
        .sf-block-connected {
          animation: sf-connection-pulse 0.5s ease-in-out;
        }
        
        @keyframes sf-connection-pulse {
          0% { box-shadow: 0 0 0 2px rgba(46, 204, 113, 0); }
          50% { box-shadow: 0 0 0 4px rgba(46, 204, 113, 0.6); }
          100% { box-shadow: 0 0 0 2px rgba(46, 204, 113, 0); }
        }
        
        .sf-flow-connection {
          stroke: rgba(186, 85, 211, 0.8) !important;
          stroke-width: 2.5px !important;
        }
        
        .sf-data-connection {
          stroke: rgba(52, 152, 219, 0.8) !important;
          stroke-width: 2px !important;
        }
        
        .sf-connection-label {
          position: absolute;
          font-size: 10px;
          background: rgba(0, 0, 0, 0.6);
          color: white;
          padding: 2px 6px;
          border-radius: 10px;
          pointer-events: none;
        }
      `;
      document.head.appendChild(connectionStyle);
      
      console.log("Simplified connection system initialized");
    });

    // Enhance connection rendering
    sf.renderConnection = function(connection) {
        const sourceBlockEl = document.getElementById(`block-${connection.sourceBlockId}`);
        const destBlockEl = document.getElementById(`block-${connection.destBlockId}`);
        
        if (!sourceBlockEl || !destBlockEl) return null;
        
        // Find the connectors
        const sourceConnectors = sourceBlockEl.querySelectorAll(`.sf-connector.output[data-connector-name="${connection.sourceConnector}"]`);
        const destConnectors = destBlockEl.querySelectorAll(`.sf-connector.input[data-connector-name="${connection.destConnector}"]`);
        
        if (sourceConnectors.length === 0 || destConnectors.length === 0) return null;
        
        const sourceConnector = sourceConnectors[0];
        const destConnector = destConnectors[0];
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const sourceRect = sourceConnector.getBoundingClientRect();
        const destRect = destConnector.getBoundingClientRect();
        
        const sourceX = (sourceRect.left + sourceRect.width / 2 - canvasRect.left) / this.canvasScale;
        const sourceY = (sourceRect.top + sourceRect.height / 2 - canvasRect.top) / this.canvasScale;
        const destX = (destRect.left + destRect.width / 2 - canvasRect.left) / this.canvasScale;
        const destY = (destRect.top + destRect.height / 2 - canvasRect.top) / this.canvasScale;
        
        // Create SVG element
        const connectionEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        connectionEl.classList.add('sf-connection');
        connectionEl.id = `connection-${connection.id}`;
        connectionEl.style.position = 'absolute';
        connectionEl.style.width = '100%';
        connectionEl.style.height = '100%';
        connectionEl.style.pointerEvents = 'none';
        connectionEl.style.zIndex = '1';
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('sf-connection-path');
        
        // Distinguish between flow and data connections
        const isFlowConnection = connection.sourceConnector === 'out' && connection.destConnector === 'in';
        
        if (isFlowConnection) {
        path.classList.add('sf-flow-connection');
        } else {
        path.classList.add('sf-data-connection');
        }
        
        // Create bezier curve
        const dx = Math.abs(destX - sourceX) * 0.5;
        const pathData = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${destX - dx} ${destY}, ${destX} ${destY}`;
        
        path.setAttribute('d', pathData);
        path.setAttribute('fill', 'none');
        path.style.pointerEvents = 'auto'; // Allow clicking on the path
        
        connectionEl.appendChild(path);
        this.canvas.appendChild(connectionEl);
        
        // Add context menu support
        path.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.showContextMenu(e);
        });
        
        // Add tooltip with connection info
        const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
        const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
        
        if (sourceBlock && destBlock) {
        const sourceBlockName = this.blockLibrary[sourceBlock.category]?.blocks[sourceBlock.type]?.name || 'Unknown';
        const destBlockName = this.blockLibrary[destBlock.category]?.blocks[destBlock.type]?.name || 'Unknown';
        
        const tooltip = document.createElement('div');
        tooltip.className = 'sf-connection-tooltip';
        tooltip.innerHTML = `${sourceBlockName}.${connection.sourceConnector} → ${destBlockName}.${connection.destConnector}`;
        tooltip.style.position = 'absolute';
        tooltip.style.display = 'none';
        
        // Add hover effect to show connection details
        path.addEventListener('mouseenter', () => {
            tooltip.style.left = `${(sourceX + destX) / 2}px`;
            tooltip.style.top = `${(sourceY + destY) / 2 - 20}px`;
            tooltip.style.display = 'block';
        });
        
        path.addEventListener('mouseleave', () => {
            tooltip.style.display = 'none';
        });
        }
        
        return connectionEl;
    };

    // Simplify code generation
    sf.generateCode = function() {
        // Process all connections first
        this.processBlockConnections();
        
        // Find root blocks (blocks with no incoming 'in' connections)
        const rootBlocks = this.blocks.filter(block => {
        return !this.connections.some(conn => 
            conn.destBlockId === block.id && conn.destConnector === 'in'
        );
        });
        
        // Generate code for each root block
        let finalCode = '';
        const processedBlocks = new Set();
        
        for (const rootBlock of rootBlocks) {
        const blockCode = this.generateBlockWithChildren(rootBlock, processedBlocks);
        if (blockCode && blockCode.trim()) {
            finalCode += blockCode + '\n\n';
        }
        }
        
        return finalCode.trim();
    };
  })();