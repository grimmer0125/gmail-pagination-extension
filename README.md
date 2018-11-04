# Gmail Inbox pagination extension

## How to use create-react-app for Chrome extension's content script 

This is a learning note to record the procedure. The code is already applied. 

1. Use [create-react-app](https://github.com/facebook/create-react-app) to create a React app. 
2. Use `yarn run eject` to generate editable webpack config files.
3. Move `public/contentScript.js` to `src/content.js` and modify `manifest.json` as `"js": ["/static/js/content.js"]` 
4. Make the following changes in `webpack.config.prod.js`
    ```
    entry: {
        app: [paths.appIndexJs], // unused by content script, dummy 
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

Then just `yarn build` and Chrome extension manager can load the build folder 