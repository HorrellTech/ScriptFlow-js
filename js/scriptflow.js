/**
 * ScriptFlow - Visual JavaScript Scripting Tool
 * 
 * A tool that allows users to create JavaScript functionalities
 * using an intuitive drag-and-drop interface.
 */

class ScriptFlow {
    constructor(options = {}) {
        this.options = Object.assign({
            onCodeGenerated: (code) => console.log(code),
            theme: 'dark' // Default to dark theme, can be 'light' or 'dark'
        }, options);
        
        this.blocks = [];
        this.connections = [];
        this.draggedBlock = null;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.isCreatingConnection = false;
        this.connectionStartBlock = null;
        this.connectionStartType = null;
        
        // Canvas pan and zoom properties
        this.canvasScale = 1;
        this.canvasOffsetX = 0;
        this.canvasOffsetY = 0;
        this.isPanning = false;
        this.lastPanX = 0;
        this.lastPanY = 0;

        this.isResizing = false;
        
        // Track open subflows
        this.openSubflows = [];
        
        this.initializeBlocks();
        this.createModal();
        this.setupKeyboardShortcuts();
    }
    
    /**
     * Initialize the block library with predefined blocks
     */
    initializeBlocks() {
        // Check if external block library function exists
        if (typeof initializeBlockLibrary === 'function') {
            this.blockLibrary = initializeBlockLibrary();
        } else {
            console.error('Block library not found! Make sure block-initialization.js is loaded before ScriptFlow.');
            // Fallback to empty library
            this.blockLibrary = {};
        }
    }
    
    /**
     * Create the modal dialog for the ScriptFlow editor
     */
    createModal() {
        this.modal = document.createElement('div');
        this.modal.className = `sf-modal sf-theme-${this.options.theme}`;
        
        this.editor = document.createElement('div');
        this.editor.className = 'sf-editor';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'sf-header';
        header.innerHTML = `
            <div class="sf-header-left">
                <h2>ScriptFlow Editor</h2>
                <div class="sf-breadcrumb" id="sf-breadcrumb"></div>
            </div>
            <div class="sf-header-center">
                <button class="sf-button sf-icon-button" id="sf-zoom-out" title="Zoom Out"><i class="sf-icon">−</i></button>
                <span id="sf-zoom-level">100%</span>
                <button class="sf-button sf-icon-button" id="sf-zoom-in" title="Zoom In"><i class="sf-icon">+</i></button>
                <button class="sf-button sf-icon-button" id="sf-zoom-reset" title="Reset Zoom"><i class="sf-icon">⟲</i></button>
            </div>
            <div class="sf-header-right">
                <select id="sf-theme-selector" class="sf-theme-select">
                    <option value="dark" ${this.options.theme === 'dark' ? 'selected' : ''}>Dark Theme</option>
                    <option value="light" ${this.options.theme === 'light' ? 'selected' : ''}>Light Theme</option>
                    <option value="blue">Blue Theme</option>
                    <option value="green">Green Theme</option>
                </select>
                <button class="sf-button" id="sf-close-btn">Close</button>
            </div>
        `;
        
        // Create palette
        this.palette = document.createElement('div');
        this.palette.className = 'sf-palette';
        this.renderPalette();
        
        // Create canvas container for pan and zoom
        const canvasContainer = document.createElement('div');
        canvasContainer.className = 'sf-canvas-container';
        
        // Create canvas
        this.canvas = document.createElement('div');
        this.canvas.className = 'sf-canvas';
        this.canvas.style.transform = 'scale(1)';
        this.canvas.style.transformOrigin = '0 0';
        
        canvasContainer.appendChild(this.canvas);
        
        // Create context menu
        this.contextMenu = document.createElement('div');
        this.contextMenu.className = 'sf-context-menu';
        this.contextMenu.style.display = 'none';
        canvasContainer.appendChild(this.contextMenu);
        
        // Create footer
        const footer = document.createElement('div');
        footer.className = 'sf-footer';
        footer.innerHTML = `
            <div>
                <button class="sf-button" id="sf-clear-btn">Clear Canvas</button>
                <button class="sf-button" id="sf-save-btn">Save Flow</button>
                <button class="sf-button" id="sf-load-btn">Load Flow</button>
            </div>
            <div class="sf-coordinates" id="sf-coordinates">X: 0, Y: 0</div>
            <div>
                <button class="sf-button secondary" id="sf-export-btn">Export Code</button>
                <button class="sf-button primary" id="sf-generate-btn">Generate Code</button>
            </div>
        `;
    
        // Add additional styles
        const style = document.createElement('style');
        style.textContent = `
            /* Glass effect for blocks */
            .sf-glass-effect {
                background-color: rgba(0, 0, 0, 0.6) !important;
                border: 2px solid rgba(255, 255, 255, 0.7) !important;
                backdrop-filter: blur(6px);
                box-shadow: 0 0 15px rgba(255, 255, 255, 0.15), inset 0 0 15px rgba(255, 255, 255, 0.05) !important;
            }
    
            /* Selected block glow effect */
            .sf-block-selected {
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9), 0 0 20px rgba(255, 255, 255, 0.5) !important;
                border: 2px solid rgba(255, 255, 255, 0.9) !important;
                z-index: 10;
            }
    
            /* Fix connector container and labels */
            .sf-connector-container {
                position: absolute;
                display: flex;
                align-items: center;
                height: 20px;
            }
    
            .sf-connector-container.input {
                left: -8px;
                flex-direction: row;
            }
    
            .sf-connector-container.output {
                right: -8px;
                flex-direction: row-reverse;
            }
    
            .sf-connector-label {
                font-size: 12px;
                white-space: nowrap;
                color: rgba(255, 255, 255, 0.9);
                padding: 0 5px;
            }
    
            .sf-connector-label.input {
                text-align: left;
            }
    
            .sf-connector-label.output {
                text-align: right;
            }
    
            /* Improved connector hitboxes */
            .sf-connector-hitbox {
                width: 24px;
                height: 24px;
                display: flex;
                justify-content: center;
                align-items: center;
                cursor: crosshair;
                position: relative;
            }
    
            /* Improved connector visuals */
            .sf-connector {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.8);
                cursor: crosshair;
                transition: transform 0.2s, box-shadow 0.2s;
            }
    
            .sf-connector.input {
                background-color: rgba(52, 152, 219, 0.8);
            }
    
            .sf-connector.output {
                background-color: rgba(46, 204, 113, 0.8);
            }
    
            .sf-connector:hover,
            .sf-connector-highlight {
                transform: scale(1.2);
                box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
            }
    
            /* Improved block content */
            .sf-block-content {
                padding: 5px 0;
            }
    
            .sf-block-title {
                color: rgba(255, 255, 255, 0.9);
                font-weight: bold;
                text-align: center;
                margin-bottom: 8px;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.3);
            }
    
            /* Style inputs inside blocks */
            .sf-block input, 
            .sf-block select {
                background-color: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.3);
                color: rgba(255, 255, 255, 0.9);
                padding: 4px 8px;
                border-radius: 3px;
                width: 100%;
                margin: 2px 0;
            }
    
            .sf-block input:focus, 
            .sf-block select:focus {
                outline: none;
                border-color: rgba(255, 255, 255, 0.6);
                box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.2);
            }
    
            .sf-block label {
                display: block;
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                margin-top: 4px;
            }

            
        `;
        
        document.head.appendChild(style);
        
        // Assemble the editor (without property panel)
        this.editor.appendChild(header);
        this.editor.appendChild(this.palette);
        this.editor.appendChild(canvasContainer);
        this.editor.appendChild(footer);
        
        this.modal.appendChild(this.editor);
        document.body.appendChild(this.modal);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize breadcrumb
        this.updateBreadcrumb();
    }
    
    /**
     * Updates the breadcrumb navigation for subflows
     */
    updateBreadcrumb() {
        const breadcrumb = document.getElementById('sf-breadcrumb');
        if (!breadcrumb) return;
        
        let html = '<span class="sf-breadcrumb-item" data-level="main">Main</span>';
        
        this.openSubflows.forEach((subflow, index) => {
            html += ` <span class="sf-breadcrumb-separator">›</span> `;
            html += `<span class="sf-breadcrumb-item" data-level="${index}">${subflow.name || 'Subflow'}</span>`;
        });
        
        breadcrumb.innerHTML = html;
        
        // Add click handlers for navigation
        const items = breadcrumb.querySelectorAll('.sf-breadcrumb-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const level = item.dataset.level;
                if (level === 'main') {
                    // Navigate back to main flow
                    this.openSubflows = [];
                    this.renderCurrentFlow();
                } else {
                    // Navigate to specific subflow level
                    const levelNum = parseInt(level);
                    this.openSubflows = this.openSubflows.slice(0, levelNum + 1);
                    this.renderCurrentFlow();
                }
            });
        });
    }
    
    /**
     * Render the current flow (main or subflow)
     */
    renderCurrentFlow() {
        this.clearCanvas();
        
        // If in a subflow, render its blocks and connections
        if (this.openSubflows.length > 0) {
            const currentSubflow = this.openSubflows[this.openSubflows.length - 1];
            this.blocks = currentSubflow.blocks || [];
            this.connections = currentSubflow.connections || [];
            
            // Render all blocks and connections
            this.blocks.forEach(block => {
                const blockEl = this.createBlockElement(block);
                this.canvas.appendChild(blockEl);
            });
            
            this.connections.forEach(connection => {
                this.renderConnection(connection);
            });
        }
        
        // Update breadcrumb
        this.updateBreadcrumb();
    }
    
    /**
     * Setup all event listeners for the editor
     */
    setupEventListeners() {
        // Theme selector
        document.getElementById('sf-theme-selector').addEventListener('change', (e) => {
            this.setTheme(e.target.value);
        });
        
        // Close button
        document.getElementById('sf-close-btn').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Generate code button - Use our new handler
        document.getElementById('sf-generate-btn').addEventListener('click', () => {
            this.generateCodeAction();
        });
        
        // Export code button
        document.getElementById('sf-export-btn').addEventListener('click', () => {
            const code = this.generateCode();
            this.downloadCode(code);
        });
        
        // Clear canvas button
        document.getElementById('sf-clear-btn').addEventListener('click', () => {
            if (confirm('Are you sure you want to clear the canvas? This will remove all blocks and connections.')) {
                this.clearCanvas();
                this.showNotification('Canvas cleared', 'info');
            }
        });
        
        // Save flow button
        document.getElementById('sf-save-btn').addEventListener('click', () => {
            this.saveFlow();
        });
        
        // Load flow button
        document.getElementById('sf-load-btn').addEventListener('click', () => {
            this.loadFlow();
        });
        
        // Zoom controls
        document.getElementById('sf-zoom-in').addEventListener('click', () => {
            this.zoomCanvas(0.1);
        });
        
        document.getElementById('sf-zoom-out').addEventListener('click', () => {
            this.zoomCanvas(-0.1);
        });
        
        document.getElementById('sf-zoom-reset').addEventListener('click', () => {
            this.resetCanvasZoom();
        });
        
        // Canvas mouse wheel for zooming
        const canvasContainer = this.canvas.parentElement;
        canvasContainer.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomDelta = e.deltaY > 0 ? -0.05 : 0.05;
            
            // Calculate zoom around mouse position
            const canvasRect = this.canvas.getBoundingClientRect();
            const mouseX = (e.clientX - canvasRect.left) / this.canvasScale;
            const mouseY = (e.clientY - canvasRect.top) / this.canvasScale;
            
            this.zoomCanvasAroundPoint(zoomDelta, mouseX, mouseY);
        });
        
        // Canvas pan
        canvasContainer.addEventListener('mousedown', (e) => {
            // Middle mouse button or Alt+Left click for panning
            if (e.button === 1 || (e.button === 0 && e.altKey)) {
                e.preventDefault();
                this.startCanvasPan(e);
            }
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPanning) {
                this.updateCanvasPan(e);
            }
            
            // Update coordinates display
            const canvasRect = this.canvas.getBoundingClientRect();
            if (e.clientX >= canvasRect.left && e.clientX <= canvasRect.right &&
                e.clientY >= canvasRect.top && e.clientY <= canvasRect.bottom) {
                const x = Math.round((e.clientX - canvasRect.left) / this.canvasScale - this.canvasOffsetX);
                const y = Math.round((e.clientY - canvasRect.top) / this.canvasScale - this.canvasOffsetY);
                document.getElementById('sf-coordinates').textContent = `X: ${x}, Y: ${y}`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            if (this.isPanning) {
                this.isPanning = false;
                this.canvas.style.cursor = 'default';
            }
        });
        
        // Canvas events for block dragging
        this.canvas.addEventListener('mousemove', (e) => {
            this.onCanvasMouseMove(e);
        });
        
        this.canvas.addEventListener('mouseup', (e) => {
            this.onCanvasMouseUp(e);
        });
        
        // Canvas right-click context menu
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.showContextMenu(e);
        });
        
        // Close context menu when clicking elsewhere
        document.addEventListener('click', (e) => {
            if (!this.contextMenu.contains(e.target)) {
                this.contextMenu.style.display = 'none';
            }
        });
    
        // Add canvas click to deselect blocks
        this.canvas.addEventListener('click', (e) => {
            // Only deselect if clicking directly on the canvas (not on a block or other element)
            if (e.target === this.canvas) {
                this.clearSelection();
            }
        });
    }

    /**
     * Setup keyboard shortcuts for common actions
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only process if the ScriptFlow modal is active
            if (!this.modal.classList.contains('active')) return;
            
            // Ctrl+S: Save flow
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.saveFlow();
            }
            
            // Ctrl+O: Load flow
            if (e.ctrlKey && e.key === 'o') {
                e.preventDefault();
                this.loadFlow();
            }
            
            // Ctrl+G: Generate code
            if (e.ctrlKey && e.key === 'g') {
                e.preventDefault();
                this.generateCodeAction();
            }
            
            // Delete: Delete selected block
            if (e.key === 'Delete' && this.selectedBlockId) {
                e.preventDefault();
                this.deleteBlock(this.selectedBlockId);
                this.showNotification('Block deleted', 'info');
            }
            
            // Ctrl+D: Duplicate selected block
            if (e.ctrlKey && e.key === 'd' && this.selectedBlockId) {
                e.preventDefault();
                this.duplicateBlock(this.selectedBlockId);
                this.showNotification('Block duplicated', 'success');
            }
            
            // Escape: Close dialogs or deselect
            if (e.key === 'Escape') {
                // Close code preview if open
                const codePreview = document.getElementById('sf-code-preview-dialog');
                if (codePreview) {
                    codePreview.remove();
                    return;
                }
                
                // Deselect block if one is selected
                if (this.selectedBlockId) {
                    this.clearSelection();
                    return;
                }
            }
        });
    }

    /**
     * Clear the current selection
     */
    clearSelection() {
        // Remove selection from all blocks
        document.querySelectorAll('.sf-block').forEach(blockEl => {
            blockEl.classList.remove('sf-block-selected');
        });
        
        // Clear the selected block ID
        this.selectedBlockId = null;
    }

    /**
     * Generate nested code blocks maintaining proper indentation and structure
     * @param {Object} block - The parent block
     * @param {Number} indentLevel - Current indentation level
     */
    generateNestedBlocksCode(block, indentLevel = 0) {
        if (!block || !block.childBlocks || block.childBlocks.length === 0) 
            return '';
        
        const indent = '  '.repeat(indentLevel);
        let result = '';
        
        // Get child blocks in proper order
        const childBlocks = block.childBlocks.map(id => 
            this.blocks.find(b => b.id === id)
        ).filter(b => b != null);
        
        for (const childBlock of childBlocks) {
            // Skip if this is a class method being processed in a different context
            if (childBlock.classMethod && block.type !== 'class') continue;
            
            // Generate code for this child block
            const blockCode = this.generateBlockCode(childBlock, indentLevel + 1);
            if (blockCode) {
                result += indent + blockCode + '\n';
                
                // Recursively process nested blocks
                const nestedCode = this.generateNestedBlocksCode(childBlock, indentLevel + 1);
                if (nestedCode) {
                    result += nestedCode;
                }
            }
        }
        
        return result;
    }
    
    /**
     * Set the theme of the editor
     */
    setTheme(theme) {
        this.options.theme = theme;
        this.modal.className = `sf-modal sf-theme-${theme}`;
        
        // You might want to save the theme preference in localStorage
        localStorage.setItem('scriptflow-theme', theme);
    }
    
    /**
     * Start panning the canvas
     */
    startCanvasPan(e) {
        this.isPanning = true;
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }
    
    /**
     * Update canvas position while panning
     */
    updateCanvasPan(e) {
        if (!this.isPanning) return;
        
        const deltaX = (e.clientX - this.lastPanX) / this.canvasScale;
        const deltaY = (e.clientY - this.lastPanY) / this.canvasScale;
        
        this.canvasOffsetX += deltaX;
        this.canvasOffsetY += deltaY;
        
        this.canvas.style.transform = `scale(${this.canvasScale}) translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px)`;
        
        this.lastPanX = e.clientX;
        this.lastPanY = e.clientY;
    }
    
    /**
     * Zoom the canvas in or out
     */
    zoomCanvas(delta) {
        const newScale = Math.min(Math.max(this.canvasScale + delta, 0.2), 3);
        this.canvasScale = newScale;
        
        this.canvas.style.transform = `scale(${this.canvasScale}) translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px)`;
        document.getElementById('sf-zoom-level').textContent = `${Math.round(this.canvasScale * 100)}%`;
    }
    
    /**
     * Reset canvas zoom and position
     */
    resetCanvasZoom() {
        this.canvasScale = 1;
        this.canvasOffsetX = 0;
        this.canvasOffsetY = 0;
        
        this.canvas.style.transform = `scale(${this.canvasScale}) translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px)`;
        document.getElementById('sf-zoom-level').textContent = '100%';
    }

    /**
     * Show context menu at the clicked position - MODIFIED FOR DIRECT EDITING
     */
    showContextMenu(e) {
        const element = document.elementFromPoint(e.clientX, e.clientY);
        
        // Check if clicked on a connection
        if (element.tagName === 'path' && element.parentElement.classList.contains('sf-connection')) {
            const connectionId = element.parentElement.id.split('-')[1];
            
            this.contextMenu.innerHTML = `
                <div class="sf-context-menu-item" data-action="delete-connection" data-id="${connectionId}">
                    Delete Connection
                </div>
            `;
        } 
        // Check if clicked on a block
        else if (element.closest('.sf-block')) {
            const block = element.closest('.sf-block');
            const blockId = block.id.split('-')[1];
            const blockData = this.blocks.find(b => b.id === blockId);
            
            let menuItems = `
                <div class="sf-context-menu-item" data-action="duplicate-block" data-id="${blockId}">
                    Duplicate
                </div>
                <div class="sf-context-menu-item" data-action="delete-block" data-id="${blockId}">
                    Delete
                </div>
            `;
            
            // Add edit subflow option for custom function blocks
            if (blockData.category === 'customFunction') {
                menuItems += `
                    <div class="sf-context-menu-separator"></div>
                    <div class="sf-context-menu-item" data-action="edit-subflow" data-id="${blockId}">
                        Edit Function Contents
                    </div>
                `;
            }
            
            this.contextMenu.innerHTML = menuItems;
        } 
        // Canvas context menu
        else {
            const canvasX = (e.clientX - this.canvas.getBoundingClientRect().left) / this.canvasScale - this.canvasOffsetX;
            const canvasY = (e.clientY - this.canvas.getBoundingClientRect().top) / this.canvasScale - this.canvasOffsetY;
            
            this.contextMenu.innerHTML = `
                <div class="sf-context-menu-item" data-action="add-custom-function" data-x="${canvasX}" data-y="${canvasY}">
                    Add Custom Function
                </div>
                <div class="sf-context-menu-item" data-action="paste">
                    Paste
                </div>
                <div class="sf-context-menu-separator"></div>
                <div class="sf-context-menu-item" data-action="select-all">
                    Select All
                </div>
                <div class="sf-context-menu-item" data-action="center-view">
                    Center View
                </div>
            `;
        }
        
        // Position and show the context menu
        this.contextMenu.style.left = e.clientX + 'px';
        this.contextMenu.style.top = e.clientY + 'px';
        this.contextMenu.style.display = 'block';
        
        // Add event listeners for context menu items
        this.contextMenu.querySelectorAll('.sf-context-menu-item').forEach(item => {
            item.addEventListener('click', () => {
                const action = item.dataset.action;
                const id = item.dataset.id;
                
                switch (action) {
                    case 'delete-connection':
                        this.deleteConnection(id);
                        break;
                    case 'duplicate-block':
                        this.duplicateBlock(id);
                        break;
                    case 'delete-block':
                        this.deleteBlock(id);
                        break;
                    case 'edit-subflow':
                        this.editSubflow(id);
                        break;
                    case 'add-custom-function':
                        this.addCustomFunction(parseFloat(item.dataset.x), parseFloat(item.dataset.y));
                        break;
                    case 'paste':
                        // Implement paste functionality
                        break;
                    case 'select-all':
                        // Implement select all functionality
                        break;
                    case 'center-view':
                        this.resetCanvasZoom();
                        break;
                }
                
                this.contextMenu.style.display = 'none';
            });
        });
    }
    
    /**
     * Delete a connection by its ID
     */
    deleteConnection(connectionId) {
        const connectionIndex = this.connections.findIndex(conn => conn.id === connectionId);
        if (connectionIndex !== -1) {
            this.connections.splice(connectionIndex, 1);
            
            const connectionEl = document.getElementById(`connection-${connectionId}`);
            if (connectionEl) {
                connectionEl.remove();
            }
        }
    }
    
    /**
     * Open the property panel for a block
     */
    openPropertyPanel(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;
        
        const blockTemplate = this.blockLibrary[block.category].blocks[block.type];
        const content = document.getElementById('sf-property-content');
        
        let html = `
            <h4>${blockTemplate.name}</h4>
            <div class="sf-property-group">
                <h5>Block Information</h5>
                <div class="sf-property-info">
                    <div>ID: <span class="sf-property-value">${block.id}</span></div>
                    <div>Type: <span class="sf-property-value">${blockTemplate.name}</span></div>
                    <div>Category: <span class="sf-property-value">${block.category}</span></div>
                </div>
            </div>
            <div class="sf-property-group">
                <h5>Position</h5>
                <div class="sf-property-row">
                    <label>X:</label>
                    <input type="number" id="sf-prop-x" value="${block.x}">
                </div>
                <div class="sf-property-row">
                    <label>Y:</label>
                    <input type="number" id="sf-prop-y" value="${block.y}">
                </div>
            </div>
        `;
        
        // Add options
        if (blockTemplate.options && blockTemplate.options.length > 0) {
            html += `<div class="sf-property-group"><h5>Options</h5>`;
            
            blockTemplate.options.forEach(option => {
                const value = block.options[option.name] || '';
                
                if (option.type === 'select') {
                    html += `
                        <div class="sf-property-row">
                            <label>${option.name}:</label>
                            <select id="sf-prop-option-${option.name}">
                    `;
                    
                    option.options.forEach(optValue => {
                        const selected = value === optValue ? 'selected' : '';
                        html += `<option value="${optValue}" ${selected}>${optValue}</option>`;
                    });
                    
                    html += `</select></div>`;
                } else {
                    html += `
                        <div class="sf-property-row">
                            <label>${option.name}:</label>
                            <input type="${option.type}" id="sf-prop-option-${option.name}" value="${value}">
                        </div>
                    `;
                }
            });
            
            html += `</div>`;
        }
        
        // Add connectors information
        html += `
            <div class="sf-property-group">
                <h5>Connectors</h5>
                <div class="sf-property-connectors">
        `;
        
        if (blockTemplate.inputs && blockTemplate.inputs.length > 0) {
            html += `<div class="sf-property-subgroup"><h6>Inputs</h6><ul>`;
            blockTemplate.inputs.forEach(input => {
                // Check if this input has connections
                const connections = this.connections.filter(
                    conn => conn.destBlockId === block.id && conn.destConnector === input
                );
                
                let connectionInfo = 'Not connected';
                if (connections.length > 0) {
                    const sourceBlock = this.blocks.find(b => b.id === connections[0].sourceBlockId);
                    const sourceBlockTemplate = sourceBlock ? 
                        this.blockLibrary[sourceBlock.category].blocks[sourceBlock.type] : null;
                    connectionInfo = sourceBlockTemplate ? 
                        `Connected to ${sourceBlockTemplate.name} (${connections[0].sourceConnector})` : 
                        'Connected';
                }
                
                html += `<li><span class="sf-connector-dot input"></span> ${input}: <span class="sf-property-connection">${connectionInfo}</span></li>`;
            });
            html += `</ul></div>`;
        }
        
        if (blockTemplate.outputs && blockTemplate.outputs.length > 0) {
            html += `<div class="sf-property-subgroup"><h6>Outputs</h6><ul>`;
            blockTemplate.outputs.forEach(output => {
                // Check if this output has connections
                const connections = this.connections.filter(
                    conn => conn.sourceBlockId === block.id && conn.sourceConnector === output
                );
                
                let connectionInfo = 'Not connected';
                if (connections.length > 0) {
                    const destBlock = this.blocks.find(b => b.id === connections[0].destBlockId);
                    const destBlockTemplate = destBlock ? 
                        this.blockLibrary[destBlock.category].blocks[destBlock.type] : null;
                    connectionInfo = destBlockTemplate ? 
                        `Connected to ${destBlockTemplate.name} (${connections[0].destConnector})` : 
                        'Connected';
                }
                
                html += `<li><span class="sf-connector-dot output"></span> ${output}: <span class="sf-property-connection">${connectionInfo}</span></li>`;
            });
            html += `</ul></div>`;
        }
        
        html += `</div></div>`;
        
        // Add custom functionality for custom function blocks
        if (block.category === 'customFunction') {
            html += `
                <div class="sf-property-group">
                    <h5>Function Parameters</h5>
                    <div id="sf-parameters-container">
                        ${this.renderFunctionParameters(block)}
                    </div>
                    <button class="sf-button sf-small-button" id="sf-add-parameter">Add Parameter</button>
                </div>
                <div class="sf-property-group">
                    <h5>Function Outputs</h5>
                    <div id="sf-outputs-container">
                        ${this.renderFunctionOutputs(block)}
                    </div>
                    <button class="sf-button sf-small-button" id="sf-add-output">Add Output</button>
                </div>
            `;
        }
        
        // Add Apply button
        html += `
            <div class="sf-property-actions">
                <button class="sf-button secondary" id="sf-property-cancel">Cancel</button>
                <button class="sf-button primary" id="sf-apply-properties">Apply</button>
            </div>
        `;
        
        content.innerHTML = html;
        this.propertyPanel.classList.add('active');
        this.propertyPanel.dataset.blockId = blockId;
        
        // Add event listeners for property inputs
        document.getElementById('sf-apply-properties').addEventListener('click', () => {
            this.applyBlockProperties(blockId);
        });
        
        document.getElementById('sf-property-cancel').addEventListener('click', () => {
            this.propertyPanel.classList.remove('active');
        });
        
        // Add event listeners for custom function parameters and outputs
        if (block.category === 'customFunction') {
            document.getElementById('sf-add-parameter').addEventListener('click', () => {
                this.addFunctionParameter(blockId);
            });
            
            document.getElementById('sf-add-output').addEventListener('click', () => {
                this.addFunctionOutput(blockId);
            });
            
            // Add delete parameter/output event listeners
            document.querySelectorAll('.sf-delete-parameter').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const paramName = e.target.dataset.name;
                    this.deleteFunctionParameter(blockId, paramName);
                });
            });
            
            document.querySelectorAll('.sf-delete-output').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    const outputName = e.target.dataset.name;
                    this.deleteFunctionOutput(blockId, outputName);
                });
            });
        }
        
        // Add CSS to position the panel correctly
        const canvas = this.canvas;
        const canvasRect = canvas.getBoundingClientRect();
        const panel = this.propertyPanel;
        
        // Position panel to avoid going off-screen
        setTimeout(() => {
            const panelRect = panel.getBoundingClientRect();
            const blockEl = document.getElementById(`block-${blockId}`);
            const blockRect = blockEl.getBoundingClientRect();
            
            // Default position near the block
            let left = blockRect.right + 10;
            let top = blockRect.top;
            
            // Adjust if it would go off-screen
            if (left + panelRect.width > window.innerWidth) {
                left = blockRect.left - panelRect.width - 10;
            }
            
            if (top + panelRect.height > window.innerHeight) {
                top = window.innerHeight - panelRect.height - 10;
            }
            
            // Make sure top is not negative
            top = Math.max(10, top);
            
            panel.style.left = `${left}px`;
            panel.style.top = `${top}px`;
        }, 0);
    }
    
    /**
     * Render function parameters in the property panel
     */
    renderFunctionParameters(block) {
        let html = '';
        
        if (block.customData && block.customData.parameters) {
            block.customData.parameters.forEach(param => {
                html += `
                    <div class="sf-parameter-row">
                        <input type="text" value="${param}" class="sf-parameter-name">
                        <button class="sf-button sf-icon-button sf-delete-parameter" data-name="${param}">×</button>
                    </div>
                `;
            });
        }
        
        return html;
    }
    
    /**
     * Render function outputs in the property panel
     */
    renderFunctionOutputs(block) {
        let html = '';
        
        if (block.customData && block.customData.outputs) {
            block.customData.outputs.forEach(output => {
                html += `
                    <div class="sf-parameter-row">
                        <input type="text" value="${output}" class="sf-output-name">
                        <button class="sf-button sf-icon-button sf-delete-output" data-name="${output}">×</button>
                    </div>
                `;
            });
        }
        
        return html;
    }
    
    /**
     * Add a new parameter to a custom function block
     */
    addFunctionParameter(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block || block.category !== 'customFunction') return;
        
        // Initialize customData if not exists
        if (!block.customData) block.customData = {};
        if (!block.customData.parameters) block.customData.parameters = [];
        
        // Add a new parameter with default name
        const newParam = `param${block.customData.parameters.length + 1}`;
        block.customData.parameters.push(newParam);
        
        // Update UI
        const container = document.getElementById('sf-parameters-container');
        container.innerHTML = this.renderFunctionParameters(block);
        
        // Re-add event listeners
        document.querySelectorAll('.sf-delete-parameter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const paramName = e.target.dataset.name;
                this.deleteFunctionParameter(blockId, paramName);
            });
        });
        
        // Also update the block's inputs to match parameters
        this.updateCustomFunctionConnectors(block);
    }
    
    /**
     * Add a new output to a custom function block
     */
    addFunctionOutput(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block || block.category !== 'customFunction') return;
        
        // Initialize customData if not exists
        if (!block.customData) block.customData = {};
        if (!block.customData.outputs) block.customData.outputs = [];
        
        // Add a new output with default name
        const newOutput = `output${block.customData.outputs.length + 1}`;
        block.customData.outputs.push(newOutput);
        
        // Update UI
        const container = document.getElementById('sf-outputs-container');
        container.innerHTML = this.renderFunctionOutputs(block);
        
        // Re-add event listeners
        document.querySelectorAll('.sf-delete-output').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const outputName = e.target.dataset.name;
                this.deleteFunctionOutput(blockId, outputName);
            });
        });
        
        // Also update the block's outputs to match
        this.updateCustomFunctionConnectors(block);
    }
    
    /**
     * Delete a parameter from a custom function block
     */
    deleteFunctionParameter(blockId, paramName) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block || !block.customData || !block.customData.parameters) return;
        
        // Remove the parameter
        block.customData.parameters = block.customData.parameters.filter(p => p !== paramName);
        
        // Update UI
        const container = document.getElementById('sf-parameters-container');
        container.innerHTML = this.renderFunctionParameters(block);
        
        // Re-add event listeners
        document.querySelectorAll('.sf-delete-parameter').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const paramName = e.target.dataset.name;
                this.deleteFunctionParameter(blockId, paramName);
            });
        });
        
        // Also update the block's inputs to match parameters
        this.updateCustomFunctionConnectors(block);
    }
    
    /**
     * Delete an output from a custom function block
     */
    deleteFunctionOutput(blockId, outputName) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block || !block.customData || !block.customData.outputs) return;
        
        // Remove the output
        block.customData.outputs = block.customData.outputs.filter(o => o !== outputName);
        
        // Update UI
        const container = document.getElementById('sf-outputs-container');
        container.innerHTML = this.renderFunctionOutputs(block);
        
        // Re-add event listeners
        document.querySelectorAll('.sf-delete-output').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const outputName = e.target.dataset.name;
                this.deleteFunctionOutput(blockId, outputName);
            });
        });
        
        // Also update the block's outputs to match
        this.updateCustomFunctionConnectors(block);
    }
    
    /**
     * Update custom function block's connectors based on parameters and outputs
     */
    updateCustomFunctionConnectors(block) {
        // Remove old block element
        const oldBlockEl = document.getElementById(`block-${block.id}`);
        if (oldBlockEl) oldBlockEl.remove();
        
        // Update the blockLibrary template for this specific block
        if (!this.blockLibrary.customFunction) {
            this.blockLibrary.customFunction = {
                name: "Custom Functions",
                blocks: {}
            };
        }
        
        this.blockLibrary.customFunction.blocks[block.id] = {
            name: block.options?.name || "Custom Function",
            category: "customFunction",
            inputs: block.customData?.parameters || [],
            outputs: block.customData?.outputs || [],
            options: [
                { name: "name", type: "text", default: "myCustomFunction" }
            ],
            template: (block) => {
                const params = block.customData?.parameters || [];
                const outputs = block.customData?.outputs || [];
                
                let code = `function ${block.options.name || 'customFunction'}(${params.join(', ')}) {\n`;
                
                // Add subflow code if available
                if (block.subflow && block.subflow.code) {
                    code += `    ${block.subflow.code.replace(/\n/g, '\n    ')}\n`;
                } else {
                    // Default return for outputs
                    if (outputs.length === 1) {
                        code += `    return ${outputs[0]};\n`;
                    } else if (outputs.length > 1) {
                        code += `    return { ${outputs.join(', ')} };\n`;
                    } else {
                        code += `    // Function body\n`;
                    }
                }
                
                code += `}`;
                return code;
            }
        };
        
        // Create a new block element
        const blockEl = this.createBlockElement(block);
        this.canvas.appendChild(blockEl);
        
        // Update connections
        this.updateConnections(block.id);
    }
    
    /**
     * Apply property changes to a block
     */
    applyBlockProperties(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block) return;
        
        const blockTemplate = this.blockLibrary[block.category].blocks[block.type];
        
        // Update position
        const newX = parseInt(document.getElementById('sf-prop-x').value);
        const newY = parseInt(document.getElementById('sf-prop-y').value);
        
        block.x = isNaN(newX) ? block.x : newX;
        block.y = isNaN(newY) ? block.y : newY;
        
        // Update options
        if (blockTemplate.options) {
            blockTemplate.options.forEach(option => {
                const optionEl = document.getElementById(`sf-prop-option-${option.name}`);
                if (optionEl) {
                    block.options[option.name] = optionEl.value;
                }
            });
        }
        
        // Update custom function parameters and outputs if applicable
        if (block.category === 'customFunction') {
            if (!block.customData) block.customData = {};
            
            // Update parameters
            const paramInputs = document.querySelectorAll('.sf-parameter-name');
            block.customData.parameters = Array.from(paramInputs).map(input => input.value);
            
            // Update outputs
            const outputInputs = document.querySelectorAll('.sf-output-name');
            block.customData.outputs = Array.from(outputInputs).map(input => input.value);
            
            // Update the block's connectors
            this.updateCustomFunctionConnectors(block);
        } else {
            // Update the block's position in the DOM
            const blockEl = document.getElementById(`block-${block.id}`);
            if (blockEl) {
                blockEl.style.left = `${block.x}px`;
                blockEl.style.top = `${block.y}px`;
                
                // Update block title and options in the DOM
                const titleEl = blockEl.querySelector('.sf-block-title');
                if (titleEl) {
                    titleEl.textContent = blockTemplate.name;
                }
                
                // Update option displays in block
                blockTemplate.options?.forEach(option => {
                    const optionEl = blockEl.querySelector(`[data-option="${option.name}"]`);
                    if (optionEl) {
                        optionEl.value = block.options[option.name] || '';
                    }
                });
                
                // Update connections
                this.updateConnections(block.id);
            }
        }
        
        // Close the property panel
        this.propertyPanel.classList.remove('active');
    }
    
    /**
     * Duplicate a block
     */
    duplicateBlock(blockId) {
        const originalBlock = this.blocks.find(b => b.id === blockId);
        if (!originalBlock) return;
        
        // Create a deep copy of the block
        const newBlock = JSON.parse(JSON.stringify(originalBlock));
        newBlock.id = this.generateUniqueId();
        newBlock.x += 50; // Offset a bit so it's visible
        newBlock.y += 50;
        
        // Add to blocks array
        this.blocks.push(newBlock);
        
        // Create visual representation
        const blockEl = this.createBlockElement(newBlock);
        this.canvas.appendChild(blockEl);
    }
    
    /**
     * Delete a block and its connections
     */
    deleteBlock(blockId) {
        // Remove block from array
        const blockIndex = this.blocks.findIndex(b => b.id === blockId);
        if (blockIndex !== -1) {
            this.blocks.splice(blockIndex, 1);
        }
        
        // Remove block element from DOM
        const blockEl = document.getElementById(`block-${blockId}`);
        if (blockEl) {
            blockEl.remove();
        }
        
        // Remove all connections to/from this block
        const connectionsToRemove = this.connections.filter(
            conn => conn.sourceBlockId === blockId || conn.destBlockId === blockId
        );
        
        connectionsToRemove.forEach(conn => {
            this.deleteConnection(conn.id);
        });
    }
    
    /**
     * Add a custom function block
     */
    addCustomFunction(x, y) {
        const blockId = this.generateUniqueId();
        
        // Create the custom function block
        const block = {
            id: blockId,
            type: blockId, // Use the ID as the type for unique template
            category: 'customFunction',
            x: x || 100,
            y: y || 100,
            inputs: {},
            outputs: {},
            options: {
                name: "myCustomFunction"
            },
            customData: {
                parameters: ["param1"],
                outputs: ["result"]
            },
            subflow: {
                blocks: [],
                connections: [],
                code: "return result;"
            }
        };
        
        // Add the custom function to the block library
        if (!this.blockLibrary.customFunction) {
            this.blockLibrary.customFunction = {
                name: "Custom Functions",
                blocks: {}
            };
        }
        
        this.blockLibrary.customFunction.blocks[blockId] = {
            name: "Custom Function",
            category: "customFunction",
            inputs: block.customData.parameters,
            outputs: block.customData.outputs,
            options: [
                { name: "name", type: "text", default: "myCustomFunction" }
            ],
            template: (block) => {
                const params = block.customData?.parameters || [];
                const outputs = block.customData?.outputs || [];
                
                let code = `function ${block.options.name || 'customFunction'}(${params.join(', ')}) {\n`;
                
                // Add subflow code if available
                if (block.subflow && block.subflow.code) {
                    code += `    ${block.subflow.code.replace(/\n/g, '\n    ')}\n`;
                } else {
                    // Default return for outputs
                    if (outputs.length === 1) {
                        code += `    return ${outputs[0]};\n`;
                    } else if (outputs.length > 1) {
                        code += `    return { ${outputs.join(', ')} };\n`;
                    } else {
                        code += `    // Function body\n`;
                    }
                }
                
                code += `}`;
                return code;
            }
        };
        
        // Add block to blocks array
        this.blocks.push(block);
        
        // Create visual representation
        const blockEl = this.createBlockElement(block);
        this.canvas.appendChild(blockEl);
        
        return blockId;
    }
    
    /**
     * Edit a custom function's subflow
     */
    editSubflow(blockId) {
        const block = this.blocks.find(b => b.id === blockId);
        if (!block || block.category !== 'customFunction') return;
        
        // Initialize subflow if not exists
        if (!block.subflow) {
            block.subflow = {
                blocks: [],
                connections: [],
                code: ""
            };
        }
        
        // Save current flow state
        const currentFlow = {
            name: block.options.name || "Custom Function",
            blocks: this.blocks,
            connections: this.connections
        };
        
        // Add to open subflows stack
        this.openSubflows.push(currentFlow);
        
        // Set the subflow as the active flow
        this.blocks = block.subflow.blocks;
        this.connections = block.subflow.connections;
        
        // Clear canvas and render the subflow
        this.clearCanvas(false); // Don't reset blocks/connections arrays
        
        // Render all blocks and connections
        this.blocks.forEach(block => {
            const blockEl = this.createBlockElement(block);
            this.canvas.appendChild(blockEl);
        });
        
        this.connections.forEach(connection => {
            this.renderConnection(connection);
        });
        
        // Update breadcrumb
        this.updateBreadcrumb();
    }

    /**
     * Process block connections for code generation
     * This ensures class methods are correctly generated
     */
    processBlockConnections() {
        // Reset all nesting relationships before rebuilding them
        this.blocks.forEach(block => {
            block.isNested = false;
            block.isConnectedToClass = false;
            block.childBlocks = [];
            block.parentBlock = null;
            block.classMethod = false;
        });
        
        // First pass: Handle class structure connections
        for (const connection of this.connections) {
            const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
            const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
            
            if (!sourceBlock || !destBlock) continue;
            
            // Class connection (any connector from class to a method-type block EXCEPT out->in)
            if (sourceBlock.type === 'class') {
                if ((destBlock.type === 'constructor' || 
                    destBlock.type === 'function' || 
                    destBlock.type === 'method' || 
                    destBlock.type === 'getter' || 
                    destBlock.type === 'setter')) {
                    
                    // This identifies a class method relationship
                    destBlock.isConnectedToClass = true;
                    destBlock.classMethod = true;
                    
                    // Add to class's child blocks array for proper nesting
                    if (!sourceBlock.childBlocks) sourceBlock.childBlocks = [];
                    if (!sourceBlock.childBlocks.includes(destBlock.id)) {
                        sourceBlock.childBlocks.push(destBlock.id);
                    }
                    
                    // Block is part of a class, not a nested flow child
                    destBlock.isNested = false;
                }
            }
        }
        
        // Second pass: Handle flow connections (out->in)
        for (const connection of this.connections) {
            if (connection.sourceConnector === 'out' && connection.destConnector === 'in') {
                const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
                const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
                
                if (!sourceBlock || !destBlock) continue;
                
                // If this is to/from a class method, handle differently
                if (destBlock.classMethod) continue;
                
                // Flow connections create parent-child relationships for code nesting
                if (!sourceBlock.childBlocks) sourceBlock.childBlocks = [];
                if (!sourceBlock.childBlocks.includes(destBlock.id)) {
                    sourceBlock.childBlocks.push(destBlock.id);
                }
                
                // Mark destination as nested for code generation
                destBlock.isNested = true;
                destBlock.parentBlock = sourceBlock.id;
            }
        }
        
        // Third pass: Handle data connections for inputs/outputs
        for (const connection of this.connections) {
            // Skip flow connections already handled
            if (connection.destConnector === 'in' || connection.sourceConnector === 'out') continue;
            
            const sourceBlock = this.blocks.find(b => b.id === connection.sourceBlockId);
            const destBlock = this.blocks.find(b => b.id === connection.destBlockId);
            
            if (sourceBlock && destBlock) {
                // Initialize input storage if not exists
                if (!destBlock.inputs) destBlock.inputs = {};
                
                // Store connection information for template use
                destBlock.inputs[connection.destConnector] = sourceBlock.id;
            }
        }
    }
    
    /**
     * Generate code for the current flow or subflow
     */
    generateCode() {
        // Process connections for special cases like class methods
        this.processBlockConnections();

        let code = '';
        
        // If we're in a subflow, generate code for the subflow and update the parent
        if (this.openSubflows.length > 0) {
            const currentFlow = this.openSubflows[this.openSubflows.length - 1];
            code = this.generateFlowCode();
            
            // Find the parent block and update its subflow code
            const parentBlock = currentFlow.blocks.find(b => 
                b.category === 'customFunction' && b.options.name === currentFlow.name
            );
            
            if (parentBlock) {
                parentBlock.subflow.code = code;
            }
            
            return code;
        } else {
            // Generate code for the main flow
            return this.generateFlowCode();
        }
    }

    /**
     * Generate code for a specific block
     */
    generateBlockCode(block) {
        const blockTemplate = this.blockLibrary[block.category]?.blocks[block.type];
        if (!blockTemplate) {
            return `/* Block template not found for ${block.id} */`;
        }
        
        // Initialize inputs/outputs if not exists
        if (!block.inputs) block.inputs = {};
        if (!block.outputs) block.outputs = {};
        
        // Process child blocks first to get their content
        this.processChildBlocksContent(block);
        
        // Process input connections
        this.processBlockInputConnections(block);
        
        try {
            if (typeof blockTemplate.template === 'function') {
                return blockTemplate.template(block);
            } else {
                return `/* No template defined for ${blockTemplate.name} */`;
            }
        } catch (error) {
            console.error(`Error in template for ${block.id}:`, error);
            return `/* Error generating code: ${error.message} */`;
        }
    }
    
    /**
     * Generate JavaScript code from the current blocks and connections
     */
    generateFlowCode() {
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
        
        // Process all blocks to collect their connections to special outputs
        const processBlockOutputConnections = () => {
            for (const block of this.blocks) {
                const blockTemplate = this.blockLibrary[block.category]?.blocks[block.type];
                if (!blockTemplate) continue;
                
                if (!block.outputs) block.outputs = {};
                
                // Process connections from special outputs like 'true', 'false', etc.
                if (blockTemplate.outputs) {
                    blockTemplate.outputs.forEach(outputName => {
                        if (outputName === 'out') return; // Skip flow connections
                        
                        // Find connections from this output
                        const connections = this.connections.filter(
                            conn => conn.sourceBlockId === block.id && conn.sourceConnector === outputName
                        );
                        
                        if (connections.length > 0) {
                            const destBlockId = connections[0].destBlockId;
                            const destBlock = this.blocks.find(b => b.id === destBlockId);
                            
                            if (destBlock) {
                                // Generate code for the connected block
                                const destCode = this.generateBlockCode(destBlock);
                                // Store this code in the output of the source block
                                block.outputs[outputName] = destCode;
                                
                                // Mark the destination block as processed so it's not generated again at the root level
                                processedBlocks.add(destBlockId);
                            }
                        }
                    });
                }
            }
        };
        
        // Process all blocks to collect their inputs from other blocks
        const processBlockInputs = () => {
            for (const block of this.blocks) {
                const blockTemplate = this.blockLibrary[block.category]?.blocks[block.type];
                if (!blockTemplate || !blockTemplate.inputs) continue;
                
                if (!block.inputs) block.inputs = {};
                
                // Process all input connectors except 'in' (flow)
                blockTemplate.inputs.forEach(inputName => {
                    if (inputName === 'in') return; // Skip flow connections
                    
                    // Find connections to this input
                    const connections = this.connections.filter(
                        conn => conn.destBlockId === block.id && conn.destConnector === inputName
                    );
                    
                    if (connections.length > 0) {
                        const sourceBlockId = connections[0].sourceBlockId;
                        const sourceConnector = connections[0].sourceConnector;
                        const sourceBlock = this.blocks.find(b => b.id === sourceBlockId);
                        
                        if (sourceBlock) {
                            // Only generate for source blocks that don't have an 'out' connector
                            // or that aren't already a child of another block
                            const hasOutConnector = this.blockLibrary[sourceBlock.category]?.blocks[sourceBlock.type]?.outputs?.includes('out');
                            
                            // Only generate inline code for data blocks (inputs, expressions, etc.)
                            if (!hasOutConnector || sourceBlock.category === 'inputs' || 
                                sourceBlock.category === 'operators' || sourceBlock.type === 'comparison') {
                                const sourceCode = this.generateBlockCode(sourceBlock);
                                if (sourceCode) {
                                    block.inputs[inputName] = sourceCode;
                                    // Mark this block as processed
                                    processedBlocks.add(sourceBlock.id);
                                }
                            }
                        }
                    }
                });
            }
        };
        
        // Execute connection processing functions
        processBlockOutputConnections();
        processBlockInputs();
        
        // Recursive function to generate code for a block and its nested children
        const generateBlockTreeCode = (block, depth = 0) => {
            if (!block || processedBlocks.has(block.id)) return '';
            
            // Mark this block as processed
            processedBlocks.add(block.id);
            
            // Process child blocks that are connected via out->in (nested blocks)
            if (block.childBlocks && block.childBlocks.length > 0) {
                let childBlocksContent = '';
                
                // Generate code for each child block
                for (const childId of block.childBlocks) {
                    const childBlock = this.blocks.find(b => b.id === childId);
                    if (!childBlock || processedBlocks.has(childId)) continue;
                    
                    if (childBlock.isNested || childBlock.isConnectedToClass) {
                        // Recursively process this child's children first (depth-first)
                        this.processChildBlocksForBlock(childBlock, processedBlocks, generateBlockTreeCode, depth + 1);
                        
                        // Now generate code for this child
                        const childCode = this.generateBlockCode(childBlock);
                        if (childCode) {
                            childBlocksContent += childCode + '\n\n';  // Add double line spacing between blocks
                        }
                        
                        // Mark as processed
                        processedBlocks.add(childId);
                    }
                }
                
                // Store the generated content for template use
                block.childBlocksContent = childBlocksContent.trim();
            }
            
            // Generate code for this block using its template
            return this.generateBlockCode(block);
        };
        
        // Process children for specific block and collect their content
        this.processChildBlocksForBlock = (block, processedBlocks, generateBlockTreeCode, depth) => {
            if (!block.childBlocks || block.childBlocks.length === 0) return;
            
            let childContent = '';
            for (const childId of block.childBlocks) {
                const childBlock = this.blocks.find(b => b.id === childId);
                if (!childBlock || processedBlocks.has(childId)) continue;
                
                // Process child's children first
                this.processChildBlocksForBlock(childBlock, processedBlocks, generateBlockTreeCode, depth + 1);
                
                // Generate code for this child
                const childCode = generateBlockTreeCode(childBlock, depth);
                if (childCode) {
                    childContent += childCode + '\n\n';  // Add double line spacing between blocks
                }
            }
            
            block.childBlocksContent = childContent.trim();
        };
        
        // Start with root blocks
        if (rootBlocks.length > 0) {
            for (const rootBlock of rootBlocks) {
                // Skip root blocks that are used as inputs to other blocks or connected to special outputs
                const isUsedAsInput = this.connections.some(conn => 
                    conn.sourceBlockId === rootBlock.id && 
                    (conn.sourceConnector !== 'out' || conn.destConnector !== 'in')
                );
                
                // Skip expression blocks that are used as inputs
                const isExpressionBlock = rootBlock.category === 'operators' || 
                                          rootBlock.category === 'inputs' ||
                                          rootBlock.type === 'comparison';
                
                if (isUsedAsInput && isExpressionBlock) {
                    continue; // Skip generating this as standalone code
                }
                
                // Skip blocks that have already been processed (e.g., as outputs of other blocks)
                if (processedBlocks.has(rootBlock.id)) {
                    continue;
                }
                
                const code = generateBlockTreeCode(rootBlock);
                if (code) {
                    finalCode += code + '\n\n';  // Add double line spacing between root blocks
                }
            }
        } else if (this.blocks.length > 0) {
            // If no root blocks found, generate from all blocks that aren't nested
            for (const block of this.blocks) {
                if (!processedBlocks.has(block.id) && !block.isNested && !block.isConnectedToClass) {
                    // Skip expression blocks that are used as inputs
                    const isUsedAsInput = this.connections.some(conn => 
                        conn.sourceBlockId === block.id && 
                        conn.sourceConnector !== 'out' && 
                        conn.destConnector !== 'in'
                    );
                    
                    const isExpressionBlock = block.category === 'operators' || 
                                              block.category === 'inputs' ||
                                              block.type === 'comparison';
                    
                    if (isUsedAsInput && isExpressionBlock) {
                        continue; // Skip generating this as standalone code
                    }
                    
                    const code = generateBlockTreeCode(block);
                    if (code) {
                        finalCode += code + '\n\n';  // Add double line spacing between blocks
                    }
                }
            }
        }
        
        return finalCode.trim();
    }

    /**
     * Process input connections for a block
     */
    processBlockInputConnections(block) {
        const blockTemplate = this.blockLibrary[block.category]?.blocks[block.type];
        if (!blockTemplate || !blockTemplate.inputs) return;
        
        // Process all input connections
        for (const inputName of blockTemplate.inputs) {
            if (inputName === 'in') continue; // Skip flow connections
            
            // Find connections to this input
            const connections = this.connections.filter(
                conn => conn.destBlockId === block.id && conn.destConnector === inputName
            );
            
            if (connections.length > 0) {
                const sourceBlockId = connections[0].sourceBlockId;
                const sourceBlock = this.blocks.find(b => b.id === sourceBlockId);
                
                if (sourceBlock) {
                    // Special handling for message inputs in utility blocks
                    const isMessageInput = (
                        inputName === 'message' && 
                        (block.type === 'alert' || 
                         block.type.startsWith('console') || 
                         block.type === 'confirm' || 
                         block.type === 'prompt')
                    );
                    
                    // Check if source is a flow control block (if, loop, etc)
                    const isFlowSourceBlock = ['if', 'for', 'while', 'switch'].includes(sourceBlock.type);
                    
                    if (isMessageInput && isFlowSourceBlock) {
                        // Use a default empty string instead of the flow block for message inputs
                        block.inputs[inputName] = "''";
                        continue;
                    }
                    
                    // Generate code for the source block
                    const sourceCode = this.generateBlockCode(sourceBlock);
                    if (sourceCode) {
                        block.inputs[inputName] = sourceCode;
                    }
                }
            }
        }
    }

    /**
     * Process child blocks for a parent to get their content
     */
    processChildBlocksContent(block) {
        if (!block.childBlocks || block.childBlocks.length === 0) {
            block.childBlocksContent = '';
            return;
        }
        
        let childContent = '';
        
        // Process all child blocks
        for (const childId of block.childBlocks) {
            const childBlock = this.blocks.find(b => b.id === childId);
            
            // Skip if not found or already processed as input
            if (!childBlock) continue;
            
            // Process this child's children first
            this.processChildBlocksContent(childBlock);
            
            // Generate the child's code
            const childCode = this.generateBlockCode(childBlock);
            if (childCode) {
                childContent += childCode + '\n';
            }
        }
        
        // Store the generated content for use in templates
        block.childBlocksContent = childContent.trim();
    }

    registerBlockType(category, blockDefinition) {
        if (!this.blockLibrary[category]) {
            this.blockLibrary[category] = {
                name: category,
                blocks: {}
            };
        }
        
        this.blockLibrary[category].blocks[blockDefinition.type] = blockDefinition;
        
        // Refresh the palette
        this.renderPalette();
        
        return blockDefinition.type; // Return the registered type
    }
    
    /**
     * Download the generated code as a JavaScript file
     */
    downloadCode(code) {
        // Prompt for filename
        const filename = prompt("Enter a filename for your code:", "scriptflow-code.js");
        if (!filename) return; // User canceled
        
        // Add .js extension if not present
        const finalFilename = filename.endsWith('.js') ? filename : `${filename}.js`;
        
        const blob = new Blob([code], {type: 'text/javascript'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        this.showNotification(`Code downloaded as ${finalFilename}`, 'success');
    }
    
    /**
     * Save the current flow to a JSON file
     */
    saveFlow() {
        const flowData = {
            blocks: this.blocks,
            connections: this.connections,
            subflows: {}, // Save all custom function subflows
            metadata: {
                version: "1.0.0",
                createdAt: new Date().toISOString(),
                modifiedAt: new Date().toISOString()
            }
        };
        
        // Extract all subflows
        this.blocks.forEach(block => {
            if (block.category === 'customFunction' && block.subflow) {
                flowData.subflows[block.id] = block.subflow;
            }
        });
        
        // Create a dialog for saving the file with a custom name
        const filename = prompt("Enter a name for your flow:", "scriptflow-flow.json");
        if (!filename) return; // User canceled
        
        // Add .json extension if not present
        const finalFilename = filename.endsWith('.json') ? filename : `${filename}.json`;
        
        const blob = new Blob([JSON.stringify(flowData, null, 2)], {type: 'application/json'});
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = finalFilename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        // Show a notification
        this.showNotification(`Flow saved as ${finalFilename}`, 'success');
    }
    
    /**
     * Load a flow from a JSON file
     */
    loadFlow() {
        // Confirm if there are existing blocks
        if (this.blocks.length > 0) {
            if (!confirm('Loading a flow will replace your current work. Are you sure you want to continue?')) {
                return;
            }
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = e => {
            const file = e.target.files[0];
            if (!file) return;
            
            this.showNotification(`Loading flow: ${file.name}`, 'info');
            
            const reader = new FileReader();
            reader.onload = event => {
                try {
                    const flowData = JSON.parse(event.target.result);
                    
                    // Clear the current flow
                    this.clearCanvas();
                    
                    // Restore blocks and connections
                    this.blocks = flowData.blocks;
                    this.connections = flowData.connections;
                    
                    // Restore subflows
                    if (flowData.subflows) {
                        this.blocks.forEach(block => {
                            if (block.category === 'customFunction') {
                                block.subflow = flowData.subflows[block.id] || {
                                    blocks: [],
                                    connections: [],
                                    code: ""
                                };
                            }
                        });
                    }
                    
                    // Render all blocks
                    this.blocks.forEach(block => {
                        // Ensure custom function blocks have their templates in the library
                        if (block.category === 'customFunction') {
                            if (!this.blockLibrary.customFunction) {
                                this.blockLibrary.customFunction = {
                                    name: "Custom Functions",
                                    blocks: {}
                                };
                            }
                            
                            this.blockLibrary.customFunction.blocks[block.id] = {
                                name: block.options.name || "Custom Function",
                                category: "customFunction",
                                inputs: block.customData?.parameters || [],
                                outputs: block.customData?.outputs || [],
                                options: [
                                    { name: "name", type: "text", default: block.options.name || "myCustomFunction" }
                                ],
                                template: this.getCustomFunctionTemplate()
                            };
                        }
                        
                        const blockEl = this.createBlockElement(block);
    
                        // Set size if previously saved
                        if (block.width && block.height) {
                            blockEl.style.width = `${block.width}px`;
                            blockEl.style.height = `${block.height}px`;
                        }
                        
                        this.canvas.appendChild(blockEl);
                    });
                    
                    // Render all connections
                    this.connections.forEach(connection => {
                        this.renderConnection(connection);
                    });
                    
                    this.showNotification(`Flow loaded successfully`, 'success');
                    
                } catch (err) {
                    console.error('Error loading flow:', err);
                    this.showNotification(`Error loading flow: ${err.message}`, 'error');
                }
            };
            
            reader.readAsText(file);
        };
        
        input.click();
    }

    /**
     * Generate code button handler
     */
    generateCodeAction() {
        const code = this.generateCode();
        
        // Create and show code preview dialog
        this.showCodePreviewDialog(code);
        
        // Also pass to callback
        this.options.onCodeGenerated(code);
    }

    /**
     * Basic JavaScript formatting function (fallback if js-beautify is not available)
     */
    formatJavaScript(code) {
        // Split the code into lines
        const lines = code.split('\n');
        const formattedLines = [];
        let indentLevel = 0;
        const indentSize = 2;
        let lastLineWasClosingBrace = false;
        
        // Process each line
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            
            // Add empty line after function or block declarations
            if (i > 0 && lastLineWasClosingBrace && line.length > 0 && !line.startsWith('}') && 
                !line.startsWith(')') && !line.startsWith('else') && !line.startsWith('catch') && 
                !line.startsWith('finally')) {
                formattedLines.push('');
            }
            
            // Adjust indent for closing brackets
            if (line.startsWith('}') || line.startsWith(']')) {
                indentLevel = Math.max(0, indentLevel - 1);
            }
            
            // Add the line with proper indentation
            if (line.length > 0) {
                formattedLines.push(' '.repeat(indentLevel * indentSize) + line);
            } else {
                formattedLines.push('');
            }
            
            // Add empty line after import statements
            if (line.startsWith('import ') && line.endsWith(';')) {
                formattedLines.push('');
            }
            
            // Add empty line after variable declarations ending with semicolons 
            // when the next line isn't another variable declaration
            if (line.endsWith(';') && !line.startsWith('for') && 
                i < lines.length - 1 && lines[i+1].trim().length > 0 && 
                !(lines[i+1].trim().startsWith('let ') || 
                  lines[i+1].trim().startsWith('const ') || 
                  lines[i+1].trim().startsWith('var '))) {
                formattedLines.push('');
            }
            
            // Add empty line before if/else/for/while/function/class statements 
            // when previous line wasn't a related statement
            if ((line.startsWith('if ') || line.startsWith('else ') || 
                 line.startsWith('for ') || line.startsWith('while ') || 
                 line.startsWith('function ') || line.startsWith('class ')) && 
                i > 0 && lines[i-1].trim().length > 0 && 
                !(lines[i-1].trim().startsWith('if ') || 
                  lines[i-1].trim().startsWith('else '))) {
                formattedLines.splice(formattedLines.length - 1, 0, '');
            }
            
            // Adjust indent for opening brackets
            if (line.endsWith('{') || line.endsWith('[') || 
                (line.includes('{') && !line.includes('}') && !line.endsWith(';'))) {
                indentLevel++;
            }
            
            // Handle special cases like if statements without brackets
            if ((line.startsWith('if') || line.startsWith('for') || line.startsWith('while')) && 
                !line.endsWith('{') && !line.endsWith(';')) {
                indentLevel++;
            }
            
            // Reduce indent after special statements that don't have blocks
            if (line.endsWith(';') && indentLevel > 0 && 
                (lines[i-1] && (lines[i-1].trim().startsWith('if') || 
                             lines[i-1].trim().startsWith('for') || 
                             lines[i-1].trim().startsWith('while'))) && 
                (!lines[i-1] || !lines[i-1].includes('{'))) {
                indentLevel--;
            }
            
            // Track if the current line is a closing brace for next-line decisions
            lastLineWasClosingBrace = line.endsWith('}');
        }
        
        return formattedLines.join('\n');
    }

    /**
     * Show code preview dialog
     */
    showCodePreviewDialog(code) {
        // Create dialog if it doesn't exist
        const existingDialog = document.getElementById('sf-code-preview-dialog');
        if (existingDialog) {
            existingDialog.remove();
        }
        
        // Format the code using js-beautify if available, or fallback to basic formatting
        let formattedCode = code;
        if (typeof js_beautify === 'function') {
            // Use js-beautify if loaded
            formattedCode = js_beautify(code, {
                indent_size: 2,
                indent_char: ' ',
                max_preserve_newlines: 2,
                preserve_newlines: true,
                keep_array_indentation: false,
                break_chained_methods: false,
                indent_scripts: 'normal',
                space_before_conditional: true,
                unescape_strings: false,
                jslint_happy: false,
                end_with_newline: true,
                wrap_line_length: 0,
                indent_empty_lines: false,
                comma_first: false,
                brace_style: 'preserve-inline'  // Add this to maintain spacing
            });
        } else {
            // Basic formatting fallback
            formattedCode = this.formatJavaScript(code);
        }
        
        const dialog = document.createElement('div');
        dialog.id = 'sf-code-preview-dialog';
        dialog.className = `sf-dialog sf-theme-${this.options.theme}`;
        
        // Add dialog content
        dialog.innerHTML = `
            <div class="sf-dialog-header">
                <h3>Generated JavaScript Code</h3>
                <div class="sf-dialog-actions">
                    <button class="sf-button" id="sf-format-code" title="Format Code"><i class="sf-icon">⟲</i> Format</button>
                    <button class="sf-button sf-icon-button" id="sf-close-preview" title="Close">×</button>
                </div>
            </div>
            <div class="sf-dialog-content">
                <div id="sf-code-editor-container" style="width: 100%; height: 100%;"></div>
            </div>
            <div class="sf-dialog-footer">
                <button class="sf-button" id="sf-copy-code">Copy to Clipboard</button>
                <button class="sf-button primary" id="sf-download-code">Download as File</button>
            </div>
        `;
        
        document.body.appendChild(dialog);
        
        // Initialize CodeMirror
        const editorContainer = document.getElementById('sf-code-editor-container');
        const cmEditor = CodeMirror(editorContainer, {
            value: formattedCode,
            mode: 'javascript',
            theme: this.options.theme === 'dark' ? 'monokai' : 'default',
            lineNumbers: true,
            lineWrapping: false,
            tabSize: 2,
            indentWithTabs: false,
            smartIndent: true,
            indentUnit: 2,
            autofocus: true,
            scrollbarStyle: 'simple', // With the addon included
            matchBrackets: true,      // With the addon included
            autoCloseBrackets: true,  // With the addon included
            styleActiveLine: true,    // With the addon included
            viewportMargin: Infinity,
            readOnly: false
        });
        
        // Refresh CodeMirror after dialog is fully visible (prevents rendering issues)
        setTimeout(() => {
            cmEditor.refresh();
        }, 10);
        
        // Store the editor reference
        this.codePreviewEditor = cmEditor;
        
        // Add event listeners
        document.getElementById('sf-close-preview').addEventListener('click', () => {
            dialog.remove();
            this.codePreviewEditor = null;
        });
        
        document.getElementById('sf-format-code').addEventListener('click', () => {
            // Format code with either js-beautify or built-in formatter
            if (typeof js_beautify === 'function') {
                const currentCode = cmEditor.getValue();
                const formattedCode = js_beautify(currentCode, {
                    indent_size: 2,
                    indent_char: ' ',
                    max_preserve_newlines: 2,
                    preserve_newlines: true,
                    keep_array_indentation: false,
                    break_chained_methods: false,
                    indent_scripts: 'normal',
                    space_before_conditional: true,
                    unescape_strings: false,
                    jslint_happy: false,
                    end_with_newline: true,
                    wrap_line_length: 0,
                    indent_empty_lines: false,
                    comma_first: false
                });
                cmEditor.setValue(formattedCode);
            } else {
                const currentCode = cmEditor.getValue();
                const formattedCode = this.formatJavaScript(currentCode);
                cmEditor.setValue(formattedCode);
            }
            
            this.showNotification('Code formatted', 'success');
        });
        
        document.getElementById('sf-copy-code').addEventListener('click', () => {
            const codeText = cmEditor.getValue();
            navigator.clipboard.writeText(codeText)
                .then(() => {
                    this.showNotification('Code copied to clipboard', 'success');
                })
                .catch(err => {
                    console.error('Failed to copy code:', err);
                    this.showNotification('Failed to copy code', 'error');
                });
        });
        
        document.getElementById('sf-download-code').addEventListener('click', () => {
            const codeText = cmEditor.getValue();
            this.downloadCode(codeText);
        });
        
        // Add escape key handler
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                dialog.remove();
                this.codePreviewEditor = null;
                document.removeEventListener('keydown', handleKeyDown);
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        
        // Add styles for the dialog
        const style = document.createElement('style');
        style.textContent = `
            .sf-dialog {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 80%;
                max-width: 900px;
                height: 80vh;
                max-height: 800px;
                background-color: var(--sf-bg-color);
                border-radius: 8px;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
                z-index: 10000;
                display: flex;
                flex-direction: column;
                overflow: hidden;
            }
            
            .sf-dialog-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px;
                border-bottom: 1px solid var(--sf-panel-border);
            }
            
            .sf-dialog-header h3 {
                margin: 0;
                font-size: 18px;
            }
            
            .sf-dialog-actions {
                display: flex;
                gap: 8px;
            }
            
            .sf-dialog-content {
                flex: 1;
                padding: 0;
                overflow: hidden;
                position: relative;
            }
            
            .sf-dialog-footer {
                display: flex;
                justify-content: flex-end;
                padding: 12px 16px;
                border-top: 1px solid var(--sf-panel-border);
                gap: 8px;
            }
            
            #sf-code-editor-container {
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            
            #sf-code-editor-container .CodeMirror {
                height: 100%;
                font-family: 'Consolas', 'Monaco', 'Andale Mono', monospace;
                font-size: 14px;
                line-height: 1.5;
            }
            
            .sf-icon {
                font-style: normal;
            }
        `;
        
        document.head.appendChild(style);
    }

    /**
     * Show a notification message
     * @param {string} message - Message text
     * @param {string} type - 'success', 'error', 'info'
     */
    showNotification(message, type = 'info') {
        // Check if notification container exists
        let container = document.getElementById('sf-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'sf-notification-container';
            container.style.position = 'fixed';
            container.style.bottom = '20px';
            container.style.right = '20px';
            container.style.zIndex = '10000';
            document.body.appendChild(container);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `sf-notification sf-notification-${type}`;
        
        // Add icon based on type
        let icon = '';
        switch (type) {
            case 'success':
                icon = '✓';
                break;
            case 'error':
                icon = '✗';
                break;
            case 'info':
            default:
                icon = 'ℹ';
                break;
        }
        
        notification.innerHTML = `
            <span class="sf-notification-icon">${icon}</span>
            <span class="sf-notification-message">${message}</span>
        `;
        
        // Add to container
        container.appendChild(notification);
        
        // Auto-remove after delay
        setTimeout(() => {
            notification.classList.add('sf-notification-hide');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 1000);
        
        // Add styles if not already added
        if (!document.getElementById('sf-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'sf-notification-styles';
            style.textContent = `
                .sf-notification {
                    background-color: rgba(42, 42, 42, 0.9);
                    color: white;
                    padding: 12px 16px;
                    margin-bottom: 10px;
                    border-radius: 6px;
                    box-shadow: 0 3px 10px rgba(0, 0, 0, 0.2);
                    display: flex;
                    align-items: center;
                    min-width: 250px;
                    max-width: 400px;
                    transition: opacity 0.3s, transform 0.3s;
                    opacity: 1;
                    transform: translateX(0);
                }
                
                .sf-notification-hide {
                    opacity: 0;
                    transform: translateX(50px);
                }
                
                .sf-notification-icon {
                    margin-right: 12px;
                    font-size: 18px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                }
                
                .sf-notification-success .sf-notification-icon {
                    background-color: rgba(39, 174, 96, 0.2);
                    color: #2ecc71;
                }
                
                .sf-notification-error .sf-notification-icon {
                    background-color: rgba(231, 76, 60, 0.2);
                    color: #e74c3c;
                }
                
                .sf-notification-info .sf-notification-icon {
                    background-color: rgba(52, 152, 219, 0.2);
                    color: #3498db;
                }
                
                .sf-notification-message {
                    flex: 1;
                    font-size: 14px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    /**
     * Escape HTML special characters to prevent XSS in the code preview
     */
    escapeHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
    
    /**
     * Get the default template function for custom functions
     */
    getCustomFunctionTemplate() {
        return (block) => {
            const params = block.customData?.parameters || [];
            const outputs = block.customData?.outputs || [];
            
            let code = `function ${block.options.name || 'customFunction'}(${params.join(', ')}) {\n`;
            
            // Add subflow code if available
            if (block.subflow && block.subflow.code) {
                code += `    ${block.subflow.code.replace(/\n/g, '\n    ')}\n`;
            } else {
                // Default return for outputs
                if (outputs.length === 1) {
                    code += `    return ${outputs[0]};\n`;
                } else if (outputs.length > 1) {
                    code += `    return { ${outputs.join(', ')} };\n`;
                } else {
                    code += `    // Function body\n`;
                }
            }
            
            code += `}`;
            return code;
        };
    }
    
    /**
     * Clear the canvas
     */
    clearCanvas(resetArrays = true) {
        if (resetArrays) {
            this.blocks = [];
            this.connections = [];
        }
        
        // Remove all block elements
        const blockElements = this.canvas.querySelectorAll('.sf-block');
        blockElements.forEach(el => el.remove());
        
        // Remove all connection elements
        const connectionElements = this.canvas.querySelectorAll('.sf-connection');
        connectionElements.forEach(el => el.remove());
    }
    
    /**
     * Render the palette with all available blocks
     */
    renderPalette() {
        this.palette.innerHTML = '';
        
        // Add search box for blocks
        const searchContainer = document.createElement('div');
        searchContainer.className = 'sf-palette-search-container';
        
        const searchInput = document.createElement('input');
        searchInput.type = 'text';
        searchInput.className = 'sf-palette-search';
        searchInput.placeholder = 'Search blocks...';
        searchInput.addEventListener('input', (e) => {
            this.filterPaletteBlocks(e.target.value);
        });
        
        searchContainer.appendChild(searchInput);
        this.palette.appendChild(searchContainer);
        
        // Render regular categories with collapse/expand functionality
        for (const categoryKey in this.blockLibrary) {
            const category = this.blockLibrary[categoryKey];
            
            const categoryEl = document.createElement('div');
            categoryEl.className = 'sf-category';
            categoryEl.dataset.category = categoryKey;
            
            // Add header with collapse/expand button
            const titleEl = document.createElement('div');
            titleEl.className = 'sf-category-title';
            
            // Add expand/collapse indicator
            const expandIndicator = document.createElement('span');
            expandIndicator.className = 'sf-category-expand';
            expandIndicator.innerHTML = '▼';
            titleEl.appendChild(expandIndicator);
            
            // Add category name
            const titleText = document.createElement('span');
            titleText.textContent = category.name;
            titleEl.appendChild(titleText);
            
            // Add count of blocks
            const blockCount = Object.keys(category.blocks).length;
            const countBadge = document.createElement('span');
            countBadge.className = 'sf-category-count';
            countBadge.textContent = blockCount;
            titleEl.appendChild(countBadge);
            
            categoryEl.appendChild(titleEl);
            
            // Create container for blocks that can be collapsed
            const blocksContainer = document.createElement('div');
            blocksContainer.className = 'sf-category-blocks';
            
            // Get blocks from saved state or default to expanded
            const isCollapsed = localStorage.getItem(`sf-category-${categoryKey}-collapsed`) === 'true';
            if (isCollapsed) {
                blocksContainer.style.display = 'none';
                expandIndicator.innerHTML = '►';
                categoryEl.classList.add('sf-category-collapsed');
            }
            
            // Add click handler for collapse/expand
            titleEl.addEventListener('click', () => {
                const isCurrentlyCollapsed = blocksContainer.style.display === 'none';
                
                if (isCurrentlyCollapsed) {
                    blocksContainer.style.display = '';
                    expandIndicator.innerHTML = '▼';
                    categoryEl.classList.remove('sf-category-collapsed');
                    localStorage.setItem(`sf-category-${categoryKey}-collapsed`, 'false');
                } else {
                    blocksContainer.style.display = 'none';
                    expandIndicator.innerHTML = '►';
                    categoryEl.classList.add('sf-category-collapsed');
                    localStorage.setItem(`sf-category-${categoryKey}-collapsed`, 'true');
                }
            });
            
            // Add blocks to container
            for (const blockKey in category.blocks) {
                const block = category.blocks[blockKey];
                
                const blockEl = document.createElement('div');
                blockEl.className = 'sf-block-template';
                blockEl.textContent = block.name;
                blockEl.dataset.category = categoryKey;
                blockEl.dataset.type = blockKey;
                
                // Make blocks draggable from palette
                blockEl.addEventListener('mousedown', (e) => {
                    this.startBlockDrag(e, categoryKey, blockKey);
                });
                
                blocksContainer.appendChild(blockEl);
            }
            
            categoryEl.appendChild(blocksContainer);
            this.palette.appendChild(categoryEl);
        }
    }
    
    /**
     * Filter palette blocks based on search term
     */
    filterPaletteBlocks(searchTerm) {
        searchTerm = searchTerm.toLowerCase();
        
        const categories = this.palette.querySelectorAll('.sf-category');
        
        categories.forEach(category => {
            const blocks = category.querySelectorAll('.sf-block-template');
            let visibleBlocks = 0;
            
            blocks.forEach(block => {
                const blockName = block.textContent.toLowerCase();
                const categoryName = this.blockLibrary[block.dataset.category].name.toLowerCase();
                
                if (blockName.includes(searchTerm) || categoryName.includes(searchTerm)) {
                    block.style.display = '';
                    visibleBlocks++;
                } else {
                    block.style.display = 'none';
                }
            });
            
            // Show/hide category based on visible blocks
            if (visibleBlocks > 0) {
                category.style.display = '';
                
                // Expand category if hidden but has matches
                if (searchTerm && category.classList.contains('sf-category-collapsed')) {
                    const blocksContainer = category.querySelector('.sf-category-blocks');
                    const expandIndicator = category.querySelector('.sf-category-expand');
                    
                    blocksContainer.style.display = '';
                    expandIndicator.innerHTML = '▼';
                    category.classList.remove('sf-category-collapsed');
                }
                
                // Update count badge
                const countBadge = category.querySelector('.sf-category-count');
                if (countBadge) {
                    countBadge.textContent = visibleBlocks;
                }
            } else {
                // Only hide if we're searching
                if (searchTerm) {
                    category.style.display = 'none';
                }
            }
        });
    }
    
    /**
     * Start dragging a block from the palette
     */
    startBlockDrag(e, categoryKey, blockKey) {
        e.preventDefault();
        
        const rect = e.target.getBoundingClientRect();
        const canvasRect = this.canvas.getBoundingClientRect();
        
        // Calculate proper offsets accounting for canvas scale and position
        this.dragOffsetX = (e.clientX - rect.left) / this.canvasScale;
        this.dragOffsetY = (e.clientY - rect.top) / this.canvasScale;
        
        // Create a new block with correct initial position
        const blockTemplate = this.blockLibrary[categoryKey].blocks[blockKey];
        const blockId = this.generateUniqueId();
        
        // Position block at mouse position, accounting for canvas transform
        const x = (e.clientX - canvasRect.left) / this.canvasScale - this.dragOffsetX;
        const y = (e.clientY - canvasRect.top) / this.canvasScale - this.dragOffsetY;
        
        // Set default size for blocks based on category
        let defaultWidth = 200;
        let defaultHeight = 120;
        
        // Make input blocks smaller by default
        if (categoryKey === 'inputs') {
            defaultWidth = 130;
            defaultHeight = 90;
        }
        
        this.draggedBlock = {
            id: blockId,
            type: blockKey,
            category: categoryKey,
            x: x,
            y: y,
            width: defaultWidth,
            height: defaultHeight,
            inputs: {},
            outputs: {},
            options: {}
        };
        
        // Initialize options with defaults if provided
        if (blockTemplate.options) {
            blockTemplate.options.forEach(option => {
                this.draggedBlock.options[option.name] = option.default || '';
            });
        }
        
        // Create the visual representation
        const blockEl = this.createBlockElement(this.draggedBlock);
        
        // Set initial size
        blockEl.style.width = `${defaultWidth}px`;
        blockEl.style.height = `${defaultHeight}px`;
        
        this.canvas.appendChild(blockEl);
        
        // Add to blocks collection
        this.blocks.push(this.draggedBlock);
    }
    
    /**
     * Create a visual representation of a block
     */
    createBlockElement(block) {
        const blockTemplate = this.blockLibrary[block.category].blocks[block.type];
    
        // Calculate block height at the start of the function
        const numConnectors = Math.max(
            blockTemplate.inputs ? blockTemplate.inputs.length : 0,
            blockTemplate.outputs ? blockTemplate.outputs.length : 0
        );
    
        const minContentHeight = 60; // Base content height
        const connectorSpacing = 30; // Spacing between connectors
        const totalConnectorHeight = numConnectors * connectorSpacing;
        const blockHeight = Math.max(minContentHeight, totalConnectorHeight + 20); // Add padding    
        
        const blockEl = document.createElement('div');
        blockEl.className = `sf-block ${block.category} sf-glass-effect`;
        blockEl.id = `block-${block.id}`;
        blockEl.style.left = `${block.x}px`;
        blockEl.style.top = `${block.y}px`;

        // Add event listener for dragging the block
        blockEl.addEventListener('mousedown', (e) => {
            // Only allow dragging with left mouse button and not on resize handle
            if (e.button !== 0 || e.target.classList.contains('sf-resize-handle')) {
                return;
            }
            
            // Prevent if clicked on an input or select element
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                return;
            }
            
            this.startExistingBlockDrag(e, block.id);
        });
        
        // Create block content with proper structure
        const blockTitle = document.createElement('div');
        blockTitle.className = 'sf-block-title';
        blockTitle.textContent = blockTemplate.name;
        blockEl.appendChild(blockTitle);
    
        // Create a central content area with proper padding to avoid connector overlap
        const blockContent = document.createElement('div');
        blockContent.className = 'sf-block-content';
        blockContent.style.margin = '0 48px'; // Add horizontal margin to avoid overlapping connectors
        blockContent.style.padding = '5px 10px'; // Add padding inside the content area

        // Add a dedicated resize handle element
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'sf-resize-handle';
        resizeHandle.innerHTML = '<svg width="10" height="10" viewBox="0 0 10 10"><path d="M 1,9 L 9,1 M 5,9 L 9,5 M 9,9 L 9,9" stroke="rgba(255,255,255,0.7)" stroke-width="1"/></svg>';
        blockEl.appendChild(resizeHandle);
        
        // Add options UI if any
        if (blockTemplate.options && blockTemplate.options.length > 0) {
            blockTemplate.options.forEach(option => {
                const optionContainer = document.createElement('div');
                optionContainer.className = 'sf-option-container';
                
                const label = document.createElement('label');
                label.textContent = `${option.name}: `;
                optionContainer.appendChild(label);
                
                if (option.type === 'select') {
                    const select = document.createElement('select');
                    select.dataset.option = option.name;
                    
                    option.options.forEach(optValue => {
                        const optEl = document.createElement('option');
                        optEl.value = optValue;
                        optEl.textContent = optValue;
                        if (block.options[option.name] === optValue) {
                            optEl.selected = true;
                        }
                        select.appendChild(optEl);
                    });
                    
                    // Stop propagation to prevent dragging when interacting with options
                    select.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    });
                    
                    select.addEventListener('change', (e) => {
                        block.options[option.name] = e.target.value;
                    });
                    
                    optionContainer.appendChild(select);
                }
                else if (option.type === 'propertyList') {
                    // Property list handler
                    const propertyListContainer = document.createElement('div');
                    propertyListContainer.className = 'sf-property-list-container';
                    
                    // Create container for the property items
                    const propertyItemsContainer = document.createElement('div');
                    propertyItemsContainer.className = 'sf-property-items';
                    propertyItemsContainer.id = `property-list-${block.id}-${option.name}`;
                    
                    // Initialize properties array if not exists
                    if (!block.options[option.name] || !Array.isArray(block.options[option.name])) {
                        block.options[option.name] = option.default || [];
                    }
                    
                    // Add each property item
                    block.options[option.name].forEach((prop, index) => {
                        const propItem = this.createPropertyItem(block.id, option.name, prop, index);
                        propertyItemsContainer.appendChild(propItem);
                    });
                    
                    propertyListContainer.appendChild(propertyItemsContainer);
                    
                    // Add button to add new property
                    const addButton = document.createElement('button');
                    addButton.className = 'sf-button sf-small-button sf-add-property';
                    addButton.textContent = option.addLabel || 'Add Item';
                    addButton.addEventListener('mousedown', (e) => {
                        e.stopPropagation(); // Prevent block dragging
                        
                        // Create new property from template
                        const newProp = {...(option.propertyTemplate || { name: "", value: "" })};
                        block.options[option.name].push(newProp);
                        
                        // Add new property item to UI
                        const propItem = this.createPropertyItem(
                            block.id, 
                            option.name, 
                            newProp, 
                            block.options[option.name].length - 1
                        );
                        
                        propertyItemsContainer.appendChild(propItem);
                    });
                    
                    propertyListContainer.appendChild(addButton);
                    optionContainer.appendChild(propertyListContainer);
                }
                else if (option.type === 'code' || option.type === 'javascript') {
                    // CodeMirror handler
                    const codeContainer = document.createElement('div');
                    codeContainer.className = 'sf-code-container';
                    
                    // Create editor wrapper
                    const editorWrapper = document.createElement('div');
                    editorWrapper.className = 'sf-code-editor-wrapper';
                    editorWrapper.style.width = '100%';
                    editorWrapper.style.height = '120px'; // Initial height
                    
                    // Create textarea for CodeMirror
                    const textarea = document.createElement('textarea');
                    textarea.dataset.option = option.name;
                    textarea.value = block.options[option.name] || option.default || '';
                    
                    editorWrapper.appendChild(textarea);
                    codeContainer.appendChild(editorWrapper);
                    
                    // Initialize CodeMirror (deferred to be safe)
                    setTimeout(() => {
                        if (typeof CodeMirror !== 'undefined') {
                            const editor = CodeMirror.fromTextArea(textarea, {
                                mode: 'javascript',
                                theme: this.options.theme === 'dark' ? 'monokai' : 'default',
                                lineNumbers: true,
                                tabSize: 2,
                                indentWithTabs: false,
                                lineWrapping: true
                            });
                            
                            // Store editor reference on the block for resizing
                            if (!block.editors) block.editors = {};
                            block.editors[option.name] = editor;
                            
                            // Update value on change
                            editor.on('change', () => {
                                block.options[option.name] = editor.getValue();
                            });
                            
                            // Prevent editor interaction from dragging the block
                            editorWrapper.addEventListener('mousedown', e => {
                                e.stopPropagation();
                            });
                            
                            // Handle resizing
                            const resizeObserver = new ResizeObserver(() => {
                                const blockWidth = blockEl.offsetWidth;
                                const editorHeight = blockEl.offsetHeight - 100; // Reserve space for block header and other elements
                                
                                if (editorHeight > 50) {
                                    editorWrapper.style.height = `${editorHeight}px`;
                                    editor.setSize('100%', `${editorHeight}px`);
                                    editor.refresh();
                                }
                            });
                            
                            resizeObserver.observe(blockEl);
                        } else {
                            console.error('CodeMirror not loaded');
                            // Fallback to regular textarea
                            const fallbackArea = document.createElement('textarea');
                            fallbackArea.value = block.options[option.name] || '';
                            fallbackArea.style.width = '100%';
                            fallbackArea.style.height = '100px';
                            fallbackArea.addEventListener('change', (e) => {
                                block.options[option.name] = e.target.value;
                            });
                            fallbackArea.addEventListener('mousedown', e => e.stopPropagation());
                            
                            editorWrapper.innerHTML = '';
                            editorWrapper.appendChild(fallbackArea);
                        }
                    }, 0);
                    
                    optionContainer.appendChild(codeContainer);
                }
                else if (option.type === 'multiline' || option.type === 'textarea') {
                    // Multiline textarea handler
                    const textareaContainer = document.createElement('div');
                    textareaContainer.className = 'sf-textarea-container';
                    
                    // Create textarea wrapper for better resizing
                    const textareaWrapper = document.createElement('div');
                    textareaWrapper.className = 'sf-textarea-wrapper';
                    textareaWrapper.style.width = '100%';
                    
                    // Create textarea
                    const textarea = document.createElement('textarea');
                    textarea.className = 'sf-multiline-textarea';
                    textarea.dataset.option = option.name;
                    textarea.value = block.options[option.name] || option.default || '';
                    textarea.style.width = '100%';
                    textarea.style.minHeight = '60px';
                    textarea.style.maxHeight = '300px';
                    textarea.style.overflow = 'auto';
                    
                    // Update value on change
                    textarea.addEventListener('change', (e) => {
                        block.options[option.name] = e.target.value;
                    });
                    
                    // Prevent textarea from triggering block drag
                    textarea.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    });
                    
                    textareaWrapper.appendChild(textarea);
                    textareaContainer.appendChild(textareaWrapper);
                    
                    // Add auto-resize functionality
                    const resizeObserver = new ResizeObserver(() => {
                        const blockWidth = blockEl.offsetWidth;
                        const textareaHeight = blockEl.offsetHeight - 100; // Reserve space for block header and other elements
                        
                        if (textareaHeight > 50) {
                            textarea.style.height = `${textareaHeight}px`;
                        }
                    });
                    
                    resizeObserver.observe(blockEl);
                    
                    optionContainer.appendChild(textareaContainer);
                } 
                else {
                    const input = document.createElement('input');
                    input.type = option.type;
                    input.dataset.option = option.name;
                    input.value = block.options[option.name] || '';
                    
                    // Stop propagation to prevent dragging when interacting with options
                    input.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                    });
                    
                    input.addEventListener('change', (e) => {
                        block.options[option.name] = e.target.value;
                    });
                    
                    optionContainer.appendChild(input);
                }
                
                blockContent.appendChild(optionContainer);
            });
        }
        
        blockEl.appendChild(blockContent);
        
        // Add input connectors with labels
        if (blockTemplate.inputs && blockTemplate.inputs.length > 0) {
            const inputCount = blockTemplate.inputs.length;
            const regularInputs = blockTemplate.inputs.filter(input => input !== 'in');
            const spacing = blockHeight / (regularInputs.length + 1);
            
            blockTemplate.inputs.forEach((input, index) => {
                const connectorContainer = document.createElement('div');
                
                // Special handling for 'in' connector
                if (input === 'in') {
                    connectorContainer.className = 'sf-connector-container input in';
                    connectorContainer.style.position = 'absolute';
                    connectorContainer.style.left = '50%';
                    connectorContainer.style.top = '-10px'; // Position outside the block
                    connectorContainer.style.transform = 'translateX(-50%)';
                    connectorContainer.style.flexDirection = 'column';
                    
                    // Add connector point - positioned outside the block
                    const connectorHitbox = document.createElement('div');
                    connectorHitbox.className = 'sf-connector-hitbox input';
                    
                    const inputConnector = document.createElement('div');
                    inputConnector.className = 'sf-connector input in-connector';
                    inputConnector.dataset.blockId = block.id;
                    inputConnector.dataset.connectorType = 'input';
                    inputConnector.dataset.connectorName = input;
                    
                    connectorHitbox.appendChild(inputConnector);
                    connectorHitbox.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        this.startConnectionDrag(e, block.id, 'input', input);
                    });
                    
                    // Label positioned inside block, directly under the connector
                    const label = document.createElement('div');
                    label.className = 'sf-connector-label input in-label';
                    label.textContent = input;
                    label.style.textAlign = 'center';
                    label.style.marginTop = '5px';
                    
                    connectorContainer.appendChild(connectorHitbox);
                    connectorContainer.appendChild(label);
                } else {
                    // Regular side input connector
                    const actualIndex = regularInputs.indexOf(input);
                    
                    connectorContainer.className = 'sf-connector-container input';
                    connectorContainer.style.left = '-12px';
                    connectorContainer.style.top = `${spacing * (actualIndex + 1)}px`;
                    connectorContainer.style.zIndex = '10';
                    
                    // Add connector point
                    const connectorHitbox = document.createElement('div');
                    connectorHitbox.className = 'sf-connector-hitbox input';
                    
                    const inputConnector = document.createElement('div');
                    inputConnector.className = 'sf-connector input';
                    inputConnector.dataset.blockId = block.id;
                    inputConnector.dataset.connectorType = 'input';
                    inputConnector.dataset.connectorName = input;
                    
                    connectorHitbox.appendChild(inputConnector);
                    connectorHitbox.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        this.startConnectionDrag(e, block.id, 'input', input);
                    });
                    
                    // Add connector label
                    const label = document.createElement('div');
                    label.className = 'sf-connector-label input';
                    label.textContent = input;
                    
                    // Append in correct order
                    connectorContainer.appendChild(connectorHitbox);
                    connectorContainer.appendChild(label);
                }
                
                blockEl.appendChild(connectorContainer);
            });
        }
        
        // Add output connectors with labels
        if (blockTemplate.outputs && blockTemplate.outputs.length > 0) {
            const outputCount = blockTemplate.outputs.length;
            const regularOutputs = blockTemplate.outputs.filter(output => output !== 'out');
            const spacing = blockHeight / (regularOutputs.length + 1);
            
            blockTemplate.outputs.forEach((output, index) => {
                const connectorContainer = document.createElement('div');
                
                // Special handling for 'out' connector
                if (output === 'out') {
                    connectorContainer.className = 'sf-connector-container output out';
                    connectorContainer.style.position = 'absolute';
                    connectorContainer.style.left = '50%';
                    connectorContainer.style.bottom = '-10px'; // Position outside block
                    connectorContainer.style.transform = 'translateX(-50%)';
                    connectorContainer.style.flexDirection = 'column-reverse';
                    
                    // Add connector point - positioned outside the block
                    const connectorHitbox = document.createElement('div');
                    connectorHitbox.className = 'sf-connector-hitbox output';
                    
                    const outputConnector = document.createElement('div');
                    outputConnector.className = 'sf-connector output out-connector';
                    outputConnector.dataset.blockId = block.id;
                    outputConnector.dataset.connectorType = 'output';
                    outputConnector.dataset.connectorName = output;
                    
                    connectorHitbox.appendChild(outputConnector);
                    connectorHitbox.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        this.startConnectionDrag(e, block.id, 'output', output);
                    });
                    
                    // Label positioned inside block, directly above the connector
                    const label = document.createElement('div');
                    label.className = 'sf-connector-label output out-label';
                    label.textContent = output;
                    label.style.textAlign = 'center';
                    label.style.marginBottom = '5px';
                    
                    connectorContainer.appendChild(label);
                    connectorContainer.appendChild(connectorHitbox);
                } else {
                    // Regular side output connector
                    const actualIndex = regularOutputs.indexOf(output);
                    
                    connectorContainer.className = 'sf-connector-container output';
                    connectorContainer.style.right = '-12px';
                    connectorContainer.style.top = `${spacing * (actualIndex + 1)}px`;
                    connectorContainer.style.zIndex = '10';
                    
                    // Add connector point
                    const connectorHitbox = document.createElement('div');
                    connectorHitbox.className = 'sf-connector-hitbox output';
                    
                    const outputConnector = document.createElement('div');
                    outputConnector.className = 'sf-connector output';
                    outputConnector.dataset.blockId = block.id;
                    outputConnector.dataset.connectorType = 'output';
                    outputConnector.dataset.connectorName = output;
                    
                    connectorHitbox.appendChild(outputConnector);
                    connectorHitbox.addEventListener('mousedown', (e) => {
                        e.stopPropagation();
                        this.startConnectionDrag(e, block.id, 'output', output);
                    });
                    
                    // Add connector label
                    const label = document.createElement('div');
                    label.className = 'sf-connector-label output';
                    label.textContent = output;
                    
                    // Append in correct order
                    connectorContainer.appendChild(label);
                    connectorContainer.appendChild(connectorHitbox);
                }
                
                blockEl.appendChild(connectorContainer);
            });
        }
    
        // Set minimum height for the block
        blockEl.style.minHeight = `${blockHeight}px`;
        
        // Make the block draggable and selectable
        resizeHandle.addEventListener('mousedown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            this.isResizing = true;
            this.resizingBlock = block;
            
            const startX = e.clientX;
            const startY = e.clientY;
            const startWidth = blockEl.offsetWidth;
            const startHeight = blockEl.offsetHeight;
            
            const onMouseMove = (e) => {
                if (!this.isResizing) return;
                
                const dx = e.clientX - startX;
                const dy = e.clientY - startY;
                
                // Calculate new dimensions with minimum size constraints
                const newWidth = Math.max(150, startWidth + dx);
                const newHeight = Math.max(90, startHeight + dy);
                
                blockEl.style.width = `${newWidth}px`;
                blockEl.style.height = `${newHeight}px`;
                
                // Update connections while resizing
                this.updateConnections(block.id);
            };
            
            const onMouseUp = () => {
                if (this.isResizing) {
                    // Save the new size to block data
                    const style = window.getComputedStyle(blockEl);
                    block.width = parseInt(style.width);
                    block.height = parseInt(style.height);
                    
                    this.isResizing = false;
                    this.resizingBlock = null;
                    
                    // Update connections one final time
                    this.updateConnections(block.id);
                }
                
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            };
            
            document.addEventListener('mousemove', onMouseMove);
            document.addEventListener('mouseup', onMouseUp);
        });

        // Make the block resizable
        blockEl.addEventListener('mouseup', (e) => {
            // After resizing, update connections since connector positions may have changed
            if (e.target === blockEl || e.target.closest('.sf-block') === blockEl) {
                this.updateConnections(block.id);
                
                // Save the new size to block data
                const style = window.getComputedStyle(blockEl);
                block.width = parseInt(style.width);
                block.height = parseInt(style.height);
            }
        });

        // Adjust connector positions based on block height
        const adjustConnectorPositions = () => {
            // Make sure in/out connectors are properly positioned
            const inConnector = blockEl.querySelector('.sf-connector-container.input.in');
            if (inConnector) {
                inConnector.style.left = '50%';
                inConnector.style.top = '-10px';
            }
            
            const outConnector = blockEl.querySelector('.sf-connector-container.output.out');
            if (outConnector) {
                outConnector.style.left = '50%';
                outConnector.style.bottom = '-10px';
            }
            
            // Update regular input connectors
            const regularInputs = blockTemplate.inputs ? blockTemplate.inputs.filter(i => i !== 'in') : [];
            if (regularInputs.length > 0) {
                const blockHeight = blockEl.offsetHeight;
                const spacing = blockHeight / (regularInputs.length + 1);
                
                blockEl.querySelectorAll('.sf-connector-container.input:not(.in)').forEach((container, idx) => {
                    container.style.top = `${spacing * (idx + 1)}px`;
                });
            }
            
            // Update regular output connectors
            const regularOutputs = blockTemplate.outputs ? blockTemplate.outputs.filter(o => o !== 'out') : [];
            if (regularOutputs.length > 0) {
                const blockHeight = blockEl.offsetHeight;
                const spacing = blockHeight / (regularOutputs.length + 1);
                
                blockEl.querySelectorAll('.sf-connector-container.output:not(.out)').forEach((container, idx) => {
                    container.style.top = `${spacing * (idx + 1)}px`;
                });
            }
        };

        // Add resize observer to keep connectors properly positioned
        const resizeObserver = new ResizeObserver(() => {
            adjustConnectorPositions();
            this.updateConnections(block.id);
        });

        resizeObserver.observe(blockEl);

        // Set initial size if previously saved
        if (block.width && block.height) {
            blockEl.style.width = `${block.width}px`;
            blockEl.style.height = `${block.height}px`;
        }
        
        // Add additional style to prevent connector and option interference
        const additionalStyle = document.createElement('style');
        additionalStyle.textContent = `
            #block-${block.id} .sf-option-container {
                pointer-events: auto;
                position: relative;
                z-index: 5;
            }
            
            #block-${block.id} .sf-option-container input,
            #block-${block.id} .sf-option-container select {
                pointer-events: auto;
                position: relative;
                z-index: 5;
            }
            
            #block-${block.id} .sf-connector-hitbox {
                z-index: 10;
            }
        `;
        document.head.appendChild(additionalStyle);
        
        return blockEl;
    }
    
    /**
     * Start connection drag
     */
    startConnectionDrag(e, blockId, connectorType, connectorName) {
        e.preventDefault();
        
        this.isCreatingConnection = true;
        this.connectionStartBlock = this.blocks.find(block => block.id === blockId);
        this.connectionStartType = connectorType;
        this.connectionStartName = connectorName;
        
        // Create temporary connection line
        this.tempConnection = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.tempConnection.classList.add('sf-connection');
        this.tempConnection.style.position = 'absolute';
        this.tempConnection.style.width = '100%';
        this.tempConnection.style.height = '100%';
        this.tempConnection.style.pointerEvents = 'none';
        this.tempConnection.style.zIndex = '1';
        
        this.tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        this.tempPath.setAttribute('stroke', '#e74c3c');
        this.tempPath.setAttribute('stroke-width', '2');
        this.tempPath.setAttribute('fill', 'none');
        
        this.tempConnection.appendChild(this.tempPath);
        this.canvas.appendChild(this.tempConnection);
        
        // Update the connection line as mouse moves
        const onMouseMove = (e) => {
            if (this.isCreatingConnection) {
                this.updateTempConnection(e);
            }
        };
        
        // Finish connection on mouse up
        const onMouseUp = (e) => {
            if (this.isCreatingConnection) {
                this.finishConnection(e);
                this.isCreatingConnection = false;
                
                document.removeEventListener('mousemove', onMouseMove);
                document.removeEventListener('mouseup', onMouseUp);
            }
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    }

    /**
     * Select a block and update visual feedback
     */
    selectBlock(blockId) {
        // Remove selection from all blocks
        document.querySelectorAll('.sf-block').forEach(blockEl => {
            blockEl.classList.remove('sf-block-selected');
        });
        
        // Add selection to the current block
        const blockEl = document.getElementById(`block-${blockId}`);
        if (blockEl) {
            blockEl.classList.add('sf-block-selected');
        }
        
        // Store the currently selected block ID
        this.selectedBlockId = blockId;
    }
    
    /**
     * Open the ScriptFlow modal dialog
     */
    openModal() {
        this.modal.classList.add('active');
    }
    
    /**
     * Close the ScriptFlow modal dialog
     */
    closeModal() {
        if (this.blocks.length > 0) {
            if (!confirm('Are you sure you want to close the editor? Any unsaved changes will be lost.')) {
                return;
            }
        }
        this.modal.classList.remove('active');
    }

    /**
     * Generate a unique ID for blocks and connections
     */
    generateUniqueId() {
        return 'id_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Handle mouse move on canvas
     */
    onCanvasMouseMove(e) {
        // Only handle dragging if not currently resizing
        if (this.draggedBlock && !this.isResizing) {
            const canvasRect = this.canvas.getBoundingClientRect();
            
            // Apply proper scaling and offset calculations
            const x = (e.clientX - canvasRect.left) / this.canvasScale - this.canvasOffsetX;
            const y = (e.clientY - canvasRect.top) / this.canvasScale - this.canvasOffsetY;
            
            // Calculate potential new position
            let newX = x - this.dragOffsetX + this.canvasOffsetX;
            let newY = y - this.dragOffsetY + this.canvasOffsetY;
            
            // Get canvas bounds (accounting for block size)
            const blockEl = document.getElementById(`block-${this.draggedBlock.id}`);
            let blockWidth = 200;  // Default width
            let blockHeight = 120; // Default height
            
            if (blockEl) {
                blockWidth = blockEl.offsetWidth;
                blockHeight = blockEl.offsetHeight;
            }
            
            // Calculate canvas boundaries
            // We're using the canvas element's client width/height which accounts for any padding/border
            const canvasWidth = this.canvas.clientWidth;
            const canvasHeight = this.canvas.clientHeight;
            
            // Constrain X position (allowing partial overflow to ensure connecters remain accessible)
            newX = Math.max(-blockWidth/2, newX); // Don't allow blocks to go too far left
            newX = Math.min(canvasWidth - blockWidth/2, newX); // Don't allow blocks to go too far right
            
            // Constrain Y position (allowing partial overflow to ensure connecters remain accessible)
            newY = Math.max(-blockHeight/2, newY); // Don't allow blocks to go too far up
            newY = Math.min(canvasHeight - blockHeight/2, newY); // Don't allow blocks to go too far down
            
            // Update block position with constraints
            this.draggedBlock.x = newX;
            this.draggedBlock.y = newY;
            
            // Update visual position
            if (blockEl) {
                blockEl.style.left = `${this.draggedBlock.x}px`;
                blockEl.style.top = `${this.draggedBlock.y}px`;
                
                // Update connections for this block
                this.updateConnections(this.draggedBlock.id);
            }
        }
        
        if (this.isCreatingConnection) {
            this.updateTempConnection(e);
        }
    }

    /**
     * Handle mouse up on canvas
     */
    onCanvasMouseUp(e) {
        if (this.draggedBlock) {
            const blockEl = document.getElementById(`block-${this.draggedBlock.id}`);
            if (blockEl) {
                blockEl.style.cursor = '';
            }
            document.body.style.cursor = '';
            this.draggedBlock = null;
        }
        
        if (this.isCreatingConnection) {
            this.finishConnection(e);
            this.isCreatingConnection = false;
            
            if (this.tempConnection) {
                this.tempConnection.remove();
                this.tempConnection = null;
            }
        }
    }

   /**
     * Start dragging an existing block - FIXED VERSION
     */
    startExistingBlockDrag(e, blockId) {
        e.preventDefault();
        e.stopPropagation();
        
        if (this.isResizing) return; // Don't start drag during resize
        
        const blockEl = document.getElementById(`block-${blockId}`);
        if (!blockEl) return;
        
        this.draggedBlock = this.blocks.find(b => b.id === blockId);
        if (!this.draggedBlock) return;
        
        // Fix the offset calculation by accounting for canvas transforms
        const canvasRect = this.canvas.getBoundingClientRect();
        const blockRect = blockEl.getBoundingClientRect();
        
        // Calculate offset in the transformed coordinate system
        this.dragOffsetX = (e.clientX - blockRect.left) / this.canvasScale;
        this.dragOffsetY = (e.clientY - blockRect.top) / this.canvasScale;
        
        // Select this block (if not already selected)
        if (this.selectedBlockId !== blockId) {
            this.selectBlock(blockId);
        }
        
        // Set cursor to grabbing during drag
        document.body.style.cursor = 'grabbing';
        blockEl.style.cursor = 'grabbing';
    }

    /**
     * Update the temporary connection line during drag
     */
    updateTempConnection(e) {
        if (!this.tempConnection || !this.tempPath) return;
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const startBlockEl = document.getElementById(`block-${this.connectionStartBlock.id}`);
        if (!startBlockEl) return;
        
        let startConnector;
        if (this.connectionStartType === 'output') {
            startConnector = startBlockEl.querySelector(`.sf-connector.output[data-connector-name="${this.connectionStartName}"]`);
        } else {
            startConnector = startBlockEl.querySelector(`.sf-connector.input[data-connector-name="${this.connectionStartName}"]`);
        }
        
        if (!startConnector) return;
        
        const startRect = startConnector.getBoundingClientRect();
        const startX = (startRect.left + startRect.width / 2 - canvasRect.left) / this.canvasScale;
        const startY = (startRect.top + startRect.height / 2 - canvasRect.top) / this.canvasScale;
        
        const endX = (e.clientX - canvasRect.left) / this.canvasScale;
        const endY = (e.clientY - canvasRect.top) / this.canvasScale;
        
        // Show visual feedback for potential connections
        const potentialTarget = this.findPotentialConnectionTarget(e);
        if (potentialTarget) {
            // Highlight the potential target
            potentialTarget.classList.add('sf-connector-highlight');
            
            // Use the potential target's position instead of the mouse position
            const targetRect = potentialTarget.getBoundingClientRect();
            const targetX = (targetRect.left + targetRect.width / 2 - canvasRect.left) / this.canvasScale;
            const targetY = (targetRect.top + targetRect.height / 2 - canvasRect.top) / this.canvasScale;
            
            // Create bezier curve
            const dx = Math.abs(targetX - startX) * 0.5;
            const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${targetX - dx} ${targetY}, ${targetX} ${targetY}`;
            
            this.tempPath.setAttribute('d', pathData);
            this.tempPath.setAttribute('stroke', '#27ae60'); // Green color for valid connection

            // Set appropriate color based on connection type
            const isFlowConnection = 
            (this.connectionStartName === 'out' || 
            potentialTarget.dataset.connectorName === 'in');
        
            if (isFlowConnection) {
                this.tempPath.setAttribute('stroke', 'rgba(186, 85, 211, 0.8)'); // Purple for valid flow
            } else {
                this.tempPath.setAttribute('stroke', 'rgba(52, 152, 219, 0.8)'); // Blue for valid data
            }
        } else {
            // Remove highlights from all connectors
            document.querySelectorAll('.sf-connector-highlight').forEach(el => {
                el.classList.remove('sf-connector-highlight');
            });
            
            // Create bezier curve to mouse position
            const dx = Math.abs(endX - startX) * 0.5;
            const pathData = `M ${startX} ${startY} C ${startX + dx} ${startY}, ${endX - dx} ${endY}, ${endX} ${endY}`;
            
            this.tempPath.setAttribute('d', pathData);
            this.tempPath.setAttribute('stroke', '#e74c3c'); // Red color for invalid connection
        }
    }

    /**
     * Finish creating a connection
     */
    finishConnection(e) {
        if (!this.isCreatingConnection) return;
        
        // Find if we're over a connector hitbox or connector
        const element = document.elementFromPoint(e.clientX, e.clientY);
        if (!element) return;
        
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
            return;
        }
        
        const endBlockId = connector.dataset.blockId;
        const endType = connector.dataset.connectorType;
        const endName = connector.dataset.connectorName;
        
        // Make sure we're connecting from output to input (or input to output)
        if (this.connectionStartType === endType) {
            if (this.tempConnection) {
                this.tempConnection.remove();
                this.tempConnection = null;
            }
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
    }

    /**
     * Zoom the canvas around a specific point
     */
    zoomCanvasAroundPoint(delta, x, y) {
        const oldScale = this.canvasScale;
        const newScale = Math.min(Math.max(this.canvasScale + delta, 0.2), 3);
        
        // Calculate the real-world coordinates before zoom
        const worldX = x / oldScale - this.canvasOffsetX;
        const worldY = y / oldScale - this.canvasOffsetY;
        
        this.canvasScale = newScale;
        
        // Calculate the new screen coordinates after zoom
        const newScreenX = worldX * newScale + this.canvasOffsetX * newScale;
        const newScreenY = worldY * newScale + this.canvasOffsetY * newScale;
        
        // Calculate the offset required to keep the point under the mouse
        const deltaX = (x - newScreenX) / newScale;
        const deltaY = (y - newScreenY) / newScale;
        
        // Update the canvas offset
        this.canvasOffsetX += deltaX;
        this.canvasOffsetY += deltaY;
        
        this.canvas.style.transform = `scale(${this.canvasScale}) translate(${this.canvasOffsetX}px, ${this.canvasOffsetY}px)`;
        document.getElementById('sf-zoom-level').textContent = `${Math.round(this.canvasScale * 100)}%`;
        
        // Update all connections to account for the new zoom level
        this.updateAllConnections();
    }

    /**
     * Find a potential connection target during dragging
     */
    findPotentialConnectionTarget(e) {
        // Get elements at mouse position
        const elements = document.elementsFromPoint(e.clientX, e.clientY);
        
        // Look for connector or connector hitbox
        for (const element of elements) {
            // Check if the element is a connector or inside a connector hitbox
            if (element.classList.contains('sf-connector') || 
                element.closest('.sf-connector-hitbox')) {
                
                const connector = element.classList.contains('sf-connector') ? 
                    element : element.querySelector('.sf-connector');
                    
                if (connector) {
                    // Make sure we're connecting compatible types (input to output or vice versa)
                    const connType = connector.dataset.connectorType;
                    if (connType !== this.connectionStartType) {
                        return connector;
                    }
                }
            }
        }
        
        return null;
    }

    /**
     * Render a connection between blocks
     */
    renderConnection(connection) {
        const sourceBlockEl = document.getElementById(`block-${connection.sourceBlockId}`);
        const destBlockEl = document.getElementById(`block-${connection.destBlockId}`);
        
        if (!sourceBlockEl || !destBlockEl) return;
        
        // Find the connector within the container
        const sourceConnectors = sourceBlockEl.querySelectorAll(`.sf-connector.output[data-connector-name="${connection.sourceConnector}"]`);
        const destConnectors = destBlockEl.querySelectorAll(`.sf-connector.input[data-connector-name="${connection.destConnector}"]`);
        
        if (sourceConnectors.length === 0 || destConnectors.length === 0) return;
        
        const sourceConnector = sourceConnectors[0];
        const destConnector = destConnectors[0];
        
        const canvasRect = this.canvas.getBoundingClientRect();
        const sourceRect = sourceConnector.getBoundingClientRect();
        const destRect = destConnector.getBoundingClientRect();
        
        const sourceX = (sourceRect.left + sourceRect.width / 2 - canvasRect.left) / this.canvasScale;
        const sourceY = (sourceRect.top + sourceRect.height / 2 - canvasRect.top) / this.canvasScale;
        const destX = (destRect.left + destRect.width / 2 - canvasRect.left) / this.canvasScale;
        const destY = (destRect.top + destRect.height / 2 - canvasRect.top) / this.canvasScale;
        
        // Create SVG element for connection
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
        
        // Determine if this is a flow connection (in/out)
        const isFlowConnection = 
        (connection.sourceConnector === 'out' || connection.destConnector === 'in');
    
        if (isFlowConnection) {
            path.setAttribute('data-connection-type', 'flow');
            path.setAttribute('stroke', 'rgba(186, 85, 211, 0.8)'); // Purple for flow
            path.setAttribute('stroke-width', '2.5');
        } else {
            path.setAttribute('data-connection-type', 'data');
            path.setAttribute('stroke', 'rgba(52, 152, 219, 0.8)'); // Blue for data
            path.setAttribute('stroke-width', '2');
        }
        
        path.setAttribute('fill', 'none');
        
        // Create bezier curve
        const dx = Math.abs(destX - sourceX) * 0.5;
        const pathData = `M ${sourceX} ${sourceY} C ${sourceX + dx} ${sourceY}, ${destX - dx} ${destY}, ${destX} ${destY}`;
        
        path.setAttribute('d', pathData);
        path.style.pointerEvents = 'auto'; // Allow clicking on the path
        
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
            const sourceTemplate = this.blockLibrary[sourceBlock.category].blocks[sourceBlock.type];
            const destTemplate = this.blockLibrary[destBlock.category].blocks[destBlock.type];
            
            path.setAttribute('title', 
                `${sourceTemplate.name} (${connection.sourceConnector}) → ${destTemplate.name} (${connection.destConnector})`
            );
        }
    }

    /**
     * Create a property item row with name/value fields and remove button
     */
    createPropertyItem(blockId, optionName, property, index) {
        const container = document.createElement('div');
        container.className = 'sf-property-item';
        container.dataset.index = index;
        
        // Name field
        const nameInput = document.createElement('input');
        nameInput.type = 'text';
        nameInput.className = 'sf-property-name';
        nameInput.value = property.name || '';
        nameInput.placeholder = 'Name';
        nameInput.addEventListener('change', (e) => {
            const block = this.blocks.find(b => b.id === blockId);
            if (block && block.options[optionName] && block.options[optionName][index]) {
                block.options[optionName][index].name = e.target.value;
            }
        });
        nameInput.addEventListener('mousedown', e => e.stopPropagation());
        
        // Value field
        const valueInput = document.createElement('input');
        valueInput.type = 'text';
        valueInput.className = 'sf-property-value';
        valueInput.value = property.value || '';
        valueInput.placeholder = 'Value';
        valueInput.addEventListener('change', (e) => {
            const block = this.blocks.find(b => b.id === blockId);
            if (block && block.options[optionName] && block.options[optionName][index]) {
                block.options[optionName][index].value = e.target.value;
            }
        });
        valueInput.addEventListener('mousedown', e => e.stopPropagation());
        
        // Remove button
        const removeButton = document.createElement('button');
        removeButton.className = 'sf-button sf-icon-button sf-remove-property';
        removeButton.textContent = '×';
        removeButton.addEventListener('mousedown', (e) => {
            e.stopPropagation();
            
            const block = this.blocks.find(b => b.id === blockId);
            if (block && block.options[optionName]) {
                // Remove property from data
                block.options[optionName].splice(index, 1);
                
                // Rebuild all property items to update indices
                const container = document.getElementById(`property-list-${blockId}-${optionName}`);
                if (container) {
                    container.innerHTML = '';
                    
                    block.options[optionName].forEach((prop, idx) => {
                        const propItem = this.createPropertyItem(blockId, optionName, prop, idx);
                        container.appendChild(propItem);
                    });
                }
            }
        });
        
        // Assemble
        container.appendChild(nameInput);
        container.appendChild(valueInput);
        container.appendChild(removeButton);
        
        return container;
    }

    /**
     * Update all connections associated with a block
     */
    updateConnections(blockId) {
        // Find all connections that involve this block
        const relatedConnections = this.connections.filter(
            conn => conn.sourceBlockId === blockId || conn.destBlockId === blockId
        );
        
        // Remove old connections from DOM
        relatedConnections.forEach(conn => {
            const connectionEl = document.getElementById(`connection-${conn.id}`);
            if (connectionEl) {
                connectionEl.remove();
            }
        });
        
        // Re-render connections
        relatedConnections.forEach(conn => {
            this.renderConnection(conn);
        });
    }

    /**
     * Update all connections on the canvas
     */
    updateAllConnections() {
        // Remove all existing connection elements
        const connectionElements = this.canvas.querySelectorAll('.sf-connection');
        connectionElements.forEach(el => el.remove());
        
        // Re-render all connections
        this.connections.forEach(connection => {
            this.renderConnection(connection);
        });
    }
}

/**
 * Initialize a sample flow for demonstration purposes
 */
function initializeDemoFlow() {
    // Make sure ScriptFlow is available
    if (!window.scriptFlow) {
        console.error('ScriptFlow not initialized');
        return;
    }
    
    // Clear any existing blocks/connections
    window.scriptFlow.clearCanvas();
    
    // Create blocks with specific IDs to reference them later for connections
    const blocks = [
        // Event handler block
        { id: 'btn1', type: 'addEventListener', category: 'dom', x: 100, y: 100, 
        options: { }, inputs: { 
            element: "document.getElementById('demo-button')", 
            eventType: "'click'" 
        }
        },
        
        // Variable declaration
        { id: 'var1', type: 'declare', category: 'variable', x: 100, y: 250, 
        options: { name: 'message', type: 'const' }, 
        inputs: { value: "'Hello from ScriptFlow!'" }
        },
        
        // Console log block
        { id: 'log1', type: 'consoleLog', category: 'utilities', x: 100, y: 350, 
        options: { label: 'Message' }, inputs: { }
        },
        
        // Alert block
        { id: 'alert1', type: 'alert', category: 'utilities', x: 100, y: 450, 
        options: { }, inputs: { }
        },
        
        // DOM manipulation 
        { id: 'dom1', type: 'querySelector', category: 'dom', x: 400, y: 180, 
        options: { }, inputs: { selector: "'.result'" }
        },
        
        // Set text content
        { id: 'text1', type: 'textContent', category: 'dom', x: 400, y: 300, 
        options: { }, inputs: { }
        },
        
        // Counter variable
        { id: 'counter', type: 'declare', category: 'variable', x: 400, y: 400, 
        options: { name: 'counter', type: 'let' }, inputs: { value: '0' }
        },
        
        // Increment counter
        { id: 'inc1', type: 'arithmetic', category: 'operators', x: 400, y: 500, 
        options: { operator: '+' }, inputs: { 
            leftOperand: 'counter', 
            rightOperand: '1' 
        }
        },
        
        // Set counter value
        { id: 'set1', type: 'set', category: 'variable', x: 400, y: 600, 
        options: { name: 'counter' }, inputs: { }
        }
    ];
    
    // Add all blocks to the workspace
    blocks.forEach(blockData => {
        const block = {
        id: blockData.id,
        type: blockData.type,
        category: blockData.category,
        x: blockData.x,
        y: blockData.y,
        options: blockData.options || {},
        inputs: blockData.inputs || {}
        };
        
        window.scriptFlow.blocks.push(block);
        
        // Create visual representation
        const blockEl = window.scriptFlow.createBlockElement(block);
        window.scriptFlow.canvas.appendChild(blockEl);
    });
    
    // Create connections between blocks
    const connections = [
        // Flow connections (out -> in)
        { id: 'conn1', sourceBlockId: 'btn1', sourceConnector: 'out', destBlockId: 'var1', destConnector: 'in' },
        { id: 'conn2', sourceBlockId: 'var1', sourceConnector: 'out', destBlockId: 'log1', destConnector: 'in' },
        { id: 'conn3', sourceBlockId: 'log1', sourceConnector: 'out', destBlockId: 'alert1', destConnector: 'in' },
        { id: 'conn4', sourceBlockId: 'alert1', sourceConnector: 'out', destBlockId: 'dom1', destConnector: 'in' },
        { id: 'conn5', sourceBlockId: 'dom1', sourceConnector: 'out', destBlockId: 'text1', destConnector: 'in' },
        { id: 'conn6', sourceBlockId: 'text1', sourceConnector: 'out', destBlockId: 'counter', destConnector: 'in' },
        { id: 'conn7', sourceBlockId: 'counter', sourceConnector: 'out', destBlockId: 'inc1', destConnector: 'in' },
        { id: 'conn8', sourceBlockId: 'inc1', sourceConnector: 'out', destBlockId: 'set1', destConnector: 'in' },
        
        // Data connections
        { id: 'conn9', sourceBlockId: 'var1', sourceConnector: 'value', destBlockId: 'log1', destConnector: 'message' },
        { id: 'conn10', sourceBlockId: 'var1', sourceConnector: 'value', destBlockId: 'alert1', destConnector: 'message' },
        { id: 'conn11', sourceBlockId: 'dom1', sourceConnector: 'element', destBlockId: 'text1', destConnector: 'element' },
        { id: 'conn12', sourceBlockId: 'var1', sourceConnector: 'value', destBlockId: 'text1', destConnector: 'content' },
        { id: 'conn13', sourceBlockId: 'inc1', sourceConnector: 'result', destBlockId: 'set1', destConnector: 'value' }
    ];
    
    // Add all connections
    connections.forEach(conn => {
        window.scriptFlow.connections.push(conn);
        window.scriptFlow.renderConnection(conn);
    });
    
    // Generate code to show the output
    const code = window.scriptFlow.generateCode();
    if (typeof window.scriptFlow.options.onCodeGenerated === 'function') {
        window.scriptFlow.options.onCodeGenerated(code);
    }
    
    // Show a notification that the demo has been loaded
    window.scriptFlow.showNotification('Demo flow loaded', 'success');
    }

/**
 * Global function to open the ScriptFlow modal
 */
function openScriptFlowModal() {
    if (window.scriptFlow) {
        window.scriptFlow.openModal();
    } else {
        window.scriptFlow = new ScriptFlow();
        window.scriptFlow.openModal();
    }
}
