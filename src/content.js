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
  // TODO: find parent (id:":fh") instead, may not happen multiple .dj anymore
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
    };

    // TODO: using state instead of using this
    this.detectedNewUI = false;
    this.type = ''; // In fact, it could be label/category/sent
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
          // console.log('reset total, new type2:', type, this.pageURL);

          if (this.type !== type) {
            // console.log('reset total, new type:', type, page);
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
            });
          } else {
            this.setState({
              currentPage: page,
            });
          }

          // NOTE: chrome.runtime.onMessage.addListener裡, 表示上面跟下面中間會夾雜個 setState 引起的 render
          // !!!!!!!!!!! 所以改成新版的了, setstate最後統一做
          // reset total, new type: search/apple 1  !!!
          // content.js? [sm]:269 render-start:this.pageURL, 1148
          // content.js? [sm]:297 render-total:1 default
          // content.js? [sm]:396 total-5: 1148
          // content.js? [sm]:183 reset total, new type2: search/apple 1   !!!!
          // content.js? [sm]:269 render-start:this.pageURL, 1
          // content.js? [sm]:297 render-total:1 default
          // content.js? [sm]:396
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
      if (newCountData) { // may happen first:1, total:NaN (since the word is "many?")
        // console.log('newCountData:', newCountData); // total:Nan will not hit

        // check if the current UI is the new version of Gmail using multiple-tab
        if (!this.detectedNewUI) {
          this.detectedNewUI = true;
          const tabTable = document.querySelector('.aKk');
          if (tabTable) {
            this.setState({ usngNewUI: true });
          }
        }

        // this.setState({ countData: newCountData });
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
        // if (emptyPanel) {
        // console.log('emptyPanel !!');
        // }
        // this.setState({ emptyPanel });

        // if (heightNonZero) {
        // console.log('all container vanish');
        // }
        // console.log('cp:', tableContainer.offsetHeight);
        // console.log('cp2:', tableContainer.clientHeight);

        // const tableContainer2 = document.querySelectorAll('.Cp');
        // console.log(tableContainer2, tableContainer2.length);
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
    // console.log('slider onDragEnd', event);

    setTimeout(() => {
      const { currentPage } = this.state;
      // this.currentPage = this.state.currentPage2;
      // console.log('get delay drag end page:', currentPage);
      // const match = url.match(/.*\/#.*\/p/g);
      // if (match) {
      //   const matchCatelog = url.match(/.*\/#category\/promotions/g);

      if (currentPage > 0) {
        const newUrl = `${this.preparedURL}${currentPage}`;
        // or window.location.href
        window.location.replace(newUrl);
      }
    }, 0);
  }

  onSliderChange = (event, value) => {
    // this.currentPage = value;
    this.setState({ currentPage: value });
  };

  render() {
    // console.log('render-start:this.pageURL,', this.pageURL);
    const { classes } = this.props;
    const {
      countData, usngNewUI, emptyPanel,
    } = this.state;

    const currentPage = this.pageURL;

    // console.log('emptyPanel in render:', emptyPanel);
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
    // 3 x search/advanced-search case, e.g.
    // https://mail.google.com/mail/u/0/#advanced-search/subset=all&has=apple&hasnot=pay&within=1d&sizeoperator=s_sl&sizeunit=s_smb&query=apple

    const { first, last, total } = countData;

    let totalPages = 1; // default, even no email
    // console.log('render-total:1 default');
    if (total) {
      // searching mode may do not have valid total
      if (currentPage > 1) {
        if (this.threadsPerPage === 0 && first) {
          let tmpThreadsPerPage = (first - 1) / (currentPage - 1);
          if (Number.isInteger(tmpThreadsPerPage) && tmpThreadsPerPage > 0) {
            this.threadsPerPage = tmpThreadsPerPage;
          } else {
            // x TODO: 有時 last/total 變得比 currentpage 快 !!!! 如果是直接開p8頁, 這裡就會有問題,
            // (176-1)/(8-1), 但開p8, 時, 卻暫時出現p7
            // way1: currentpage 慢出現, 手動加 1. way2: 現在也直接使用this.pageURL, 可能快點變化比較不需要 way1 (還是會發生)
            // 代表 MutationObserver 有時比 chrome.runtime.onMessage.addListener 快 !!!
            tmpThreadsPerPage = (first - 1) / (currentPage);
            console.log('workaround to calculate  this.threadsPerPage:', tmpThreadsPerPage, first, currentPage);

            if (Number.isInteger(tmpThreadsPerPage) && tmpThreadsPerPage > 0) {
              this.threadsPerPage = tmpThreadsPerPage;
            } else {
              console.log('can not get threadsPerPage');
              // *TODO: (151-1) / (8-1)?  如果是 currentpage 先出現? 要手動-1? 先做下面的 disable the slider 好了
            }
          }
        }

        // search mode 時, 這個值只是估計
        if (this.threadsPerPage > 0) {
          totalPages = Math.ceil(total / this.threadsPerPage);
          // console.log('total-2:', totalPages, this.threadsPerPage);
        } else {
          console.log('no this.threadsPerPage data to calculate totalpages (total/this.threadsPerPage)');
          // TODO:
          // disable the slider, not enough data
        }
      } else if (total !== last) {
        // in page1, total pages > 1
        if (this.threadsPerPage === 0) {
          this.threadsPerPage = last - first + 1;
        }

        totalPages = Math.ceil(total / this.threadsPerPage);
        // console.log('total-3:', totalPages);
      } else {
        // in page1, total pages: 1
        // totalPages = 1;
      }
    }


    const shownCurrentPage = this.state.currentPage;

    let searchMode = false;
    if (this.type.indexOf(SEARCH) > -1 || this.type.indexOf(ADVANCED_SEARCH) > -1) {
      // serach UI which can not know total pages at the beginning
      searchMode = true;

      // x TODO: 到了後之後就不能再改了 this. 或是不要用下面的 再用新的 variable
      if (!this.search.reachMax && last && last === total) {
        // console.log('reach !!!!', totalPages); // 有時 last/total 變得比 currentpage 快 !!!!
        this.search.reachMax = true;
        this.search.triedValidMax = totalPages; // 1.  每次都改. 2. 選較大的. 3. 選currentPage
        //   triedValidMax: totalPages,
        //   // triedInvalidMin: totalPages + 1,
        // };
      }

      if (!this.search.reachMax) {
        if (emptyPanel) {
        // console.log('empty redner, search');
          if (this.search.triedInvalidMin === 0) {
            this.search.triedInvalidMin = currentPage;
          // console.log('set this.search.triedInvalidMin:', currentPage);
          } else if (currentPage > this.search.triedValidMax && currentPage < this.search.triedInvalidMin) { // 因為會先變 url, 所以 回到4th page, 此時還是 emptypanel
            this.search.preTriedInvalidMin = this.search.triedInvalidMin;
            this.search.triedInvalidMin = currentPage;
            // console.log('set this.search.triedInvalidMin2:', currentPage);
          }

          // 突然間拖到很大的out of range, 因為 url 會先變, 然後才變 empty, 所以一定有瞬間會先以為有panel, 然後再進來這邊
          // totalPages 可能是算出來的 or 0 (nan)
          if (this.search.triedValidMax === currentPage) {
            console.log('recover max:', this.search.preTriedValidMax); // 8 ? why
            totalPages = this.search.preTriedValidMax;
            // console.log('total-4:', totalPages);
            // *TODO: currentpage 改成第0頁, 也還是可以拖回去, 所以也先放棄好了
            // shownCurrentPage = 0;  ???????
            this.search.triedValidMax = this.search.preTriedValidMax;
          }
        } else {
          // console.log('not empty redner, search');

          // 直接接 p8, p9就是max, 因為上面 console.log('reach !!!!');, 所以這邊會進來 min !!!
          if (!this.search.reachMax && this.search.triedInvalidMin === currentPage) {
            // p1 -> p1000 (無) -> p100 瞬間會無 但可能是有的
            console.log('recover min:', this.search.preTriedInvalidMin);
            this.search.triedInvalidMin = this.search.preTriedInvalidMin;
          }

          if (this.search.triedInvalidMin === 0 || currentPage < this.search.triedInvalidMin) {
            totalPages = totalPages >= currentPage ? totalPages : currentPage;

            // done FIXME:
            // 先到 https://mail.google.com/mail/u/0/#inbox/p1301
            // 再搜尋 apple ?
            // 已經 url 是 search, 但 currentPage 還是舊的1301!!
            // console.log('total-5:', totalPages);

            if (!this.search.reachMax && totalPages > this.search.triedValidMax) {
              this.search.preTriedValidMax = this.search.triedValidMax;
              this.search.triedValidMax = totalPages;
            } else {
              totalPages = this.search.triedValidMax;
              // console.log('total-6:', totalPages);
            }
          }
        }
      }

      if (this.search.reachMax) {
        totalPages = this.search.triedValidMax;
        // console.log('total-7:', totalPages);
      }
    }


    // currentPage is this.pageURL ??????????? 還是可以拖, 先放棄好了
    // *TODO: grey out to disable, e.g. 244/1, 應該要是 k/triedValidMax, only search mode would happen
    // shownCurrentPage = currentPage <= totalPages ? currentPage : 0;

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
          {searchMode ? (
            <div>
              {'searching.'}
              {this.search.reachMax ? 'final' : `triedInvalidMin:${this.search.triedInvalidMin}`}
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
