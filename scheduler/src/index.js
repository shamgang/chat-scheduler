import React from 'react';
import ReactDOM from 'react-dom/client';
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import './index.css';
import App, { loader as appLoader } from './App';
import ErrorPage from './Error';
import reportWebVitals from './reportWebVitals';
import { makeErrorsSerializable, startCapturingLogs } from './helpers/LogDownload';

makeErrorsSerializable();
startCapturingLogs();

const router = createBrowserRouter([
  {
    path: '/:eventId?',
    element: <App/>,
    loader: appLoader,
    errorElement: <ErrorPage/>
  }
]);

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
