import React from 'react';
import ReactDOM from 'react-dom';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
// import Button from '@material-ui/core/Button';

import './content.css';

const { chrome } = window;

const styles = theme => ({
  // root: {
  //   width: 300,
  // },
  button: {
    margin: theme.spacing.unit,
  },
  slider: {
    padding: '22px 0px', // top, right, down, left
  },
});

function findCountInfo(node) {
  const countInfoSpan = node.querySelectorAll('.Dj');
  if (countInfoSpan) {
    if (countInfoSpan.length >= 1) {
      // console.log('countInfoSpan.length:', countInfoSpan.length);
    } else {
      return;
    }
    // console.log('all span:', countInfoSpan, countInfoSpan.length);

    let finalSpan = null;
    for (const span of countInfoSpan) {
      if (span.offsetHeight != 0) {
        finalSpan = span;
        break;
      }
    }
    if (finalSpan) {
      const countInfos = finalSpan.querySelectorAll('.ts');

      if (!countInfos || countInfos.length < 3) {
        console.log('countInfos is undefined/null/no enough span(<3)');
        return;
      }

      const first = parseInt(countInfos[0].innerHTML.replace(/,/g, ''), 10);
      const last = parseInt(countInfos[1].innerHTML.replace(/,/g, ''), 10);
      const total = parseInt(countInfos[2].innerHTML.replace(/,/g, ''), 10);

      // console.log('first/last/total in monitor:', first, last, total);
      return { first, last, total };
    }
  }
}


function parsePatternURL(url, pattern, result) {
  //   const regex = new RegExp(`.*\/#${pattern}\/(.*)\/p`);
  //   const regex2 = new RegExp(`.*\/#${pattern}\/(.*)`);

  const regex = new RegExp(`.*\/#${pattern}\/p`);
  const regex2 = new RegExp(`.*\/#${pattern}`);

  let matchArr;

  let page = null;
  let preparedURL = null;
  let type = null;

  matchArr = url.match(regex);

  if (matchArr) {
    // found with page number
    preparedURL = matchArr[0];
    type = matchArr[1];
    page = parseInt(url.replace(preparedURL, ''), 10);
  } else {
    // pageStr = url.replace(/.*\/#search\/(.*)/, '');
    matchArr = url.match(regex2);

    if (matchArr) {
      // found w/o page number, should page1
      preparedURL = `${matchArr[0]}/p`;
      type = matchArr[1];
      page = 1;
    }
  }

  result.preparedURL = preparedURL;
  result.type = type;
  result.page = page;

  if (result.page) {
    return true;
  }

  return false;
}


function fetchInfoFromURL(url) {
  const parseResult = {};

  if (parsePatternURL(url, '(search\/.*)', parseResult)) {
    console.log('match search');
  } else if (parsePatternURL(url, '(advanced-search\/.*)', parseResult)) {
    console.log('match advanced-search');
  } else if (parsePatternURL(url, '(category\/.*)', parseResult)) {
    console.log('match category');
  } else if (parsePatternURL(url, '(label\/.*)', parseResult)) {
    console.log('match label');
  } else if (parsePatternURL(url, '(.*)', parseResult)) {
    console.log('match generic');
  } else {
    console.log('parse fail !!!');
  }

  return parseResult;
}

const SEARCH = 'search';
const ADVANCED_SEARCH = 'advanced-search';

class SimpleSlider extends React.Component {
  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {
      currentPage: 1,
      countData: {},
      usngNewUI: false,
    };

    this.threadsPerPage = 0;
    this.detectedNewUI = false;
    this.type = ''; // In fact, it could be label/category/sent
    this.preparedURL = null;
    this.possibleSearchTotal = 0;

    this.search = {
      triedValidMax: 0,
      triedInvalidMin: 0,
    };
  }

  componentDidMount() {
    // url part
    chrome.runtime.onMessage.addListener((request) => {
      if (request.message === 'tab_update_completed') {
        const url = window.location.href;

        const result = fetchInfoFromURL(url);
        const { type, page, preparedURL } = result;
        if (type) {
          if (this.type !== type) {
            console.log('reset total, new type:', type);
            this.type = type;
            this.search = {
              triedValidMax: 0,
              triedInvalidMin: 0,
            };
            // reset total
            this.setState({
              countData: {},
            });
          }

          this.preparedURL = preparedURL;

          this.setState({
            currentPage: page,
          });
        } else {
          console.log('can not find out type from url');
        }
      }
    });

    // span part
    const observer = new MutationObserver((() => {
      let newCountData = null;
      newCountData = findCountInfo(document);

      // newCountData.total also means that UI is fullly loaded
      if (newCountData && newCountData.first) { // may happen first:1, total:NaN (since the word is "many?")
        // console.log('newCountData:', newCountData); // total:Nan will not hit

        this.setState({ countData: newCountData });

        // check if the current UI is the new version of Gmail using multiple-tab
        if (!this.detectedNewUI) {
          this.detectedNewUI = true;
          const tabTable = document.querySelector('.aKk');
          if (tabTable) {
            this.setState({ usngNewUI: true });
          }
        }
      }
    }));
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
    });
  }

  onDragEnd = (event) => {
    console.log('slider onDragEnd', event);

    setTimeout(() => {
      const { currentPage } = this.state;
      console.log('get delay drag end page:', currentPage);
      // const match = url.match(/.*\/#.*\/p/g);
      // if (match) {
      //   const matchCatelog = url.match(/.*\/#category\/promotions/g);

      const newUrl = `${this.preparedURL}${currentPage}`;
      // or window.location.href
      window.location.replace(newUrl);
    }, 0);
  }

  onSliderChange = (event, value) => {
    this.setState({ currentPage: value });
  };

  render() {
    const { classes } = this.props;
    const { currentPage, countData, usngNewUI } = this.state;
    if (usngNewUI) {
      return (
        <div className="flex-container">
          <div style={{ color: 'red' }}>
          New Gmail default UI (Catagories on tabs) does not support pagination. Please uncheck some tabs (e.g. social, promotions) in the setting -> configure inbox. You can still access catagories in the left menu.
          </div>
        </div>
      );
    }

    // TODO:
    // 1 x works: https://mail.google.com/mail/u/0/#category/promotions/p2, https://mail.google.com/mail/u/0/#category/social/p2
    // 2 x https://mail.google.com/mail/u/0/#category/promotions //NaN, https://mail.google.com/mail/u/0/#category/social
    // 3 search/advanced-search case, e.g.
    // https://mail.google.com/mail/u/0/#advanced-search/subset=all&has=apple&hasnot=pay&within=1d&sizeoperator=s_sl&sizeunit=s_smb&query=apple

    const { first, last, total } = countData;

    let totalPages = 1; // default, even no email
    if (total) {
      // searching mode may do not have valid total
      if (currentPage > 1) {
        if (this.threadsPerPage === 0) {
          this.threadsPerPage = (first - 1) / (currentPage - 1);
        }
        totalPages = Math.ceil(total / this.threadsPerPage);
      } else if (total !== last) {
        // in page1, total pages > 1
        if (this.threadsPerPage === 0) {
          this.threadsPerPage = last - first + 1;
        }

        totalPages = Math.ceil(total / this.threadsPerPage);
      } else {
        // in page1, total pages: 1
        // totalPages = 1;
      }

      // TODO: how to get triedInvalidMin?
      if (last === total) {
        this.search = {
          triedValidMax: totalPages,
          triedInvalidMin: totalPages + 1,
        };
      }
    }

    let searchMode = false;
    if (this.type.indexOf(SEARCH) > -1 || this.type.indexOf(ADVANCED_SEARCH) > -1) {
      // serach UI which can not know total pages at the beginning
      searchMode = true;

      // totalPages 可能是算出來的 or 0 (nan)
      totalPages = totalPages >= currentPage ? totalPages : currentPage;
      totalPages = this.search.triedValidMax >= totalPages ? this.search.triedValidMax : totalPages;
      this.search.triedValidMax = totalPages;


      // element = (
      //   <div className="flex-container">
      //     <div style={{ width: '600px' }}>
      //       <Slider
      //         classes={{ container: classes.slider }}
      //         min={1}
      //         max={totalPages}
      //         step={1}
      //         value={currentPage}
      //         aria-labelledby="label"
      //         onChange={this.onSliderChange}
      //         onDragEnd={this.onDragEnd}
      //       />
      //     </div>
      //     <div style={{ marginLeft: '20px', width: '80px' }}>
      //       <Typography id="label">page:</Typography>
      //       <Typography id="label">{`${currentPage}/${totalPages}`}</Typography>
      //     </div>
      //   </div>
      // );

      // return element;
    }

    const element = (
      <div className="flex-container">
        <div style={{ width: '600px' }}>
          <Slider
            classes={{ container: classes.slider }}
            min={1}
            max={totalPages}
            step={1}
            value={currentPage}
            aria-labelledby="label"
            onChange={this.onSliderChange}
            onDragEnd={this.onDragEnd}
          />
        </div>
        <div style={{ marginLeft: '20px', width: '80px' }}>
          <Typography id="label">page:</Typography>
          <Typography id="label">{`${currentPage}/${totalPages}`}</Typography>
        </div>
        <div>
          {searchMode ? (
            <div>
              {'searching.'}
              {this.search.triedValidMax + 1 === this.search.triedInvalidMin ? 'final' : null}
            </div>
          ) : null}
        </div>
      </div>
    );
    return element;
  }
}
SimpleSlider.propTypes = {
  classes: PropTypes.object.isRequired,
};
const MySlider = withStyles(styles)(SimpleSlider);


function addExtensionUI() {
  const newNode = document.createElement('div');
  newNode.setAttribute('id', 'root');
  newNode.style.backgroundColor = '#B8E8E7';
  newNode.style.height = '50px'; // '60px'; // 32
  // newNode.style.width = '620px'; // 662 640 370

  // const referenceNode = document.querySelector('.Cr.aqJ');
  // referenceNode.before(newNode); // not work since gmail seems to reset DOM often
  document.body.appendChild(newNode);
  ReactDOM.render(<MySlider />, newNode);
}

chrome.storage.sync.get(['visibility'], (result) => {
  if (!result.visibility || result.visibility === 'show') {
    addExtensionUI();
  }
});
