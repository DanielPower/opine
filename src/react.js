import createStore from "./vanilla";
import { useSyncExternalStore } from "react";

const createReactStore = (slices) => {
  const store = createStore(slices);
  const useStore = (selector) =>
    useSyncExternalStore(store.subscribe, () => selector(store.getState()));
  Object.assign(useStore, store);
  return useStore;
};

export default createReactStore;
