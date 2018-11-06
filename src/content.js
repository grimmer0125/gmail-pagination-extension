import React from 'react';
import ReactDOM from 'react-dom';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
import Button from '@material-ui/core/Button';

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

function fetchLabelPart(str) {
  let r = null;

  r = str.match(/.*\/#category\/(.*)\//);
  if (r) {
    // https://mail.google.com/mail/u/0/#category/promotions/p2
    console.log('label type6 (#category/promotions/p2):', r[1]);
    return r[1];
  }
  r = str.match(/.*\/#category\/(.*)/);
  if (r) {
    console.log('label type5 (#category/promotions):', r[1]);
    return r[1];
  }

  r = str.match(/.*\/#(.*)\//);
  if (!r) {
    // #inbox type
    r = str.match(/.*\/#(.*)/);
    // console.log('label type1(#inbox):', r[1]);
  } else {
    //   console.log('debug1:', r[1]); e.g. search, inbox/p1, label/apple
    if (r[1].indexOf('label') > -1) {
      r = str.match(/.*\/#label\/(.*)\//);
      if (!r) {
        // #label/104-32'
        r = str.match(/.*\/#label\/(.*)/);
        // console.log('label type3:', r[1]);
      } else {
        // #label/104-32/p1
        // console.log('label type4:', r[1]);
      }
    } else {
      // console.log('label type2(#search or inbox/p*):', r[1]);
    }
  }

  if (r && r[1]) {
    return r[1];
  }

  return null;
}

class SimpleSlider extends React.Component {
  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {
      currentPage: 0,
      countData: {},
      usngNewUI: false,
    };

    this.threadsPerPage = 0;
    this.detectedNewUI = false;
    this.label = null;
  }


  componentDidMount() {
    // url part
    chrome.runtime.onMessage.addListener((request) => {
      if (request.message === 'tab_update_completed') {
        const url = window.location.href;

        const label = fetchLabelPart(url);
        if (label) {
          if (this.label !== label) {
            console.log('reset total, new label:', label);
            this.label = label;
            // reset total
            this.setState({
              countData: {},
            });
          }
        } else {
          console.log('can not find out label from url');
        }

        // if (isNaN(currentPage)) {
        //   const pageStr = url.replace(/.*\/#(?!search).*\/p/g, '');
        //   currentPage = parseInt(pageStr, 10);
        // }

        // TODO:
        // 1 x works: https://mail.google.com/mail/u/0/#category/promotions/p2, https://mail.google.com/mail/u/0/#category/social/p2
        // 2 x https://mail.google.com/mail/u/0/#category/promotions //NaN, https://mail.google.com/mail/u/0/#category/social
        // 3 search/advanced-search case, e.g.
        // https://mail.google.com/mail/u/0/#advanced-search/subset=all&has=apple&hasnot=pay&within=1d&sizeoperator=s_sl&sizeunit=s_smb&query=apple
        const pageStr = url.replace(/.*\/#(?!search).*\/p/g, '');
        let currentPage;
        if (pageStr !== url) {
          currentPage = parseInt(pageStr, 10);
          if (isNaN(currentPage)) {
            currentPage = 1; // https://mail.google.com/mail/u/0/#category/promotions
          }
          console.log('set currentpage from url:', currentPage);
        } else if (url.match(/.*\/#search.*\//g) || url.match(/.*\/#advanced-search.*\//g)) {
          currentPage = 0; // search type, ignore to handle on UI
        } else {
          currentPage = 1; // it might be no email
        }
        this.setState({
          currentPage,
        });
      }
    });

    // span part
    const observer = new MutationObserver((() => {
      let newCountData = null;
      newCountData = findCountInfo(document);

      // newCountData.total also means that UI is fullly loaded
      if (newCountData && newCountData.total) {
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
      const url = window.location.href;
      const match = url.match(/.*\/#.*\/p/g);
      let newUrl;
      if (match) {

        const matchCatelog = url.match(/.*\/#category\/promotions/g);

        if (matchCatelog) {
          // #category\/promotions or #category\/promotions/p3
          const match2 = url.match(/.*\/#category\/promotions\/p/g);
          if (match2) {
            newUrl = match2[0] + currentPage;
          } else {
            newUrl = `${url}/p${currentPage}`;
          }
        } else {
          // handle some label starts from p, e.g. #label/p*
          const matchLabel = url.match(/.*\/#label\/p.*/g);

          if (matchLabel) {
            const match3 = url.match(/.*\/#label\/p.*\/p/g);
            if (match3) {
              newUrl = match3[0] + currentPage;
            } else {
              newUrl = `${url}/p${currentPage}`;
            }
          } else {
            newUrl = match[0] + currentPage;
          }
        }
      } else {
        newUrl = `${url}/p${currentPage}`;
      }
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

    const { first, last, total } = countData;

    let totalPages = 0;
    if (total) {
      if (currentPage > 1) {
        if (this.threadsPerPage === 0) {
          if (first !== 1) {
            this.threadsPerPage = (first - 1) / (currentPage - 1);
          }
        }
      } else if (total === last) {
        // in page1, total pages: 1
        totalPages = 1;
      } else if (this.threadsPerPage === 0) {
        // in page1, total pages >1
        this.threadsPerPage = last - first + 1;
      }

      if (totalPages === 0) {
        totalPages = Math.ceil(total / this.threadsPerPage);
      }
    }

    const element = (currentPage > 0 && totalPages > 0) ? (
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
      </div>
    ) : <div />;
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
