import { useSyncExternalStore } from "use-sync-external-store/shim/index.js";

const opine = (slices) => {
  const listeners = new Set();
  let state = {};
  let actions = {};

  const getState = () => state;

  const setState = (fn) => {
    state = fn(state);
    listeners.forEach((listener) => listener());
  };

  slices.forEach((slice) => {
    state[slice.name] = slice.state;
    actions[slice.name] = Object.fromEntries(
      Object.entries(slice.actions).map(([key, action]) => [
        key,
        action(setState),
      ])
    );
  });

  const subscribe = (callback) => {
    listeners.add(callback);
    return () => listeners.delete(callback);
  };

  const useStore = (selector) =>
    useSyncExternalStore(subscribe, () => selector(getState()));

  Object.assign(useStore, { getState, setState, actions });

  return useStore;
};

export const createSlice = (name, state, actions) => ({ name, state, actions });

export default opine;
