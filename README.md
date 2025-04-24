## pirate gen v0.1.0 installation

- You can clone the repo and re-build the plugin yourself using adobe UXP - or - download the v0.0.2 release.

- If you choose to build your own plugin, download the UXP Dev Tools from CC, create a plugin, and replace the directory it installs with a clone of this repo (ccx file not needed) (you might have to mess around with the manifest if you're running into issues).

- Here is a relevant thread on how to install a non-marketplace plugin on Creative Cloud: https://forums.creativeclouddeveloper.com/t/methods-for-installing-non-marketplace-plugins/6005

- If you dont have a CC subscription you could take a look at GenP: https://www.reddit.com/r/GenP/wiki/redditgenpguides/


## Features:

- Add NFT name and description
- Select visible layer groups
- Determine layer rarity (any number of 0 or below will prevent a layer from being chosen)
- Choose Output Location
- Choose number of images to generate
- Add metadata optionally
- Start generation from index (generate collection in batches)
- Save as PNG or JPEG
- Choose compression when saving as PNG
- Choose quality when saving as JPEG

## Tips:

- Make sure all of the layers that you want in the final images are contained within groups, the plugin will only detect layers within groups!
- All blending modes, masks, filters, effects, etc.. that have been applied to layers or groups will be retained, the final images appear exactly as they do in PS.


## Planned Improvements:

- See layers outside of groups
- Select / deselect all groups
- Set rarity to (x) for group / all groups


## UI Example (PS light theme):

<img width="599" alt="Screenshot 2025-04-23 at 2 36 40 AM" src="https://github.com/user-attachments/assets/5d923e87-1d5b-4faa-8024-7a7966052a58" />


