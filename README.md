# Gmail Inbox pagination extension

## Install locally to develop or test

Ref: https://developer.chrome.com/extensions/getstarted

Make sure you have [`yarn`](https://yarnpkg.com/) installed first. 

1. `yarn install`.
2. Open the Extension Management page by navigating to `chrome://extensions`.
    - The Extension Management page can also be opened by clicking on the Chrome menu, hovering over `More Tools` then selecting `Extensions`.
3. Enable Developer Mode by clicking the toggle switch next to Developer mode.
4. Click the `LOAD UNPACKED` button and select the `build subfolder` in extension directory.

## Usage

CurrentPage/TotalPage for Inbox:

![Screenshot](
https://raw.githubusercontent.com/grimmer0125/grimmer0125.github.io/master/images/chrome-inbox-extension.png)

## How to use create-react-app for Chrome extension's content script 

This is a learning note to record the procedure. The code is already applied. 

1. Use [create-react-app](https://github.com/facebook/create-react-app) to create a React app. 
2. Use `yarn run eject` to generate editable webpack config files.
3. Move `public/contentScript.js` to `src/content.js` and modify `manifest.json` as `"js": ["/static/js/content.js"]` 
4. Make the following changes in `webpack.config.prod.js`, no built index.js in build folder, building content.js 
    ```
    // entry: [paths.appIndexJs],
    entry: {
        // main: [paths.appIndexJs], // unused by content script, dummy 
        content: ['./src/content.js'], 
    },    
    filename: 'static/js/[name].js',
    runtimeChunk: false,
    // splitChunks: {
    //   chunks: 'all',
    //   name: false,
    // }
    ```
5. (optional) prevent ESlint from stoping build for convenient debugging, in `webpack.config.prod` 
    ```
    eslintPath: require.resolve('eslint'),
    emitWarning: true, // add this line
    ```
6. (optional) remove unused built service-worker.js, in `webpack.config.prod`
    ```
    // const WorkboxWebpackPlugin = require('workbox-webpack-plugin');
    // new WorkboxWebpackPlugin.GenerateSW({
    //   clientsClaim: true,
    //   exclude: [/\.map$/, /asset-manifest\.json$/],
    //   importWorkboxFrom: 'cdn',
    //   navigateFallback: `${publicUrl}/index.html`,
    //   navigateFallbackBlacklist: [
    //     // Exclude URLs starting with /_, as they're likely an API call
    //     new RegExp('^/_'),
    //     // Exclude URLs containing a dot, as they're likely a resource in
    //     // public/ and not a SPA route
    //     new RegExp('/[^/]+\\.[^/]+$'),
    //   ],
    // }),
    ```
7. (optional) remove unused built html file, ref: https://github.com/jantimon/html-webpack-plugin#generating-multiple-html-files, in `webpack.config.prod`
    ```
    // new HtmlWebpackPlugin({
    //   inject: true,
    //   template: paths.appHtml,
    //   minify: {
    //     removeComments: true,
    //     collapseWhitespace: true,
    //     removeRedundantAttributes: true,
    //     useShortDoctype: true,
    //     removeEmptyAttributes: true,
    //     removeStyleLinkTypeAttributes: true,
    //     keepClosingSlash: true,
    //     minifyJS: true,
    //     minifyCSS: true,
    //     minifyURLs: true,
    //   },
    // }),    
    ```
8. (optinal) Although index.html and index.js are not built but they are required to pass the check of building process. To remove this restriction,  set `/config/path.js` as 
    ```
    appHtml: resolveApp(''),
    appIndexJs: resolveApp(''),
    ```

Then just `yarn build` and Chrome extension manager can load the build folder 

### use compiled css in content script 

If you want to use compiled css (e.g. `import './content.css';` in `content.js`) , you need to set `"css": ["/static/css/content.css"]` in `Chrome manifest.json`. Also, you need to do the following change in `webpack.config.prod.js`, 

    ```
    new MiniCssExtractPlugin({
        filename: 'static/css/[name].css', // 'static/css/[name].[contenthash:8].css'
    ```

