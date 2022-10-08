import { useSyncExternalStore } from "react";
import produce from "immer";
import mapValues from "lodash.mapvalues";

export const withImmer = (store) => {
  const originalSet = store.setState;
  store.setState = (action) =>
    originalSet((state) =>
      produce(state, (draft) => {
        draft = action(draft);
      })
    );
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
    actions[sliceKey] = mapValues(slice.actions, (action) => (...args) => {
      useStore.setState((previousState) => ({
        ...previousState,
        [sliceKey]: action(...args)(previousState[sliceKey]),
      }));
    });
  });

  return useStore;
};

export default createStore;
