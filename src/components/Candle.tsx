import React from "react";
import "./Candle.css";

const Candle = () => {
  return (
    <div className="holder">
      <div className="flame-wrapper">
        <div className="candle-body">
          <div className="blinking-glow"></div>
          <div className="glow"></div>
          <div className="flame"></div>
        </div>
      </div>
    </div>
  );
};

export default Candle;
