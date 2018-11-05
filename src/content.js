import React from 'react';
import ReactDOM from 'react-dom';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';

import './content.css';

console.log('in contentScript');
console.log('current page url:', window.location.href);

// react material-ui-slide + tooltip
// ref: https://github.com/tariqwest/material-ui-slider-label

// create-react-app for chrome extension:
// https://veerasundar.com/blog/2018/05/how-to-create-a-chrome-extension-in-react-js/
// https://medium.com/@yosevu/how-to-inject-a-react-app-into-a-chrome-extension-as-a-content-script-3a038f611067

const { chrome } = window;

// inbox case:
// https://mail.google.com/mail/u/0/#inbox/p8
// 1. 全部9頁, page9, 此時自己或別人刪掉到此頁沒有, url 會變, 但 total 實驗了一次應該是要變成10, 但還是 show 11 (小issue)
// 2. 一開始就只有1頁
// 3. 其它頁
// 加slider/pagination ui
// email/conversation mode ? 應該沒差吧
//
// 全沒有的話呢? countInfoSpan: null !!
//
// p.s. 列是多的

// search result case:
// 0. 如果第一頁沒有滿, 就也不 show 下拉式選單
// 1. 可直接輸入的 infinite 下拉式選單? (但如果確定是最後一頁就變成不是 inifite) + show try過最大無效的 page number
// 2. 一旦有確定非第一頁的, 就 show slider/pagination ui

const styles = {
  root: {
    width: 300,
  },
  slider: {
    padding: '22px 0px', // top, right, down, left
  },
};

class SimpleSlider extends React.Component {
  state = {
    totalPages: 0,
    currentPage: 0,
  };

  componentDidMount() {
    this.threadsPerPage = 0;
    this.total = -1; // first/last may be set to this.first/last, too, 因為它們也不是很準
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      console.log('on message requset:', request);
      if (request.message === 'tab_update_completed') {
        // 有時 page 已切換, 但 start-last 還是是舊的，此時如果去抓一頁有幾個會出錯
        // 方法 1. 晚點抓. 2. 只要有得到過就不再去算? 重點是有幾頁 !! 不行 因為總數可能會變, spcial case
        // 同時有人/client 在新增/刪除 email or 收到新的信. <-算了不要理這 case 好了, 之後再想
        // p.s. 如果是一開始就p10 -> p11 會晚點換 first
        // 但如果一開始是第一頁, first/last 就永遠都是1~25
        // setTimeout(() => {
        this.onTabUpdated();
        // }, 100); // 20ms 不太夠, 放棄這作法
      }
    });
  }

  onTabUpdated = () => {
    let first;
    let last;
    // let total;
    // let threadsPerPage;
    let currentPage;

    const url = window.location.href;
    console.log('on tab upadted url, fetch url:', url);

    // TODO: 改成用下拉式選單 最後的是否 gray out 來判斷, 這樣可以套用到其他 tag
    // 怎麼判斷是 確定 tag-count or search mode.
    // a. 由下拉式選單是不是 grey 判斷. (除了只有一頁以外, 其他的// )
    //    如果 search 跳到最後一頁, about 字就會不見, 但 最新的字一直都是 grey out
    // x b. 由文字判斷, 只多了 約 (about) 這個字
    if (url.indexOf('#inbox') > -1) {
      // tag-count
      console.log('inbox section');

      // const b = document.getElementsByClassName("Dj");
      // console.log("b:",b);
      let countInfoSpan = document.querySelectorAll('.Dj');
      console.log('pages:', countInfoSpan);
      if (countInfoSpan) {
        if (countInfoSpan.length > 1) {
          console.log('countInfoSpan.length:', countInfoSpan.length);
        }
        countInfoSpan = countInfoSpan[countInfoSpan.length - 1];
        const countInfos = countInfoSpan.querySelectorAll('.ts');

        if (!countInfos) {
          console.log('countInfos is not-defined or null');
          return;
        }

        first = parseInt(countInfos[0].innerHTML.replace(/,/g, ''));
        last = parseInt(countInfos[1].innerHTML.replace(/,/g, ''));

        // const totalStr = countInfos[2].innerHTML;
        // e.g. 35,917, to remove "," comma
        // TODO: replace 方法可能不適用每個 locale, 要用 library
        // https://stackoverflow.com/questions/11665884/how-can-i-parse-a-string-with-a-comma-thousand-separator-to-a-number
        if (this.total === -1) {
          this.total = parseInt(countInfos[2].innerHTML.replace(/,/g, ''));
        }

        // 兩個問題 x a. 直接打開p10/或托到p10, 有時已 show p10, 但字此時會抓到舊的 1~25, 有 workaround way
        // x b. slider 已設定 value, 但 ui 沒有更新 !! 拖到某一頁 (沒再看到)
        console.log('first/last:', first, last);
        console.log('total:', this.total);

        // first 可能不會更新
        // 1. 怎麼區別 new ui? old UI 的第一頁 跟 new ui (url永遠無page number) 是不可分的
        // 2. 所以 new ui 無法知道是第幾頁?  因為無page in url
        // 如果是文字show 101~110, 也可能是抓到還沒更新的上一頁page span !!
        // 以上兩問題只要有 瞬間錯誤 case 就無法解決 (不, 新ui可以去抓有無 ad/社群 tab 來區別!!!)
        // p.s. new ui 其一頁有幾個可以得到(因為一定從第一頁進去), new ui也無法使直接url跳到某頁
        if (first) {
          if (first >= this.total) {
            console.log('it might be page_url is large than maximal page, temp situation');
          } else {
            const urlPaths = url.split('#inbox/p');
            if (urlPaths.length === 2) {
              const pageStr = urlPaths.pop();

              currentPage = parseInt(pageStr); // curent page
              console.log('case1, get page from url:', pageStr, currentPage);

              if (first !== 1) {
                // normal case, 容易出錯, 因為 first 可能沒即時更新, e.g. 一開始就是 p10, 跳到p100頁
                if (this.threadsPerPage === 0) {
                  this.threadsPerPage = (first - 1) / (currentPage - 1); // 用來 show 在 slider
                }
              } else {
                // 瞬間錯誤 case
                // 從 p1 跳到其他頁
                console.log('not p1, is nth page, but first-last is not updated, still 1-k, workaround solution');
                // 有時已 p10, 但字還是瞬間抓到 1~25
                // a. x 用 timeout 等更新 ?
                // b.
                if (this.threadsPerPage === 0) {
                  this.threadsPerPage = last - first + 1;
                }
              }
            } else if (last === this.total) {
              // 只有一頁, 不用 show slider
              // old ui, new ui 都有可能, 無法判斷一頁幾個, 此時 slider 也不需要 show
              console.log('case3, no page number in url but fast=last, only 1 page');
            } else {
              console.log('case2-no page info in url but total>last, in page1');
              // 可能
              // old ui: 但還有更多頁
              currentPage = 1;
              if (this.threadsPerPage === 0) {
                this.threadsPerPage = last - first + 1;
              }
              // new ui: a. 1~25, total 77 b. 26~50, total 77
            }
          }
        } else {
          console.log('no email');
        }

        // if (this.threadsPerPage) {
        //   console.log('threadsPerPage:', this.threadsPerPage);
        //   console.log('currentPage:', currentPage);

        //   const totalPages = Math.ceil(total / this.threadsPerPage);
        //   console.log('update UI !!!');
        //   this.setState({
        //     totalPages,
        //     currentPage,
        //   });
        // } else {
        //   // TODO:
        //   // 1. 把 全部 ui 住, 因為可能從兩頁變成一頁
        //   // 不然就是只有一頁也要 show slider !!
        // }
      } // else {
      // *1. case1 no any emails
      // 2. case2: new UI
      // TODO:
      // 1. 把 全部 ui 住
      // }
    } else {
      console.log('other label, not inbox');
      // TODO:
      // 如果先到inbox -> 其他 label -> 回來 inbox, total 可能會停留在其他label的總數 !!
      // 所以 total 只能設定一次, 如果要推到其他 label, 則要各字存 每個 label的 first/last/total
    }

    if (currentPage) {
      console.log('threadsPerPage:', this.threadsPerPage);
      console.log('currentPage:', currentPage);

      const totalPages = Math.ceil(this.total / this.threadsPerPage);
      console.log('update UI !!!');
      this.setState({
        totalPages,
        currentPage, // 被改的時機 a. 如果直接開 p10 url, b.1 slide change
        // b.2. slide change會trigger url, 然後再set新的值一次
      });
    } else {
      console.log('hide ui, reset totalPages = 0');

      this.setState({
        totalPages: 0,
      });
    }
  }

  onDragEnd = (event) => {
    console.log('slider onDragEnd', event);

    setTimeout(() => {
      const { currentPage } = this.state;
      console.log('delay drag end:', currentPage);

      const newUrl = `${window.location.href.split('#inbox')[0]}#inbox/p${currentPage}`;
      console.log('new:', newUrl);

      // similar behavior as an HTTP redirect
      window.location.replace(newUrl);

      // similar behavior as clicking on a link
      // window.location.href = "http://stackoverflow.com";
    }, 0);
  }

  onSliderChange = (event, value) => {
    // console.log('slider change:', value);
    this.setState({ currentPage: value });
  };

  render() {
    const { classes } = this.props;

    const { currentPage, totalPages } = this.state;
    // console.log('value/total in render:', currentPage, totalPages);
    const element = totalPages > 0 ? (
      <div className="flex-container">
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
        <Typography style={{ width: '70px' }} id="label">{`${currentPage}/${totalPages}`}</Typography>
      </div>
    ) : <div />;
    return element;
  }
}
SimpleSlider.propTypes = {
  classes: PropTypes.object.isRequired,
};
const MySlider = withStyles(styles)(SimpleSlider);

const newNode = document.createElement('div');
newNode.setAttribute('id', 'root2');

newNode.style.backgroundColor = 'yellow';
newNode.style.height = '60px'; // 32
newNode.style.width = '620px'; // 662 640 370
// Get the reference node, e.g.
// const referenceNode = document.getElementById(':3'); //document.querySelector('#:3'); <- not work
// may be ('#\\3:3') for id is :3, ref:
// https://stackoverflow.com/questions/20306204/using-queryselector-with-ids-that-are-numbers

// const referenceNode = document.querySelector('.ar5.J-J5-Ji');
// const referenceNode = document.querySelector('.Cr.aqJ');
// referenceNode.before(newNode);
document.body.appendChild(newNode);
ReactDOM.render(<MySlider />, newNode);
