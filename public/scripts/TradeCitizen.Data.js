'use strict';

TradeCitizen.prototype.addStation = function(data) {
  const collection = firebase.firestore().collection('stations');
  return collection.add(data);
};

TradeCitizen.prototype.getAllStations = function(render) {
  const query = firebase.firestore()
      .collection('stations')
      .orderBy('anchor', 'desc')
      .limit(50);
  this.getDocumentsInQuery(query, render);
};

TradeCitizen.prototype.getDocumentsInQuery = function(query, render) {
  query.onSnapshot(snapshot => {
    //console.log("snapshot.size:" + snapshot.size);
    if (!snapshot.size) return render();

    snapshot.docChanges.forEach(change => {
      if (change.type === 'added') {
        render(change.doc);
      }
    });
  });
};

TradeCitizen.prototype.getStation = function(id) {
  return firebase.firestore().collection('stations').doc(id).get();
};

TradeCitizen.prototype.getFilteredStations = function(filters, render) {
  let query = firebase.firestore().collection('stations');

  if (filters.anchorType !== 'Any') {
    query = query.where('anchorType', '==', filters.anchorType);
  }

  if (filters.anchor !== 'Any') {
    query = query.where('anchor', '==', filters.anchor);
  }

  /*
  if (filters.price !== 'Any') {
    query = query.where('price', '==', filters.price.length);
  }
  */

  if (filters.sort === 'Anchor') {
    query = query.orderBy('anchor', 'desc');
  } else if (filters.sort === 'Anchor Type') {
  }

  this.getDocumentsInQuery(query, render);
};

/*
TradeCitizen.prototype.addRating = function(stationID, rating) {
  const collection = firebase.firestore().collection('stations');
  const document = collection.doc(stationID);

  return document.collection('ratings').add(rating).then(() => {
    return firebase.firestore().runTransaction(transaction => {
      return transaction.get(document).then(doc => {
        const data = doc.data();

        let newAverage =
            (data.numRatings * data.avgRating + rating.rating) /
            (data.numRatings + 1);

        return transaction.update(document, {
          numRatings: data.numRatings + 1,
          avgRating: newAverage
        });
      });
    });
  });
};
*/
