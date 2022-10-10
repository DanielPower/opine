import { useSyncExternalStore } from "react";
import produce from "immer";
import mapValues from "lodash.mapvalues";

export const withImmer = (store) => {
  const originalSet = store.setState;
  store.setState = (fn, name) =>
    originalSet(
      (state) =>
        produce(state, (draft) => {
          draft = fn(draft);
        }),
      name
    );
  return store;
};

export const withDevTools = (store, options) => {
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
      devTools.send(name, store.getState());
    };
  }
  return store;
};

const createStore = ({ slices }) => {
  const listeners = new Set();
  let state = {};
  let actions = {};
  let composedActions = {};

  const getState = () => state;

  const setState = (fn) => {
    state = fn(state);
    listeners.forEach((listener) => listener());
  };

  const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  const useStore = (selector) =>
    useSyncExternalStore(subscribe, () => selector(getState()));

  const transformationFunctions = mapValues(slices, (slice) => slice.actions);

  Object.entries(slices).forEach(([sliceKey, slice]) => {
    state[sliceKey] = slice.initialState;
    actions[sliceKey] = mapValues(
      slice.actions,
      (action, actionKey) =>
        (...args) => {
          useStore.setState(
            (previousState) => ({
              ...previousState,
              [sliceKey]: action(...args)(previousState[sliceKey]),
            }),
            `${sliceKey}/${actionKey}`
          );
        }
    );
    if (slice.composedActions) {
      console.log(slice.composedActions(transformationFunctions));
      composedActions[sliceKey] = mapValues(
        slice.composedActions(transformationFunctions),
        (transformations) =>
          transformations.reduce(state, (acc, action) => action(acc))
      );
    }
  });

  Object.assign(useStore, { getState, setState, actions, composedActions });
  console.log(actions, composedActions);

  return useStore;
};

export default createStore;
