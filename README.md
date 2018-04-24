# Trade Citizen Quickstart

## Introduction

TradeCitizen is a [planned to be Crowd Sourced Reptuation Based] Commodity Prices Tracker for Star Citizen.

### Add Location

TODO:(pv) Create an admin app/page that makes this *MUCH* easier

1. `node utils/generate-push-id.js`
1. Create a document w/ that name under locations w/ following values:
```json
anchor: reference to deployments/production/anchors/?
type: reference to deployments/production/locationTypes/?
name: as appropriate
```

### Add Item

1. `node utils/generate-push-id.js`
1. ...

### Add "Anchor"

"Anchor" is what I am calling whatever holds a Location. The Anchor is the closest capturing planet (ex: Crusader), moon (ex: Yela). It is possible some locations may be free-floating and have no Anchor.

1. `node utils/generate-push-id.js`
1. ...

## Workflow

Hosting:
1. `cd hosting`
1. `yarn dev`
1. Dev your heart out
1. **DON'T FORGET TO TEST!**
1. `yarn build`
1. `cd ..`
1. `firebase deploy --only hosting`

Functions:
1. `cd functions`
1. Dev your heart out
1. **DON'T FORGET TO TEST!**
1. `cd ..`
1. `firebase deploy --only functions`
 