import { useEffect } from 'react';
import { useRouteError } from "react-router-dom";
import { getRandomBackgroundImageUrl } from "./helpers/BackgroundImage";
import { getLogURL } from './helpers/LogDownload';
import './Error.css';

const BACKGROUND_IMAGE = getRandomBackgroundImageUrl();
const BACKGROUND_STYLE = {
  backgroundImage: `url(${BACKGROUND_IMAGE})`
};

function ErrorPage() {
  const error = useRouteError();

  // Initial setup
  useEffect(() => {
    console.error('Error page received error', error);
  }, [error]);

  return (
    <div className="error-page" style={BACKGROUND_STYLE}>
      <div className="oops">
        <h1>OOPS</h1>
        <h3>{error?.statusText || 'UNKNOWN ERROR'}</h3>
        <p>
          {
            <span>
              Please click this link to download logs:<br/>
              <a
                href={getLogURL()}
                download="console_logs.txt"
              >
                console_logs.txt
              </a>
            </span>
          }
        </p>
      </div>
    </div>
  );
}

export default ErrorPage;