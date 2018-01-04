'use strict';

TradeCitizen.prototype.initTemplates = function() {
  this.templates = {};
  document.querySelectorAll('.template').forEach(el => {
    this.templates[el.getAttribute('id')] = el;
  });
};

TradeCitizen.prototype.viewHome = function() {
  this.getAllStations();
};

TradeCitizen.prototype.viewList = function(filters, filter_description) {
  if (!filter_description) {
    filter_description = 'any station at any anchor sorted by anchor.';
  }

  const mainEl = this.renderTemplate('main-adjusted');
  const headerEl = this.renderTemplate('header-base', {
    hasSectionHeader: true
  });

  this.replaceElement(
      headerEl.querySelector('#section-header'),
      this.renderTemplate('filter-display', { filter_description })
  );

  this.replaceElement(document.querySelector('.header'), headerEl);
  this.replaceElement(document.querySelector('main'), mainEl);

  headerEl.querySelector('#show-filters').addEventListener('click', () => {
    this.dialogs.filter.show();
  });

  const renderResults = doc => {
    if (!doc) {
      const headerEl = this.renderTemplate('header-base', {
        hasSectionHeader: true
      });

      const noResultsEl = this.renderTemplate('no-results');

      this.replaceElement(
          headerEl.querySelector('#section-header'),
          this.renderTemplate('filter-display', { filter_description })
      );

      headerEl.querySelector('#show-filters').addEventListener('click', () => {
        this.dialogs.filter.show();
      });

      this.replaceElement(document.querySelector('.header'), headerEl);
      this.replaceElement(document.querySelector('main'), noResultsEl);
      return;
    }
    const data = doc.data();
    data['.id'] = doc.id;
    data['go_to_station'] = () => {
      this.router.navigate(`/stations/${doc.id}`);
    };

    const el = this.renderTemplate('station-card', data);

    mainEl.querySelector('#cards').append(el);
  };

  if (filters.anchor || filters.anchorType || filters.price || filters.sort !== 'Anchor' ) {
    this.getFilteredStations({
     anchor: filters.anchor || 'Any',
     anchorType: filters.anchorType || 'Any',
     price: filters.price || 'Any',
     sort: filters.sort
    }, renderResults);
  } else {
    this.getAllStations(renderResults);
  }

  const toolbar = mdc.toolbar.MDCToolbar.attachTo(document.querySelector('.mdc-toolbar'));
  toolbar.fixedAdjustElement = document.querySelector('.mdc-toolbar-fixed-adjust');

  mdc.autoInit();
};

TradeCitizen.prototype.initReviewDialog = function() {
  const dialog = document.querySelector('#dialog-add-review');
  this.dialogs.add_review = new mdc.dialog.MDCDialog(dialog);

  this.dialogs.add_review.listen('MDCDialog:accept', () => {
    let pathname = this.getCleanPath(document.location.pathname);
    let id = pathname.split('/')[2];

    this.addRating(id, {
      rating,
      text: dialog.querySelector('#text').value,
      userName: 'Anonymous (Web)',
      timestamp: new Date(),
      userId: firebase.auth().currentUser.uid
    }).then(() => {
      this.rerender();
    });
  });

  let rating = 0;

  dialog.querySelectorAll('.star-input i').forEach(el => {
    const rate = () => {
      let after = false;
      rating = 0;
      [].slice.call(el.parentNode.children).forEach(child => {
        if (!after) {
          rating++;
          child.innerText = 'star';
        } else {
          child.innerText = 'star_border';
        }
        after = after || child.isSameNode(el);
      });
    };
    el.addEventListener('mouseover', rate);
  });
};

TradeCitizen.prototype.initFilterDialog = function() {
  // TODO: Reset filter dialog to init state on close.
  this.dialogs.filter = new mdc.dialog.MDCDialog(document.querySelector('#dialog-filter-all'));

  this.dialogs.filter.listen('MDCDialog:accept', () => {
    this.updateQuery(this.filters);
  });

  const dialog = document.querySelector('aside');
  const pages = dialog.querySelectorAll('.page');

  this.replaceElement(
    dialog.querySelector('#anchorType-list'),
      this.renderTemplate('item-list', { items: ['Any'].concat(this.data.anchorTypes) })
  );

  this.replaceElement(
      dialog.querySelector('#anchor-list'),
      this.renderTemplate('item-list', { items: ['Any'].concat(this.data.anchors) })
  );

  const renderAllList = () => {
    this.replaceElement(
        dialog.querySelector('#all-filters-list'),
        this.renderTemplate('all-filters-list', this.filters)
    );

    dialog.querySelectorAll('#page-all .mdc-list-item').forEach(el => {
      el.addEventListener('click', () => {
        const id = el.id.split('-').slice(1).join('-');
        displaySection(id);
      });
    });
  };

  const displaySection = id => {
    if (id === 'page-all') {
      renderAllList();
    }

    pages.forEach(sel => {
      if (sel.id === id) {
        sel.style.display = 'block';
      } else {
        sel.style.display = 'none';
      }
    });
  };

  pages.forEach(sel => {
    const type = sel.id.split('-')[1];
    if (type === 'all') return;

    sel.querySelectorAll('.mdc-list-item').forEach(el => {
      el.addEventListener('click', () => {
        this.filters[type] = el.innerText.trim() === 'Any'? '' : el.innerText.trim();
        displaySection('page-all');
      });
    });
  });

  displaySection('page-all');
  dialog.querySelectorAll('.back').forEach(el => {
    el.addEventListener('click', () => {
      displaySection('page-all');
    });
  });
};

TradeCitizen.prototype.updateQuery = function(filters) {
  let query_description = 'any station';

  if (filters.anchor !== '') {
    query_description += ` at ${filters.anchor}`;
  } else {
    query_description += ' at any anchor';
  }

  if (filters.anchorType !== '') {
    query_description += ` at any ${filters.anchorType} anchor type`;
  } else {
    query_description += ' at any anchor type';
  }

  /*
  if (filters.price !== '') {
    query_description += ` with a price of ${filters.price}`;
  } else {
    query_description += ' with any price';
  }
  */

  if (filters.sort === 'Anchor') {
    query_description += ' sorted by anchor';
  } else if (filters.sort === 'Anchor Type') {
    query_description += ' sorted by anchor type';
  }

  this.viewList(filters, query_description);
};

TradeCitizen.prototype.viewStation = function(id) {
  let sectionHeaderEl;
  return this.getStation(id)
    .then(doc => {
      const data = doc.data();
      const dialog =  this.dialogs.add_review;

      data.show_add_review = () => {
        dialog.show();
      };

      sectionHeaderEl = this.renderTemplate('station-header', data);

      /*
      sectionHeaderEl
        .querySelector('.rating')
        .append(this.renderRating(data.avgRating));

      sectionHeaderEl
        .querySelector('.price')
        .append(this.renderPrice(data.price));
      */

      return doc.ref.collection('ratings').orderBy('timestamp', 'desc').get();
    })
    .then(ratings => {
      let mainEl;

      if (ratings.size) {
        mainEl = this.renderTemplate('main');

        ratings.forEach(rating => {
          const data = rating.data();
          const el = this.renderTemplate('review-card', data);
          el.querySelector('.rating').append(this.renderRating(data.rating));
          mainEl.querySelector('#cards').append(el);
        });
      } else {
        mainEl = this.renderTemplate('no-ratings', {
          add_mock_data: () => {
            this.addMockRatings(id).then(() => {
              this.rerender();
            });
          }
        });
      }

      const headerEl = this.renderTemplate('header-base', {
        hasSectionHeader: true
      });

      this.replaceElement(document.querySelector('.header'), sectionHeaderEl);
      this.replaceElement(document.querySelector('main'), mainEl);
    })
    .then(() => {
      this.router.updatePageLinks();
    })
    .catch(err => {
      console.warn('Error rendering page', err);
    });
};

TradeCitizen.prototype.renderTemplate = function(id, data) {
  const template = this.templates[id];
  const el = template.cloneNode(true);
  el.removeAttribute('hidden');
  this.render(el, data);
  return el;
};

TradeCitizen.prototype.render = function(el, data) {
  if (!data) return;

  const modifiers = {
    'data-fir-foreach': tel => {
      const field = tel.getAttribute('data-fir-foreach');
      const values = this.getDeepItem(data, field);

      values.forEach((value, index) => {
        const cloneTel = tel.cloneNode(true);
        tel.parentNode.append(cloneTel);

        Object.keys(modifiers).forEach(selector => {
          const children = Array.prototype.slice.call(
            cloneTel.querySelectorAll(`[${selector}]`)
          );
          children.push(cloneTel);
          children.forEach(childEl => {
            const currentVal = childEl.getAttribute(selector);

            if (!currentVal) return;
            childEl.setAttribute(
              selector,
              currentVal.replace('~', `${field}/${index}`)
            );
          });
        });
      });

      tel.parentNode.removeChild(tel);
    },
    'data-fir-content': tel => {
      const field = tel.getAttribute('data-fir-content');
      tel.innerText = this.getDeepItem(data, field);
    },
    'data-fir-click': tel => {
      tel.addEventListener('click', () => {
        const field = tel.getAttribute('data-fir-click');
        this.getDeepItem(data, field)();
      });
    },
    'data-fir-if': tel => {
      const field = tel.getAttribute('data-fir-if');
      if (!this.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },
    'data-fir-if-not': tel => {
      const field = tel.getAttribute('data-fir-if-not');
      if (this.getDeepItem(data, field)) {
        tel.style.display = 'none';
      }
    },
    'data-fir-attr': tel => {
      const chunks = tel.getAttribute('data-fir-attr').split(':');
      const attr = chunks[0];
      const field = chunks[1];
      tel.setAttribute(attr, this.getDeepItem(data, field));
    },
    'data-fir-style': tel => {
      const chunks = tel.getAttribute('data-fir-style').split(':');
      const attr = chunks[0];
      const field = chunks[1];
      let value = this.getDeepItem(data, field);

      if (attr.toLowerCase() === 'backgroundimage') {
        value = `url(${value})`;
      }
      tel.style[attr] = value;
    }
  };

  const preModifiers = ['data-fir-foreach'];

  preModifiers.forEach(selector => {
    const modifier = modifiers[selector];
    this.useModifier(el, selector, modifier);
  });

  Object.keys(modifiers).forEach(selector => {
    if (preModifiers.indexOf(selector) !== -1) return;

    const modifier = modifiers[selector];
    this.useModifier(el, selector, modifier);
  });
};

TradeCitizen.prototype.useModifier = function(el, selector, modifier) {
  el.querySelectorAll(`[${selector}]`).forEach(modifier);
};

TradeCitizen.prototype.getDeepItem = function(obj, path) {
  path.split('/').forEach(chunk => {
    obj = obj[chunk];
  });
  return obj;
};

/*
TradeCitizen.prototype.renderRating = function(rating) {
  const el = this.renderTemplate('rating', {});
  for (let r = 0; r < 5; r += 1) {
    let star;
    if (r < Math.floor(rating)) {
      star = this.renderTemplate('star-icon', {});
    } else {
      star = this.renderTemplate('star-border-icon', {});
    }
    el.append(star);
  }
  return el;
};

TradeCitizen.prototype.renderPrice = function(price) {
  const el = this.renderTemplate('price', {});
  for (let r = 0; r < price; r += 1) {
    el.append('$');
  }
  return el;
};
*/

TradeCitizen.prototype.replaceElement = function(parent, content) {
  parent.innerHTML = '';
  parent.append(content);
};

TradeCitizen.prototype.rerender = function() {
  this.router.navigate(document.location.pathname + '?' + new Date().getTime());
};
