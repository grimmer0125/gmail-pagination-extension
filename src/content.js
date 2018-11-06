import React from 'react';
import ReactDOM from 'react-dom';

import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Slider from '@material-ui/lab/Slider';
// import Button from '@material-ui/core/Button';

import './content.css';

console.log('contentScript starts');

const { chrome } = window;

const styles = theme => ({
  // root: {
  //   width: 300,
  // },
  // button: {
  //   margin: theme.spacing.unit,
  // },
  slider: {
    padding: '22px 0px', // top, right, down, left
  },
});

function findCountInfo(node, type) {
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

class SimpleSlider extends React.Component {
  constructor(props) {
    super(props);
    // Don't call this.setState() here!
    this.state = {
      currentPage: 0,
      countData: {},
    };

    this.threadsPerPage = 0;
  }

  componentDidMount() {
    // url part
    chrome.runtime.onMessage.addListener((request) => {
      if (request.message === 'tab_update_completed') {
        const url = window.location.href;
        const pageStr = url.replace(/.*\/#(?!search).*\/p/g, '');
        let currentPage;
        if (pageStr !== url) {
          currentPage = parseInt(pageStr, 10);
          console.log('set currentpage from url:', currentPage);
        } else if (url.match(/.*\/#search.*\//g)) {
          currentPage = 0;
        } else {
          currentPage = 1; // it might be no email
        }
        this.setState({
          currentPage,
        });
      }
    });

    // span part
    const observer = new MutationObserver(((mutations, me) => {
      let newCountData = null;
      newCountData = findCountInfo(document);

      if (newCountData && newCountData.total) {
        this.setState({ countData: newCountData });
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
        newUrl = match + currentPage;
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
    const { currentPage, countData } = this.state;
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
        {/* <Button
          variant="outlined"
          color="secondary"
          className={classes.button}
          onClick={() => { console.log('onClick'); }}
        >
          Hide
        </Button> */}
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
  console.log(`Value currently is ${result.visibility}`);

  if (!result.visibility || result.visibility === 'show') {
    addExtensionUI();
  }
});
