'use strict';

function TradeCitizen()
{
  this.checkSetup();
}

TradeCitizen.prototype.checkSetup = function()
{
  if (!window.firebase || !(firebase.app instanceof Function) || !firebase.app().options)
  {
    window.alert('You have not configured and imported the Firebase SDK. ' +
    'Make sure you go through the codelab setup instructions and make ' +
    'sure you are running the codelab using `firebase serve`');
  }

  //...
  
};

window.onload = function()
{
  window.friendlyChat = new TradeCitizen();
};
