// Main application object
const app = {
  // Store data
  layerGroups: [],
  selectedOutputPath: '',
  lastSavedFile: null,

  // Initialize the application
  async init() {
    console.log('NFT Generator initializing...');

    // Get DOM elements
    this.layerTreeElement = document.getElementById('layer-tree');
    this.numImagesInput = document.getElementById('num-images');
    this.outputPathInput = document.getElementById('output-path');
    this.browseBtn = document.getElementById('browse-btn');
    this.generateBtn = document.getElementById('generate-btn');
    this.statusElement = document.getElementById('status');
    this.collectionNameInput = document.getElementById('collection-name');
    this.collectionDescriptionInput = document.getElementById('collection-description');
    this.generateMetadataCheckbox = document.getElementById('generate-metadata');
    this.startIndexInput = document.getElementById('start-index');
    this.startIndexHelp = document.querySelector('.start-index .help-text');
    this.generateBtn.disabled = true;

    this.saveFormatSelect = document.getElementById('save-format');
    this.pngOptions = document.getElementById('png-options');
    this.jpegOptions = document.getElementById('jpeg-options');
    this.pngCompression = document.getElementById('png-compression');
    this.jpegQuality = document.getElementById('jpeg-quality');

    // Event listeners
    this.browseBtn.addEventListener('click', () => this.browseForFolder());
    this.generateBtn.addEventListener('click', () => this.generateNFTs());
    this.saveFormatSelect.addEventListener('change', () => this.toggleSaveOptions());

    this.pngCompression.addEventListener('change', () => {
      // Ensure value is within range
      let value = parseInt(this.pngCompression.value);
      if (isNaN(value)) value = 0;
      value = Math.max(0, Math.min(9, value));
      this.pngCompression.value = value;
    });

    this.jpegQuality.addEventListener('change', () => {
      // Ensure value is within range
      let value = parseInt(this.jpegQuality.value);
      if (isNaN(value)) value = 90;
      value = Math.max(0, Math.min(100, value));
      this.jpegQuality.value = value;
    });

    // Initialize the visible options based on default selection
    this.toggleSaveOptions();

    // Try to load the layer structure
    try {
      await this.loadLayerStructure();
      this.showStatus('Layer structure loaded successfully');
    } catch (error) {
        console.error('Error loading layers:', error);
        this.showStatus('Error loading layers: ' + error.message, 'error');
    }
  },

  toggleSaveOptions() {
    const format = this.saveFormatSelect.value;
    console.log('Format changed to:', format); // Debug log

    if (format === 'png') {
        // Show PNG options, hide JPEG options
        this.pngOptions.classList.remove('hidden');
        this.jpegOptions.classList.add('hidden');
    } else {
        // Hide PNG options, show JPEG options
        this.pngOptions.classList.add('hidden');
        this.jpegOptions.classList.remove('hidden');
    }
  },

  // Load layer structure from the active document
  async loadLayerStructure() {
      try {
          // Get Photoshop and the active document
          const photoshop = require('photoshop');
          const app = photoshop.app;

          if (!app.documents.length) {
              this.showStatus('No document open in Photoshop', 'error');
              return;
          }

          const doc = app.activeDocument;
          console.log('Document loaded:', doc.name);

          // Process all layers recursively
          this.layerGroups = await this.processLayers(doc.layers);

          // Render the layer tree
          this.renderLayerTree();
      } catch (error) {
          console.error('Error in loadLayerStructure:', error);
          throw error;
      }
  },

  // Process layers recursively
  async processLayers(layers) {
    const result = [];

    for (let i = 0; i < layers.length; i++) {
        const layer = layers[i];

        if (layer.kind === 'group') {
            // Determine if this is a container group or a selection group
            // We'll consider it a container if ALL its children are groups
            const isContainer = layer.layers.every(child => child.kind === 'group');

            const groupData = {
                id: layer.id,
                name: layer.name,
                type: 'group',
                selected: false,
                expanded: false,
                isContainer: isContainer, // Add this flag
                children: await this.processLayers(layer.layers)
            };

            result.push(groupData);
        } else {
            // Process regular layer
            const layerData = {
                id: layer.id,
                name: layer.name,
                type: 'layer',
                rarity: 1.0
            };

            result.push(layerData);
        }
    }

    return result;
  },

  // Render the layer tree in the UI
  renderLayerTree() {
      if (!this.layerGroups || this.layerGroups.length === 0) {
          this.layerTreeElement.innerHTML = '<div class="error">No layers found in document</div>';
          return;
      }

      this.layerTreeElement.innerHTML = '';

      // Create the tree recursively
      this.layerGroups.forEach(group => {
          if (group.type === 'group') {
              const groupElement = this.createGroupElement(group);
              this.layerTreeElement.appendChild(groupElement);
          }
      });
  },

  // Create a group element for the UI
  createGroupElement(group) {
      const groupDiv = document.createElement('div');
      groupDiv.className = 'layer-group';
      groupDiv.dataset.id = group.id;

      // Create header
      const header = document.createElement('div');
      header.className = 'layer-header';

      // Create toggle icon
      const toggleIcon = document.createElement('span');
      toggleIcon.className = 'toggle-icon';
      toggleIcon.textContent = group.expanded ? '▼' : '►';
      toggleIcon.addEventListener('click', () => {
          group.expanded = !group.expanded;
          toggleIcon.textContent = group.expanded ? '▼' : '►';
          childrenDiv.classList.toggle('hidden');
      });

      // Create checkbox
      if (!group.isContainer) {
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = group.selected;
        checkbox.addEventListener('change', () => {
            group.selected = checkbox.checked;
            // Update rarity sum display
            this.updateRaritySum(group, raritySum);
        });
        header.appendChild(checkbox);
    } else {
        // Add a spacer div with the same width as the checkbox for alignment
        const spacer = document.createElement('div');
        spacer.style.width = '30px';
        spacer.style.height = '14px';
        spacer.style.margin = '6px';
        spacer.style.border = '1px';
        spacer.style.display = 'inline-block';
        header.appendChild(spacer);
    }

      // Create name span
      const nameSpan = document.createElement('span');
      nameSpan.className = 'layer-name';
      nameSpan.textContent = group.name;

      // Create rarity sum display
      const raritySum = document.createElement('span');
      raritySum.className = 'rarity-sum';
      this.updateRaritySum(group, raritySum);

      // Add elements to header
      header.appendChild(toggleIcon);
      header.appendChild(nameSpan);
      header.appendChild(raritySum);
      groupDiv.appendChild(header);

      // Create children container
      const childrenDiv = document.createElement('div');
      childrenDiv.className = 'layer-children';
      if (!group.expanded) {
          childrenDiv.classList.add('hidden');
      }

      // Add child elements
      if (group.children && group.children.length > 0) {
          group.children.forEach(child => {
              if (child.type === 'group') {
                  const childGroup = this.createGroupElement(child);
                  childrenDiv.appendChild(childGroup);
              } else if (child.type === 'layer') {
                  const layerItem = this.createLayerElement(child, group, raritySum);
                  childrenDiv.appendChild(layerItem);
              }
          });
      }

      groupDiv.appendChild(childrenDiv);
      return groupDiv;
  },

  createLayerElement(layer, parentGroup, raritySum) {
    const layerDiv = document.createElement('div');
    layerDiv.className = 'layer-item';
    layerDiv.dataset.id = layer.id;

    // Create wrapper for the layer name to help with overflow handling
    const nameWrapper = document.createElement('div');
    nameWrapper.className = 'layer-name-wrapper';
    nameWrapper.style.overflow = 'hidden';
    nameWrapper.style.flex = '1';
    nameWrapper.style.minWidth = '0'; // Important for text truncation

    // Create name span
    const nameSpan = document.createElement('span');
    nameSpan.className = 'layer-name';
    nameSpan.textContent = layer.name;

    // Add name span to wrapper
    nameWrapper.appendChild(nameSpan);

    // Add name wrapper to the div
    layerDiv.appendChild(nameWrapper);

    // Create rarity container
    const rarityContainer = document.createElement('div');
    rarityContainer.className = 'rarity-container';

    // Create rarity label
    const rarityLabel = document.createElement('span');
    rarityLabel.className = 'rarity-label';
    rarityLabel.textContent = 'Rarity:';

    // Create rarity input
    const rarityInput = document.createElement('input');
    rarityInput.type = 'number';
    rarityInput.className = 'rarity-input';
    rarityInput.min = 0;
    rarityInput.step = 1;
    rarityInput.value = layer.rarity || 1;
    rarityInput.addEventListener('change', () => {
        layer.rarity = parseFloat(rarityInput.value);
        // Update rarity sum display
        this.updateRaritySum(parentGroup, raritySum);
    });

    // Add label and input to rarity container
    rarityContainer.appendChild(rarityLabel);
    rarityContainer.appendChild(rarityInput);

    // Add rarity container to the layer div
    layerDiv.appendChild(rarityContainer);

    return layerDiv;
  },

  // Update rarity sum display
  updateRaritySum(group, rarityElement) {
    if (group.isContainer) {
        rarityElement.textContent = '';
        rarityElement.classList.remove('error');
        return;
    }

    if (!group.children || group.children.length === 0) {
        rarityElement.textContent = 'Sum: 0';
        return;
    }

    // Check if any layer has a negative rarity (this is the only invalid case)
    const hasNegativeRarity = group.children
        .filter(child => child.type === 'layer')
        .some(layer => (parseFloat(layer.rarity) || 0) < 0);

    // Calculate sum of weights for non-group children
    const sum = group.children
        .filter(child => child.type === 'layer')
        .reduce((total, layer) => total + (parseFloat(layer.rarity) || 0), 0);

    // Display the total weight
    rarityElement.textContent = `Rarity Sum: ${sum.toFixed(2)}`;

    // Only add error class if we have negative rarities
    if (hasNegativeRarity) {
        rarityElement.classList.add('error');
    } else {
        rarityElement.classList.remove('error');
    }
  },

  // Browse for output folder
  async browseForFolder() {
    try {
        const fs = require('uxp').storage.localFileSystem;
        const folder = await fs.getFolder();

        if (folder) {
            this.selectedOutputPath = folder.nativePath;
            this.outputPathInput.value = folder.nativePath;
            this.generateBtn.disabled = false; // Enable the button once path is selected
            this.showStatus(`Output folder selected: ${folder.nativePath}`);
        }
    } catch (error) {
        console.error('Error browsing for folder:', error);
        this.showStatus('Error selecting folder: ' + error.message, 'error');
    }
  },

  // Validate rarity values
  validateRarities() {
    let allValid = true;
    const validationMessages = [];

    const validateGroup = (group) => {
        if (group.selected && group.children) {
            // Get non-group children (layers)
            const layers = group.children.filter(child => child.type === 'layer');

            if (layers.length > 0) {
                // Check if all weights are positive numbers
                const invalidLayers = layers.filter(layer => {
                    const weight = parseFloat(layer.rarity);
                    return isNaN(weight) || weight < 0;
                });

                if (invalidLayers.length > 0) {
                    allValid = false;
                    validationMessages.push(`Group "${group.name}" has ${invalidLayers.length} layers with invalid weights (must be positive numbers)`);
                }

                // Calculate total weight for display
                const totalWeight = layers.reduce((total, layer) =>
                    total + (parseFloat(layer.rarity) || 0), 0);

                // Check if total weight is greater than 0
                if (totalWeight <= 0) {
                    allValid = false;
                    validationMessages.push(`Group "${group.name}" has a total weight of 0 (at least one layer must have a positive weight)`);
                }
            }

            // Validate nested groups
            group.children
                .filter(child => child.type === 'group')
                .forEach(validateGroup);
        }
    };

    // Start validation for top-level groups
    this.layerGroups.forEach(validateGroup);

    // Show validation results
    if (allValid) {
        this.showStatus('All weight values are valid!', 'success');
    } else {
        let message = 'Weight validation failed:\n- ' + validationMessages.join('\n- ');
        this.showStatus(message, 'error');
    }

    return allValid;
  },

  // Validate collection info
  validateCollectionInfo() {
    const collectionName = this.collectionNameInput.value.trim();
    const collectionDescription = this.collectionDescriptionInput.value.trim();

    if (!collectionName) {
        this.showStatus('Please enter a name for your NFTs', 'error');
        return false;
    }

    return true;
  },

  // Create output folder structure
  async createOutputFolders(fs, baseFolder) {
    try {
        // Create images folder
        let imagesFolder;
        try {
            imagesFolder = await baseFolder.getEntry('images');
        } catch (e) {
            imagesFolder = await baseFolder.createFolder('images');
        }

        let jsonFolder = null;
        // Only create JSON folder if metadata generation is enabled
        if (this.generateMetadataCheckbox.checked) {
          try {
            jsonFolder = await baseFolder.getEntry('json');
          } catch (e) {
            jsonFolder = await baseFolder.createFolder('json');
          }
        }

        return { imagesFolder, jsonFolder };
    } catch (error) {
        console.error('Error creating folder structure:', error);
        throw new Error('Failed to create output folder structure: ' + error.message);
    }
  },

  // Generate metadata JSON for an NFT
  generateMetadata(nftIndex, selectedLayers, extension) {
    const collectionName = this.collectionNameInput.value.trim();
    const collectionDescription = this.collectionDescriptionInput.value.trim();

    // Build attributes array
    const attributes = [];
    for (const selection of selectedLayers) {
        attributes.push({
            trait_type: selection.groupName,
            value: selection.layerName
        });
    }

    // Determine the correct image type
    const imageType = extension === 'png' ? 'image/png' : 'image/jpeg';

    // Create metadata object
    const metadata = {
        name: `${collectionName} #${nftIndex}`,
        description: collectionDescription,
        image: `${nftIndex}.${extension}`,
        attributes: attributes,
        properties: {
            files: [{ uri: `${nftIndex}.${extension}`, type: imageType }],
            category: "image"
        }
    };

    return JSON.stringify(metadata, null, 2);
  },

  // Save JSON file
  async saveJsonFile(folder, fileName, content) {
    try {
        const file = await folder.createFile(fileName, { overwrite: true });
        await file.write(content);
        return file;
    } catch (error) {
        console.error('Error saving JSON file:', error);
        throw error;
    }
  },

  // Generate NFT images
  async generateNFTs() {
    // Validation code
    if (!this.validateCollectionInfo()) {
        return;
    }

    // Check number of images
    const numImages = parseInt(this.numImagesInput.value, 10);
    if (isNaN(numImages) || numImages < 1) {
        this.showStatus('Please enter a valid number of images', 'error');
        return;
    }

    // Get the start index
    const startIndex = parseInt(this.startIndexInput.value, 10);
    if (isNaN(startIndex) || startIndex < 0) {
      this.showStatus('Start index must be a non-negative number', 'error');
      return;
    }

    // Check output path
    if (!this.selectedOutputPath) {
        this.showStatus('Please select an output folder', 'error');
        return;
    }

    try {
        this.generateBtn.disabled = true;
        this.showStatus(`Starting generation of ${numImages} NFT images...`);

        // Get Photoshop references
        const photoshop = require('photoshop');
        const app = photoshop.app;
        const doc = app.activeDocument;

        // Get selected groups and their layers
        const selectedGroups = this.getSelectedGroups();

        if (selectedGroups.length === 0) {
            this.showStatus('No layer groups selected for generation', 'error');
            this.generateBtn.disabled = false;
            return;
        }

        // Get filesystem access
        const fs = require('uxp').storage.localFileSystem;
        let baseFolder;

        try {
            // Try to get the folder from the path
            baseFolder = await fs.getFolder(this.selectedOutputPath);
        } catch (error) {
            // If we can't get it directly, let the user choose one
            this.showStatus('Could not access the specified output folder. Please select a folder.', 'error');
            baseFolder = await fs.getFolder();

            if (baseFolder) {
                this.selectedOutputPath = baseFolder.nativePath;
                this.outputPathInput.value = baseFolder.nativePath;
            } else {
                this.showStatus('No output folder selected.', 'error');
                this.generateBtn.disabled = false;
                return;
            }
        }

        // Create folder structure
        const { imagesFolder, jsonFolder } = await this.createOutputFolders(fs, baseFolder);
        this.showStatus('Created output folder structure');

        // speed up layer lookups with layer cache
        this.buildLayerCache(doc.layers);

        // Create an array to store all NFT configurations
        const nftConfigurations = [];
        const format = this.saveFormatSelect.value;
        const extension = format === 'png' ? 'png' : 'jpg';

        // Pre-calculate all layer selections for all NFTs
        for (let i = 0; i < numImages; i++) {
            const nftIndex = startIndex + i;
            const selectedLayerInfo = [];
            const selectedLayerIds = [];

            // For each selected group, choose a layer based on rarity
            for (const group of selectedGroups) {
                // Select one layer based on rarity
                const selectedLayerId = this.selectLayerByRarity(group);
                if (!selectedLayerId) continue;

                // Find the selected layer data
                const selectedLayerData = group.children.find(layer => layer.id === selectedLayerId);
                if (selectedLayerData) {
                    selectedLayerInfo.push({
                        groupName: group.name,
                        layerName: selectedLayerData.name
                    });
                }

                // Add to our selected layer IDs list
                selectedLayerIds.push(selectedLayerId);
            }

            // Store this NFT's configuration
            nftConfigurations.push({
                nftIndex,
                selectedLayerInfo,
                selectedLayerIds,
                fileName: `${nftIndex}.${extension}`
            });
        }

        // Process NFTs in batches (here we process all at once)
        this.showStatus(`Preparing to generate ${numImages} NFTs...`);

        // Single modal execution for all layer setup
        try {
            await photoshop.core.executeAsModal(async () => {
                // Only suspend history inside modal for performance
                this.suspendHistory(doc);
                
                // Process each NFT configuration one by one
                for (let i = 0; i < nftConfigurations.length; i++) {
                    const config = nftConfigurations[i];
                    
                    // Update status outside of intensive operations
                    if (i % 5 === 0) { // Update every 5 NFTs instead of every NFT
                        this.showStatus(`Processing NFT ${i + 1} of ${numImages}...`);
                    }
                    
                    this.applyVisibilityState(doc, config.selectedLayerIds);
        
                    // Save the current NFT
                    if (format === 'png') {
                        await this.saveAsPNG(doc, imagesFolder, config.fileName);
                    } else {
                        await this.saveAsJPEG(doc, imagesFolder, config.fileName);
                    }
        
                    // Minimal delay to prevent UI freezing
                    if (i % 10 === 0) { // Only delay every 10 NFTs
                        await new Promise(resolve => setTimeout(resolve, 25));
                    }
                }
        
                // Restore history
                this.restoreHistory(doc);
            }, { commandName: "Generating NFTs" }); // Shorter, more descriptive name
            
        } catch (modalError) {
            throw new Error(modalError.message || modalError.toString());
        }

        // Generate all metadata if needed
        if (this.generateMetadataCheckbox.checked) {
            this.showStatus(`Generating metadata files...`);

            // Create a batch of promises for metadata generation
            const metadataPromises = nftConfigurations.map(async (config, index) => {
                // Generate metadata JSON
                const jsonContent = this.generateMetadata(
                    config.nftIndex,
                    config.selectedLayerInfo,
                    extension
                );

                // Save JSON file
                return this.saveJsonFile(
                    jsonFolder,
                    `${config.nftIndex}.json`,
                    jsonContent
                );
            });

            // Process metadata in parallel batches to speed up
            // Process in chunks of 10 to avoid overwhelming the filesystem
            const batchSize = 10;
            for (let i = 0; i < metadataPromises.length; i += batchSize) {
                const batch = metadataPromises.slice(i, i + batchSize);
                await Promise.all(batch);

                // Update status occasionally
                if (i % 50 === 0) {
                    this.showStatus(`Generated metadata for ${i} of ${numImages} NFTs...`);
                }
            }
        }

        this.clearLayerCache();

        if (this.generateMetadataCheckbox.checked) {
            this.showStatus(`Successfully generated ${numImages} NFT images and metadata!`, 'success');
        } else {
            this.showStatus(`Successfully generated ${numImages} NFT images without metadata!`, 'success');
        }

    } catch (error) {
        console.error('Error generating NFTs:', error);
        const errorMessage = error.message || 'An unknown error occurred while generating NFTs';
        this.showStatus('Error generating NFTs: ' + errorMessage, 'error');
        this.clearLayerCache();
    } finally {
        this.generateBtn.disabled = false;
    }
  },

// Add this method to your app object to build a layer cache
buildLayerCache(layers) {
    // Create a cache object if it doesn't exist
    if (!this.layerCache) {
        this.layerCache = new Map();
    }

    // Recursive function to add layers to cache
    const addToCache = (layers) => {
        for (const layer of layers) {
            // Add this layer to cache using its ID as key
            this.layerCache.set(layer.id, layer);

            // Process child layers if this is a group
            if (layer.layers && layer.layers.length > 0) {
                addToCache(layer.layers);
            }
        }
    };

    // Build the cache
    addToCache(layers);

    return this.layerCache;
    },

  // Helper function to find a layer by name
  findLayerByName(layers, name) {
    for (const layer of layers) {
        if (layer.name === name) {
            return layer;
        }

        if (layer.layers && layer.layers.length > 0) {
            const found = this.findLayerByName(layer.layers, name);
            if (found) {
                return found;
            }
        }
    }

    return null;
  },

  // Get selected groups
  getSelectedGroups() {
      const result = [];

      // Recursive function to collect selected groups
      const collectSelectedGroups = (groups) => {
          for (const group of groups) {
              if (group.type === 'group') {
                  if (group.selected) {
                      result.push(group);
                  }

                  // Check children
                  if (group.children) {
                      collectSelectedGroups(
                          group.children.filter(child => child.type === 'group')
                      );
                  }
              }
          }
      };

      collectSelectedGroups(this.layerGroups);
      return result;
  },

  // Select a layer from a group based on weight
  selectLayerByRarity(group) {
    // Get layers (non-group children)
    const layers = group.children.filter(child => child.type === 'layer');
    if (!layers || layers.length === 0) {
        return null;
    }

    // Filter out layers with zero or negative weights
    const validLayers = layers.filter(layer => {
        const weight = parseFloat(layer.rarity) || 0;
        return weight > 0;
    });

    // If no valid layers, return null
    if (validLayers.length === 0) {
        return null;
    }

    // Calculate total weight
    const totalWeight = validLayers.reduce((sum, layer) =>
        sum + (parseFloat(layer.rarity) || 0), 0);

    // Generate random number between 0 and totalWeight
    const random = Math.random() * totalWeight;

    // Find corresponding layer
    let currentWeight = 0;
    for (const layer of validLayers) {
        currentWeight += parseFloat(layer.rarity) || 0;
        if (random <= currentWeight) {
            return layer.id;
        }
    }

    // Fallback to last layer
    return validLayers[validLayers.length - 1].id;
  },

  // This replaces individual layer visibility operations with a more efficient approach
  applyVisibilityState(doc, layerIds) {
    // Create a map for quick lookup of layers that should be visible
    const visibilityMap = new Set(layerIds);

    // Recursive function to apply visibility
    const setVisibility = (layers) => {
        for (const layer of layers) {
            // Set layer visibility based on if it's in our map
            const shouldBeVisible = visibilityMap.has(layer.id);

            // Only change visibility if necessary
            if (layer.visible !== shouldBeVisible) {
                layer.visible = shouldBeVisible;
            }

            // If this is a layer group that contains one of our target layers,
            // we need to make it visible and check its children
            if (layer.layers && layer.layers.length > 0) {
                // Check if any children need to be visible
                const hasVisibleChildren = this.layerGroupHasVisibleDescendant(layer, visibilityMap);

                // If any children need to be visible, this group must be visible
                if (hasVisibleChildren) {
                    layer.visible = true;
                    // Recurse into children
                    setVisibility(layer.layers);
                }
            }
        }
    };

    // Apply visibility changes
    setVisibility(doc.layers);
  },

  // Helper method to check if any descendant needs to be visible
  layerGroupHasVisibleDescendant(group, visibilityMap) {
        if (visibilityMap.has(group.id)) return true;

        if (group.layers && group.layers.length > 0) {
            for (const child of group.layers) {
                if (visibilityMap.has(child.id)) return true;

                if (child.layers && child.layers.length > 0) {
                    // Recursive check for deeper layer groups
                    if (this.layerGroupHasVisibleDescendant(child, visibilityMap)) {
                        return true;
                    }
                }
            }
        }

        return false;
  },

  suspendHistory(doc) {
    // Get the application
    const photoshop = require('photoshop');
    const app = photoshop.app;

    // Store the current active history state
    this.historyState = doc.activeHistoryState;

    // Attempt to suspend history - this is a performance optimization
    try {
        // Different ways to handle history depending on Photoshop version
        if (app.preferences.hasKey("performancePrefs") &&
            app.preferences.performancePrefs.hasKey("maximumHistoryStates")) {
            // Store original value
            this.originalHistoryStates = app.preferences.performancePrefs.maximumHistoryStates;

            // Temporarily reduce history states to minimum
            app.preferences.performancePrefs.maximumHistoryStates = 1;
        }

        // Some versions support suspendHistory directly
        if (typeof doc.suspendHistory === 'function') {
            doc.suspendHistory = true;
        }
    } catch (e) {
        console.log('History suspension not supported in this version', e);
    }
  },

  // Add a companion method to restore history
  restoreHistory(doc) {
    // Get the application
    const photoshop = require('photoshop');
    const app = photoshop.app;

    try {
        // Restore original history settings
        if (app.preferences.hasKey("performancePrefs") &&
            app.preferences.performancePrefs.hasKey("maximumHistoryStates") &&
            this.originalHistoryStates !== undefined) {
            app.preferences.performancePrefs.maximumHistoryStates = this.originalHistoryStates;
        }

        // If suspendHistory was supported
        if (typeof doc.suspendHistory === 'function') {
            doc.suspendHistory = false;
        }

        // Optionally, revert to original history state
        if (this.historyState) {
            doc.activeHistoryState = this.historyState;
        }
    } catch (e) {
        console.log('Error restoring history settings', e);
    }
  },

  // Helper to find a layer by ID
  findLayerById(layers, id) {
    // If we have a cache, use it for faster lookup
    if (this.layerCache && this.layerCache.has(id)) {
        return this.layerCache.get(id);
    }

    // If no cache or layer not in cache, fall back to traversal
    for (const layer of layers) {
        if (layer.id === id) {
            return layer;
        }

        // Check in child layers if this is a group
        if (layer.layers && layer.layers.length > 0) {
            const found = this.findLayerById(layer.layers, id);
            if (found) {
                return found;
            }
        }
    }

    return null;
  },

  // clear the cache when needed
  clearLayerCache() {
        if (this.layerCache) {
            this.layerCache.clear();
        }
  },

  // Save as JPEG
  async saveAsJPEG(doc, folder, fileName) {
    try {
        const photoshop = require('photoshop');
        const fs = require('uxp').storage.localFileSystem;

        // Check if file exists - but do it outside the modal execution
        let fileExists = false;
        try {
            await folder.getEntry(fileName);
            fileExists = true;
        } catch (e) {
            // File doesn't exist
        }

        if (fileExists) {
            const errorMsg = `File ${fileName} already exists, will not overwrite`;
            console.error(errorMsg);
            this.showStatus(errorMsg, 'error');
            throw new Error(errorMsg);
        }

        // Create file outside of modal execution to reduce overhead
        const file = await folder.createFile(fileName, { overwrite: true });
        const quality = parseInt(this.jpegQuality.value);

        // Configure save options outside modal execution
        const saveOptions = {
            quality: quality,
            optimized: true, // Use optimized encoding
            progressive: false // Progressive JPEGs are slower to save
        };

        // Save file with optimized options
        // No need for a separate modal execution - this will happen in our batch modal context
        await doc.saveAs.jpg(file, saveOptions, true);

        this.lastSavedFile = {
            path: folder.nativePath,
            name: fileName,
            format: 'JPEG',
            index: fileName.split('.')[0]
        };

        if (this.startIndexHelp) {
            this.startIndexHelp.innerHTML = `Last saved: <strong>${this.lastSavedFile.name}</strong> in ${this.lastSavedFile.path}`;
        }

        return file;
    } catch (error) {
        const errorMsg = error.message || 'Unknown error occurred while saving JPEG';
        console.error('Error saving JPEG:', errorMsg);
        throw new Error(errorMsg);
    }
  },

  // Save as PNG
  async saveAsPNG(doc, folder, fileName) {
    try {
        const photoshop = require('photoshop');
        const fs = require('uxp').storage.localFileSystem;

        // Check if file exists - but do it outside the modal execution
        let fileExists = false;
        try {
            await folder.getEntry(fileName);
            fileExists = true;
        } catch (e) {
            // File doesn't exist
        }

        if (fileExists) {
            const errorMsg = `File ${fileName} already exists, will not overwrite`;
            console.error(errorMsg);
            this.showStatus(errorMsg, 'error');
            throw new Error(errorMsg);
        }

        // Create file outside of modal execution to reduce overhead
        const file = await folder.createFile(fileName, { overwrite: true });
        const compression = parseInt(this.pngCompression.value);

        // Configure save options outside modal execution
        const saveOptions = {
            compression: compression,
            interlaced: false,
            transparency: true,
            // Add a smaller matte rectangle if possible to improve compression
            smallestMatte: true
        };

        // Save file
        await doc.saveAs.png(file, saveOptions, true);

        this.lastSavedFile = {
            path: folder.nativePath,
            name: fileName,
            format: 'PNG',
            index: fileName.split('.')[0]
        };

        if (this.startIndexHelp) {
            this.startIndexHelp.innerHTML = `Last saved: <strong>${this.lastSavedFile.name}</strong> in ${this.lastSavedFile.path}`;
        }

        return file;
    } catch (error) {
        const errorMsg = error.message || 'Unknown error occurred while saving PNG';
        console.error('Error saving PNG:', errorMsg);
        throw new Error(errorMsg);
    }
  },

  // Show status message
  showStatus(message, type) {
      this.statusElement.textContent = message;
      this.statusElement.className = 'status';

      if (type) {
          this.statusElement.classList.add(type);
      }

      console.log('Status:', message);
  }
};

// Initialize the application when the document is loaded
document.addEventListener('DOMContentLoaded', () => {
  app.init().catch(error => {
      console.error('Initialization error:', error);
  });
});