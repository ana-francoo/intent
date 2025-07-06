import { useEffect, useState } from "react";
import "./Flame.css";

const Flame = () => {
  return (
    <div className="holder">
      <div className="flame-wrapper">
        <div className="flame-body">
          <div className="blinking-glow"></div>
          <div className="glow"></div>
          <div className="flame"></div>
        </div>
      </div>
    </div>
  );
};

export default Flame; 