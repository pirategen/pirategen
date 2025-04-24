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
    // Validate collection info
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

        // Generate each image
        for (let i = 0; i < numImages; i++) {
            // Use the startIndex to calculate the current file index
            const nftIndex = startIndex + i;
            this.showStatus(`Generating NFT ${1 + i} of ${numImages} (file index: ${nftIndex})...`);


            const selectedLayerInfo = [];

            try {
                // Use a single modal execution for all document modifications for this image
                await photoshop.core.executeAsModal(async () => {
                    // Make sure we have the current document state
                    const currentDoc = app.activeDocument;

                    // 1. Hide all layers first
                    this.hideAllLayersRecursive(currentDoc.layers);

                    // 2. For each selected group, choose a layer based on rarity and show it
                    const selectedLayerIds = [];

                    for (const group of selectedGroups) {
                        // Find the actual layer group in the document
                        const docGroup = this.findLayerById(currentDoc.layers, group.id);
                        if (!docGroup) continue;

                        // Select one layer based on rarity
                        const selectedLayerId = this.selectLayerByRarity(group);
                        if (!selectedLayerId) continue;

                        // Find the selected layer in the document
                        const selectedLayer = this.findLayerById(currentDoc.layers, selectedLayerId);
                        if (!selectedLayer) continue;

                        if (this.generateMetadataCheckbox.checked) {
                          // Save the selected layer info for metadata
                          const selectedLayerData = group.children.find(layer => layer.id === selectedLayerId);
                          if (selectedLayerData) {
                              selectedLayerInfo.push({
                                  groupName: group.name,
                                  layerName: selectedLayerData.name
                              });
                          }
                        }

                        // Add to our selected layer IDs list
                        selectedLayerIds.push(selectedLayerId);

                        // Make the selected layer visible
                        selectedLayer.visible = true;

                        // Make all parent groups visible too
                        let parent = selectedLayer.parent;
                        while (parent && parent !== currentDoc) {
                            parent.visible = true;
                            parent = parent.parent;
                        }
                    }

                }, { commandName: "Set Up NFT Layers" });

                // Save as png or jpeg (in its own modal execution) with sequential numbering
                const format = this.saveFormatSelect.value;
                const extension = format === 'png' ? 'png' : 'jpg';
                const fileName = `${nftIndex}.${extension}`;

                try {
                    if (format === 'png') {
                      await this.saveAsPNG(doc, imagesFolder, fileName)
                    } else {
                      await this.saveAsJPEG(doc, imagesFolder, fileName)
                    }
                } catch (e) {
                    throw e
                }

                // Generate metadata JSON
                if (this.generateMetadataCheckbox.checked) {
                  const jsonContent = this.generateMetadata(nftIndex, selectedLayerInfo, extension);
                  const jsonFileName = `${nftIndex}.json`;
                  await this.saveJsonFile(jsonFolder, jsonFileName, jsonContent);
                }

            } catch (error) {
                console.error(`Error generating NFT ${nftIndex}:`, error);
                this.showStatus(`Error on NFT ${nftIndex}: ${error.message}`, 'error');
            }

            // Short delay to prevent UI freezing
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.generateMetadataCheckbox.checked) {
          this.showStatus(`Successfuly generated ${numImages} NFT images and metadata!`, 'success');
        } else {
          this.showStatus(`Successfuly generated ${numImages} NFT images without metadata!`, 'success');
        }

    } catch (error) {
        console.error('Error generating NFTs:', error);
        this.showStatus('Error generating NFTs: ' + error.message, 'error');
    } finally {
        this.generateBtn.disabled = false;
    }
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

  // Helper to hide all layers recursively
  hideAllLayersRecursive(layers) {
    for (const layer of layers) {
        layer.visible = false;

        // Process child layers if this is a group
        if (layer.layers && layer.layers.length > 0) {
            this.hideAllLayersRecursive(layer.layers);
        }
    }
  },

  // Helper to find a layer by ID
  findLayerById(layers, id) {
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

  // Save as JPEG
  async saveAsJPEG(doc, folder, fileName) {
    try {
        const photoshop = require('photoshop');
        const fs = require('uxp').storage.localFileSystem;

        try {
            await folder.getEntry(fileName);
            console.error(`File ${fileName} already exists, will not overwrite`)
            this.showStatus(`File ${fileName} already exists, will not overwrite`, 'error')
            throw error;
        } catch (e) {

        }

        const file = await folder.createFile(fileName, { overwrite: true });

        // Get the quality value
        const quality = parseInt(this.jpegQuality.value);

        // Create a modal execution context for export
        await photoshop.core.executeAsModal(async () => {
            // Get the active document
            const app = photoshop.app;
            const activeDoc = app.activeDocument;

            // Use the saveAs operation with the selected quality
            await activeDoc.saveAs.jpg(file, { quality: quality }, true);
        }, { commandName: "Save As JPEG" });

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
        console.error('Error saving JPEG:', error);
        throw error;
    }
  },


  // Save as PNG
  async saveAsPNG(doc, folder, fileName) {
    try {
        const photoshop = require('photoshop');
        const fs = require('uxp').storage.localFileSystem;

        try {
            await folder.getEntry(fileName);
            console.error(`File ${fileName} already exists, will not overwrite`)
            this.showStatus(`File ${fileName} already exists, will not overwrite`, 'error')
            throw error;
        } catch (e) {

        }

        const file = await folder.createFile(fileName, { overwrite: true });

        const compression = parseInt(this.pngCompression.value);

        await photoshop.core.executeAsModal(async () => {
            const app = photoshop.app;
            const activeDoc = app.activeDocument;

            await activeDoc.saveAs.png(file, {
                compression: compression,
                interlaced: false,
                transparency: true
            }, true);
        }, { commandName: "Save As PNG" });

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
        console.error('Error saving PNG:', error);

        throw error;
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