
//
// https://firebase.google.com/docs/functions/unit-testing
//

var myFunctions = require('../index');

const fakeEvent = {
  //...
};

myFunctions.onStationPriceWrite(fakeEvent);
