/**
 * Prevent text selection during drag operations
 * This script stops text selection across the application
 */

(function() {
    // Global flag to track if we're dragging
    let isDragging = false;
    let dragStarted = false;
    let initialX = 0;
    let initialY = 0;
  
    // Create a global style element to disable selection during dragging
    const styleEl = document.createElement('style');
    styleEl.id = 'sf-prevent-selection-style';
    styleEl.textContent = `
      .sf-dragging * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        cursor: grabbing !important;
      }
      
      .sf-block-template, .sf-block, .sf-palette * {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
      
      .sf-block input, .sf-block select, .sf-property-panel input, .sf-property-panel textarea {
        user-select: text !important;
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
      }
    `;
    document.head.appendChild(styleEl);
  
    // Helper function to detect significant movement
    function hasMovedSignificantly(e, threshold = 5) {
      const curX = e.clientX || (e.touches && e.touches[0] ? e.touches[0].clientX : initialX);
      const curY = e.clientY || (e.touches && e.touches[0] ? e.touches[0].clientY : initialY);
      
      return Math.abs(curX - initialX) > threshold || Math.abs(curY - initialY) > threshold;
    }
  
    // Mouse event handlers
    function handleMouseDown(e) {
      if (e.button !== 0) return; // Only track left mouse button
      
      // Save initial position
      initialX = e.clientX;
      initialY = e.clientY;
      
      // Check if we're clicking on a draggable element
      if (e.target.closest('.sf-block-template, .sf-block')) {
        dragStarted = true;
        
        // Prevent text selection immediately on mousedown
        if (document.getSelection) {
          const selection = document.getSelection();
          if (selection.removeAllRanges) {
            selection.removeAllRanges();
          }
        }
      }
    }
  
    function handleMouseMove(e) {
      if (!dragStarted) return;
      
      if (!isDragging && hasMovedSignificantly(e)) {
        isDragging = true;
        document.body.classList.add('sf-dragging');
      }
    }
  
    function handleMouseUp() {
      if (isDragging) {
        setTimeout(() => {
          document.body.classList.remove('sf-dragging');
          isDragging = false;
        }, 50); // Small delay to prevent text selection on mouseup
      }
      dragStarted = false;
    }
  
    // Touch event handlers
    function handleTouchStart(e) {
      if (e.touches.length !== 1) return;
      
      // Save initial position
      initialX = e.touches[0].clientX;
      initialY = e.touches[0].clientY;
      
      // Check if we're touching a draggable element
      if (e.target.closest('.sf-block-template, .sf-block')) {
        dragStarted = true;
        
        // Cancel any text selection immediately
        if (document.getSelection) {
          document.getSelection().removeAllRanges();
        }
      }
    }
  
    function handleTouchMove(e) {
      if (!dragStarted) return;
      
      if (!isDragging && e.touches.length === 1 && hasMovedSignificantly(e, 10)) {
        isDragging = true;
        document.body.classList.add('sf-dragging');
        
        // Prevent default only after confirming a drag to avoid interfering with scrolling
        e.preventDefault();
      }
    }
  
    function handleTouchEnd() {
      if (isDragging) {
        setTimeout(() => {
          document.body.classList.remove('sf-dragging');
          isDragging = false;
        }, 50);
      }
      dragStarted = false;
    }
  
    // Directly attach listeners to specific elements
    function attachListenersToElement(element) {
      if (element.classList.contains('sf-block-template') || element.classList.contains('sf-block')) {
        element.addEventListener('mousedown', function(e) {
          // Prevent selection immediately
          e.preventDefault();
          document.getSelection().removeAllRanges();
        });
        
        element.addEventListener('touchstart', function(e) {
          // For touch, we'll prevent default selectively to allow scrolling
          if (e.target.closest('.sf-block-template, .sf-block')) {
            document.getSelection().removeAllRanges();
          }
        }, { passive: true });
      }
    }
  
    // MutationObserver to watch for new elements
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach(node => {
            if (node.nodeType === 1) { // Element node
              attachListenersToElement(node);
              
              // Also check children
              node.querySelectorAll('.sf-block-template, .sf-block').forEach(el => {
                attachListenersToElement(el);
              });
            }
          });
        }
      });
    });
  
    // Start global tracking
    document.addEventListener('mousedown', handleMouseDown, { passive: false });
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
    document.addEventListener('touchcancel', handleTouchEnd);
  
    // Apply to existing elements
    document.querySelectorAll('.sf-block-template, .sf-block').forEach(el => {
      attachListenersToElement(el);
    });
  
    // Watch for new elements
    observer.observe(document.body, { childList: true, subtree: true });
  
    // For iOS devices, we need additional handling
    document.addEventListener('selectionchange', () => {
      if (isDragging) {
        document.getSelection().removeAllRanges();
      }
    });
  
    // Handle safari-specific selection issues
    document.body.style.webkitTouchCallout = 'none';
  })();