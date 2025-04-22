## pirate gen v0.0.2 installation

- You can clone the repo and re-build the plugin yourself using adobe UXP - or - download the ccx file and open it.

- Downloading the ccx file with Creative Cloud open and double clicking it is the most simple way to install, otherwise you will have to build your own plugin using the adobe UXP. If you choose to build your own plugin, download the UXP Dev Tools from CC, create a plugin, and replace the directory it installs with a clone of this repo (ccx file not needed) (you might have to mess around with the manifest if you're running into issues).

- Here is a relevant thread on how to install a non-marketplace plugin on Creative Cloud: https://forums.creativeclouddeveloper.com/t/methods-for-installing-non-marketplace-plugins/6005

- If you dont have a CC subscription you could take a look at GenP: https://www.reddit.com/r/GenP/wiki/redditgenpguides/


## Features:

- Add NFT name and Description
- Select visible layer groups
- Determine layer rarity (any number of 0 or below will prevent a layer from being chosen)
- Choose Output Location
- Choose number of images to generate
- Add metadata optionally
- Start generation from index (generate collection in batches)
- Save as PNG or JPEG
- Choose compression when saving as PNG
- Choose quality when saving as JPEG

## v0.0.2 Improvements:

- Optimized generation time

## Planned Improvements:

- Show last saved image index to make it easier to see which number the 'Start From' field should have when generating in batches
