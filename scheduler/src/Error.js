import { useState, useEffect } from 'react';
import { useNavigate, useRouteError } from "react-router-dom";
import { getRandomBackgroundImageUrl } from "./helpers/BackgroundImage";
import './Error.css';

const BACKGROUND_IMAGE = getRandomBackgroundImageUrl();
const BACKGROUND_STYLE = {
  backgroundImage: `url(${BACKGROUND_IMAGE})`
};

const REDIRECT_DELAY_S = 5;

function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_S);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 0) {
          navigate('/');
          return prev;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [navigate]);

  return (
    <div className="error-page" style={BACKGROUND_STYLE}>
      <div className="oops">
        <h1>OOPS</h1>
        <p>
          {error?.status === 404 ? "This page doesn't exist" : "Unexpected error"}<br/>
          Redirecting in {countdown}...
        </p>
      </div>
    </div>
  );
}

export default ErrorPage;