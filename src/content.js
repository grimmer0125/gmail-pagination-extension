// import React, { Component } from 'react';
import ReactDOM from 'react-dom';

import React, { Component } from 'react';
import {
  Grid, Input, Pagination, Segment,
} from 'semantic-ui-react';

export default class PaginationExampleControlled extends Component {
  state = { activePage: 1 }

  handleInputChange = (e, { value }) => this.setState({ activePage: value })

  handlePaginationChange = (e, { activePage }) => this.setState({ activePage })

  render() {
    const { activePage } = this.state;

    return (
      <Grid columns={2} verticalAlign="middle">
        <Grid.Column>
          <Segment secondary>
            <div>
activePage:
              {activePage}
            </div>
            <Input
              min={1}
              max={5}
              onChange={this.handleInputChange}
              type="range"
              value={activePage}
            />
          </Segment>
        </Grid.Column>
        <Grid.Column>
          <Pagination
            activePage={activePage}
            onPageChange={this.handlePaginationChange}
            totalPages={5}
          />
        </Grid.Column>
      </Grid>
    );
  }
}

console.log('in contentScript');
console.log('current page url:', window.location.href);

// https://veerasundar.com/blog/2018/05/how-to-create-a-chrome-extension-in-react-js/
// https://medium.com/@yosevu/how-to-inject-a-react-app-into-a-chrome-extension-as-a-content-script-3a038f611067

// Create a new element
const newNode = document.createElement('div');
newNode.setAttribute('id', 'root2');

newNode.style.backgroundColor = 'yellow';
newNode.style.height = '100px'; // 32
newNode.style.width = '800px'; // 640
// Get the reference node
// const referenceNode = document.getElementById(':3'); //document.querySelector('#:3');
// // Insert the new node before the reference node
// referenceNode.before(newNode);

// const referenceNode = document.querySelector('.ar5.J-J5-Ji');
// const referenceNode = document.querySelector('.Cr.aqJ');
// referenceNode.before(newNode);
document.body.appendChild(newNode);

// class App2 extends Component {
//   render() {
//     return (
//       <div>
//         hello
//       </div>
//     );
//   }
// }
// export default App2;

ReactDOM.render(<PaginationExampleControlled />, newNode);


// let test = 0;

// https://mail.google.com/mail/u/0/#inbox/p8

// case
// inbox:
// 1. 全部9頁, page9, 此時自己或別人刪掉到此頁沒有, url 會變, 但 total 實驗了一次應該是要變成10, 但還是 show 11 (小bug)
// 2. 一開始就只有1頁
// 3. 其它頁
// 加slider/pagination ui
// email/conversation mode ? 應該沒差吧
//
// 全沒有的話呢? countInfoSpan: null !!
//
// p.s. 列是多的

// search result
// 0. 如果第一頁沒有滿, 就也不 show 下拉式選單
// 1. 可直接輸入的 infinite 下拉式選單? (但如果確定是最後一頁就變成不是 inifite) + show try過最大無效的 page number
// 2. 一旦有確定非第一頁的, 就 show slider/pagination ui

// 找#inbox
//
//
// const observer = new MutationObserver(function(e) {
//   console.log("first changes")
// });

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    let fisrt; let end; let total; let numberOfPage; let
      currentPage;
    // let numberOfPag = null;

    // console.log("test:", test)
    console.log('new url:', window.location.href);
    const url = window.location.href;
    // listen for messages sent from background.js
    // if (request.message === 'hello!') {
    console.log('requset url:', request.url); // new url is now in content scripts!
    // }

    // TODO: 改成用下拉式選單 最後的是否 gray out 來判斷, 這樣可以套用到其他 tag
    // 怎麼判斷是 確定 tag-count or search mode.
    // a. 由下拉式選單是不是 grey 判斷. (除了只有一頁以外, 其他的// )
    //    如果 search 跳到最後一頁, about 字就會不見, 但 最新的字一直都是 grey out
    // x b. 由文字判斷, 只多了 約 (about) 這個字
    if (window.location.href.indexOf('#inbox') > -1) {
      // tag-count
      console.log('inbox section');

      // const b = document.getElementsByClassName("Dj");
      // console.log("b:",b);
      const countInfoSpan = document.querySelector('.Dj');
      console.log('pages:', countInfoSpan);
      if (countInfoSpan) {
        countInfos = countInfoSpan.querySelectorAll('.ts'); // .innerHTML; //$49

        first = parseInt(countInfos[0].innerHTML);
        last = parseInt(countInfos[1].innerHTML);

        const totalStr = countInfos[2].innerHTML;
        // 35,917
        // TODO: replace 方法可能不適用每個 locale, 要用 library
        // https://stackoverflow.com/questions/11665884/how-can-i-parse-a-string-with-a-comma-thousand-separator-to-a-number
        total = parseInt(totalStr.replace(/,/g, ''));

        console.log('first:', first);
        console.log('total:', total);

        if (first === 1) { // 也可以用 沒有p來判斷是否是第一頁
          if (last === total) {
            // 只有一頁, 不用 show slider
          } else {
            currentPage = 1;
            numberOfPage = last - first + 1;
            // 第一頁 !! 但還有更多頁
          }
        } else {
          page = url.split('#inbox/p').pop();
          if (pageStr) {
            currentPage = parseInt(page); // curent page
            numberOfPage = (first - 1) / (currentPage - 1); // 用來 show 在 slider
          } else {
            console.log('no page number in url, it may be a new UI');
          }

          // 第二頁以上
          // if (last === total) {
          // 最後一頁, 此時也可以用 last - first +1 來得到 numberOfPage, 也可以用 pN 的方法, 不行
          // const numberOfPage = last - first + 1;
          // } else {
          // pN
          // }
          // https://mail.google.com/mail/u/0/#inbox/p2
          //
        }

        if (numberOfPage) {
          console.log('numberOfPage:', numberOfPage);
          console.log('currentPage:', currentPage);

          console.log('update UI !!!');
          // Create a new element
          // const newNode = document.createElement('div');
          // newNode.style.backgroundColor = 'yellow';
          // newNode.style.height = "32px";
          // newNode.style.width = "630px";
          // // Get the reference node
          // // const referenceNode = document.getElementById(':3'); //document.querySelector('#:3');
          // // // Insert the new node before the reference node
          // // referenceNode.before(newNode);
          //
          // // const referenceNode = document.querySelector('.ar5.J-J5-Ji');
          // const referenceNode = document.querySelector('.Cr.aqJ');
          // referenceNode.before(newNode);
        } else {
          // TODO:
          // 1. 把 全部 ui 住, 因為可能從兩頁變成一頁
          // 不然就是只有一頁也要 show slider !!
        }

        // 現在 p10, 全部 255,
        // 從 start 跟 p10 就可以知道一頁多少個. 然後算出全部幾頁


        // test++;
        // 不 work
        // if (test === 1) {
        //   observer.observe(countInfos[0], {
        //     characterData: true,
        //     childList: true
        //   });
        // }

        // productName = productNameUI.innerHTML;
      } else {
        // 1. case1 no any emails
        // 2. case2: new UI
        //
        // TODO:
        // 1. 把 全部 ui 住
      }
    }
  },
);


// https://mail.google.com/mail/u/0/#inbox/p4 無法偵測到
