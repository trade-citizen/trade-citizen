'use strict';

/**
 * Initializes the TradeCitizen app.
 */
function TradeCitizen() {
  this.filters = {
    anchor: '',
    anchorType: '',
    //price: '',
    sort: 'Anchor'
  };

  this.dialogs = {};

  firebase.auth().signInAnonymously().then(() => {
    this.initTemplates();
    this.initRouter();
    this.initReviewDialog();
    this.initFilterDialog();
  }).catch(err => {
    console.log(err);
  });
}

/**
 * Initializes the router for the TradeCitizen app.
 */
TradeCitizen.prototype.initRouter = function() {
  this.router = new Navigo();

  this.router
    .on({
      '/': () => {
        this.updateQuery(this.filters);
      }
    })
    .on({
      '/stations/*': () => {
        let path = this.getCleanPath(document.location.pathname);
        const id = path.split('/')[2];
        this.viewStation(id);
      }
    })
    .resolve();
};

TradeCitizen.prototype.getCleanPath = function(dirtyPath) {
  if (dirtyPath.startsWith('/index.html')) {
    return dirtyPath.split('/').slice(1).join('/');
  } else {
    return dirtyPath;
  }
};

TradeCitizen.prototype.getFirebaseConfig = function() {
  return firebase.app().options;
};

/*
TradeCitizen.prototype.getRandomItem = function(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
};
*/

TradeCitizen.prototype.data = {
  anchors: [
    'Delamar',
    'Nyx',
    'Cellin',
    'Yela',
    'Stanton',
    'Daymar',
    'Crusader',
  ],
  anchorTypes: [
    'Moon',
    'Gas Giant',
    'System',
    'Asteroid',
  ],
  stationTypes: [
    'Floating',
    'Orbiting',
    'Ground',
  ],
};

window.onload = () => {
  window.app = new TradeCitizen();
};
