# Gmail Inbox pagination extension

## Usage

CurrentPage/TotalPage for Inbox:

![Screenshot](
https://raw.githubusercontent.com/grimmer0125/grimmer0125.github.io/master/images/chrome-inbox-extension.png)

## How to use create-react-app for Chrome extension's content script 

This is a learning note to record the procedure. The code is already applied. 

1. Use [create-react-app](https://github.com/facebook/create-react-app) to create a React app. 
2. Use `yarn run eject` to generate editable webpack config files.
3. Move `public/contentScript.js` to `src/content.js` and modify `manifest.json` as `"js": ["/static/js/content.js"]` 
4. Make the following changes in `webpack.config.prod.js`
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
5. (optional) prevent ESlint from stoping build for convenient debugging 
    ```
    eslintPath: require.resolve('eslint'),
    emitWarning: true, // add this line
    ```
6. (optional) remove unused built service-worker.js
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
7. (optional) remove unused built html file, ref: https://github.com/jantimon/html-webpack-plugin#generating-multiple-html-files
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

You still need to keep `/public/index.html` and `/src/index.js`, although they are not built into `build folder`, otherwise your build would fail. To remove them, `webpack.config.prod.js` need more modification.

Then just `yarn build` and Chrome extension manager can load the build folder 
