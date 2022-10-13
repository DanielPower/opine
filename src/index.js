import { useSyncExternalStore } from "react";
import mapValues from "lodash.mapvalues";

const createStore = ({ slices }) => {
  const listeners = new Set();
  let state = {};
  let actions = {};

  const getState = () => state;

  const setState = (fn) => {
    state = fn(state);
    listeners.forEach((listener) => listener());
  };

  const transformSlice = (state, sliceKey, fn) => ({
    ...state,
    [sliceKey]: fn(state[sliceKey]),
  });

  const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  const useStore = (selector) =>
    useSyncExternalStore(subscribe, () => selector(getState()));

  const transformationFunctions = mapValues(slices, (slice, sliceKey) =>
    mapValues(
      slice.actions,
      (action) =>
        (...args) =>
        (state) =>
          transformSlice(state, sliceKey, action(...args))
    )
  );

  const compose = (fn) => {
    const transformations = fn(transformationFunctions);
    setState((state) =>
      transformations.reduce(
        (acc, transformation) => transformation(acc),
        state
      )
    );
  };

  Object.entries(slices).forEach(([sliceKey, slice]) => {
    state[sliceKey] = slice.initialState;
    actions[sliceKey] = mapValues(
      slice.actions,
      (action, actionKey) =>
        (...args) => {
          useStore.setState(
            transformSlice(state, sliceKey, action(...args)),
            `${sliceKey}/${actionKey}`
          );
        }
    );
  });

  Object.assign(useStore, { getState, setState, actions, compose });

  return useStore;
};

export default createStore;
