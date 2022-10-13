import produce from "immer";

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

export default withImmer;
