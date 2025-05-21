/**
 * Enhanced connection handling for ScriptFlow
 */

// Wait for ScriptFlow to initialize
window.addEventListener('DOMContentLoaded', () => {
    if (!window.scriptFlow) {
      console.error("ScriptFlow not initialized");
      return;
    }
    
    // Fix the rendering of connections for better visualization
    const originalRenderConnection = scriptFlow.renderConnection;
    scriptFlow.renderConnection = function(connection) {
      // Call the original implementation
      const result = originalRenderConnection.call(this, connection);
      
      // Add visual cue about connection type
      if (result) {
        const path = result.querySelector('path');
        if (path) {
          // Determine if this is a flow or data connection
          const isFlow = connection.sourceConnector === 'out' || connection.destConnector === 'in';
          path.classList.add(isFlow ? 'sf-flow-connection' : 'sf-data-connection');
          
          // Add connection type as data attribute for CSS targeting
          path.dataset.connectionType = isFlow ? 'flow' : 'data';
        }
      }
      
      return result;
    };
    
    // Add CSS styles to highlight different connection types
    const style = document.createElement('style');
    style.textContent = `
      /* Flow connections (out->in) */
      .sf-flow-connection {
        stroke: rgba(186, 85, 211, 0.8) !important; /* Purple for flow */
        stroke-width: 2.5px !important;
      }
      
      /* Data connections (value passing) */
      .sf-data-connection {
        stroke: rgba(52, 152, 219, 0.8) !important; /* Blue for data */
        stroke-width: 2px !important;
      }
      
      /* Hover effects */
      .sf-connection:hover path {
        filter: drop-shadow(0 0 5px rgba(255, 255, 255, 0.5)) !important;
        stroke-width: 3px !important;
      }
    `;
    document.head.appendChild(style);
    
    console.log('Enhanced connection handler initialized');
  });