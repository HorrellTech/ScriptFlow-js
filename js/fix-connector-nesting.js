/**
 * Connection rendering fix for ScriptFlow
 * Ensures that connections are properly styled and rendered
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
    console.log("Applying connection fixes to ScriptFlow...");

    // Override the renderConnection method to fix styling issues
    const originalRenderConnection = sf.renderConnection;
    sf.renderConnection = function(connection) {
      try {
        const sourceBlockEl = document.getElementById(`block-${connection.sourceBlockId}`);
        const destBlockEl = document.getElementById(`block-${connection.destBlockId}`);
        
        if (!sourceBlockEl || !destBlockEl) return;
        
        // Find the connector elements
        const sourceConnectors = sourceBlockEl.querySelectorAll(`.sf-connector.output[data-connector-name="${connection.sourceConnector}"]`);
        const destConnectors = destBlockEl.querySelectorAll(`.sf-connector.input[data-connector-name="${connection.destConnector}"]`);
        
        if (sourceConnectors.length === 0 || destConnectors.length === 0) return;
        
        const sourceConnector = sourceConnectors[0];
        const destConnector = destConnectors[0];
        
        // Get canvas positioning information
        const canvasRect = this.canvas.getBoundingClientRect();
        const sourceRect = sourceConnector.getBoundingClientRect();
        const destRect = destConnector.getBoundingClientRect();
        
        // Calculate scaled positions
        const sourceX = (sourceRect.left + sourceRect.width / 2 - canvasRect.left) / this.canvasScale;
        const sourceY = (sourceRect.top + sourceRect.height / 2 - canvasRect.top) / this.canvasScale;
        const destX = (destRect.left + destRect.width / 2 - canvasRect.left) / this.canvasScale;
        const destY = (destRect.top + destRect.height / 2 - canvasRect.top) / this.canvasScale;
        
        // Remove existing connection if any
        const existingConnection = document.getElementById(`connection-${connection.id}`);
        if (existingConnection) {
          existingConnection.remove();
        }
        
        // Create SVG element for connection
        const connectionEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        connectionEl.classList.add('sf-connection');
        connectionEl.id = `connection-${connection.id}`;
        connectionEl.style.position = 'absolute';
        connectionEl.style.width = '100%';
        connectionEl.style.height = '100%';
        connectionEl.style.pointerEvents = 'none';
        connectionEl.style.zIndex = '1';
        
        // Create path element
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        
        // Determine if this is a flow connection (in/out)
        const isFlowConnection = 
          connection.sourceConnector === 'out' || 
          connection.destConnector === 'in';
        
        // Apply appropriate styling based on connection type
        if (isFlowConnection) {
          path.setAttribute('class', 'sf-connection-path');
          path.setAttribute('data-connection-type', 'flow');
          path.setAttribute('stroke', 'rgba(186, 85, 211, 0.8)'); // Purple for flow
          path.setAttribute('stroke-width', '2.5');
          
          // Add special classes for visual identification
          connectionEl.classList.add('flow-connection');
          sourceConnector.classList.add('in-connector');
          destConnector.classList.add('out-connector');
        } else {
          path.setAttribute('class', 'sf-connection-path');
          path.setAttribute('data-connection-type', 'data');
          path.setAttribute('stroke', 'rgba(52, 152, 219, 0.8)'); // Blue for data
          path.setAttribute('stroke-width', '2');
        }
        
        // Set common path attributes
        path.setAttribute('fill', 'none');
        
        // Create bezier curve
        const dx = Math.abs(destX - sourceX) * 0.5;
        const pathData = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${destX - dx} ${destY}, ${destX} ${destY}`;
        
        path.setAttribute('d', pathData);
        path.style.pointerEvents = 'auto'; // Allow clicking on the path
        
        // Add path to connection and connection to canvas
        connectionEl.appendChild(path);
        this.canvas.appendChild(connectionEl);
        
        // Make the connection selectable via right-click
        path.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.showContextMenu(e);
        });
        
        // Add a title attribute to show connection details on hover
        const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
        const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
        
        if (sourceBlock && destBlock) {
          const sourceTemplate = this.blockLibrary[sourceBlock.category]?.blocks[sourceBlock.type];
          const destTemplate = this.blockLibrary[destBlock.category]?.blocks[destBlock.type];
          
          if (sourceTemplate && destTemplate) {
            path.setAttribute('title', 
              `${sourceTemplate.name} (${connection.sourceConnector}) → ${destTemplate.name} (${connection.destConnector})`
            );
          }
        }
        
        return connectionEl;
      } catch (err) {
        console.error("Error rendering connection:", err);
        return null;
      }
    };

    // Fix updateTempConnection method for proper styling during connection creation
    const originalUpdateTempConnection = sf.updateTempConnection;
    sf.updateTempConnection = function(e) {
      if (!this.tempConnection || !this.tempPath) return;
      
      const canvasRect = this.canvas.getBoundingClientRect();
      const startBlockEl = document.getElementById(`block-${this.connectionStartBlock.id}`);
      if (!startBlockEl) return;
      
      // Find the starting connector
      let startConnector;
      if (this.connectionStartType === 'output') {
        startConnector = startBlockEl.querySelector(`.sf-connector.output[data-connector-name="${this.connectionStartName}"]`);
      } else {
        startConnector = startBlockEl.querySelector(`.sf-connector.input[data-connector-name="${this.connectionStartName}"]`);
      }
      
      if (!startConnector) return;
      
      // Calculate start position
      const startRect = startConnector.getBoundingClientRect();
      const startX = (startRect.left + startRect.width / 2 - canvasRect.left) / this.canvasScale;
      const startY = (startRect.top + startRect.height / 2 - canvasRect.top) / this.canvasScale;
      
      // Calculate end position (mouse position)
      const endX = (e.clientX - canvasRect.left) / this.canvasScale;
      const endY = (e.clientY - canvasRect.top) / this.canvasScale;
      
      // Look for potential connection target
      const potentialTarget = this.findPotentialConnectionTarget(e);
      
      // Clear all previous connector highlights
      document.querySelectorAll('.sf-connector-highlight').forEach(el => {
        el.classList.remove('sf-connector-highlight');
      });
      
      if (potentialTarget) {
        // Add highlight to the potential target
        potentialTarget.classList.add('sf-connector-highlight');
        
        // Calculate target position
        const targetRect = potentialTarget.getBoundingClientRect();
        const targetX = (targetRect.left + targetRect.width / 2 - canvasRect.left) / this.canvasScale;
        const targetY = (targetRect.top + targetRect.height / 2 - canvasRect.top) / this.canvasScale;
        
        // Create curve
        const dx = Math.abs(targetX - startX) * 0.5;
        const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
        
        this.tempPath.setAttribute('d', pathData);
        
        // Determine connection type for proper styling
        const isFlowConnection = 
          (this.connectionStartName === 'out' || potentialTarget.dataset.connectorName === 'in');
        
        if (isFlowConnection) {
          this.tempPath.setAttribute('stroke', 'rgba(186, 85, 211, 0.8)'); // Purple for flow
          this.tempPath.setAttribute('stroke-width', '2.5');
          this.tempPath.setAttribute('data-connection-type', 'flow');
        } else {
          this.tempPath.setAttribute('stroke', 'rgba(52, 152, 219, 0.8)'); // Blue for data
          this.tempPath.setAttribute('stroke-width', '2');
          this.tempPath.setAttribute('data-connection-type', 'data');
        }
      } else {
        // No target - create curve to mouse position
        const dx = Math.abs(endX - startX) * 0.5;
        const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
        
        this.tempPath.setAttribute('d', pathData);
        this.tempPath.setAttribute('stroke', '#e74c3c'); // Red for invalid connection
        this.tempPath.setAttribute('stroke-width', '2');
        this.tempPath.removeAttribute('data-connection-type');
      }
    };

    // Fix finishConnection method to ensure consistent styling
    const originalFinishConnection = sf.finishConnection;
    sf.finishConnection = function(e) {
      if (!this.isCreatingConnection) return;
      
      // Find target element
      const element = document.elementFromPoint(e.clientX, e.clientY);
      if (!element) {
        if (this.tempConnection) {
          this.tempConnection.remove();
          this.tempConnection = null;
        }
        return;
      }
      
      // Find connector
      const connector = element.closest('.sf-connector') || 
                       element.querySelector('.sf-connector') || 
                       element.closest('.sf-connector-hitbox')?.querySelector('.sf-connector');
      
      if (!connector) {
        if (this.tempConnection) {
          this.tempConnection.remove();
          this.tempConnection = null;
        }
        return;
      }
      
      // Get connection details
      const endBlockId = connector.dataset.blockId;
      const endType = connector.dataset.connectorType;
      const endName = connector.dataset.connectorName;
      
      // Validate connection type compatibility (input->output or output->input)
      if (this.connectionStartType === endType) {
        if (this.tempConnection) {
          this.tempConnection.remove();
          this.tempConnection = null;
        }
        return;
      }
      
      // Determine source and destination
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
      
      // Check for existing connection
      const existingConnection = this.connections.find(conn => 
        conn.sourceBlockId === sourceBlockId && 
        conn.sourceConnector === sourceConnector &&
        conn.destBlockId === destBlockId &&
        conn.destConnector === destConnector
      );
      
      if (existingConnection) {
        if (this.tempConnection) {
          this.tempConnection.remove();
          this.tempConnection = null;
        }
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
      
      // Add to connections array
      this.connections.push(connection);
      
      // Clean up temporary connection
      if (this.tempConnection) {
        this.tempConnection.remove();
        this.tempConnection = null;
      }
      
      // Show notification
      this.showNotification(`Connected ${sourceConnector} to ${destConnector}`, 'success');
      
      // Render the new connection
      this.renderConnection(connection);
      
      // Update connected blocks' style
      const sourceConnectorEl = document.querySelector(`.sf-connector[data-block-id="${sourceBlockId}"][data-connector-name="${sourceConnector}"]`);
      const destConnectorEl = document.querySelector(`.sf-connector[data-block-id="${destBlockId}"][data-connector-name="${destConnector}"]`);
      
      // Add special classes for flow connections
      if (sourceConnector === 'out' || destConnector === 'in') {
        if (sourceConnectorEl) sourceConnectorEl.classList.add('in-connector');
        if (destConnectorEl) destConnectorEl.classList.add('out-connector');
      }
    };

    // Add additional CSS to fix styling issues
    const styleElement = document.createElement('style');
    styleElement.textContent = `
      /* Ensure flow connections have distinct styling */
      path.sf-connection-path[data-connection-type="flow"] {
        stroke: rgba(186, 85, 211, 0.8) !important;
        stroke-width: 2.5px !important;
        filter: drop-shadow(0 0 5px rgba(186, 85, 211, 0.3)) !important;
      }
      
      path.sf-connection-path[data-connection-type="data"] {
        stroke: rgba(52, 152, 219, 0.8) !important;
        stroke-width: 2px !important;
        filter: drop-shadow(0 0 3px rgba(52, 152, 219, 0.3)) !important;
      }
      
      /* Hover effects */
      path.sf-connection-path[data-connection-type="flow"]:hover {
        stroke: rgba(186, 85, 211, 1) !important;
        stroke-width: 4px !important;
        filter: drop-shadow(0 0 8px rgba(186, 85, 211, 0.5)) !important;
      }
      
      path.sf-connection-path[data-connection-type="data"]:hover {
        stroke: rgba(52, 152, 219, 1) !important;
        stroke-width: 3px !important;
        filter: drop-shadow(0 0 8px rgba(52, 152, 219, 0.5)) !important;
      }
      
      /* Flow connector styling reinforcement */
      .sf-connector.input.in-connector,
      .sf-connector.output.out-connector {
        background-color: rgba(186, 85, 211, 0.8) !important;
        border-color: rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 0 10px rgba(186, 85, 211, 0.5) !important;
      }
      
      /* Data connector styling reinforcement */
      .sf-connector:not(.in-connector):not(.out-connector) {
        background-color: rgba(52, 152, 219, 0.8) !important;
        border-color: rgba(255, 255, 255, 0.9) !important;
        box-shadow: 0 0 5px rgba(52, 152, 219, 0.5) !important;
      }
      
      /* Fix for temporary connection styling */
      .sf-temp-connection path[data-connection-type="flow"] {
        stroke: rgba(186, 85, 211, 0.8) !important;
        stroke-width: 2.5px !important;
        stroke-dasharray: 5, 5 !important;
        animation: dash 1s linear infinite !important;
      }
      
      .sf-temp-connection path[data-connection-type="data"] {
        stroke: rgba(52, 152, 219, 0.8) !important;
        stroke-width: 2px !important;
        stroke-dasharray: 5, 5 !important;
        animation: dash 1s linear infinite !important;
      }
      
      /* Animation for dashed lines */
      @keyframes dash {
        to {
          stroke-dashoffset: -10;
        }
      }
    `;
    document.head.appendChild(styleElement);

    // Force update all connections to apply new styling
    sf.updateAllConnections();

    console.log("Connection fixes applied successfully");
  });
})();