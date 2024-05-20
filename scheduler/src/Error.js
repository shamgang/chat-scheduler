import { useState, useEffect } from 'react';
import { useNavigate, useRouteError } from "react-router-dom";
import { getRandomBackgroundImageUrl } from "./helpers/BackgroundImage";
import { getLogURL } from './helpers/LogDownload';
import './Error.css';

const BACKGROUND_IMAGE = getRandomBackgroundImageUrl();
const BACKGROUND_STYLE = {
  backgroundImage: `url(${BACKGROUND_IMAGE})`
};

const REDIRECT_DELAY_S = 20;

function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_S);


  // Initial setup
  useEffect(() => {
    console.error('Error page received error', error);
    // Start countdown
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          navigate('/');
          return prev;
        }
        return prev - 1;
      });
    }, 1000);
    // Cleanup
    return () => clearInterval(interval);
  }, [error, navigate, setCountdown]);

  return (
    <div className="error-page" style={BACKGROUND_STYLE}>
      <div className="oops">
        <h1>OOPS</h1>
        <h3>{error?.statusText}</h3>
        <p>
          {
            <span>
              Click this link to download and send logs to the developer:<br/>
              <a
                href={getLogURL()}
                download="console_logs.txt"
              >
                console_logs.txt
              </a>
            </span>
          }<br/>
          Redirecting in {countdown}...
        </p>
      </div>
    </div>
  );
}

export default ErrorPage;