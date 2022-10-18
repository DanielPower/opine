const withDevTools = (store, options) => {
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect();
    const originalSet = store.setState;
    devTools.init(store.getState(), options);
    devTools.subscribe((message) => {
      if (message.type === "DISPATCH" && message.state) {
        originalSet(() => JSON.parse(message.state));
      }
    });
    store.setState = (fn, name) => {
      originalSet(fn, name);
      devTools.send(name ?? "anonymous", store.getState());
    };
  }
  return store;
};

export default withDevTools;
