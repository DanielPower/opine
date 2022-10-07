import { useSyncExternalStore } from "react";
import produce from "immer";
import mapValues from "lodash.mapvalues";

const createStore = ({ slices }) => {
  const listeners = new Set();
  let state = {};
  let actions = {};

  const getState = () => state;

  const setState = (newState) => {
    state = newState;
    listeners.forEach((listener) => listener());
  };

  Object.entries(slices).forEach(([sliceKey, slice]) => {
    state[sliceKey] = slice.initialState;
    actions[sliceKey] = mapValues(slice.actions, (action) => (...args) => {
      setState({
        ...state,
        [sliceKey]: produce(state[sliceKey], action(...args)),
      });
    });
  });

  const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  const useStore = (selector) =>
    useSyncExternalStore(subscribe, () => selector(getState()));

  Object.assign(useStore, { getState, actions });

  return useStore;
};

export default createStore;
