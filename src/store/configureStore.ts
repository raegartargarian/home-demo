import { runSagas } from "../containers/runSagas";
import { configureStore } from "@reduxjs/toolkit";
import createSagaMiddleware, { SagaMiddlewareOptions } from "redux-saga";

import { createReducer } from "./reducers";

const reduxSagaMonitorOptions: SagaMiddlewareOptions = {};
const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions);
const middlewares = [sagaMiddleware];
export const { run: runSaga } = sagaMiddleware;

export function configureAppStore() {
  const store = configureStore({
    reducer: createReducer(),
    // @ts-ignore
    middleware: (getDefaultMiddleware) => [
      ...getDefaultMiddleware({
        serializableCheck: false,
      }),
      ...middlewares,
    ],
    devTools:
      /* istanbul ignore next line */
      process.env.NODE_ENV !== "production",
  });
  runSagas();
  return store;
}
