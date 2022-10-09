import { useSyncExternalStore } from "react";
import produce from "immer";
import mapValues from "lodash.mapvalues";

export const withImmer = (store) => {
  const originalSet = store.setState;
  store.setState = (fn) =>
    originalSet((state) =>
      produce(state, (draft) => {
        draft = fn(draft);
      })
    );
  return store;
};

export const withDevTools = (store) => {
  if (window.__REDUX_DEVTOOLS_EXTENSION__) {
    const devTools = window.__REDUX_DEVTOOLS_EXTENSION__.connect();
    devTools.init(store.getState());
    const originalSet = store.setState;
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

  Object.assign(useStore, { getState, setState, actions });

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
  });

  return useStore;
};

export default createStore;
