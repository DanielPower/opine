import mapValues from "lodash.mapvalues";

const createStore = (slices) => {
  const store = {
    listeners: new Set(),
    state: mapValues(slices, (slice) => slice.initialState),
    actions: mapValues(slices, (slice) =>
      mapValues(
        slice.actions,
        (fn) =>
          (fn = (...args) => {
            store.setState(store.transformSlice(state, sliceKey, fn(...args)));
          })
      )
    ),
    getState: () => store.state,
    setState: (fn) => {
      store.state = fn(store.state);
    },
    subscribe: (callback) => {
      store.listeners.add(callback);
      return () => store.listeners.delete(callback);
    },
    transformSlice: (state, sliceKey, fn) => ({
      ...state,
      [sliceKey]: fn(state[sliceKey]),
    }),
    transformationFunctions: mapValues(slices, (slice, sliceKey) =>
      mapValues(
        slice.actions,
        (action) =>
          (...args) =>
          (state) =>
            store.transformSlice(state, sliceKey, action(...args))
      )
    ),
    compose: (fn) => {
      const transformations = fn(store.transformationFunctions);
      console.log(store.state);
      console.log(transformations[0]);
      console.log(transformations[0](store.state));
      console.log(
        transformations.reduce(
          (acc, transformation) => transformation(acc),
          store.state
        )
      );
      store.setState((state) =>
        transformations.reduce(
          (acc, transformation) => transformation(acc),
          state
        )
      );
    },
  };
  return store;
};

export default createStore;
