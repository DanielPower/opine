import { useSyncExternalStore } from "react";
import mapValues from "lodash.mapvalues";

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

  const transformationFunctions = mapValues(slices, (slice, sliceKey) =>
    mapValues(slice.actions, (action) => (state) => ({
      ...state,
      [sliceKey]: action(state[sliceKey]),
    }))
  );

  console.log(transformationFunctions);

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
      composedActions[sliceKey] = mapValues(slice.composedActions, (fn) => {
        console.log(fn);
        const transformations = fn(transformationFunctions);
        console.log(transformations);
        return (...args) => {
          console.log(transformations);
          console.log(args);
          const newState = transformations.reduce(
            (acc, transformation) => transformation(acc),
            state
          );
          console.log(newState);
        };
      });
    }
  });
  console.log(composedActions);

  Object.assign(useStore, { getState, setState, actions, composedActions });

  return useStore;
};

export default createStore;
