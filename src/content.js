import React from 'react';
import ReactDOM from 'react-dom';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
import Button from '@material-ui/core/Button';
import TextField from '@material-ui/core/TextField';

import './content.css';

const { chrome } = window;

const styles = theme => ({
  // root: {
  //   width: 300,
  // },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing.unit,
    width: 60,
  },
  button: {
    margin: theme.spacing.unit,
  },
  slider: {
    padding: '22px 0px', // top, right, down, left
  },
});

function findCountInfo(node) {
  // TODO: find parent (id:":fh") instead, may not happen multiple .dj anymore
  const countInfoSpan = node.querySelectorAll('.Dj');
  if (countInfoSpan) {
    if (countInfoSpan.length >= 1) {
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
    // console.log('match search');
  } else if (parsePatternURL(url, '(advanced-search\/.*)', parseResult)) {
    // console.log('match advanced-search');
  } else if (parsePatternURL(url, '(category\/.*)', parseResult)) {
    // console.log('match category');
  } else if (parsePatternURL(url, '(label\/.*)', parseResult)) {
    // console.log('match label');
  } else if (parsePatternURL(url, '(.*)', parseResult)) {
    // console.log('match generic');
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
      currentPage: 1, // on slider's UI
      countData: {},
      usngNewUI: false,
      emptyPanel: true,
      pageInput: '',
    };

    // TODO: using state instead of using this
    this.detectedNewUI = false;
    this.type = ''; // it refers label/category/sent etc
    this.preparedURL = null;
    this.pageURL = 1;
    // TODO: not calculate threadsPerPage this in render
    this.threadsPerPage = 0;
    this.search = {
      preTriedValidMax: 0,
      triedValidMax: 0,
      preTriedInvalidMin: 0,
      triedInvalidMin: 0,
      reachMax: false,
    };
  }

  componentDidMount() {
    // url part, not guarantee chrome-tab change is happend before MutationObserver change (first/last/total)
    chrome.runtime.onMessage.addListener((request) => {
      if (request.message === 'tab_update_completed') {
        const url = window.location.href;

        const result = fetchInfoFromURL(url);
        const { type, page, preparedURL } = result;
        if (type) {
          this.preparedURL = preparedURL;
          this.pageURL = page;

          if (this.type !== type) {
            this.type = type;
            this.search = {
              preTriedValidMax: 0,
              triedValidMax: 0,
              triedInvalidMin: 0,
              preTriedInvalidMin: 0,
              reachMax: false,
            };
            this.setState({
              countData: {}, // reset total
              currentPage: page,
              pageInput: page.toString(),
            });
          } else {
            // this may trigger synchronized render()
            this.setState({
              currentPage: page,
              pageInput: page.toString(),
            });
          }
        } else {
          console.log('can not find out type from url');
        }
      }
    });

    // span part
    const observer = new MutationObserver((() => {
      let newCountData = null;
      newCountData = findCountInfo(document);

      // This line means that UI is fullly loaded and we can try to detect if it is new UI or not
      if (newCountData) { // may happen first:1, total:NaN (since the word is "many/about")
        // console.log('newCountData:', newCountData); // total:Nan will not hit

        // check if the current UI is the new version of Gmail using multiple-tab
        if (!this.detectedNewUI) {
          this.detectedNewUI = true;
          const tabTable = document.querySelector('.aKk');
          if (tabTable) {
            this.setState({ usngNewUI: true });
          }
        }
      }

      const tableContainer = document.querySelectorAll('.Cp');
      let emptyPanel = true;
      if (tableContainer) {
        for (const container of tableContainer) {
          if (container.offsetHeight > 0) {
            emptyPanel = false;
            break;
          }
        }
      }

      if (newCountData && tableContainer) {
        this.setState({ emptyPanel, countData: newCountData });
      } else if (newCountData) {
        this.setState({ countData: newCountData });
      } else if (tableContainer) {
        this.setState({ emptyPanel });
      }
    }));
    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
    });
  }

  onDragEnd = (event) => {
    setTimeout(() => {
      const { currentPage } = this.state;

      if (currentPage > 0) {
        const newUrl = `${this.preparedURL}${currentPage}`;
        // or window.location.href
        window.location.replace(newUrl);
      }
    }, 0);
  }

  onJumpClick = () => {
    const { pageInput } = this.state;

    if (pageInput > 0) {
      const newUrl = `${this.preparedURL}${pageInput}`;
      window.location.replace(newUrl);
    }
  }

  onSliderChange = (event, value) => {
    this.setState({ currentPage: value, pageInput: value.toString() });
  };

  onInputPage = (event) => {
    this.setState({
      pageInput: event.target.value,
    });
  }

  render() {
    const { classes } = this.props;
    const {
      pageInput, countData, usngNewUI, emptyPanel,
    } = this.state;

    const currentPage = this.pageURL;

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

    // default, even no email
    let totalPages = 1;
    // searching mode may do not have valid total
    if (total) {
      if (currentPage > 1) {
        if (this.threadsPerPage === 0 && first) {
          let tmpThreadsPerPage = (first - 1) / (currentPage - 1);
          if (Number.isInteger(tmpThreadsPerPage) && tmpThreadsPerPage > 0) {
            this.threadsPerPage = tmpThreadsPerPage;
          } else {
            // NOTE: the changes of last/totalo and currentpage may not be synchronized
            // case1: first/last occur first
            tmpThreadsPerPage = (first - 1) / (currentPage);
            console.log('workaround to calculate  this.threadsPerPage:', tmpThreadsPerPage, first, currentPage);

            if (Number.isInteger(tmpThreadsPerPage) && tmpThreadsPerPage > 0) {
              this.threadsPerPage = tmpThreadsPerPage;
            } else {
              // NOTE: if change of currentpage occur first ? (case2)
              console.log('can not get threadsPerPage');
            }
          }
        }

        if (this.threadsPerPage > 0) {
          totalPages = Math.ceil(total / this.threadsPerPage);
        } else {
          // TODO: disable the slider, not enough data?
          console.log('no this.threadsPerPage data to calculate totalpages (total/this.threadsPerPage)');
        }
      } else if (total !== last) {
        // in page1, total pages > 1
        if (this.threadsPerPage === 0) {
          this.threadsPerPage = last - first + 1;
        }

        totalPages = Math.ceil(total / this.threadsPerPage);
      } else {
        // in page1, total pages: 1
      }
    }

    const shownCurrentPage = this.state.currentPage;

    let searchMode = false;
    if (this.type.indexOf(SEARCH) > -1 || this.type.indexOf(ADVANCED_SEARCH) > -1) {
      // serach UI can not know total pages at the beginning
      searchMode = true;

      if (!this.search.reachMax && last && last === total) {
        this.search.reachMax = true;
        this.search.triedValidMax = totalPages;
      }

      if (!this.search.reachMax) {
        if (emptyPanel) {
          if (this.search.triedInvalidMin === 0) {
            this.search.triedInvalidMin = currentPage;
          } else if (currentPage > this.search.triedValidMax && currentPage < this.search.triedInvalidMin) {
            this.search.preTriedInvalidMin = this.search.triedInvalidMin;
            this.search.triedInvalidMin = currentPage;
          }

          if (this.search.triedValidMax === currentPage) {
            // p1 -> p1000 (empty, out of range)
            // it will happen 1. the code hit emptyPanel=false (url changes first, so the email keep old status)
            // 2. then it will hit here later
            console.log('recover max:', this.search.preTriedValidMax);
            totalPages = this.search.preTriedValidMax;
            this.search.triedValidMax = this.search.preTriedValidMax;
          }
        } else {
          if (this.search.triedInvalidMin === currentPage) {
            // p1 -> p1000 (empty) -> p100:
            // 1. hit emptyPanel (<- wrong intermediate status)
            // 2. but p100 is possible to have emails, it will hit if it happen
            console.log('recover min:', this.search.preTriedInvalidMin);
            this.search.triedInvalidMin = this.search.preTriedInvalidMin;
          }

          if (this.search.triedInvalidMin === 0 || currentPage < this.search.triedInvalidMin) {
            totalPages = totalPages >= currentPage ? totalPages : currentPage;

            if (!this.search.reachMax && totalPages > this.search.triedValidMax) {
              this.search.preTriedValidMax = this.search.triedValidMax;
              this.search.triedValidMax = totalPages;
            } else {
              totalPages = this.search.triedValidMax;
            }
          }
        }
      }

      if (this.search.reachMax) {
        totalPages = this.search.triedValidMax;
      }
    }

    const element = (
      <div className="flex-container">
        <div style={{ width: '600px' }}>
          <Slider
            classes={{ container: classes.slider }}
            min={1}
            max={totalPages}
            step={1}
            value={shownCurrentPage}
            aria-labelledby="label"
            onChange={this.onSliderChange}
            onDragEnd={this.onDragEnd}
          />
        </div>
        <div style={{ marginLeft: '20px', width: '80px' }}>
          <Typography id="label">page:</Typography>
          <Typography id="label">{`${shownCurrentPage}/${totalPages}`}</Typography>
        </div>
        <div>
          <TextField
            id="standard-number"
            label="Input"
            className={classes.textField}
            value={pageInput}
            InputLabelProps={{
              shrink: true,
            }}
            onChange={this.onInputPage}
            onKeyPress={(ev) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                this.onJumpClick();
              }
            }}
            type="number"
            margin="normal"
          />
        </div>
        <div>
          <Button variant="outlined" color="secondary" className={classes.button} onClick={this.onJumpClick}>
            Jump
          </Button>
        </div>
        <div>
          {searchMode ? (
            <div>
              <div>
                {this.search.reachMax ? 'Got final page' : 'Not got final page'}
              </div>
              <div>
                {!this.search.reachMax ? `min.OfTriedInvalid:${this.search.triedInvalidMin}` : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>);
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
