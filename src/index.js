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

  const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  const useStore = (selector) =>
    useSyncExternalStore(subscribe, () => selector(getState()));

  const transformSlice = (state, sliceKey, fn) => ({
    ...state,
    [sliceKey]: fn(state[sliceKey]),
  });

  const transformationFunctions = mapValues(slices, (slice, sliceKey) =>
    mapValues(
      slice.actions,
      (action) =>
        (...args) =>
        (state) =>
          useStore.transformSlice(state, sliceKey, action(...args))
    )
  );

  const compose = (fn) => {
    const transformations = fn(transformationFunctions);
    useStore.setState((state) =>
      transformations.reduce(
        (acc, transformation) => transformation(acc),
        state
      )
    );
  };

  Object.entries(slices).forEach(([sliceKey, slice]) => {
    state[sliceKey] = slice.initialState;
    actions[sliceKey] = mapValues(slice.actions, (fn) => (...args) => {
      useStore.setState(useStore.transformSlice(state, sliceKey, fn(...args)));
    });
  });

  Object.assign(useStore, {
    getState,
    setState,
    actions,
    compose,
    transformSlice,
  });

  return useStore;
};

export default createStore;
