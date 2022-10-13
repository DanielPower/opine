import produce from "immer";

export const withImmer = (store) => {
  const originalTransformSlice = store.transformSlice;
  store.transformSlice = (state, sliceKey, fn) =>
    originalTransformSlice(state, sliceKey, produce(fn));
  return store;
};

export default withImmer;
